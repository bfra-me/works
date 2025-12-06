/**
 * @bfra.me/doc-sync/generators - Unified export of all generator modules
 */

export {
  generateAPICompact,
  generateAPIReference,
  generateCategoryReference,
} from './api-reference-generator'

export {
  cleanCodeExample,
  detectLanguage,
  formatCodeBlock,
  formatCodeExamples,
  formatFunctionExamples,
  formatGroupedExamples,
  formatTypeExamples,
  formatUsageExample,
  groupExamplesByCategory,
} from './code-example-formatter'
export type {CodeExampleOptions} from './code-example-formatter'

export {
  createBadge,
  createCard,
  createCardGrid,
  createTabs,
  generateInstallTabs,
  mapToStarlightComponents,
} from './component-mapper'
export type {ComponentMapperConfig, SectionMapper} from './component-mapper'

export {
  createDiffSummary,
  extractAutoSections,
  extractManualSections,
  hasAutoContent,
  hasManualContent,
  mergeContent,
  stripSentinelMarkers,
  validateMarkerPairing,
  wrapAutoSection,
  wrapManualSection,
} from './content-merger'
export type {ContentSection, MergeOptions, MergeResult} from './content-merger'

export {generateFrontmatter, parseFrontmatter, stringifyFrontmatter} from './frontmatter-generator'

export {
  generateMDXDocument,
  sanitizeContent,
  sanitizeTextContent,
  validateMDXSyntax,
} from './mdx-generator'
export type {MDXGeneratorOptions} from './mdx-generator'
