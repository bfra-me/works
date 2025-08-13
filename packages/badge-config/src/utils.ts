/**
 * @module
 * This module contains utility functions for the @bfra.me/badge-config package.
 * It provides helpers for encoding text, validating inputs, and sanitizing data.
 */

import type {BadgeColor} from './types'
import {BadgeError} from './types'

/**
 * Encodes a string for use in a shields.io badge URL.
 * It handles special characters and shields.io-specific escaping.
 *
 * @param text - The text to encode.
 * @returns The encoded and escaped text.
 * @throws {BadgeError} If the input is not a string.
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
 * Validates and normalizes a badge color string.
 * It supports named colors, hex codes, and RGB values.
 *
 * @param color - The color to validate.
 * @returns The normalized and encoded color string.
 * @throws {BadgeError} If the color format is invalid.
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
 * Validates the `cacheSeconds` value to ensure it's a non-negative integer.
 *
 * @param cacheSeconds - The cache duration in seconds.
 * @returns The validated cache duration.
 * @throws {BadgeError} If the value is not a non-negative integer.
 */
export function validateCacheSeconds(cacheSeconds: number): number {
  if (!Number.isInteger(cacheSeconds) || cacheSeconds < 0) {
    throw new BadgeError('Cache seconds must be a non-negative integer', 'INVALID_CACHE_SECONDS')
  }
  return cacheSeconds
}

/**
 * Validates the `logoSize` value to ensure it's a positive integer or 'auto'.
 *
 * @param logoSize - The size of the logo.
 * @returns The validated logo size as a string.
 * @throws {BadgeError} If the value is invalid.
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
 * Sanitizes user-provided strings to prevent URL injection attacks
 * by removing potentially harmful characters.
 *
 * @param input - The string to sanitize.
 * @returns The sanitized string.
 * @throws {BadgeError} If the input is not a string.
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
