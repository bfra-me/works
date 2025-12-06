import type {Result} from '@bfra.me/es/result'
import type {MDXDocument, SyncError} from '../types'

import {err, ok} from '@bfra.me/es/result'

import {validateMDXSyntax} from '../generators'
import {
  createHeadingPattern,
  extractCodeBlocks,
  findEmptyMarkdownLinks,
  hasComponent,
} from '../utils/safe-patterns'

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly ValidationError[]
  readonly warnings: readonly ValidationWarning[]
}

export interface ValidationError {
  readonly type: 'syntax' | 'frontmatter' | 'component' | 'content'
  readonly message: string
  readonly line?: number
  readonly column?: number
}

export interface ValidationWarning {
  readonly type: 'deprecation' | 'recommendation' | 'compatibility'
  readonly message: string
  readonly line?: number
}

export interface ValidationPipelineOptions {
  readonly validateFrontmatter?: boolean
  readonly validateComponents?: boolean
  readonly validateContent?: boolean
  readonly strict?: boolean
}

const DEFAULT_OPTIONS: Required<ValidationPipelineOptions> = {
  validateFrontmatter: true,
  validateComponents: true,
  validateContent: true,
  strict: false,
}

export function createValidationPipeline(options: ValidationPipelineOptions = {}): {
  readonly validate: (doc: MDXDocument) => ValidationResult
  readonly validateContent: (content: string) => ValidationResult
  readonly validateMultiple: (
    docs: readonly MDXDocument[],
  ) => Result<Map<string, ValidationResult>, SyncError>
} {
  const mergedOptions = {...DEFAULT_OPTIONS, ...options}

  function validate(doc: MDXDocument): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (mergedOptions.validateFrontmatter) {
      const frontmatterResult = validateFrontmatter(doc.frontmatter)
      errors.push(...frontmatterResult.errors)
      warnings.push(...frontmatterResult.warnings)
    }

    const syntaxResult = validateSyntax(doc.rendered)
    errors.push(...syntaxResult.errors)
    warnings.push(...syntaxResult.warnings)

    if (mergedOptions.validateComponents) {
      const componentResult = validateStarlightComponents(doc.rendered)
      errors.push(...componentResult.errors)
      warnings.push(...componentResult.warnings)
    }

    if (mergedOptions.validateContent) {
      const contentResult = validateContentQuality(doc.rendered)
      errors.push(...contentResult.errors)
      warnings.push(...contentResult.warnings)
    }

    const valid = mergedOptions.strict
      ? errors.length === 0 && warnings.length === 0
      : errors.length === 0

    return {valid, errors, warnings}
  }

  function validateContent(content: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const syntaxResult = validateSyntax(content)
    errors.push(...syntaxResult.errors)
    warnings.push(...syntaxResult.warnings)

    if (mergedOptions.validateComponents) {
      const componentResult = validateStarlightComponents(content)
      errors.push(...componentResult.errors)
      warnings.push(...componentResult.warnings)
    }

    const valid = mergedOptions.strict
      ? errors.length === 0 && warnings.length === 0
      : errors.length === 0

    return {valid, errors, warnings}
  }

  function validateMultiple(
    docs: readonly MDXDocument[],
  ): Result<Map<string, ValidationResult>, SyncError> {
    const results = new Map<string, ValidationResult>()
    const seen = new Set<string>()

    for (const doc of docs) {
      const key = doc.frontmatter.title

      // Fixed: Return error on duplicate titles instead of silent overwrite
      if (seen.has(key)) {
        return err({
          code: 'VALIDATION_ERROR',
          message: `Duplicate document title detected: "${key}". Each document must have a unique title.`,
        })
      }

      seen.add(key)
      results.set(key, validate(doc))
    }

    return ok(results)
  }

  return {validate, validateContent, validateMultiple}
}

function validateFrontmatter(frontmatter: MDXDocument['frontmatter']): {
  errors: ValidationError[]
  warnings: ValidationWarning[]
} {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  if (frontmatter.title.trim().length === 0) {
    errors.push({
      type: 'frontmatter',
      message: 'Frontmatter title is required and cannot be empty',
    })
  }

  if (frontmatter.title.length > 100) {
    warnings.push({
      type: 'recommendation',
      message: `Title is ${frontmatter.title.length} characters, consider keeping under 100 for better readability`,
    })
  }

  if (frontmatter.description !== undefined && frontmatter.description.length > 200) {
    warnings.push({
      type: 'recommendation',
      message: 'Description is quite long, consider keeping under 200 characters for SEO',
    })
  }

  return {errors, warnings}
}

