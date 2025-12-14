/**
 * @bfra.me/doc-sync/parsers/readme-parser - README Markdown parser with section extraction
 */

import type {Root, RootContent} from 'mdast'

import type {ParseError, ParseResult, ReadmeContent, ReadmeSection} from '../types'

import {err, ok} from '@bfra.me/es/result'
import remarkParse from 'remark-parse'
import {unified} from 'unified'

/**
 * Options for parsing README files
 */
export interface ReadmeParserOptions {
  readonly extractSections?: boolean
  readonly preserveRaw?: boolean
}

/**
 * Parses a README markdown string into structured content
 */
export function parseReadme(
  content: string,
  options?: ReadmeParserOptions,
): ParseResult<ReadmeContent> {
  try {
    const processor = unified().use(remarkParse)
    const tree = processor.parse(content)

    const title = extractTitle(tree)
    const preamble = extractPreamble(tree)
    const sections =
      options?.extractSections === false ? ([] as readonly ReadmeSection[]) : extractSections(tree)

    return ok({
      ...(title !== undefined && {title}),
      ...(preamble !== undefined && {preamble}),
      sections,
      raw: options?.preserveRaw === false ? '' : content,
    })
  } catch (error) {
    return err({
      code: 'INVALID_SYNTAX',
      message: 'Failed to parse README content',
      cause: error,
    } satisfies ParseError)
  }
}

/**
 * Parses a README file from the file system
 */
export async function parseReadmeFile(
  filePath: string,
  options?: ReadmeParserOptions,
): Promise<ParseResult<ReadmeContent>> {
  try {
    const fs = await import('node:fs/promises')
    const content = await fs.readFile(filePath, 'utf-8')
    return parseReadme(content, options)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return err({
        code: 'FILE_NOT_FOUND',
        message: `README file not found: ${filePath}`,
        filePath,
        cause: error,
      } satisfies ParseError)
    }

    return err({
      code: 'READ_ERROR',
      message: `Failed to read README file: ${filePath}`,
      filePath,
      cause: error,
    } satisfies ParseError)
  }
}

function extractTitle(tree: Root): string | undefined {
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 1) {
      return extractTextFromNode(node)
    }
  }
  return undefined
}

function extractPreamble(tree: Root): string | undefined {
  const preambleNodes: RootContent[] = []

  for (const node of tree.children) {
    if (node.type === 'heading') {
      break
    }
    preambleNodes.push(node)
  }

  if (preambleNodes.length === 0) {
    return undefined
  }

  const text = preambleNodes.map(extractTextFromNode).join('\n\n').trim()
  return text.length > 0 ? text : undefined
}

function extractSections(tree: Root): readonly ReadmeSection[] {
  const sections: ReadmeSection[] = []
  const stack: {level: number; section: ReadmeSection & {children: ReadmeSection[]}}[] = []

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i]

    if (node !== undefined && node.type === 'heading') {
      const heading = extractTextFromNode(node)
      const level = node.depth
      const content = extractSectionContent(tree, i + 1)

      const newSection: ReadmeSection & {children: ReadmeSection[]} = {
        heading,
        level,
        content,
        children: [],
      }

      // Pop sections from stack that are at same or higher level
      while (stack.length > 0 && (stack.at(-1)?.level ?? 0) >= level) {
        stack.pop()
      }

      if (stack.length === 0) {
        // Top-level section
        sections.push(newSection)
      } else {
        // Nested section
        const parent = stack.at(-1)
        parent?.section.children.push(newSection)
      }

      stack.push({level, section: newSection})
    }
  }

  return freezeSections(sections)
}

function freezeSections(sections: ReadmeSection[]): readonly ReadmeSection[] {
  return sections.map(s => ({
    heading: s.heading,
    level: s.level,
    content: s.content,
    children: freezeSections([...s.children]),
  }))
}

function extractSectionContent(tree: Root, startIndex: number): string {
  const contentNodes: RootContent[] = []

  for (let i = startIndex; i < tree.children.length; i++) {
    const node = tree.children[i]
    if (node === undefined || node.type === 'heading') {
      break
    }
    contentNodes.push(node)
  }

  return contentNodes.map(serializeNode).join('\n\n').trim()
}

function extractTextFromNode(node: RootContent): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value
  }

  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as RootContent[]).map(extractTextFromNode).join('')
  }

  return ''
}

