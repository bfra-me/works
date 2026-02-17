/**
 * @bfra.me/doc-sync/generators/mdx-generator - MDX document structure generation for Starlight
 */

import type {Result} from '@bfra.me/es/result'
import type {
  MDXDocument,
  MDXFrontmatter,
  PackageAPI,
  PackageInfo,
  ReadmeContent,
  SyncError,
} from '../types'

import {err, ok} from '@bfra.me/es/result'
import {SENTINEL_MARKERS} from '../types'
import {extractCodeBlocks, parseJSXTags} from '../utils/safe-patterns'
import {sanitizeAttribute, sanitizeForMDX, sanitizeJSXTag} from '../utils/sanitization'
import {generateAPIReference} from './api-reference-generator'
import {formatCodeExamples} from './code-example-formatter'
import {mapToStarlightComponents} from './component-mapper'
import {generateFrontmatter, stringifyFrontmatter} from './frontmatter-generator'

/**
 * Options for MDX generation
 */
export interface MDXGeneratorOptions {
  /** Include API reference section */
  readonly includeAPI?: boolean
  /** Include examples from JSDoc */
  readonly includeExamples?: boolean
  /** Custom frontmatter overrides */
  readonly frontmatterOverrides?: Partial<MDXFrontmatter>
  /** Preserve manual content sections */
  readonly preserveManualContent?: boolean
  /** Existing MDX content for merging */
  readonly existingContent?: string
}

/**
 * Default options for MDX generation
 */
const DEFAULT_OPTIONS: Required<
  Omit<MDXGeneratorOptions, 'frontmatterOverrides' | 'existingContent'>
> = {
  includeAPI: true,
  includeExamples: true,
  preserveManualContent: true,
}

/**
 * Starlight component imports required for generated documentation
 */
const STARLIGHT_IMPORTS = `import { Badge, Card, CardGrid, Tabs, TabItem } from '@astrojs/starlight/components';`

export function generateMDXDocument(
  packageInfo: PackageInfo,
  readme: ReadmeContent | undefined,
  api: PackageAPI | undefined,
  options: MDXGeneratorOptions = {},
): Result<MDXDocument, SyncError> {
  const mergedOptions = {...DEFAULT_OPTIONS, ...options}

  try {
    const frontmatter = generateFrontmatter(packageInfo, readme, options.frontmatterOverrides)
    const contentSections = buildContentSections(packageInfo, readme, api, mergedOptions)
    const content = contentSections.join('\n\n')
    const rendered = renderMDXDocument(frontmatter, content)

    return ok({
      frontmatter,
      content,
      rendered,
    })
  } catch (error) {
    return err({
      code: 'GENERATION_ERROR',
      message: `Failed to generate MDX for ${packageInfo.name}: ${error instanceof Error ? error.message : String(error)}`,
      packageName: packageInfo.name,
      cause: error,
    })
  }
}

function buildContentSections(
  packageInfo: PackageInfo,
  readme: ReadmeContent | undefined,
  api: PackageAPI | undefined,
  options: Required<Omit<MDXGeneratorOptions, 'frontmatterOverrides' | 'existingContent'>>,
): string[] {
  const sections: string[] = []

  sections.push(STARLIGHT_IMPORTS)
  sections.push('')
  sections.push(generatePackageHeader(packageInfo))

  if (readme !== undefined) {
    const mappedContent = mapToStarlightComponents(readme, packageInfo)
    sections.push(mappedContent)
  }

  if (options.includeAPI && api !== undefined && hasAPIContent(api)) {
    sections.push(SENTINEL_MARKERS.AUTO_START)
    sections.push('')
    sections.push('## API Reference')
    sections.push('')
    sections.push(generateAPIReference(api))

    if (options.includeExamples) {
      const examples = formatCodeExamples(api)
      if (examples.length > 0) {
        sections.push('')
        sections.push('## Examples')
        sections.push('')
        sections.push(examples)
      }
    }

    sections.push('')
    sections.push(SENTINEL_MARKERS.AUTO_END)
  }

  return sections
}

function generatePackageHeader(packageInfo: PackageInfo): string {
  const lines: string[] = []

  lines.push(`# ${packageInfo.name}`)
  lines.push('')

  const badges: string[] = []

  if (packageInfo.keywords?.includes('cli')) {
    badges.push(`<Badge text="CLI Tool" variant="tip" />`)
  } else if (packageInfo.keywords?.includes('library')) {
    badges.push(`<Badge text="Library" variant="tip" />`)
  } else if (packageInfo.keywords?.includes('config')) {
    badges.push(`<Badge text="Config" variant="tip" />`)
  }

  badges.push(`<Badge text="${sanitizeAttribute(`v${packageInfo.version}`)}" variant="note" />`)

  if (badges.length > 0) {
    lines.push(badges.join('\n'))
    lines.push('')
  }

  if (packageInfo.description !== undefined) {
    lines.push(packageInfo.description)
    lines.push('')
  }

  return lines.join('\n')
}

