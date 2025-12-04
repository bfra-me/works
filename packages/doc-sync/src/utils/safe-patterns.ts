/**
 * @bfra.me/doc-sync/utils/safe-patterns - Safe regex patterns and utilities for MDX/HTML parsing
 * All patterns are designed to prevent ReDoS attacks
 */

import remarkParse from 'remark-parse'
import {unified} from 'unified'

/**
 * Safe pattern for matching JSX component opening tags (non-backtracking)
 * Uses explicit character classes and negative lookahead to prevent backtracking
 */
export const JSX_COMPONENT_TAG = /<([A-Z][a-zA-Z0-9]*)(?:\s[^/>][^>]*)?>(?!\/)/g

/**
 * Safe pattern for matching self-closing JSX tags
 */
export const JSX_SELF_CLOSING_TAG = /<([A-Z][a-zA-Z0-9]*)(?:\s[^/>][^>]*)?\/>/g

/**
 * Safe pattern for matching closing JSX tags
 */
export const JSX_CLOSING_TAG = /<\/([A-Z][a-zA-Z0-9]*)>/g

/**
 * Create safe heading pattern for specific level
 * Uses explicit character class instead of greedy `.+` to prevent ReDoS
 *
 * @param level - Heading level (1-6)
 * @returns Safe regex pattern for the heading level
 *
 * @example
 * ```ts
 * const h2Pattern = createHeadingPattern(2)
 * const matches = content.match(h2Pattern)
 * ```
 */
export function createHeadingPattern(level: number): RegExp {
  if (level < 1 || level > 6) {
    throw new Error('Heading level must be between 1 and 6')
  }
  const hashes = '#'.repeat(level)
  // Use [^\r\n]+ instead of .+ to prevent ReDoS
  return new RegExp(`^${hashes} ([^\r\n]+)$`, 'gm')
}

/**
 * Check if content contains a specific JSX component
 * Uses a safe pattern that avoids catastrophic backtracking
 *
 * @param content - The MDX/HTML content to search
 * @param componentName - Name of the component to find (e.g., 'Card', 'Badge')
 * @returns True if the component is found
 *
 * @example
 * ```ts
 * const hasCard = hasComponent(content, 'Card')
 * const hasCardGrid = hasComponent(content, 'CardGrid')
 * ```
 */
export function hasComponent(content: string, componentName: string): boolean {
  // Escape special regex characters in component name
  const escaped = componentName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
  // Match opening tag or self-closing tag with word boundary
  const pattern = new RegExp(String.raw`<${escaped}(?:\s[^>]*)?(?:>|\/>)`)
  return pattern.test(content)
}

/**
 * Extract code blocks from markdown content using unified/remark (safe, no regex)
 * This approach uses AST parsing instead of regex to avoid ReDoS vulnerabilities
 *
 * @param content - The markdown content to parse
 * @returns Array of code block strings with their language identifiers
 *
 * @example
 * ```ts
 * const blocks = extractCodeBlocks(content)
 * for (const block of blocks) {
 *   console.log(block)
 * }
 * ```
 */
export function extractCodeBlocks(content: string): readonly string[] {
  const processor = unified().use(remarkParse)
  let tree

  try {
    tree = processor.parse(content)
  } catch {
    // If parsing fails, return empty array instead of throwing
    return []
  }

  const blocks: string[] = []

  interface MarkdownNode {
    type?: string
    lang?: string | null
    value?: string
    children?: MarkdownNode[]
  }

  function visit(node: MarkdownNode): void {
    if (node.type === 'code') {
      const lang = node.lang ?? ''
      const value = node.value ?? ''
      blocks.push(`\`\`\`${lang}\n${value}\n\`\`\``)
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(tree as MarkdownNode)
  return blocks
}
