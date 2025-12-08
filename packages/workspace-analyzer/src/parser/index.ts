/**
 * Parser module exports.
 *
 * Provides unified access to all parsing utilities for TypeScript source files,
 * configuration files, and import extraction.
 */

// Configuration parser exports
export {
  getAllDependencies,
  parsePackageJson,
  parsePackageJsonContent,
  parseTsConfig,
  parseTsConfigContent,
  resolveTsConfigExtends,
} from './config-parser'
export type {
  ConfigError,
  ConfigErrorCode,
  ParsedPackageJson,
  ParsedTsConfig,
  TsCompilerOptions,
  TsProjectReference,
} from './config-parser'

// Import extractor exports
export {
  extractImports,
  getPackageNameFromSpecifier,
  getUniqueDependencies,
  isRelativeImport,
  isWorkspacePackageImport,
  resolveRelativeImport,
} from './import-extractor'
export type {
  ExtractedImport,
  ImportExtractionResult,
  ImportExtractorOptions,
  ImportType,
} from './import-extractor'

// TypeScript parser exports
export {
  createProject,
  getAllSourceFiles,
  getSourceFile,
  isJavaScriptFile,
  isSourceFile,
  isTypeScriptFile,
  parseSourceContent,
  parseSourceFile,
  parseSourceFiles,
} from './typescript-parser'
export type {ParseError, ParseErrorCode, TypeScriptParserOptions} from './typescript-parser'
