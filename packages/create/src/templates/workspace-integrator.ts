import type {TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

/**
 * Configuration for workspace integration.
 */
export interface WorkspaceConfig {
  /** Path to the workspace root */
  workspaceRoot: string
  /** Path to the workspace package.json */
  workspacePackageJson: string
  /** Path to the pnpm-workspace.yaml */
  pnpmWorkspace: string
  /** Whether to run pnpm install after integration */
  autoInstall: boolean
  /** Whether to update workspace lockfile */
  updateLockfile: boolean
  /** Package manager to use */
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
}

/**
 * Result of workspace integration.
 */
export interface WorkspaceResult {
  /** Whether dependencies were installed */
  dependenciesInstalled: boolean
  /** Whether pnpm workspace was updated */
  pnpmWorkspaceUpdated: boolean
  /** Whether package.json was updated */
  packageJsonUpdated: boolean
  /** Any warnings during integration */
  warnings: string[]
  /** Any errors during integration */
  errors: string[]
}

/**
 * Manages workspace integration for generated packages in monorepos.
 * Handles pnpm workspace configuration, dependency management, and installation.
 */
export class WorkspaceIntegrator {
  private readonly config: WorkspaceConfig

  constructor(config: Partial<WorkspaceConfig> = {}) {
    // Default configuration based on the bfra.me/works workspace structure
    this.config = {
      workspaceRoot: process.cwd(),
      workspacePackageJson: path.join(process.cwd(), 'package.json'),
      pnpmWorkspace: path.join(process.cwd(), 'pnpm-workspace.yaml'),
      autoInstall: true,
      updateLockfile: true,
      packageManager: 'pnpm',
      ...config,
    }
  }

  /**
   * Integrate a generated package with the workspace.
   *
   * @param packagePath - Path to the generated package
   * @param context - Template context used for generation
   * @param options - Integration options
   * @param options.verbose - Enable verbose logging
   * @param options.skipInstall - Skip dependency installation
   * @returns Result of workspace integration
   */
  async integrate(
    packagePath: string,
    context: TemplateContext,
    options: {verbose?: boolean; skipInstall?: boolean} = {},
  ): Promise<WorkspaceResult> {
    const warnings: string[] = []
    const errors: string[] = []
    let dependenciesInstalled = false
    let pnpmWorkspaceUpdated = false
    let packageJsonUpdated = false

    try {
      if (options.verbose) {
        consola.info('Starting workspace integration...', {
          package: packagePath,
          workspaceRoot: this.config.workspaceRoot,
        })
      }

      // Check if this is a workspace environment
      if (!this.isWorkspaceEnvironment()) {
        warnings.push('Not a workspace environment, skipping workspace integration')
        return {dependenciesInstalled, pnpmWorkspaceUpdated, packageJsonUpdated, warnings, errors}
      }

      // Step 1: Update pnpm-workspace.yaml (if needed)
      const workspaceResult = await this.updatePnpmWorkspace(packagePath, context, options)
      if (workspaceResult.success) {
        pnpmWorkspaceUpdated = workspaceResult.updated
      } else {
        warnings.push(`pnpm-workspace update warning: ${workspaceResult.message}`)
      }

      // Step 2: Update workspace package.json dependencies (if needed)
      const packageJsonResult = await this.updateWorkspacePackageJson(packagePath, context, options)
      if (packageJsonResult.success) {
        packageJsonUpdated = packageJsonResult.updated
      } else {
        warnings.push(`Workspace package.json update warning: ${packageJsonResult.message}`)
      }

      // Step 3: Install dependencies
      if (!options.skipInstall && this.config.autoInstall) {
        const installResult = await this.installDependencies(options)
        if (installResult.success) {
          dependenciesInstalled = true
        } else {
          errors.push(`Dependency installation failed: ${installResult.error}`)
        }
      }

      if (options.verbose) {
        consola.success('Workspace integration completed', {
          dependenciesInstalled,
          pnpmWorkspaceUpdated,
          packageJsonUpdated,
          warnings: warnings.length,
          errors: errors.length,
        })
      }

      return {
        dependenciesInstalled,
        pnpmWorkspaceUpdated,
        packageJsonUpdated,
        warnings,
        errors,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(`Workspace integration failed: ${errorMessage}`)

      return {
        dependenciesInstalled: false,
        pnpmWorkspaceUpdated: false,
        packageJsonUpdated: false,
        warnings,
        errors,
      }
    }
  }

  /**
   * Check if the current environment is a workspace.
   */
  private isWorkspaceEnvironment(): boolean {
    return (
      existsSync(this.config.pnpmWorkspace) ||
      existsSync(path.join(this.config.workspaceRoot, 'yarn.lock')) ||
      existsSync(path.join(this.config.workspaceRoot, 'lerna.json'))
    )
  }

  /**
   * Update pnpm-workspace.yaml to include the new package.
   */
  private async updatePnpmWorkspace(
    packagePath: string,
    _context: TemplateContext,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; updated: boolean; message?: string}> {
    try {
      if (!existsSync(this.config.pnpmWorkspace)) {
        return {success: true, updated: false, message: 'pnpm-workspace.yaml not found'}
      }

      const workspaceContent = await readFile(this.config.pnpmWorkspace, 'utf8')
      const relativePath = path.relative(this.config.workspaceRoot, packagePath)

      // Check if the package is already included
      if (this.isPackageInWorkspace(workspaceContent, relativePath)) {
        if (options.verbose) {
          consola.info('Package already included in workspace configuration')
        }
        return {success: true, updated: false, message: 'Package already in workspace'}
      }

      // Check if there's a pattern that would include this package
      if (this.isPackageMatchedByPattern(workspaceContent, relativePath)) {
        if (options.verbose) {
          consola.info('Package matched by existing workspace pattern')
        }
        return {success: true, updated: false, message: 'Package matched by existing pattern'}
      }

      // Add package to workspace
      const updatedContent = this.addPackageToWorkspace(workspaceContent, relativePath)
      await writeFile(this.config.pnpmWorkspace, updatedContent, 'utf8')

      if (options.verbose) {
        consola.success('Updated pnpm-workspace.yaml')
      }

      return {success: true, updated: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, updated: false, message: errorMessage}
    }
  }

  /**
   * Update workspace package.json with new package as dependency if needed.
   */
  private async updateWorkspacePackageJson(
    packagePath: string,
    _context: TemplateContext,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; updated: boolean; message?: string}> {
    try {
      if (!existsSync(this.config.workspacePackageJson)) {
        return {success: true, updated: false, message: 'Workspace package.json not found'}
      }

      const packageJsonContent = await readFile(this.config.workspacePackageJson, 'utf8')
      const workspacePackageJson = JSON.parse(packageJsonContent) as {
        devDependencies?: Record<string, string>
        dependencies?: Record<string, string>
      }

      // Read the generated package's package.json
      const generatedPackageJsonPath = path.join(packagePath, 'package.json')
      if (!existsSync(generatedPackageJsonPath)) {
        return {success: true, updated: false, message: 'Generated package.json not found'}
      }

      const generatedPackageJson = JSON.parse(await readFile(generatedPackageJsonPath, 'utf8')) as {
        name?: string
      }

      const packageName = generatedPackageJson.name
      if (packageName == null || packageName.trim() === '') {
        return {success: true, updated: false, message: 'Generated package has no name'}
      }

      // Check if this package should be added as a workspace dependency
      // For bfra.me/works, typically packages are added as devDependencies in root
      const shouldAddAsDevDependency = packageName.startsWith('@bfra.me/')

      if (!shouldAddAsDevDependency) {
        return {
          success: true,
          updated: false,
          message: 'Package does not need workspace dependency',
        }
      }

      // Check if already exists
      const hasDevDep =
        workspacePackageJson.devDependencies?.[packageName] != null &&
        workspacePackageJson.devDependencies[packageName].trim() !== ''
      const hasDep =
        workspacePackageJson.dependencies?.[packageName] != null &&
        workspacePackageJson.dependencies[packageName].trim() !== ''

      if (hasDevDep || hasDep) {
        return {success: true, updated: false, message: 'Package already in workspace dependencies'}
      }

      // Add as devDependency
      if (!workspacePackageJson.devDependencies) {
        workspacePackageJson.devDependencies = {}
      }
      workspacePackageJson.devDependencies[packageName] = 'workspace:*'

      // Write updated package.json
      const updatedContent = `${JSON.stringify(workspacePackageJson, null, 2)}\n`
      await writeFile(this.config.workspacePackageJson, updatedContent, 'utf8')

      if (options.verbose) {
        consola.success(`Added ${packageName} to workspace devDependencies`)
      }

      return {success: true, updated: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, updated: false, message: errorMessage}
    }
  }

  /**
   * Install dependencies using the configured package manager.
   */
  private async installDependencies(options: {
    verbose?: boolean
  }): Promise<{success: boolean; error?: string}> {
    try {
      const command = this.getInstallCommand()

      if (options.verbose) {
        consola.start(`Running: ${command}`)
      }

      const {execSync} = await import('node:child_process')

      // Change to workspace root for installation
      const originalCwd = process.cwd()
      process.chdir(this.config.workspaceRoot)

      try {
        execSync(command, {
          encoding: 'utf8',
          stdio: options.verbose ? 'inherit' : 'pipe',
        })

        if (options.verbose) {
          consola.success('Dependencies installed successfully')
        }

        return {success: true}
      } finally {
        // Restore original working directory
        process.chdir(originalCwd)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, error: errorMessage}
    }
  }

  /**
   * Get the appropriate install command for the package manager.
   */
  private getInstallCommand(): string {
    switch (this.config.packageManager) {
      case 'pnpm':
        return 'pnpm install'
      case 'yarn':
        return 'yarn install'
      case 'bun':
        return 'bun install'
      case 'npm':
      default:
        return 'npm install'
    }
  }

  /**
   * Check if a package is already included in the workspace configuration.
   */
  private isPackageInWorkspace(workspaceContent: string, packagePath: string): boolean {
    const lines = workspaceContent.split('\n')
    return lines.some(
      line =>
        line.trim().startsWith('-') &&
        (line.includes(`"${packagePath}"`) || line.includes(`'${packagePath}'`)),
    )
  }

  /**
   * Check if a package is matched by existing workspace patterns.
   */
  private isPackageMatchedByPattern(workspaceContent: string, packagePath: string): boolean {
    const lines = workspaceContent.split('\n')
    const patterns = lines
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().slice(1).trim().replaceAll(/['"]/g, ''))

    return patterns.some(pattern => {
      // Simple glob pattern matching for common cases
      if (pattern.endsWith('/*')) {
        const basePattern = pattern.slice(0, -2)
        return packagePath.startsWith(`${basePattern}/`)
      }
      if (pattern.endsWith('/**')) {
        const basePattern = pattern.slice(0, -3)
        return packagePath.startsWith(`${basePattern}/`)
      }
      return pattern === packagePath
    })
  }

  /**
   * Add a package to the workspace configuration.
   */
  private addPackageToWorkspace(workspaceContent: string, packagePath: string): string {
    const lines = workspaceContent.split('\n')

    // Find the packages section
    const packagesLineIndex = lines.findIndex(line => line.trim() === 'packages:')
    if (packagesLineIndex === -1) {
      // No packages section found, add one
      return `${workspaceContent}\npackages:\n  - "${packagePath}"\n`
    }

    // Find where to insert the new package (maintain alphabetical order)
    let insertIndex = packagesLineIndex + 1
    while (insertIndex < lines.length && lines[insertIndex]?.trim().startsWith('-')) {
      insertIndex++
    }

    // Insert the new package
    lines.splice(insertIndex, 0, `  - "${packagePath}"`)

    return lines.join('\n')
  }

  /**
   * Check if workspace integration is available.
   */
  isAvailable(): boolean {
    return this.isWorkspaceEnvironment()
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<WorkspaceConfig> {
    return {...this.config}
  }
}

/**
 * Create a workspace integrator with default configuration.
 */
export function createWorkspaceIntegrator(config?: Partial<WorkspaceConfig>): WorkspaceIntegrator {
  return new WorkspaceIntegrator(config)
}
