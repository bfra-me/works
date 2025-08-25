import type {TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

/**
 * Configuration for instruction display.
 */
export interface InstructionConfig {
  /** Whether to show basic usage instructions */
  showUsage: boolean
  /** Whether to show development instructions */
  showDevelopment: boolean
  /** Whether to show workspace-specific instructions */
  showWorkspace: boolean
  /** Whether to show git instructions */
  showGit: boolean
  /** Whether to show package-specific instructions */
  showPackageSpecific: boolean
  /** Custom instructions to append */
  customInstructions?: string[]
}

/**
 * Result of instruction display.
 */
export interface InstructionResult {
  /** Instructions that were displayed */
  instructions: string[]
  /** Whether instructions were successfully displayed */
  displayed: boolean
}

/**
 * Manages post-generation instruction display using established user feedback patterns.
 * Provides helpful next steps and usage guidance after package generation.
 */
export class InstructionDisplayer {
  private readonly config: InstructionConfig

  constructor(config: Partial<InstructionConfig> = {}) {
    // Default configuration based on proven user feedback patterns
    this.config = {
      showUsage: true,
      showDevelopment: true,
      showWorkspace: true,
      showGit: true,
      showPackageSpecific: true,
      customInstructions: [],
      ...config,
    }
  }

  /**
   * Display post-generation instructions to the user.
   */
  async display(
    packagePath: string,
    context: TemplateContext,
    workflowResult: {
      validation?: {passed: boolean}
      documentation?: {mdxGenerated: boolean; navigationUpdated: boolean}
      workspace?: {dependenciesInstalled: boolean; pnpmWorkspaceUpdated: boolean}
      changeset?: {generated: boolean; path?: string}
      git?: {initialized: boolean; committed: boolean}
    },
    options: {verbose?: boolean} = {},
  ): Promise<InstructionResult> {
    try {
      if (options.verbose) {
        consola.info('Generating post-generation instructions...')
      }

      const instructions: string[] = []

      // Read package information
      const packageInfo = await this.getPackageInfo(packagePath)

      // Build instructions sections
      this.addHeader(instructions, context, packageInfo)

      if (this.config.showUsage) {
        this.addUsageInstructions(instructions, context, packageInfo, packagePath)
      }

      if (this.config.showDevelopment) {
        this.addDevelopmentInstructions(instructions, context, packageInfo)
      }

      if (this.config.showWorkspace && workflowResult.workspace) {
        this.addWorkspaceInstructions(instructions, workflowResult.workspace)
      }

      if (this.config.showGit && workflowResult.git) {
        this.addGitInstructions(instructions, workflowResult.git, context)
      }

      if (this.config.showPackageSpecific) {
        this.addPackageSpecificInstructions(instructions, context, packageInfo)
      }

      this.addValidationStatus(instructions, workflowResult.validation)
      this.addDocumentationInfo(instructions, workflowResult.documentation)
      this.addChangesetInfo(instructions, workflowResult.changeset)

      // Add custom instructions
      if (this.config.customInstructions && this.config.customInstructions.length > 0) {
        instructions.push('', '📝 Additional Instructions:')
        instructions.push(...this.config.customInstructions)
      }

      this.addFooter(instructions, context)

      // Display all instructions
      this.displayInstructions(instructions)

      return {
        instructions,
        displayed: true,
      }
    } catch (error) {
      if (options.verbose) {
        consola.error('Failed to generate instructions:', error)
      }

      return {
        instructions: [],
        displayed: false,
      }
    }
  }

  /**
   * Get package information from package.json.
   */
  private async getPackageInfo(packagePath: string): Promise<{
    name?: string
    version?: string
    description?: string
    scripts?: Record<string, string>
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json')

      if (!existsSync(packageJsonPath)) {
        return {}
      }

      const packageJsonContent = await readFile(packageJsonPath, 'utf8')
      return JSON.parse(packageJsonContent) as {
        name?: string
        version?: string
        description?: string
        scripts?: Record<string, string>
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
    } catch {
      return {}
    }
  }

  /**
   * Add header with package information.
   */
  private addHeader(
    instructions: string[],
    context: TemplateContext,
    packageInfo: {name?: string; description?: string},
  ): void {
    instructions.push('🎉 Package created successfully!')
    instructions.push('')

    const packageName = packageInfo.name ?? context.projectName
    const packageDescription = packageInfo.description ?? context.description

    instructions.push(`� Package: ${packageName}`)
    if (packageDescription !== null) {
      instructions.push(`📝 Description: ${packageDescription}`)
    }
    instructions.push(`📁 Location: ${path.relative(process.cwd(), process.cwd())}`)
    instructions.push('')
  }

  /**
   * Add basic usage instructions.
   */
  private addUsageInstructions(
    instructions: string[],
    context: TemplateContext,
    packageInfo: {name?: string; scripts?: Record<string, string>},
    packagePath: string,
  ): void {
    const relativePath = path.relative(process.cwd(), packagePath)

    instructions.push('🚀 Getting Started:')
    instructions.push('')
    instructions.push(`  cd ${relativePath}`)

    // Add package manager specific install command
    const packageManager = context.packageManager || 'npm'
    switch (packageManager) {
      case 'pnpm':
        instructions.push('  pnpm install')
        break
      case 'yarn':
        instructions.push('  yarn install')
        break
      case 'bun':
        instructions.push('  bun install')
        break
      case 'npm':
      default:
        instructions.push('  npm install')
    }

    // Add common script commands if they exist
    if (packageInfo.scripts) {
      const commonScripts = ['dev', 'start', 'build', 'test', 'lint']
      const availableScripts = commonScripts.filter(script => {
        const scriptExists = packageInfo.scripts?.[script]
        return Boolean(scriptExists)
      })

      if (availableScripts.length > 0) {
        instructions.push('')
        instructions.push('📜 Available Scripts:')
        for (const script of availableScripts) {
          const command =
            packageManager === 'npm' ? `npm run ${script}` : `${packageManager} ${script}`
          instructions.push(`  ${command}`)
        }
      }
    }

    instructions.push('')
  }

  /**
   * Add development instructions.
   */
  private addDevelopmentInstructions(
    instructions: string[],
    context: TemplateContext,
    _packageInfo: {name?: string},
  ): void {
    instructions.push('🛠️ Development:')
    instructions.push('')

    const packageManager = context.packageManager || 'npm'
    const runCommand = packageManager === 'npm' ? 'npm run' : packageManager

    instructions.push(`  ${runCommand} build     # Build the package`)
    instructions.push(`  ${runCommand} test      # Run tests`)
    instructions.push(`  ${runCommand} lint      # Lint code`)

    if (packageManager === 'pnpm') {
      instructions.push('  pnpm build --watch # Watch mode for development')
    }

    instructions.push('')
    instructions.push('📚 Documentation:')
    instructions.push('  - Check README.md for detailed usage')
    instructions.push('  - Review src/ directory for implementation')
    instructions.push('  - Look at test/ directory for examples')
    instructions.push('')
  }

  /**
   * Add workspace-specific instructions.
   */
  private addWorkspaceInstructions(
    instructions: string[],
    workspaceResult: {dependenciesInstalled: boolean; pnpmWorkspaceUpdated: boolean},
  ): void {
    instructions.push('🏢 Workspace Integration:')
    instructions.push('')

    if (workspaceResult.pnpmWorkspaceUpdated) {
      instructions.push('  ✅ Added to pnpm workspace configuration')
    }

    if (workspaceResult.dependenciesInstalled) {
      instructions.push('  ✅ Workspace dependencies installed')
    } else {
      instructions.push('  ⚠️  Run `pnpm install` from workspace root to install dependencies')
    }

    instructions.push('  📄 Package available as workspace dependency')
    instructions.push('')
  }

  /**
   * Add git-specific instructions.
   */
  private addGitInstructions(
    instructions: string[],
    gitResult: {initialized: boolean; committed: boolean},
    context: TemplateContext,
  ): void {
    instructions.push('📝 Version Control:')
    instructions.push('')

    if (gitResult.initialized) {
      instructions.push('  ✅ Git repository initialized')
    }

    if (gitResult.committed) {
      instructions.push('  ✅ Initial commit created')
      instructions.push('  🌟 Ready to start development!')
    } else if (gitResult.initialized) {
      instructions.push('  💡 Create your first commit:')
      instructions.push('    git add .')
      instructions.push(`    git commit -m "feat: add ${context.projectName} package"`)
    } else {
      instructions.push('  💡 Initialize git repository:')
      instructions.push('    git init')
      instructions.push('    git add .')
      instructions.push(`    git commit -m "feat: add ${context.projectName} package"`)
    }

    instructions.push('')
  }

  /**
   * Add package-specific instructions.
   */
  private addPackageSpecificInstructions(
    instructions: string[],
    context: TemplateContext,
    packageInfo: {name?: string},
  ): void {
    const packageName = packageInfo.name ?? context.projectName

    instructions.push('📦 Package Usage:')
    instructions.push('')
    instructions.push(`  // Import the package in your code`)
    if (packageName.startsWith('@')) {
      instructions.push(`  import { /* exports */ } from '${packageName}'`)
    } else {
      instructions.push(`  import { /* exports */ } from './${packageName}'`)
    }
    instructions.push('')
    instructions.push('🔧 Configuration:')
    instructions.push('  - Edit src/index.ts for main functionality')
    instructions.push('  - Update package.json for metadata')
    instructions.push('  - Modify tsconfig.json for TypeScript settings')
    instructions.push('  - Configure eslint.config.ts for linting rules')
    instructions.push('')
  }

  /**
   * Add validation status information.
   */
  private addValidationStatus(instructions: string[], validation?: {passed: boolean}): void {
    if (validation) {
      instructions.push('✅ Quality Checks:')
      instructions.push('')
      if (validation.passed) {
        instructions.push('  ✅ All validation checks passed')
        instructions.push('  🎯 Package is ready for development')
      } else {
        instructions.push('  ⚠️  Some validation checks failed')
        instructions.push('  🔧 Please fix issues before proceeding')
      }
      instructions.push('')
    }
  }

  /**
   * Add documentation information.
   */
  private addDocumentationInfo(
    instructions: string[],
    documentation?: {mdxGenerated: boolean; navigationUpdated: boolean},
  ): void {
    if (documentation?.mdxGenerated) {
      instructions.push('📖 Documentation:')
      instructions.push('')
      instructions.push('  ✅ Documentation site integration completed')
      if (documentation.navigationUpdated) {
        instructions.push('  ✅ Navigation updated automatically')
      }
      instructions.push('  🌐 Package documentation will be available on the site')
      instructions.push('')
    }
  }

  /**
   * Add changeset information.
   */
  private addChangesetInfo(
    instructions: string[],
    changeset?: {generated: boolean; path?: string},
  ): void {
    if (changeset?.generated) {
      instructions.push('📋 Release Management:')
      instructions.push('')
      instructions.push('  ✅ Changeset generated for release')
      if (changeset.path !== null && changeset.path !== undefined) {
        const relativePath = path.relative(process.cwd(), changeset.path)
        instructions.push(`  📄 Changeset file: ${relativePath}`)
      }
      instructions.push('  🚀 Package ready for automated release')
      instructions.push('')
    }
  }

  /**
   * Add footer with next steps.
   */
  private addFooter(instructions: string[], _context: TemplateContext): void {
    instructions.push('🎯 Next Steps:')
    instructions.push('')
    instructions.push('  1. Review and customize the generated code')
    instructions.push('  2. Write tests for your functionality')
    instructions.push('  3. Update documentation as needed')
    instructions.push('  4. Start implementing your features')
    instructions.push('')
    instructions.push('💡 Need help? Check the documentation or create an issue!')
    instructions.push('')
    instructions.push('Happy coding! 🚀')
  }

  /**
   * Display instructions to the user.
   */
  private displayInstructions(instructions: string[]): void {
    // Add some visual separation
    consola.log('')
    consola.log('━'.repeat(80))

    for (const instruction of instructions) {
      consola.log(instruction)
    }

    consola.log('━'.repeat(80))
    consola.log('')
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<InstructionConfig> {
    return {...this.config}
  }
}

/**
 * Create an instruction displayer with default configuration.
 */
export function createInstructionDisplayer(
  config?: Partial<InstructionConfig>,
): InstructionDisplayer {
  return new InstructionDisplayer(config)
}
