/**
 * @bfra.me/doc-sync/parsers/guards - Type guards and validation for parser types
 */

import type {
  DocConfigSource,
  ExportedFunction,
  ExportedType,
  JSDocInfo,
  JSDocParam,
  JSDocTag,
  MDXFrontmatter,
  PackageAPI,
  PackageInfo,
  ParseError,
  ReadmeContent,
  ReadmeSection,
  ReExport,
  SyncError,
} from '../types'

export function isParseError(value: unknown): value is ParseError {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    [
      'INVALID_SYNTAX',
      'FILE_NOT_FOUND',
      'READ_ERROR',
      'MALFORMED_JSON',
      'UNSUPPORTED_FORMAT',
    ].includes(obj.code)
  )
}

/**
 * Type guard for SyncError
 */
export function isSyncError(value: unknown): value is SyncError {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    [
      'WRITE_ERROR',
      'VALIDATION_ERROR',
      'GENERATION_ERROR',
      'PACKAGE_NOT_FOUND',
      'CONFIG_ERROR',
    ].includes(obj.code)
  )
}

export function isJSDocParam(value: unknown): value is JSDocParam {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.name === 'string' &&
    (obj.type === undefined || typeof obj.type === 'string') &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.optional === undefined || typeof obj.optional === 'boolean') &&
    (obj.defaultValue === undefined || typeof obj.defaultValue === 'string')
  )
}

export function isJSDocTag(value: unknown): value is JSDocTag {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return typeof obj.name === 'string' && (obj.value === undefined || typeof obj.value === 'string')
}

export function isJSDocInfo(value: unknown): value is JSDocInfo {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.params === undefined || (Array.isArray(obj.params) && obj.params.every(isJSDocParam))) &&
    (obj.returns === undefined || typeof obj.returns === 'string') &&
    (obj.examples === undefined ||
      (Array.isArray(obj.examples) && obj.examples.every(e => typeof e === 'string'))) &&
    (obj.deprecated === undefined || typeof obj.deprecated === 'string') &&
    (obj.since === undefined || typeof obj.since === 'string') &&
    (obj.see === undefined ||
      (Array.isArray(obj.see) && obj.see.every(s => typeof s === 'string'))) &&
    (obj.customTags === undefined ||
      (Array.isArray(obj.customTags) && obj.customTags.every(isJSDocTag)))
  )
}

export function isExportedFunction(value: unknown): value is ExportedFunction {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.name === 'string' &&
    typeof obj.signature === 'string' &&
    typeof obj.isAsync === 'boolean' &&
    typeof obj.isGenerator === 'boolean' &&
    Array.isArray(obj.parameters) &&
    typeof obj.returnType === 'string' &&
    typeof obj.isDefault === 'boolean'
  )
}

export function isExportedType(value: unknown): value is ExportedType {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.name === 'string' &&
    typeof obj.definition === 'string' &&
    typeof obj.kind === 'string' &&
    ['interface', 'type', 'enum', 'class'].includes(obj.kind) &&
    typeof obj.isDefault === 'boolean'
  )
}

export function isReExport(value: unknown): value is ReExport {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.from === 'string' &&
    (obj.exports === '*' ||
      (Array.isArray(obj.exports) && obj.exports.every(e => typeof e === 'string')))
  )
}

export function isPackageAPI(value: unknown): value is PackageAPI {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    Array.isArray(obj.functions) &&
    obj.functions.every(isExportedFunction) &&
    Array.isArray(obj.types) &&
    obj.types.every(isExportedType) &&
    Array.isArray(obj.reExports) &&
    obj.reExports.every(isReExport)
  )
}

export function isDocConfigSource(value: unknown): value is DocConfigSource {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    (obj.title === undefined || typeof obj.title === 'string') &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.sidebar === undefined || typeof obj.sidebar === 'object') &&
    (obj.excludeSections === undefined ||
      (Array.isArray(obj.excludeSections) &&
        obj.excludeSections.every(s => typeof s === 'string'))) &&
    (obj.frontmatter === undefined || typeof obj.frontmatter === 'object')
  )
}

