/**
 * @bfra.me/doc-sync/utils - Security utilities for MDX generation
 */

export {
  createHeadingPattern,
  extractCodeBlocks,
  findEmptyMarkdownLinks,
  hasComponent,
  JSX_CLOSING_TAG,
  JSX_COMPONENT_TAG,
  JSX_SELF_CLOSING_TAG,
  parseJSXTags,
} from './safe-patterns'

export {parseJSXAttributes, sanitizeAttribute, sanitizeForMDX, sanitizeJSXTag} from './sanitization'
