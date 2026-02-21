/**
 * Template selection interface with preview and description support
 */

import type {Result} from '@bfra.me/es/result'
import type {TemplateError, TemplateMetadata, TemplateSelection} from '../types.js'
import process from 'node:process'
import {err, ok} from '@bfra.me/es/result'
import {cancel, isCancel, note, select} from '@clack/prompts'
import {consola} from 'consola'

// Built-in template definitions
const BUILTIN_TEMPLATES: Record<string, TemplateMetadata> = {
  default: {
    name: 'default',
    description: 'Basic TypeScript project with essential configurations',
    version: '1.0.0',
    author: '@bfra.me/works',
    tags: ['typescript', 'basic', 'starter'],
  },
  library: {
    name: 'library',
    description: 'NPM library template with publishing configuration',
    version: '1.0.0',
    author: '@bfra.me/works',
    tags: ['typescript', 'library', 'npm', 'publishing'],
  },
  cli: {
    name: 'cli',
    description: 'Command-line application with CLI framework setup',
    version: '1.0.0',
    author: '@bfra.me/works',
    tags: ['typescript', 'cli', 'command-line'],
  },
  node: {
    name: 'node',
    description: 'Node.js server application with Express setup',
    version: '1.0.0',
    author: '@bfra.me/works',
    tags: ['typescript', 'node', 'server', 'express'],
  },
  react: {
    name: 'react',
    description: 'React application with modern tooling',
    version: '1.0.0',
    author: '@bfra.me/works',
    tags: ['typescript', 'react', 'frontend', 'vite'],
  },
}

/**
 * Interactive template selection with preview and validation.
 *
 * Provides an interactive prompt for users to select from built-in templates or specify
 * custom template sources (GitHub repositories, URLs, or local paths). When a template is
 * selected, displays a preview of the template's metadata before proceeding.
 *
 * @param initialTemplate - Optional pre-selected template identifier. If provided, skips interactive selection.
 * @returns A Result containing the selected template information or an error.
 *
 * @example
 * ```typescript
 * import { templateSelection } from '@bfra.me/create/prompts'
 * import { isOk } from '@bfra.me/es/result'
 *
 * // Interactive selection
 * const result = await templateSelection()
 * if (isOk(result)) {
 *   console.log('Selected:', result.value.type, result.value.location)
 * }
 *
 * // Pre-selected template
 * const result = await templateSelection('library')
 * ```
 */
export async function templateSelection(
  initialTemplate?: string,
): Promise<Result<TemplateSelection, TemplateError>> {
  // If template is already specified, resolve it directly
  if (initialTemplate != null && initialTemplate.trim().length > 0) {
    return resolveTemplateSource(initialTemplate)
  }

  // Show available templates
  const templateOptions = Object.entries(BUILTIN_TEMPLATES).map(([key, metadata]) => ({
    value: key,
    label: `${metadata.name} - ${metadata.description}`,
    hint: metadata.tags?.join(', ') ?? '',
  }))

  // Add custom template option
  templateOptions.push({
    value: 'custom',
    label: 'Custom template (GitHub repo, URL, or local path)',
    hint: 'github:user/repo, https://..., or ./path',
  })

  const selectedTemplate = await select({
    message: '📋 Choose a template for your project:',
    options: templateOptions,
  })

  if (isCancel(selectedTemplate)) {
    cancel('Template selection cancelled')
    process.exit(0)
  }

  // Handle custom template input
  if (selectedTemplate === 'custom') {
    const {text} = await import('@clack/prompts')

    const customTemplate = await text({
      message: '🔗 Enter custom template source:',
      placeholder: 'github:user/repo, https://example.com/template.zip, or ./local/path',
      validate: value => {
        if (value == null || value.trim().length === 0) {
          return 'Template source is required'
        }
        return undefined
      },
    })

    if (isCancel(customTemplate)) {
      cancel('Template selection cancelled')
      process.exit(0)
    }

    return resolveTemplateSource(customTemplate.trim())
  }

  // Show template preview
  const templateMetadata = BUILTIN_TEMPLATES[selectedTemplate]
  if (templateMetadata) {
    await showTemplatePreview(templateMetadata)
  }

  return resolveTemplateSource(selectedTemplate)
}

