import type {BadgeColor} from './types'
import {BadgeError} from './types'

/**
 * Encodes a string for use in a shields.io URL
 * @param text - The text to encode
 * @returns The encoded text
 */
export function encodeText(text: string): string {
  if (typeof text !== 'string') {
    throw new BadgeError('Text must be a string', 'INVALID_TEXT_TYPE')
  }

  // First apply URL encoding for special characters including Unicode
  let encoded = encodeURIComponent(text)

  // Then apply shields.io specific rules
  encoded = encoded
    .replaceAll('-', '--') // Escape hyphens (-- becomes -)
    .replaceAll('_', '__') // Escape underscores (__ becomes _)

  return encoded
}

/**
 * Validates and normalizes a badge color
 * @param color - The color to validate
 * @returns The normalized color string
 */
export function validateColor(color: BadgeColor): string {
  if (typeof color !== 'string') {
    throw new BadgeError('Color must be a string', 'INVALID_COLOR_TYPE')
  }

  // Check for hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(hex)) {
      throw new BadgeError(`Invalid hex color: ${color}`, 'INVALID_HEX_COLOR')
    }
    return encodeURIComponent(color) // URL encode the # character
  }

  // Check for RGB color
  if (color.startsWith('rgb(') && color.endsWith(')')) {
    const rgbValues = color.slice(4, -1).split(',')
    if (rgbValues.length !== 3) {
      throw new BadgeError(`Invalid RGB color: ${color}`, 'INVALID_RGB_COLOR')
    }

    for (const value of rgbValues) {
      const num = Number.parseInt(value.trim(), 10)
      if (Number.isNaN(num) || num < 0 || num > 255) {
        throw new BadgeError(`Invalid RGB color: ${color}`, 'INVALID_RGB_COLOR')
      }
    }

    return encodeURIComponent(color)
  }

  // Must be a named color - no validation needed, shields.io will handle it
  return color
}

/**
 * Validates a cache seconds value
 * @param cacheSeconds - The cache seconds to validate
 * @returns The validated cache seconds
 */
export function validateCacheSeconds(cacheSeconds: number): number {
  if (!Number.isInteger(cacheSeconds) || cacheSeconds < 0) {
    throw new BadgeError('Cache seconds must be a non-negative integer', 'INVALID_CACHE_SECONDS')
  }
  return cacheSeconds
}

/**
 * Validates a logo size value
 * @param logoSize - The logo size to validate (number or 'auto')
 * @returns The validated logo size
 */
export function validateLogoSize(logoSize: number | 'auto'): string {
  if (logoSize === 'auto') {
    return 'auto'
  }

  if (!Number.isInteger(logoSize) || logoSize <= 0) {
    throw new BadgeError('Logo size must be a positive integer or "auto"', 'INVALID_LOGO_SIZE')
  }

  return logoSize.toString()
}

/**
 * Sanitizes user input to prevent URL injection
 * @param input - The input to sanitize
 * @returns The sanitized input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new BadgeError('Input must be a string', 'INVALID_INPUT_TYPE')
  }

  // Remove any suspicious characters that could be used for injection
  const sanitized = input
    .replaceAll(/[<>"']/g, '') // Remove HTML/XSS characters
    .replaceAll(/javascript:/gi, '') // Remove javascript: protocol
    .replaceAll(/vbscript:/gi, '') // Remove vbscript: protocol
    .replaceAll(/data:/gi, '') // Remove data: protocol (except for logo)
    .trim()

  if (sanitized.length === 0) {
    throw new BadgeError('Input cannot be empty after sanitization', 'EMPTY_INPUT')
  }

  return sanitized
}
