/**
 * @bfra.me/doc-sync/parsers/jsdoc-extractor - JSDoc annotation extraction from TypeScript AST nodes
 */

import type {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  JSDoc,
  JSDocableNode,
  Node,
  TypeAliasDeclaration,
} from 'ts-morph'

import type {JSDocInfo, JSDocParam, JSDocTag} from '../types'

/**
 * Supported node types for JSDoc extraction
 */
export type JSDocableDeclaration =
  | ClassDeclaration
  | EnumDeclaration
  | FunctionDeclaration
  | InterfaceDeclaration
  | TypeAliasDeclaration

/**
 * Type guard to check if a node has JSDoc
 */
export function hasJSDoc(node: Node): node is Node & JSDocableNode {
  return 'getJsDocs' in node && typeof node.getJsDocs === 'function'
}

/**
 * Extracts JSDoc information from an AST node
 */
export function extractJSDocInfo(node: JSDocableDeclaration): JSDocInfo | undefined {
  if (!hasJSDoc(node)) {
    return undefined
  }

  const jsDocs = node.getJsDocs()
  if (jsDocs.length === 0) {
    return undefined
  }

  const jsDoc = jsDocs[0]
  if (jsDoc === undefined) {
    return undefined
  }

  return parseJSDoc(jsDoc)
}

/**
 * Parses a JSDoc node into structured information
 */
export function parseJSDoc(jsDoc: JSDoc): JSDocInfo {
  const description = jsDoc.getDescription().trim() || undefined
  const tags = jsDoc.getTags()

  const params = extractParams(tags)
  const returns = extractReturns(tags)
  const examples = extractExamples(tags)
  const deprecated = extractDeprecated(tags)
  const since = extractSince(tags)
  const see = extractSee(tags)
  const customTags = extractCustomTags(tags)

  return {
    ...(description !== undefined && {description}),
    ...(params.length > 0 && {params}),
    ...(returns !== undefined && {returns}),
    ...(examples.length > 0 && {examples}),
    ...(deprecated !== undefined && {deprecated}),
    ...(since !== undefined && {since}),
    ...(see.length > 0 && {see}),
    ...(customTags.length > 0 && {customTags}),
  }
}

function extractParams(tags: ReturnType<JSDoc['getTags']>): readonly JSDocParam[] {
  const params: JSDocParam[] = []

  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (tagName !== 'param') continue

    const text = getTagText(tag)
    if (text === undefined) continue

    const parsed = parseParamText(text)
    if (parsed !== undefined) {
      params.push(parsed)
    }
  }

  return params
}

/**
 * Handles multiple @param text formats:
 * - name - description
 * - {type} name - description
 * - name description
 */
function parseParamText(text: string): JSDocParam | undefined {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return undefined
  }

  let type: string | undefined
  let remaining = trimmed

  // Extract type if present: {type} ...
  if (remaining.startsWith('{')) {
    const typeEnd = remaining.indexOf('}')
    if (typeEnd > 0) {
      type = remaining.slice(1, typeEnd)
      remaining = remaining.slice(typeEnd + 1).trim()
    }
  }

  // Split name from description
  const dashIndex = remaining.indexOf(' - ')
  const spaceIndex = remaining.indexOf(' ')

  let name: string
  let description: string | undefined

  if (dashIndex > 0) {
    name = remaining.slice(0, dashIndex).trim()
    description = remaining.slice(dashIndex + 3).trim() || undefined
  } else if (spaceIndex > 0) {
    name = remaining.slice(0, spaceIndex).trim()
    description = remaining.slice(spaceIndex + 1).trim() || undefined
  } else {
    name = remaining
  }

  // Handle optional parameters [name]
  let optional = false
  if (name.startsWith('[') && name.endsWith(']')) {
    optional = true
    name = name.slice(1, -1)
  }

  // Handle default values [name=value]
  let defaultValue: string | undefined
  const defaultIndex = name.indexOf('=')
  if (defaultIndex > 0) {
    defaultValue = name.slice(defaultIndex + 1)
    name = name.slice(0, defaultIndex)
    optional = true
  }

  return {
    name,
    ...(type !== undefined && {type}),
    ...(description !== undefined && {description}),
    ...(optional && {optional}),
    ...(defaultValue !== undefined && {defaultValue}),
  }
}

function extractReturns(tags: ReturnType<JSDoc['getTags']>): string | undefined {
  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (tagName !== 'returns' && tagName !== 'return') continue

    const text = getTagText(tag)
    if (text !== undefined && text.trim().length > 0) {
      // Strip leading type annotation if present
      let result = text.trim()
      if (result.startsWith('{')) {
        const typeEnd = result.indexOf('}')
        if (typeEnd > 0) {
          result = result.slice(typeEnd + 1).trim()
        }
      }
      return result.length > 0 ? result : undefined
    }
  }

  return undefined
}

function extractExamples(tags: ReturnType<JSDoc['getTags']>): readonly string[] {
  const examples: string[] = []

  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (tagName !== 'example') continue

    const text = getTagText(tag)
    if (text !== undefined && text.trim().length > 0) {
      examples.push(text.trim())
    }
  }

  return examples
}

function extractDeprecated(tags: ReturnType<JSDoc['getTags']>): string | undefined {
  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (tagName !== 'deprecated') continue

    const text = getTagText(tag)
    return text?.trim() ?? ''
  }

  return undefined
}

function extractSince(tags: ReturnType<JSDoc['getTags']>): string | undefined {
  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (tagName !== 'since') continue

    const text = getTagText(tag)
    if (text !== undefined && text.trim().length > 0) {
      return text.trim()
    }
  }

  return undefined
}

function extractSee(tags: ReturnType<JSDoc['getTags']>): readonly string[] {
  const see: string[] = []

  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (tagName !== 'see') continue

    const text = getTagText(tag)
    if (text !== undefined && text.trim().length > 0) {
      see.push(text.trim())
    }
  }

  return see
}

const STANDARD_TAGS = new Set([
  'param',
  'returns',
  'return',
  'example',
  'deprecated',
  'since',
  'see',
  'type',
  'typedef',
  'callback',
  'template',
  'throws',
  'async',
  'generator',
  'override',
  'readonly',
  'private',
  'protected',
  'public',
  'module',
  'exports',
  'interface',
  'enum',
  'class',
  'constructor',
  'function',
  'method',
  'property',
  'member',
  'implements',
  'extends',
  'augments',
])

function extractCustomTags(tags: ReturnType<JSDoc['getTags']>): readonly JSDocTag[] {
  const customTags: JSDocTag[] = []

  for (const tag of tags) {
    const tagName = tag.getTagName()
    if (STANDARD_TAGS.has(tagName)) continue

    const text = getTagText(tag)
    const value = text !== undefined && text.trim().length > 0 ? text.trim() : undefined

    customTags.push({
      name: tagName,
      ...(value !== undefined && {value}),
    })
  }

  return customTags
}

function getTagText(tag: ReturnType<JSDoc['getTags']>[number]): string | undefined {
  const fullText = tag.getText()
  const tagName = tag.getTagName()
  const prefix = `@${tagName}`

  if (fullText.startsWith(prefix)) {
    const text = fullText.slice(prefix.length).trim()
    return text.length > 0 ? text : undefined
  }

  return undefined
}
