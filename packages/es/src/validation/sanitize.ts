/**
 * Options for input sanitization.
 */
export interface SanitizeOptions {
  /** Escape HTML entities (default: true) */
  readonly escapeHtml?: boolean
  /** Remove null bytes (default: true) */
  readonly removeNullBytes?: boolean
  /** Trim whitespace (default: true) */
  readonly trim?: boolean
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

/**
 * Sanitizes user input to prevent XSS attacks.
 *
 * @param input - The input to sanitize
 * @param options - Sanitization options
 * @returns The sanitized string
 *
 * @example
 * ```ts
 * const safe = sanitizeInput('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeInput(input: string, options: SanitizeOptions = {}): string {
  const {escapeHtml = true, removeNullBytes = true, trim = true} = options

  let result = input

  if (removeNullBytes) {
    result = result.replaceAll('\0', '')
  }

  if (escapeHtml) {
    result = result.replaceAll(/[&<>"'/]/g, char => HTML_ENTITIES[char] ?? char)
  }

  if (trim) {
    result = result.trim()
  }

  return result
}
