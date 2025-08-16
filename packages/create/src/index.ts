import type {CreateCommandOptions, CreatePackageOptions, Result, TemplateContext} from './types.js'
import path from 'node:path'
import process from 'node:process'
import {cancel, confirm, intro, isCancel, outro, select, text} from '@clack/prompts'
import {consola} from 'consola'
import {templateFetcher} from './templates/fetcher.js'
import {templateProcessor} from './templates/processor.js'
import {templateResolver} from './templates/resolver.js'
import {ValidationUtils} from './utils/index.js'

/**
 * Creates a new package based on a specified template using the new architecture.
 *
 * @param options - Options for creating the package
 * @returns A Promise that resolves when the package has been created
 *
 * @example
 * ```typescript
 * // Create with specific template
 * await createPackage({
 *   name: 'my-app',
 *   template: 'react',
 *   outputDir: './my-app'
 * })
 *
 * // Create with interactive prompts
 * await createPackage({
 *   interactive: true
 * })
 *
 * // Create from GitHub repository
 * await createPackage({
 *   name: 'my-library',
 *   template: 'user/repo',
 *   outputDir: './my-library'
 * })
 * ```
 */
export async function createPackage(
  options: CreateCommandOptions,
): Promise<Result<{projectPath: string}>> {
  try {
    // Validation
    const validation = ValidationUtils.validateCreateOptions(options)
    if (!validation.valid) {
      const errorMessage = validation.errors?.join(', ') ?? 'Invalid options'
      throw new Error(errorMessage)
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        consola.warn(warning)
      }
    }

    // Interactive mode
    let finalOptions = {...options}
    if (options.interactive && !options.skipPrompts) {
      finalOptions = await runInteractivePrompts(options)
    }

    // Set defaults
    const projectName = finalOptions.name ?? 'new-project'
    const template = finalOptions.template ?? 'default'
    let outputDir = finalOptions.outputDir ?? path.join(process.cwd(), projectName)
    const author = finalOptions.author ?? 'Anonymous'
    const description = finalOptions.description ?? 'A new project'
    const version = finalOptions.version ?? '1.0.0'

    // If dryRun is requested, use a temporary directory to avoid writing to the repo
    let tempOutputDir: string | undefined
    if (finalOptions.dryRun) {
      const {mkdtemp} = await import('node:fs/promises')
      const {tmpdir} = await import('node:os')
      tempOutputDir = await mkdtemp(path.join(tmpdir(), 'bfra-me-create-'))
      outputDir = tempOutputDir
    }

    if (finalOptions.verbose) {
      consola.info('Creating project with options:', {
        projectName,
        template,
        outputDir,
        author,
        description,
        version,
        dryRun: Boolean(finalOptions.dryRun),
      })
    }

    // Resolve template source
    const templateSource = templateResolver.resolve(template)
    const sourceValidation = await templateResolver.validate(templateSource)

    if (!sourceValidation.valid) {
      throw new Error(`Invalid template: ${sourceValidation.errors?.join(', ')}`)
    }

    if (finalOptions.verbose) {
      consola.info('Template source resolved:', templateSource)
    }

    // Fetch template
    const fetchResult = await templateFetcher.fetch(
      templateSource,
      path.join(outputDir, '.template'),
    )

    if (!fetchResult.success) {
      throw fetchResult.error
    }

    const {path: templatePath, metadata} = fetchResult.data

    if (finalOptions.verbose) {
      consola.info('Template fetched:', {templatePath, metadata})
    }

    // Build template context
    const context: TemplateContext = {
      projectName,
      description,
      author,
      version,
      packageManager: finalOptions.packageManager || 'npm',
      variables: {
        name: projectName,
        description,
        author,
        version,
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0],
      },
    }

    // Validate template context
    const contextValidation = templateProcessor.validateContext(
      context,
      metadata.variables?.map(v => v.name),
    )
    if (!contextValidation.valid) {
      consola.warn('Template context validation warnings:', contextValidation.missing)
    }

    // Process template
    const processResult = await templateProcessor.process(templatePath, outputDir, context)

    if (!processResult.success) {
      throw processResult.error
    }

    // Cleanup temporary template files
    try {
      await import('node:fs/promises').then(async fs =>
        fs.rm(path.join(outputDir, '.template'), {recursive: true, force: true}),
      )
    } catch {
      // Ignore cleanup errors
    }

    // If this was a dry run, remove the temporary output directory so nothing is left behind
    if (finalOptions.dryRun && tempOutputDir != null) {
      try {
        await import('node:fs/promises').then(async fs =>
          fs.rm(tempOutputDir, {recursive: true, force: true}),
        )
      } catch {
        // Ignore cleanup errors
      }
    }

    if (finalOptions.verbose) {
      consola.info(
        `Template processed: ${processResult.data.operations.length} operations completed`,
      )
    }

    return {
      success: true,
      data: {projectPath: outputDir},
    }
  } catch (error) {
    consola.error('Failed to create package:', error)
    return {
      success: false,
      error: error as Error,
    }
  }
}

