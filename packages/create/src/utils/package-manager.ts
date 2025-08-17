import {existsSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

interface PackageJson {
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  [key: string]: unknown
}

/**
 * Add dependencies to package.json and install them
 */
export async function addDependencies(
  projectDir: string,
  dependencies: string[] = [],
  devDependencies: string[] = [],
  packageManager?: PackageManager,
  verbose?: boolean,
): Promise<void> {
  if (dependencies.length === 0 && devDependencies.length === 0) {
    return
  }

  const packageJsonPath = path.join(projectDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found in project directory')
  }

  // Read and update package.json
  const content = await readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(content) as PackageJson

  // Add dependencies
  if (dependencies.length > 0) {
    if (!packageJson.dependencies) {
      packageJson.dependencies = {}
    }
    for (const dep of dependencies) {
      if (!(dep in (packageJson.dependencies ?? {}))) {
        packageJson.dependencies[dep] = 'latest'
      }
    }
  }

  // Add dev dependencies
  if (devDependencies.length > 0) {
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {}
    }
    for (const dep of devDependencies) {
      if (!(dep in (packageJson.devDependencies ?? {}))) {
        packageJson.devDependencies[dep] = 'latest'
      }
    }
  }

  // Write updated package.json
  const updatedContent = JSON.stringify(packageJson, null, 2)
  await writeFile(packageJsonPath, `${updatedContent}\n`, 'utf-8')

  if (verbose) {
    consola.success('Updated package.json with new dependencies')
  }

  // Install dependencies using the detected package manager
  const pm = packageManager ?? detectPackageManager(projectDir)
  await installDependencies(projectDir, pm, verbose)
}

/**
 * Install dependencies using the specified package manager
 */
export async function installDependencies(
  projectDir: string,
  packageManager: PackageManager,
  verbose?: boolean,
): Promise<void> {
  const {exec} = await import('node:child_process')
  const {promisify} = await import('node:util')
  const execAsync = promisify(exec)

  const commands = {
    npm: 'npm install',
    yarn: 'yarn install',
    pnpm: 'pnpm install',
    bun: 'bun install',
  }

  const command = commands[packageManager]

  if (verbose) {
    consola.info(`Installing dependencies with ${packageManager}...`)
  }

  try {
    await execAsync(command, {cwd: projectDir})
    if (verbose) {
      consola.success('Dependencies installed successfully')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    consola.warn(`Failed to install dependencies: ${errorMessage}`)
    consola.info(`Please run "${command}" manually in your project directory`)
  }
}

/**
 * Detect package manager based on lock files
 */
export function detectPackageManager(projectDir: string): PackageManager {
  if (existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(path.join(projectDir, 'yarn.lock'))) {
    return 'yarn'
  }
  if (existsSync(path.join(projectDir, 'bun.lockb'))) {
    return 'bun'
  }
  // Default to npm
  return 'npm'
}

/**
 * Add or update scripts in package.json
 */
export async function addScripts(
  projectDir: string,
  scripts: Record<string, string>,
  verbose?: boolean,
): Promise<void> {
  const packageJsonPath = path.join(projectDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found in project directory')
  }

  const content = await readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(content) as PackageJson

  if (!packageJson.scripts) {
    packageJson.scripts = {}
  }

  let hasChanges = false
  for (const [script, command] of Object.entries(scripts)) {
    if (!(script in (packageJson.scripts ?? {}))) {
      packageJson.scripts[script] = command
      hasChanges = true
    }
  }

  if (hasChanges) {
    const updatedContent = JSON.stringify(packageJson, null, 2)
    await writeFile(packageJsonPath, `${updatedContent}\n`, 'utf-8')
    if (verbose) {
      consola.success('Added scripts to package.json')
    }
  } else if (verbose) {
    consola.info('Scripts already exist in package.json')
  }
}
