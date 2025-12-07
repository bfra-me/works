/**
 * Template source normalization utilities
 * Part of Phase 2: Template System Refactoring
 *
 * This module provides utilities for normalizing template sources
 * with branded type enforcement and Phase 1 validation.
 */

import type {Result} from '@bfra.me/es/result'
import type {BrandedTemplateSource, TemplateSource} from '../types.js'
import path from 'node:path'
import {err, ok} from '@bfra.me/es/result'
import {createTemplateError, TemplateErrorCode} from '../utils/errors.js'
import {createTemplateSource} from '../utils/type-guards.js'
import {validateTemplateId} from '../utils/validation-factory.js'

/**
 * Source normalization options
 */
export interface NormalizationOptions {
  /** Enable strict validation mode */
  strict?: boolean
  /** Resolve relative paths to absolute */
  resolveRelativePaths?: boolean
  /** Remove .git suffix from GitHub URLs */
  removeGitSuffix?: boolean
  /** Default branch for GitHub repositories */
  defaultBranch?: string
}

/**
 * Default normalization options
 */
export const DEFAULT_NORMALIZATION_OPTIONS: Required<NormalizationOptions> = {
  strict: false,
  resolveRelativePaths: true,
  removeGitSuffix: true,
  defaultBranch: 'main',
}

/**
 * Normalized source result with additional metadata
 */
export interface NormalizedSource {
  /** The normalized template source */
  source: TemplateSource
  /** Branded source string */
  branded: BrandedTemplateSource
  /** Original input string */
  original: string
  /** Whether normalization changed the input */
  modified: boolean
  /** Detected source type */
  detectedType: TemplateSource['type']
}

/**
 * Source type detection patterns
 */
const SOURCE_PATTERNS = {
  github: {
    shorthand: /^[\w.-]+\/[\w.-]+(?:\/.*)?(?:#[\w./-]+)?$/,
    url: /^https?:\/\/(www\.)?github\.com\//,
  },
  local: {
    relative: /^\.\.?\//,
    absolute: /^\/|^[a-z]:\\/i,
  },
} as const

/**
 * Detects the type of a template source from a string.
 *
 * @param input - The input string to detect
 * @returns The detected source type
 *
 * @example
 * ```typescript
 * detectSourceType('user/repo') // 'github'
 * detectSourceType('./template') // 'local'
 * detectSourceType('https://example.com/template') // 'url'
 * detectSourceType('default') // 'builtin'
 * ```
 */
export function detectSourceType(input: string): TemplateSource['type'] {
  const trimmed = input.trim()

  if (trimmed.startsWith('github:')) {
    return 'github'
  }

  if (SOURCE_PATTERNS.github.url.test(trimmed)) {
    return 'url'
  }

  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('file://')
  ) {
    return 'url'
  }

  if (
    SOURCE_PATTERNS.local.relative.test(trimmed) ||
    SOURCE_PATTERNS.local.absolute.test(trimmed)
  ) {
    return 'local'
  }

  if (SOURCE_PATTERNS.github.shorthand.test(trimmed)) {
    return 'github'
  }

  return 'builtin'
}

/**
 * Normalizes a GitHub source string.
 *
 * @param input - The GitHub source string
 * @param options - Normalization options
 * @returns Normalized source
 */
function normalizeGitHubSource(
  input: string,
  options: Required<NormalizationOptions>,
): TemplateSource {
  let location = input

  if (location.startsWith('github:')) {
    location = location.slice(7)
  }

  if (options.removeGitSuffix) {
    location = location.replace(/\.git$/, '')
  }

  let ref: string | undefined
  let subdir: string | undefined

  if (location.includes('#')) {
    const [repo, refPart] = location.split('#', 2)
    if (repo !== undefined) {
      location = repo
    }
    ref = refPart
  }

  const parts = location.split('/')
  if (parts.length > 2) {
    location = `${parts[0]}/${parts[1]}`
    subdir = parts.slice(2).join('/')
  }

  return {
    type: 'github',
    location,
    ref,
    subdir,
  }
}