function validateSyntax(content: string): {
  errors: ValidationError[]
  warnings: ValidationWarning[]
} {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  const result = validateMDXSyntax(content)

  if (!result.success) {
    errors.push({
      type: 'syntax',
      message: result.error.message,
    })
  }

  return {errors, warnings}
}

const STARLIGHT_COMPONENTS = ['Badge', 'Card', 'CardGrid', 'Tabs', 'TabItem'] as const

function validateStarlightComponents(content: string): {
  errors: ValidationError[]
  warnings: ValidationWarning[]
} {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  for (const component of STARLIGHT_COMPONENTS) {
    const openPattern = new RegExp(String.raw`<${component}(?:\s[^>]*)?>`, 'g')
    const closePattern = new RegExp(`</${component}>`, 'g')
    const selfClosePattern = new RegExp(String.raw`<${component}(?:\s[^>]*)?/>`, 'g')

    const opens = content.match(openPattern)?.length ?? 0
    const closes = content.match(closePattern)?.length ?? 0
    const selfCloses = content.match(selfClosePattern)?.length ?? 0

    const nonSelfClosingOpens = opens - selfCloses
    if (nonSelfClosingOpens > closes) {
      errors.push({
        type: 'component',
        message: `Unclosed <${component}> tag detected (${nonSelfClosingOpens} opens, ${closes} closes)`,
      })
    }
  }

  const hasTabItem = content.includes('<TabItem')
  const hasTabs = content.includes('<Tabs')
  if (hasTabItem && !hasTabs) {
    errors.push({
      type: 'component',
      message: '<TabItem> must be used inside <Tabs>',
    })
  }

  // Ensures hasCard detects 'Card' but not 'CardGrid'
  const hasCard = hasComponent(content, 'Card')
  const hasCardGrid = hasComponent(content, 'CardGrid')
  if (hasCard && !hasCardGrid) {
    warnings.push({
      type: 'recommendation',
      message: 'Consider wrapping <Card> components in <CardGrid> for better layout',
    })
  }

  return {errors, warnings}
}

function validateContentQuality(content: string): {
  errors: ValidationError[]
  warnings: ValidationWarning[]
} {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  const emptyLinkPositions = findEmptyMarkdownLinks(content)
  if (emptyLinkPositions.length > 0) {
    errors.push({
      type: 'content',
      message: `Found ${emptyLinkPositions.length} empty link(s)`,
    })
  }

  const codeBlockMarkers = content.match(/```/g)?.length ?? 0
  if (codeBlockMarkers % 2 !== 0) {
    errors.push({
      type: 'content',
      message: 'Unclosed code block detected (odd number of ``` markers)',
    })
  }

  // Duplicate headings can confuse readers and break anchor links
  const h2Pattern = createHeadingPattern(2)
  const h2Headings: string[] = []
  const h2Matches = content.matchAll(h2Pattern)
  for (const match of h2Matches) {
    const heading = match[1]
    if (heading === undefined) {
      continue
    }
    if (h2Headings.includes(heading)) {
      warnings.push({
        type: 'recommendation',
        message: `Duplicate H2 heading: "${heading}"`,
      })
    }
    h2Headings.push(heading)
  }

  const codeBlocks = extractCodeBlocks(content)
  for (const block of codeBlocks) {
    const lines = block.split('\n')
    for (const line of lines) {
      if (line.length > 120 && !line.startsWith('```')) {
        warnings.push({
          type: 'recommendation',
          message: `Code line exceeds 120 characters, may require horizontal scrolling`,
        })
        break
      }
    }
  }

  return {errors, warnings}
}

export function validateDocument(
  doc: MDXDocument,
  options?: ValidationPipelineOptions,
): Result<MDXDocument, SyncError> {
  const pipeline = createValidationPipeline(options)
  const result = pipeline.validate(doc)

  if (!result.valid) {
    const errorMessages = result.errors.map(e => e.message).join('; ')
    return err({
      code: 'VALIDATION_ERROR',
      message: `MDX validation failed: ${errorMessages}`,
    })
  }

  return ok(doc)
}

export function validateContentString(
  content: string,
  options?: ValidationPipelineOptions,
): Result<string, SyncError> {
  const pipeline = createValidationPipeline(options)
  const result = pipeline.validateContent(content)

  if (!result.valid) {
    const errorMessages = result.errors.map(e => e.message).join('; ')
    return err({
      code: 'VALIDATION_ERROR',
      message: `MDX validation failed: ${errorMessages}`,
    })
  }

  return ok(content)
}