/**
 * Run interactive prompts to gather project information.
 */
async function runInteractivePrompts(
  initialOptions: CreateCommandOptions,
): Promise<CreateCommandOptions> {
  intro('🚀 Create a new project')

  try {
    // Project name
    const name =
      initialOptions.name ??
      (await text({
        message: 'What is the name of your project?',
        placeholder: 'my-awesome-project',
        validate: value => {
          const validation = ValidationUtils.validateProjectName(value)
          return validation.valid ? undefined : validation.errors?.[0]
        },
      }))

    if (isCancel(name)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    // Template selection
    const availableTemplates = templateResolver.getBuiltinTemplates()
    const templateChoices = [
      {value: 'default', label: 'Default - Basic TypeScript project'},
      ...availableTemplates
        .filter(t => t !== 'default')
        .map(t => ({
          value: t,
          label: `${t} - Built-in template`,
        })),
      {value: 'custom', label: 'Custom - Enter GitHub repo or URL'},
    ]

    const templateChoice =
      initialOptions.template ??
      (await select({
        message: 'Which template would you like to use?',
        options: templateChoices,
      }))

    if (isCancel(templateChoice)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    let template = templateChoice
    if (template === 'custom') {
      const customTemplate = await text({
        message: 'Enter template (GitHub repo, URL, or local path):',
        placeholder: 'user/repo or https://example.com/template.zip',
        validate: value => {
          const validation = ValidationUtils.validateTemplateId(value)
          return validation.valid ? undefined : validation.errors?.[0]
        },
      })

      if (isCancel(customTemplate)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      template = customTemplate
    }

    // Project description
    const description =
      initialOptions.description ??
      (await text({
        message: 'Describe your project:',
        placeholder: 'A fantastic new project',
      }))

    if (isCancel(description)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    // Project author
    const author =
      initialOptions.author ??
      (await text({
        message: 'Who is the author?',
        placeholder: 'Your Name <your.email@example.com>',
      }))

    if (isCancel(author)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    // Output directory
    const defaultOutputDir = path.join(process.cwd(), name)
    const outputDir =
      initialOptions.outputDir ??
      (await text({
        message: 'Where should the project be created?',
        placeholder: defaultOutputDir,
        defaultValue: defaultOutputDir,
      }))

    if (isCancel(outputDir)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    // Package manager
    const packageManager =
      initialOptions.packageManager ||
      (await select({
        message: 'Which package manager do you prefer?',
        options: [
          {value: 'npm', label: 'npm'},
          {value: 'yarn', label: 'Yarn'},
          {value: 'pnpm', label: 'pnpm'},
          {value: 'bun', label: 'Bun'},
        ],
      }))

    if (isCancel(packageManager)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    // Force overwrite confirmation if directory exists
    let force = initialOptions.force
    if (!force && (await import('node:fs').then(fs => fs.existsSync(outputDir)))) {
      const forceConfirm = await confirm({
        message: 'Output directory already exists. Overwrite existing files?',
      })

      if (isCancel(forceConfirm)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      force = forceConfirm
    }

    outro('✅ Project configuration complete!')

    return {
      ...initialOptions,
      name,
      template,
      description,
      author,
      outputDir,
      packageManager,
      force: force as boolean,
    }
  } catch (error) {
    cancel('Project creation cancelled due to error.')
    throw error
  }
}

// Export legacy interface for backward compatibility
export {createPackage as default}

// Re-export types
export type {CreateCommandOptions, CreatePackageOptions, TemplateContext}