/**
 * Normalizes a local path source.
 *
 * @param input - The local path string
 * @param options - Normalization options
 * @returns Normalized source
 */
function normalizeLocalSource(
  input: string,
  options: Required<NormalizationOptions>,
): TemplateSource {
  let location = input

  if (options.resolveRelativePaths && !path.isAbsolute(location)) {
    location = path.resolve(location)
  }

  return {
    type: 'local',
    location,
  }
}

/**
 * Normalizes a URL source string.
 *
 * @param input - The URL string
 * @returns Normalized source
 */
function normalizeUrlSource(input: string): TemplateSource {
  return {
    type: 'url',
    location: input,
  }
}

/**
 * Normalizes a builtin template source.
 *
 * @param input - The builtin template name
 * @returns Normalized source
 */
function normalizeBuiltinSource(input: string): TemplateSource {
  return {
    type: 'builtin',
    location: input.trim(),
  }
}

/**
 * Normalizes a template source string into a structured TemplateSource.
 *
 * This function applies consistent normalization rules including:
 * - Detecting source type from input format
 * - Removing .git suffix from GitHub URLs
 * - Resolving relative paths to absolute
 * - Extracting branch/ref and subdirectory information
 *
 * @param input - The template source string to normalize
 * @param options - Normalization options
 * @returns Result containing normalized source or error
 *
 * @example
 * ```typescript
 * const result = normalizeTemplateSource('user/repo#main/templates/cli')
 * if (result.success) {
 *   console.log(result.data.source)
 *   // { type: 'github', location: 'user/repo', ref: 'main', subdir: 'templates/cli' }
 * }
 * ```
 */
export function normalizeTemplateSource(
  input: string,
  options: NormalizationOptions = {},
): Result<NormalizedSource, Error> {
  const opts: Required<NormalizationOptions> = {
    ...DEFAULT_NORMALIZATION_OPTIONS,
    ...options,
  }

  const trimmed = input.trim()

  if (trimmed.length === 0) {
    return err(
      createTemplateError('Template source cannot be empty', TemplateErrorCode.TEMPLATE_INVALID, {
        input,
      }),
    )
  }

  if (opts.strict) {
    const validation = validateTemplateId(trimmed)
    if (!validation.success) {
      return err(validation.error)
    }
  }

  const detectedType = detectSourceType(trimmed)

  let source: TemplateSource

  switch (detectedType) {
    case 'github':
      source = normalizeGitHubSource(trimmed, opts)
      break

    case 'local':
      source = normalizeLocalSource(trimmed, opts)
      break

    case 'url':
      source = normalizeUrlSource(trimmed)
      break

    case 'builtin':
    default:
      source = normalizeBuiltinSource(trimmed)
      break
  }

  let branded: BrandedTemplateSource
  try {
    branded = createTemplateSource(trimmed)
  } catch {
    return err(
      createTemplateError(
        'Failed to create branded template source',
        TemplateErrorCode.TEMPLATE_INVALID,
        {input: trimmed},
      ),
    )
  }

  const modified =
    input !== trimmed ||
    (detectedType === 'local' && opts.resolveRelativePaths && !path.isAbsolute(input)) ||
    (detectedType === 'github' && opts.removeGitSuffix && input.endsWith('.git'))

  return ok({
    source,
    branded,
    original: input,
    modified,
    detectedType,
  })
}

/**
 * Converts a TemplateSource back to a string representation.
 *
 * @param source - The template source to stringify
 * @returns String representation of the source
 *
 * @example
 * ```typescript
 * stringifyTemplateSource({
 *   type: 'github',
 *   location: 'user/repo',
 *   ref: 'main',
 *   subdir: 'templates'
 * })
 * // 'github:user/repo#main/templates'
 * ```
 */