/**
 * Resolve template source into TemplateSelection
 *
 * @returns A Result containing the resolved template or an error
 */
function resolveTemplateSource(source: string): Result<TemplateSelection, TemplateError> {
  // GitHub repository pattern: github:user/repo or user/repo
  if (source.startsWith('github:') || /^[\w-]+\/[\w-]+$/.test(source)) {
    const repo = source.startsWith('github:') ? source.slice(7) : source
    const [repoPath, ref] = repo.includes('#') ? repo.split('#') : [repo, undefined]

    return ok({
      type: 'github',
      location: repoPath,
      ref,
      metadata: {
        name: repo,
        description: `GitHub template: ${repo}`,
        version: '1.0.0',
      },
    })
  }

  // URL pattern: http:// or https://
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return ok({
      type: 'url',
      location: source,
      metadata: {
        name: 'url-template',
        description: `URL template: ${source}`,
        version: '1.0.0',
      },
    })
  }

  // Local path pattern: ./ or / or ~/
  if (source.startsWith('./') || source.startsWith('/') || source.startsWith('~/')) {
    return ok({
      type: 'local',
      location: source,
      metadata: {
        name: 'local-template',
        description: `Local template: ${source}`,
        version: '1.0.0',
      },
    })
  }

  // Built-in template
  const metadata = BUILTIN_TEMPLATES[source]
  if (metadata) {
    return ok({
      type: 'builtin',
      location: source,
      metadata,
    })
  }

  // Default fallback
  consola.warn(`Unknown template "${source}", using default template`)
  const defaultTemplate = BUILTIN_TEMPLATES.default
  if (!defaultTemplate) {
    return err({
      code: 'TEMPLATE_NOT_FOUND',
      message: 'Default template not found',
      source: 'builtin:default',
    })
  }

  return ok({
    type: 'builtin',
    location: 'default',
    metadata: defaultTemplate,
  })
}

/**
 * Show template preview with metadata and features
 */
async function showTemplatePreview(metadata: TemplateMetadata): Promise<void> {
  let preview = `📦 ${metadata.name}\n`
  preview += `📝 ${metadata.description}\n`

  if (metadata.version) {
    preview += `🏷️  Version: ${metadata.version}\n`
  }

  if (metadata.author != null && metadata.author.trim().length > 0) {
    preview += `👤 Author: ${metadata.author}\n`
  }

  if (metadata.tags && metadata.tags.length > 0) {
    preview += `🏷️  Tags: ${metadata.tags.join(', ')}\n`
  }

  if (metadata.nodeVersion != null && metadata.nodeVersion.trim().length > 0) {
    preview += `⚙️  Node.js: ${metadata.nodeVersion}+\n`
  }

  note(preview, 'Template Preview')
}

/**
 * Get list of available built-in templates
 */
export function getBuiltinTemplates(): Record<string, TemplateMetadata> {
  return {...BUILTIN_TEMPLATES}
}

/**
 * Validate template source format
 */
export function validateTemplateSource(source: string): {valid: boolean; error?: string} {
  if (!source || source.trim().length === 0) {
    return {valid: false, error: 'Template source cannot be empty'}
  }

  const trimmed = source.trim()

  // Check for valid patterns
  const patterns = [
    /^github:[\w-]+\/[\w-]+/, // github:user/repo
    /^[\w-]+\/[\w-]+$/, // user/repo
    /^https?:\/\//, // http/https URL
    /^\.?\//, // local path starting with ./ or /
    /^~\//, // home directory path
  ]

  const isBuiltin = Object.keys(BUILTIN_TEMPLATES).includes(trimmed)
  const isValidPattern = patterns.some(pattern => pattern.test(trimmed))

  if (isBuiltin || isValidPattern) {
    return {valid: true}
  }

  return {
    valid: false,
    error:
      'Invalid template source. Use: builtin-name, github:user/repo, user/repo, https://..., or ./path',
  }
}
