/**
 * @bfra.me/doc-sync/utils/sanitization - Sanitization utilities for MDX content
 * Provides comprehensive XSS prevention for user-generated content
 */

import {sanitizeInput} from '@bfra.me/es/validation'
import escapeHtml from 'escape-html'

/**
 * Sanitize HTML content for MDX context
 * Escapes all HTML entities and JSX curly braces to prevent XSS
 *
 * @param content - The content to sanitize
 * @returns Sanitized content safe for MDX rendering
 *
 * @example
 * ```ts
 * const safe = sanitizeForMDX('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeForMDX(content: string): string {
  // Use existing sanitizeInput from @bfra.me/es/validation
  // This escapes: & < > " ' /
  const escaped = sanitizeInput(content, {trim: false})

  // Additionally escape JSX curly braces for MDX safety
  return escaped.replaceAll('{', '&#123;').replaceAll('}', '&#125;')
}

/**
 * Sanitize value for use in HTML/JSX attribute
 * Uses escape-html library for proper attribute encoding
 *
 * @param value - The attribute value to sanitize
 * @returns Sanitized value safe for attribute context
 *
 * @example
 * ```ts
 * const safe = sanitizeAttribute('value" onload="alert(1)')
 * // Returns: 'value&quot; onload=&quot;alert(1)'
 * ```
 */
export function sanitizeAttribute(value: string): string {
  return escapeHtml(value)
}

/**
 * JSX attribute parsed from a tag
 */
interface JSXAttribute {
  readonly name: string
  readonly value: string | null
}

/**
 * Parse JSX tag attributes safely without using complex regex
 * Uses a simple state machine approach to avoid ReDoS vulnerabilities
 *
 * @param tag - The complete JSX tag string (e.g., '<Badge text="hello" />')
 * @returns Array of parsed attributes
 *
 * @example
 * ```ts
 * const attrs = parseJSXAttributes('<Card title="Hello" icon="star" />')
 * // Returns: [{name: 'title', value: 'Hello'}, {name: 'icon', value: 'star'}]
 * ```
 */
export function parseJSXAttributes(tag: string): readonly JSXAttribute[] {
  const attrs: JSXAttribute[] = []

  // Find the start of attributes (after first space)
  const spaceIndex = tag.indexOf(' ')
  if (spaceIndex === -1) return attrs

  // Find the end of attributes (before > or />)
  const closeIndex = tag.lastIndexOf('>')
  if (closeIndex === -1) return attrs

  const attrRegion = tag.slice(spaceIndex + 1, closeIndex).trim()
  let i = 0

  while (i < attrRegion.length) {
    // Skip whitespace
    while (i < attrRegion.length && /\s/.test(attrRegion.charAt(i))) i++
    if (i >= attrRegion.length) break

    // Extract attribute name
    let name = ''
    while (i < attrRegion.length && /[\w-]/.test(attrRegion.charAt(i))) {
      name += attrRegion[i]
      i++
    }

    if (!name) break

    // Skip whitespace around =
    while (i < attrRegion.length && /\s/.test(attrRegion.charAt(i))) i++

    // Check for = sign
    if (i >= attrRegion.length || attrRegion[i] !== '=') {
      // Boolean attribute (no value)
      attrs.push({name, value: null})
      continue
    }

    i++ // skip =
    while (i < attrRegion.length && /\s/.test(attrRegion.charAt(i))) i++

    if (i >= attrRegion.length) {
      attrs.push({name, value: ''})
      break
    }

    // Extract value
    let value = ''
    const quote = attrRegion[i]
    if (quote === '"' || quote === "'") {
      i++ // skip opening quote
      while (i < attrRegion.length && attrRegion[i] !== quote) {
        value += attrRegion[i]
        i++
      }
      if (i < attrRegion.length) i++ // skip closing quote
    } else {
      // Unquoted value
      while (i < attrRegion.length && !/[\s/>]/.test(attrRegion.charAt(i))) {
        value += attrRegion[i]
        i++
      }
    }

    attrs.push({name, value})
  }

  return attrs
}

/**
 * Sanitize a complete JSX tag including all attributes
 * Parses the tag and escapes all attribute values to prevent XSS
 *
 * @param tag - The complete JSX tag string
 * @returns Sanitized JSX tag safe for rendering
 *
 * @example
 * ```ts
 * const safe = sanitizeJSXTag('<Badge text="v1.0.0" onclick="alert(1)" />')
 * // Returns: '<Badge text="v1.0.0" onclick="alert(1)" />' (with escaped values)
 * ```
 */
export function sanitizeJSXTag(tag: string): string {
  // Extract tag name
  const tagMatch = tag.match(/^<([A-Z][a-zA-Z0-9]*)/)
  if (!tagMatch || typeof tagMatch[1] !== 'string' || tagMatch[1].length === 0) {
    // Not a valid JSX tag, escape everything
    return escapeHtml(tag)
  }

  const tagName = tagMatch[1]
  const selfClosing = tag.endsWith('/>')
  const attributes = parseJSXAttributes(tag)

  // Sanitize each attribute value
  const sanitizedAttrs = attributes.map(({name, value}) => {
    if (value === null) return name
    const escaped = escapeHtml(value)
    return `${name}="${escaped}"`
  })

  const attrString = sanitizedAttrs.length > 0 ? ` ${sanitizedAttrs.join(' ')}` : ''
  return `<${tagName}${attrString}${selfClosing ? ' />' : '>'}`
}
