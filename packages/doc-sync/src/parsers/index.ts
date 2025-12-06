/**
 * @bfra.me/doc-sync/parsers - Unified export of all parser modules
 */

// Export analyzer exports
export {
  analyzePublicAPI,
  findExportedSymbols,
  getExportedSymbolInfo,
  getExportsByKind,
  isSymbolExported,
} from './export-analyzer'
export type {ExportAnalyzerOptions, PublicAPIAnalysis, ResolvedExport} from './export-analyzer'

// Type guards and validation exports
export {
  assertPackageAPI,
  assertPackageInfo,
  assertParseError,
  isDocConfigSource,
  isExportedFunction,
  isExportedType,
  isJSDocInfo,
  isJSDocParam,
  isJSDocTag,
  isMDXFrontmatter,
  isPackageAPI,
  isPackageInfo,
  isParseError,
  isReadmeContent,
  isReadmeSection,
  isReExport,
  isSafeContent,
  isSafeFilePath,
  isSyncError,
  isValidHeadingLevel,
  isValidPackageName,
  isValidSemver,
} from './guards'

// JSDoc extractor exports
export {extractJSDocInfo, hasJSDoc, parseJSDoc} from './jsdoc-extractor'
export type {JSDocableDeclaration} from './jsdoc-extractor'

// Package info exports
export {
  buildDocSlug,
  extractDocsConfig,
  findEntryPoint,
  findReadmePath,
  getPackageScope,
  getUnscopedName,
  parsePackageComplete,
  parsePackageJson,
  parsePackageJsonContent,
} from './package-info'
export type {PackageInfoOptions, PackageJsonSchema} from './package-info'

// README parser exports
export {
  findSection,
  flattenSections,
  getSectionsByLevel,
  getTableOfContents,
  parseReadme,
  parseReadmeFile,
} from './readme-parser'
export type {ReadmeParserOptions} from './readme-parser'

// TypeScript parser exports
export {
  analyzeTypeScriptContent,
  analyzeTypeScriptFile,
  createProject,
  extractExportedFunctions,
  extractExportedTypes,
  extractPackageAPI,
  extractReExports,
  parseSourceContent,
  parseSourceFile,
} from './typescript-parser'
export type {TypeScriptParserOptions} from './typescript-parser'
