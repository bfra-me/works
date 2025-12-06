/**
 * @bfra.me/doc-sync/utils/safe-patterns - Safe regex patterns and utilities for MDX/HTML parsing
 * All patterns are designed to prevent ReDoS attacks
 */

import remarkParse from 'remark-parse'
import {unified} from 'unified'

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

/**
 * Parse JSX tags from content using a safe, non-backtracking approach.
 * Uses a state machine instead of regex to prevent ReDoS.
 *
 * @param content - The MDX/HTML content to parse
 * @returns Array of matched JSX tags with their positions
 */
export function parseJSXTags(
  content: string,
): readonly {tag: string; index: number; isClosing: boolean; isSelfClosing: boolean}[] {
  const results: {tag: string; index: number; isClosing: boolean; isSelfClosing: boolean}[] = []
  let i = 0

  while (i < content.length) {
    if (content[i] !== '<') {
      i++
      continue
    }

    const startIndex = i
    i++

    if (i >= content.length) break

    const isClosing = content[i] === '/'
    if (isClosing) {
      i++
      if (i >= content.length) break
    }

    // JSX components must start with uppercase (React convention)
    if (!/^[A-Z]/.test(content[i] ?? '')) {
      continue
    }

    let tagName = ''
    while (i < content.length && /^[a-z0-9]/i.test(content[i] ?? '')) {
      tagName += content[i]
      i++
    }

    if (tagName.length === 0) {
      continue
    }

    if (isClosing) {
      if (i < content.length && content[i] === '>') {
        results.push({
          tag: `</${tagName}>`,
          index: startIndex,
          isClosing: true,
          isSelfClosing: false,
        })
        i++
      }
      continue
    }

    // Skip attributes while tracking nested structures
    let depth = 0
    let foundEnd = false
    let isSelfClosing = false

    while (i < content.length && !foundEnd) {
      const char = content[i]

      // Skip quoted string contents to avoid misinterpreting > inside strings
      if ((char === '"' || char === "'") && depth === 0) {
        const quote = char
        i++
        while (i < content.length && content[i] !== quote) {
          if (content[i] === '\\' && i + 1 < content.length) {
            i += 2
          } else {
            i++
          }
        }
        if (i < content.length) i++
        continue
      }

      // Track brace depth for JSX expressions like {value}
      if (char === '{') {
        depth++
        i++
        continue
      }
      if (char === '}') {
        depth = Math.max(0, depth - 1)
        i++
        continue
      }

      // Only match tag end when not inside a JSX expression
      if (depth === 0) {
        if (char === '/' && i + 1 < content.length && content[i + 1] === '>') {
          isSelfClosing = true
          foundEnd = true
          i += 2
          continue
        }
        if (char === '>') {
          foundEnd = true
          i++
          continue
        }
      }

      i++
    }

    if (foundEnd) {
      const fullTag = content.slice(startIndex, i)
      results.push({tag: fullTag, index: startIndex, isClosing: false, isSelfClosing})
    }
  }

  return results
}

/**
 * Find empty markdown links in content using safe parsing.
 * Uses indexOf-based scanning instead of regex to prevent ReDoS.
 *
 * @param content - The markdown content to check
 * @returns Array of positions where empty links were found
 */
export function findEmptyMarkdownLinks(content: string): readonly number[] {
  const positions: number[] = []
  let pos = 0

  while (pos < content.length) {
    const openBracket = content.indexOf('[', pos)
    if (openBracket === -1) break

    // Handle nested brackets
    let bracketDepth = 1
    let closeBracket = openBracket + 1
    while (closeBracket < content.length && bracketDepth > 0) {
      if (content[closeBracket] === '[') {
        bracketDepth++
      } else if (content[closeBracket] === ']') {
        bracketDepth--
      }
      closeBracket++
    }

    if (bracketDepth !== 0) {
      pos = openBracket + 1
      continue
    }

    closeBracket--

    if (closeBracket + 1 < content.length && content[closeBracket + 1] === '(') {
      let parenPos = closeBracket + 2
      let isEmptyOrWhitespace = true

      while (parenPos < content.length && content[parenPos] !== ')') {
        if (!/^\s/.test(content[parenPos] ?? '')) {
          isEmptyOrWhitespace = false
          break
        }
        parenPos++
      }

      if (isEmptyOrWhitespace && parenPos < content.length && content[parenPos] === ')') {
        positions.push(openBracket)
      }
    }

    pos = closeBracket + 1
  }

  return positions
}