export function stringifyTemplateSource(source: TemplateSource): string {
  switch (source.type) {
    case 'github': {
      let result = `github:${source.location}`
      if (source.ref !== undefined) {
        result += `#${source.ref}`
      }
      if (source.subdir !== undefined) {
        result += `/${source.subdir}`
      }
      return result
    }

    case 'url':
      return source.location

    case 'local':
      return source.location

    case 'builtin':
      return source.location

    default:
      return source.location
  }
}

/**
 * Compares two template sources for equality.
 *
 * @param a - First template source
 * @param b - Second template source
 * @returns Whether the sources are equivalent
 *
 * @example
 * ```typescript
 * const source1 = { type: 'github', location: 'user/repo' }
 * const source2 = { type: 'github', location: 'user/repo', ref: undefined }
 * areSourcesEqual(source1, source2) // true
 * ```
 */
export function areSourcesEqual(a: TemplateSource, b: TemplateSource): boolean {
  if (a.type !== b.type) return false
  if (a.location !== b.location) return false
  if (a.ref !== b.ref) return false
  if (a.subdir !== b.subdir) return false
  return true
}

/**
 * Creates a unique identifier for a template source.
 *
 * This is useful for caching and deduplication purposes.
 *
 * @param source - The template source
 * @returns A unique identifier string
 *
 * @example
 * ```typescript
 * getSourceId({ type: 'github', location: 'user/repo', ref: 'main' })
 * // 'github:user/repo#main'
 * ```
 */
export function getSourceId(source: TemplateSource): string {
  const parts = [source.type, source.location]
  if (source.ref !== undefined) parts.push(`ref:${source.ref}`)
  if (source.subdir !== undefined) parts.push(`subdir:${source.subdir}`)
  return parts.join(':')
}

/**
 * Validates a template source structure.
 *
 * @param source - The template source to validate
 * @returns Result indicating validity
 *
 * @example
 * ```typescript
 * const result = validateSource({ type: 'github', location: '' })
 * if (!result.success) {
 *   console.error(result.error.message)
 *   // 'GitHub repository location cannot be empty'
 * }
 * ```
 */
export function validateSource(source: TemplateSource): Result<void, Error> {
  if (source.location.trim().length === 0) {
    return err(
      createTemplateError(
        `${source.type} location cannot be empty`,
        TemplateErrorCode.TEMPLATE_INVALID,
        {source},
      ),
    )
  }

  switch (source.type) {
    case 'github': {
      const parts = source.location.split('/')
      const owner = parts[0]
      const repo = parts[1]
      if (
        parts.length < 2 ||
        owner === '' ||
        repo === '' ||
        owner === undefined ||
        repo === undefined
      ) {
        return err(
          createTemplateError(
            'GitHub repository must be in format "owner/repo"',
            TemplateErrorCode.TEMPLATE_INVALID,
            {source},
          ),
        )
      }

      if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
        return err(
          createTemplateError(
            'GitHub repository owner and name can only contain alphanumeric characters, hyphens, and dots',
            TemplateErrorCode.TEMPLATE_INVALID,
            {source},
          ),
        )
      }
      break
    }

    case 'url': {
      if (!URL.canParse(source.location)) {
        return err(
          createTemplateError('Invalid URL format', TemplateErrorCode.TEMPLATE_INVALID, {source}),
        )
      }
      break
    }

    case 'local': {
      if (source.location.includes('\0')) {
        return err(
          createTemplateError(
            'Local path contains null bytes',
            TemplateErrorCode.TEMPLATE_INVALID,
            {source},
          ),
        )
      }

      const normalized = path.normalize(source.location)
      if (normalized.includes('..') && !source.location.startsWith('..')) {
        return err(
          createTemplateError(
            'Path traversal detected in local path',
            TemplateErrorCode.TEMPLATE_INVALID,
            {source},
          ),
        )
      }
      break
    }

    case 'builtin':
      break
  }

  return ok(undefined)
}
