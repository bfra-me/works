/**
 * @bfra.me/doc-sync - Intelligent documentation synchronization engine
 *
 * Monitors package source code, README files, and JSDoc comments to
 * automatically update Astro Starlight documentation sites.
 */

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