export function isPackageInfo(value: unknown): value is PackageInfo {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.name === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.packagePath === 'string' &&
    typeof obj.srcPath === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.keywords === undefined ||
      (Array.isArray(obj.keywords) && obj.keywords.every(k => typeof k === 'string'))) &&
    (obj.readmePath === undefined || typeof obj.readmePath === 'string') &&
    (obj.docsConfig === undefined || isDocConfigSource(obj.docsConfig))
  )
}

export function isReadmeSection(value: unknown): value is ReadmeSection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.heading === 'string' &&
    typeof obj.level === 'number' &&
    obj.level >= 1 &&
    obj.level <= 6 &&
    typeof obj.content === 'string' &&
    Array.isArray(obj.children) &&
    obj.children.every(isReadmeSection)
  )
}

export function isReadmeContent(value: unknown): value is ReadmeContent {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    (obj.title === undefined || typeof obj.title === 'string') &&
    (obj.preamble === undefined || typeof obj.preamble === 'string') &&
    Array.isArray(obj.sections) &&
    obj.sections.every(isReadmeSection) &&
    typeof obj.raw === 'string'
  )
}

export function isMDXFrontmatter(value: unknown): value is MDXFrontmatter {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.title === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.sidebar === undefined || typeof obj.sidebar === 'object') &&
    (obj.tableOfContents === undefined ||
      typeof obj.tableOfContents === 'boolean' ||
      typeof obj.tableOfContents === 'object') &&
    (obj.template === undefined || obj.template === 'doc' || obj.template === 'splash')
  )
}

export function isValidPackageName(name: string): boolean {
  // Package names must not be empty
  if (name.length === 0) {
    return false
  }

  // Package names must not start with a dot or underscore
  if (name.startsWith('.') || name.startsWith('_')) {
    return false
  }

  // Scoped package names
  if (name.startsWith('@')) {
    const slashIndex = name.indexOf('/')
    if (slashIndex <= 1 || slashIndex === name.length - 1) {
      return false
    }

    const scope = name.slice(1, slashIndex)
    const pkg = name.slice(slashIndex + 1)

    return isValidUnscopedPackageName(scope) && isValidUnscopedPackageName(pkg)
  }

  return isValidUnscopedPackageName(name)
}

function isValidUnscopedPackageName(name: string): boolean {
  return /^\w[\w.-]*$/.test(name)
}

export function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version)
}

export function isValidHeadingLevel(level: number): level is 1 | 2 | 3 | 4 | 5 | 6 {
  return Number.isInteger(level) && level >= 1 && level <= 6
}

/** Checks for potential XSS patterns to prevent injection attacks */
export function isSafeContent(content: string): boolean {
  const dangerousPatterns = [/<script\b/i, /javascript:/i, /on\w+\s*=/i, /data:/i, /vbscript:/i]

  return !dangerousPatterns.some(pattern => pattern.test(content))
}

/** Prevents directory traversal attacks in file paths */
export function isSafeFilePath(filePath: string): boolean {
  const normalizedPath = filePath
    .replaceAll('\\', '/')
    .replaceAll(/\/+/g, '/')
    .replaceAll('/./', '/')

  // Check for directory traversal
  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    return false
  }

  // Check for absolute paths on Unix
  if (normalizedPath.startsWith('/') && !filePath.startsWith('/')) {
    return false
  }

  return true
}

export function assertParseError(value: unknown): asserts value is ParseError {
  if (!isParseError(value)) {
    throw new TypeError('Expected ParseError')
  }
}

export function assertPackageInfo(value: unknown): asserts value is PackageInfo {
  if (!isPackageInfo(value)) {
    throw new TypeError('Expected PackageInfo')
  }
}

export function assertPackageAPI(value: unknown): asserts value is PackageAPI {
  if (!isPackageAPI(value)) {
    throw new TypeError('Expected PackageAPI')
  }
}
