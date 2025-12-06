/**
 * @bfra.me/doc-sync/utils - Security utilities for MDX generation
 */

export {
  createHeadingPattern,
  extractCodeBlocks,
  findEmptyMarkdownLinks,
  hasComponent,
  parseJSXTags,
} from './safe-patterns'

export {parseJSXAttributes, sanitizeAttribute, sanitizeForMDX, sanitizeJSXTag} from './sanitization'
