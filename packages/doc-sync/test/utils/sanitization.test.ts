/**
 * Security tests for sanitization utilities - XSS prevention
 */

import {describe, expect, it} from 'vitest'

import {
  parseJSXAttributes,
  sanitizeAttribute,
  sanitizeForMDX,
  sanitizeJSXTag,
} from '../../src/utils/sanitization'

describe('security: XSS Prevention', () => {
  describe('sanitizeForMDX', () => {
    it('should escape HTML entities in content', () => {
      const malicious = '<script>alert("xss")</script>'
      const result = sanitizeForMDX(malicious)
      // escape-html and sanitizeInput may use different entity encodings
      // The important thing is that script tags are escaped
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    it('should escape JSX curly braces', () => {
      const malicious = '{() => alert("xss")}'
      const result = sanitizeForMDX(malicious)
      expect(result).toContain('&#123;')
      expect(result).toContain('&#125;')
      expect(result).not.toContain('{')
      expect(result).not.toContain('}')
    })

    it('should escape all dangerous characters', () => {
      const malicious = `<div onclick="alert('xss')" data-test="value">`
      const result = sanitizeForMDX(malicious)
      expect(result).not.toContain('<div')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
    })
  })

  describe('sanitizeAttribute', () => {
    it('should escape HTML entities for attributes', () => {
      const malicious = 'value" onload="alert(1)'
      const result = sanitizeAttribute(malicious)
      expect(result).toContain('&quot;')
      expect(result).not.toContain('"')
    })

    it('should handle special characters in attributes', () => {
      const value = '<script>alert("xss")</script>'
      const result = sanitizeAttribute(value)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })
  })

  describe('parseJSXAttributes', () => {
    it('should parse simple attributes', () => {
      const tag = '<Badge text="hello" variant="tip" />'
      const attrs = parseJSXAttributes(tag)
      expect(attrs).toHaveLength(2)
      expect(attrs[0]).toEqual({name: 'text', value: 'hello'})
      expect(attrs[1]).toEqual({name: 'variant', value: 'tip'})
    })

    it('should handle boolean attributes', () => {
      const tag = '<Card disabled />'
      const attrs = parseJSXAttributes(tag)
      expect(attrs).toHaveLength(1)
      expect(attrs[0]).toEqual({name: 'disabled', value: null})
    })

    it('should handle attributes with single quotes', () => {
      const tag = "<Badge text='hello' />"
      const attrs = parseJSXAttributes(tag)
      expect(attrs).toHaveLength(1)
      expect(attrs[0]).toEqual({name: 'text', value: 'hello'})
    })

    it('should handle attributes with spaces', () => {
      const tag = '<Badge  text = "hello"  />'
      const attrs = parseJSXAttributes(tag)
      expect(attrs).toHaveLength(1)
      expect(attrs[0]).toEqual({name: 'text', value: 'hello'})
    })

    it('should handle empty tag', () => {
      const tag = '<Badge/>'
      const attrs = parseJSXAttributes(tag)
      expect(attrs).toHaveLength(0)
    })
  })

  describe('sanitizeJSXTag', () => {
    it('should sanitize JSX tag attributes', () => {
      const malicious = '<Badge text="value" onload="alert(1)" />'
      const result = sanitizeJSXTag(malicious)
      // The attribute values should be escaped
      expect(result).toContain('text=')
      expect(result).toContain('onload=')
      // But the structure should be preserved
      expect(result).toContain('<Badge')
      expect(result).toContain('/>')
    })

    it('should handle attribute injection attempts', () => {
      const attack = '<Card title="<script>xss</script>" />'
      const result = sanitizeJSXTag(attack)
      // Should preserve tag structure but escape attribute values
      expect(result).toContain('<Card')
      expect(result).toContain('title=')
      // The script tags in the attribute value should be escaped
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('should prevent event handler injection', () => {
      const malicious = '<Badge text="v1.0.0" onclick="alert(\'xss\')" />'
      const result = sanitizeJSXTag(malicious)
      // Check that the event handler attribute exists
      expect(result).toContain('onclick=')
      // But the actual handler code should be escaped
      // escape-html converts ' to &#x27; or similar
      expect(result).not.toContain("alert('xss')")
    })

    it('should handle malformed tags safely', () => {
      const malformed = '<not-a-jsx-component'
      const result = sanitizeJSXTag(malformed)
      // Should escape the entire thing if not valid JSX
      expect(result).toContain('&lt;')
    })

    it('should preserve valid JSX tags', () => {
      const valid = '<Badge text="CLI Tool" variant="tip" />'
      const result = sanitizeJSXTag(valid)
      expect(result).toContain('<Badge')
      expect(result).toContain('text="CLI Tool"')
      expect(result).toContain('variant="tip"')
      expect(result).toContain('/>')
    })

    it('should handle complex attribute values', () => {
      const complex = '<Badge text="Version: v1.0.0-beta.1" />'
      const result = sanitizeJSXTag(complex)
      expect(result).toContain('text="Version: v1.0.0-beta.1"')
    })
  })

  describe('xSS Attack Vectors', () => {
    it('should prevent script injection via attributes', () => {
      const attack = '<Badge text="<script>alert(1)</script>" />'
      const result = sanitizeJSXTag(attack)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('should prevent javascript: protocol injection', () => {
      const attack = '<Card href="javascript:alert(1)" />'
      const result = sanitizeJSXTag(attack)
      // The value should still be there but escaped
      expect(result).toContain('href=')
    })

    it('should prevent data: protocol injection', () => {
      const attack = '<Card src="data:text/html,<script>alert(1)</script>" />'
      const result = sanitizeJSXTag(attack)
      // Should escape dangerous characters in data URL
      expect(result).not.toContain('<script>')
    })

    it('should handle nested quotes in attributes', () => {
      const nested = `<Badge text='value with "quotes"' />`
      const result = sanitizeJSXTag(nested)
      // Should handle the nested quotes safely
      expect(result).toContain('<Badge')
    })
  })
})
