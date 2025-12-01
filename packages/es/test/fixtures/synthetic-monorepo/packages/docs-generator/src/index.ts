/**
 * Documentation generator package for synthetic monorepo.
 * Demonstrates complex dependency chains and Result composition.
 */

import type {Result} from '@bfra.me/es/result'
import {err, isErr, ok} from '@bfra.me/es/result'
import {flatMap} from '@bfra.me/es/result'

/** Documentation error */
export interface DocError {
  code: 'PARSE_ERROR' | 'RENDER_ERROR' | 'WRITE_ERROR' | 'NOT_FOUND'
  message: string
  file?: string
}

/** Documentation source */
export interface DocSource {
  path: string
  content: string
  format: 'markdown' | 'jsdoc' | 'typescript'
}

/** Documentation output */
export interface DocOutput {
  html: string
  metadata: DocMetadata
}

/** Documentation metadata */
export interface DocMetadata {
  title: string
  description?: string
  tags?: string[]
  lastModified: Date
}

/** Parses documentation from a source file */
export function parseDocSource(source: DocSource): Result<ParsedDoc, DocError> {
  if (!source.content.trim()) {
    return err({
      code: 'PARSE_ERROR',
      message: 'Empty source content',
      file: source.path,
    })
  }

  const titleMatch = source.content.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1] ?? 'Untitled'

  const descMatch = source.content.match(/^#\s+.+\n+(.+)$/m)

  const result: ParsedDoc = {
    source,
    title,
    sections: parseSections(source.content),
  }

  if (descMatch?.[1]) {
    result.description = descMatch[1]
  }

  return ok(result)
}

interface ParsedDoc {
  source: DocSource
  title: string
  description?: string
  sections: DocSection[]
}

interface DocSection {
  level: number
  title: string
  content: string
}

function parseSections(content: string): DocSection[] {
  const sections: DocSection[] = []
  const lines = content.split('\n')
  let currentSection: DocSection | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)

    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        level: headingMatch[1].length,
        title: headingMatch[2],
        content: '',
      }
    } else if (currentSection) {
      currentSection.content += line + '\n'
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

/** Renders parsed documentation to HTML */
export function renderDoc(parsed: ParsedDoc): Result<DocOutput, DocError> {
  try {
    const html = renderToHtml(parsed)
    const metadata: DocMetadata = {
      title: parsed.title,
      lastModified: new Date(),
    }
    if (parsed.description) {
      metadata.description = parsed.description
    }
    return ok({
      html,
      metadata,
    })
  } catch (error) {
    return err({
      code: 'RENDER_ERROR',
      message: error instanceof Error ? error.message : 'Unknown render error',
      file: parsed.source.path,
    })
  }
}

function renderToHtml(parsed: ParsedDoc): string {
  const lines = [`<h1>${escapeHtml(parsed.title)}</h1>`]

  if (parsed.description) {
    lines.push(`<p class="description">${escapeHtml(parsed.description)}</p>`)
  }

  for (const section of parsed.sections) {
    if (section.level > 1) {
      lines.push(`<h${section.level}>${escapeHtml(section.title)}</h${section.level}>`)
    }
    if (section.content.trim()) {
      lines.push(`<p>${escapeHtml(section.content.trim())}</p>`)
    }
  }

  return lines.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Creates a documentation generator pipeline */
export function createDocGenerator() {
  return {
    generate(source: DocSource): Result<DocOutput, DocError> {
      const parseResult = parseDocSource(source)
      if (isErr(parseResult)) {
        return parseResult
      }
      return renderDoc(parseResult.data)
    },

    generateWithFlatMap(source: DocSource): Result<DocOutput, DocError> {
      const parseResult = parseDocSource(source)
      return flatMap(parseResult, renderDoc)
    },
  }
}