function serializeNode(node: RootContent): string {
  if (node.type === 'paragraph') {
    return serializeInlineContent(node)
  }

  if (node.type === 'heading') {
    const prefix = '#'.repeat(node.depth)
    return `${prefix} ${serializeInlineContent(node)}`
  }

  if (node.type === 'code') {
    return `\`\`\`${node.lang ?? ''}\n${node.value}\n\`\`\``
  }

  if (node.type === 'blockquote') {
    return (node.children as RootContent[]).map(c => `> ${serializeNode(c)}`).join('\n')
  }

  if (node.type === 'list') {
    const items = node.children
      .map((item, index) => {
        if (item.type !== 'listItem') return ''
        const prefix = node.ordered === true ? `${index + 1}. ` : '- '
        const content = (item.children as RootContent[]).map(serializeNode).join('\n')
        return `${prefix}${content}`
      })
      .filter(s => s.length > 0)
    return items.join('\n')
  }

  if (node.type === 'thematicBreak') {
    return '---'
  }

  if (node.type === 'html') {
    return node.value
  }

  if (node.type === 'table') {
    return serializeTable(node)
  }

  // For all other node types, extract text content
  return extractTextFromNode(node)
}

/**
 * Serialize inline content preserving markdown formatting like **bold**, *italic*, `code`, etc.
 */
function serializeInlineContent(node: RootContent): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value
  }

  if (!('children' in node) || !Array.isArray(node.children)) {
    return ''
  }

  return (node.children as RootContent[])
    .map(child => {
      // Handle strong (bold) text
      if (child.type === 'strong') {
        return `**${serializeInlineContent(child)}**`
      }

      // Handle emphasis (italic) text
      if (child.type === 'emphasis') {
        return `*${serializeInlineContent(child)}*`
      }

      // Handle inline code
      if (child.type === 'inlineCode') {
        return `\`${'value' in child ? child.value : ''}\``
      }

      // Handle links
      if (child.type === 'link') {
        const text = serializeInlineContent(child)
        return `[${text}](${'url' in child ? child.url : ''})`
      }

      // Handle images
      if (child.type === 'image') {
        const alt = 'alt' in child ? child.alt : ''
        const url = 'url' in child ? child.url : ''
        return `![${alt}](${url})`
      }

      // Handle plain text
      if ('value' in child && typeof child.value === 'string') {
        return child.value
      }

      // Recursively handle other inline elements
      return serializeInlineContent(child)
    })
    .join('')
}

function serializeTable(node: RootContent): string {
  if (node.type !== 'table' || !('children' in node)) {
    return ''
  }

  const rows = node.children
    .filter((row): row is (typeof node.children)[number] => row.type === 'tableRow')
    .map(row => {
      const cells = (row.children as RootContent[])
        .filter((cell): cell is RootContent => cell.type === 'tableCell')
        .map(cell => extractTextFromNode(cell))
      return `| ${cells.join(' | ')} |`
    })

  if (rows.length === 0) {
    return ''
  }

  // Insert separator after header row
  const headerRow = rows[0]
  if (headerRow !== undefined) {
    const columnCount = (headerRow.match(/\|/g)?.length ?? 2) - 1
    const separator = `|${' --- |'.repeat(columnCount)}`
    rows.splice(1, 0, separator)
  }

  return rows.join('\n')
}

/**
 * Finds a section by heading text (case-insensitive)
 */
export function findSection(
  content: ReadmeContent,
  headingText: string,
): ReadmeSection | undefined {
  const normalizedSearch = headingText.toLowerCase()

  function searchInSections(sections: readonly ReadmeSection[]): ReadmeSection | undefined {
    for (const section of sections) {
      if (section.heading.toLowerCase() === normalizedSearch) {
        return section
      }

      const found = searchInSections(section.children)
      if (found !== undefined) {
        return found
      }
    }
    return undefined
  }

  return searchInSections(content.sections)
}

/**
 * Gets all sections at a specific heading level
 */
export function getSectionsByLevel(
  content: ReadmeContent,
  level: number,
): readonly ReadmeSection[] {
  const result: ReadmeSection[] = []

  function collectAtLevel(sections: readonly ReadmeSection[]): void {
    for (const section of sections) {
      if (section.level === level) {
        result.push(section)
      }
      collectAtLevel(section.children)
    }
  }

  collectAtLevel(content.sections)
  return result
}

/**
 * Flattens all sections into a single array
 */
export function flattenSections(content: ReadmeContent): readonly ReadmeSection[] {
  const result: ReadmeSection[] = []

  function collect(sections: readonly ReadmeSection[]): void {
    for (const section of sections) {
      result.push(section)
      collect(section.children)
    }
  }

  collect(content.sections)
  return result
}

/**
 * Gets the table of contents as a flat list
 */
export function getTableOfContents(
  content: ReadmeContent,
): readonly {readonly heading: string; readonly level: number}[] {
  return flattenSections(content).map(s => ({
    heading: s.heading,
    level: s.level,
  }))
}