function hasAPIContent(api: PackageAPI): boolean {
  return api.functions.length > 0 || api.types.length > 0
}

function renderMDXDocument(frontmatter: MDXFrontmatter, content: string): string {
  const frontmatterYaml = stringifyFrontmatter(frontmatter)
  return `---\n${frontmatterYaml}\n---\n\n${content}\n`
}

/**
 * Sanitizes content for safe MDX rendering
 * Prevents XSS by escaping potentially dangerous content
 */
export function sanitizeContent(content: string): string {
  return sanitizeForMDX(content)
}

/**
 * Sanitizes content within MDX while preserving JSX components
 * Sanitizes JSX component attributes to prevent XSS while leaving closing tags unchanged
 */
export function sanitizeTextContent(content: string): string {
  const jsxTags = parseJSXTags(content)
  const parts: string[] = []
  let lastIndex = 0

  for (const {tag, index, isClosing} of jsxTags) {
    if (index > lastIndex) {
      parts.push(sanitizeContent(content.slice(lastIndex, index)))
    }

    parts.push(isClosing ? tag : sanitizeJSXTag(tag))
    lastIndex = index + tag.length
  }

  if (lastIndex < content.length) {
    parts.push(sanitizeContent(content.slice(lastIndex)))
  }

  return parts.join('')
}

export function validateMDXSyntax(mdx: string): Result<true, SyncError> {
  const unclosedTags = checkForUnclosedTags(mdx)
  if (unclosedTags.length > 0) {
    return err({
      code: 'VALIDATION_ERROR',
      message: `Unclosed MDX tags: ${unclosedTags.join(', ')}`,
    })
  }

  const invalidFrontmatter = checkFrontmatter(mdx)
  if (invalidFrontmatter !== undefined) {
    return err({
      code: 'VALIDATION_ERROR',
      message: invalidFrontmatter,
    })
  }

  return ok(true)
}

/**
 * Checks if a tag name is likely a TypeScript generic parameter rather than a JSX component
 * Single uppercase letters (T, E, K, V, etc.) are common generic type parameters
 */
function isTypeScriptGeneric(tag: string): boolean {
  const tagNameMatch = tag.match(/<\/?([A-Z][a-zA-Z0-9]*)/)
  const tagName = tagNameMatch?.[1]
  return tagName !== undefined && tagName.length === 1
}

function checkForUnclosedTags(mdx: string): string[] {
  const unclosed: string[] = []
  const tagStack: string[] = []

  // Remove code blocks and inline code to prevent TypeScript generics like Result<T, E>
  // from being misinterpreted as JSX tags
  const codeBlocks = extractCodeBlocks(mdx)
  let contentWithoutCode = mdx
  for (const block of codeBlocks) {
    const lineCount = block.split('\n').length
    const placeholder = '\n'.repeat(lineCount)
    contentWithoutCode = contentWithoutCode.replace(block, placeholder)
  }

  const allJSXTags = parseJSXTags(contentWithoutCode)
  const jsxTags = allJSXTags.filter(({tag}) => !isTypeScriptGeneric(tag))

  for (const {tag, isClosing, isSelfClosing} of jsxTags) {
    const tagNameMatch = isClosing
      ? tag.match(/^<\/([A-Z][a-zA-Z0-9]*)>$/)
      : tag.match(/^<([A-Z][a-zA-Z0-9]*)/)
    const tagName = tagNameMatch?.[1]

    if (tagName === undefined) continue

    if (isClosing) {
      const lastOpenTag = tagStack.pop()
      if (lastOpenTag !== tagName && lastOpenTag !== undefined) {
        unclosed.push(lastOpenTag)
      }
    } else if (!isSelfClosing) {
      tagStack.push(tagName)
    }
  }

  unclosed.push(...tagStack)

  return unclosed
}

function checkFrontmatter(mdx: string): string | undefined {
  if (!mdx.startsWith('---')) {
    return 'MDX document must start with frontmatter'
  }

  const secondDashIndex = mdx.indexOf('---', 3)
  if (secondDashIndex === -1) {
    return 'Frontmatter is not properly closed'
  }

  const frontmatterContent = mdx.slice(3, secondDashIndex).trim()
  if (frontmatterContent.length === 0) {
    return 'Frontmatter cannot be empty'
  }

  if (!frontmatterContent.includes('title:')) {
    return 'Frontmatter must include a title'
  }

  return undefined
}
