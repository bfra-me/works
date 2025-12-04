/**
 * @bfra.me/doc-sync - Intelligent documentation synchronization engine
 *
 * Monitors package source code, README files, and JSDoc comments to
 * automatically update Astro Starlight documentation sites.
 */

// Re-export generators
export {
  cleanCodeExample,
  createBadge,
  createCard,
  createCardGrid,
  createDiffSummary,
  createTabs,
  detectLanguage,
  extractAutoSections,
  extractManualSections,
  formatCodeBlock,
  formatCodeExamples,
  formatFunctionExamples,
  formatGroupedExamples,
  formatTypeExamples,
  formatUsageExample,
  generateAPICompact,
  generateAPIReference,
  generateCategoryReference,
  generateFrontmatter,
  generateInstallTabs,
  generateMDXDocument,
  groupExamplesByCategory,
  hasAutoContent,
  hasManualContent,
  mapToStarlightComponents,
  mergeContent,
  parseFrontmatter,
  sanitizeContent,
  sanitizeTextContent,
  stringifyFrontmatter,
  stripSentinelMarkers,
  validateMarkerPairing,
  validateMDXSyntax,
  wrapAutoSection,
  wrapManualSection,
} from './generators'

export type {
  CodeExampleOptions,
  ComponentMapperConfig,
  ContentSection,
  MDXGeneratorOptions,
  MergeOptions,
  MergeResult,
  SectionMapper,
} from './generators'

export type {
  CLIOptions,
  DocConfig,
  DocConfigSource,
  ExportedFunction,
  ExportedType,
  FileChangeEvent,
  FunctionParameter,
  InferSchema,
  JSDocInfo,
  JSDocParam,
  JSDocTag,
  MDXDocument,
  MDXFrontmatter,
  PackageAPI,
  PackageInfo,
  ParseError,
  ParseErrorCode,
  ParseResult,
  ReadmeContent,
  ReadmeSection,
  ReExport,
  SyncError,
  SyncErrorCode,
  SyncInfo,
  SyncResult,
  SyncSummary,
} from './types'

export {SENTINEL_MARKERS} from './types'
