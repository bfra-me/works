/**
 * @module
 * This module provides the core `createBadge` function for generating shields.io badge URLs.
 * It handles URL construction, parameter validation, and optional SVG fetching.
 */

import type {BadgeOptions, BadgeResult, FetchOptions} from './types'
import {BadgeError} from './types'
import {
  encodeText,
  sanitizeInput,
  validateCacheSeconds,
  validateColor,
  validateLogoSize,
} from './utils'

/**
 * Creates a shields.io badge URL and optionally fetches the SVG content.
 *
 * This function constructs a URL based on the provided options, validates inputs,
 * and can fetch the resulting SVG image. It's the primary entry point for badge generation.
 *
 * @param options - The configuration for the badge, including label, message, and colors.
 * @param fetchOptions - Optional settings for fetching the SVG content, such as a timeout.
 * @returns A promise that resolves to a `BadgeResult` object containing the URL and optional SVG.
 * @throws {BadgeError} If required fields are missing or if fetching fails.
 *
 * @example
 * ```typescript
 * import { createBadge } from '@bfra.me/badge-config';
 *
 * const badge = await createBadge({
 *   label: 'build',
 *   message: 'passing',
 *   color: 'green',
 *   style: 'flat-square',
 * });
 *
 * console.log(badge.url);
 * // => https://img.shields.io/badge/build-passing-green?style=flat-square
 * ```
 */
export async function createBadge(
  options: BadgeOptions,
  fetchOptions?: FetchOptions,
): Promise<BadgeResult> {
  // Validate required fields
  if (!options.label || !options.message) {
    throw new BadgeError('Label and message are required', 'MISSING_REQUIRED_FIELDS')
  }

  // Sanitize and encode text fields
  const label = encodeText(sanitizeInput(options.label))
  const message = encodeText(sanitizeInput(options.message))

  // Build the base URL with the shields.io format: label-message-color
  const baseUrl = 'https://img.shields.io/badge'
  const color =
    options.color !== undefined && options.color !== null && options.color.trim() !== ''
      ? validateColor(options.color)
      : 'blue'
  let url = `${baseUrl}/${label}-${message}-${color}`

  // Add optional parameters
  const searchParams = new URLSearchParams()

  if (options.labelColor !== undefined) {
    const labelColor = validateColor(options.labelColor)
    searchParams.set('labelColor', labelColor)
  }

  if (options.style !== undefined) {
    searchParams.set('style', options.style)
  }

  if (options.logo !== undefined) {
    searchParams.set('logo', options.logo)
  }

  if (options.logoColor !== undefined) {
    const logoColor = validateColor(options.logoColor)
    searchParams.set('logoColor', logoColor)
  }

  if (options.logoSize !== undefined) {
    const logoSize = validateLogoSize(options.logoSize)
    searchParams.set('logoSize', logoSize)
  }

  if (options.cacheSeconds !== undefined) {
    const cacheSeconds = validateCacheSeconds(options.cacheSeconds)
    searchParams.set('cacheSeconds', cacheSeconds.toString())
  }

  // Append query parameters if any
  const queryString = searchParams.toString()
  if (queryString.length > 0) {
    url += `?${queryString}`
  }

  const result: BadgeResult = {url}

  // Optionally fetch SVG content
  if (fetchOptions?.fetchSvg === true) {
    try {
      const response = await fetch(url, {
        signal:
          typeof fetchOptions.timeout === 'number'
            ? AbortSignal.timeout(fetchOptions.timeout)
            : undefined,
      })

      if (!response.ok) {
        throw new BadgeError(
          `Failed to fetch badge: ${response.status} ${response.statusText}`,
          'FETCH_ERROR',
        )
      }

      result.svg = await response.text()
    } catch (error) {
      if (error instanceof BadgeError) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new BadgeError(`Failed to fetch SVG: ${message}`, 'FETCH_ERROR')
    }
  }

  return result
}

/**
 * Creates a badge URL synchronously (without fetching SVG content)
 * @param options - Badge configuration options
 * @returns Badge URL string
 */
export function createBadgeUrl(options: BadgeOptions): string {
  // Validate required fields
  if (!options.label || !options.message) {
    throw new BadgeError('Label and message are required', 'MISSING_REQUIRED_FIELDS')
  }

  // Sanitize and encode text fields
  const label = encodeText(sanitizeInput(options.label))
  const message = encodeText(sanitizeInput(options.message))

  // Build the base URL with the correct shields.io format: label-message-color
  const baseUrl = 'https://img.shields.io/badge'
  const color =
    options.color !== undefined && options.color !== null && options.color.trim() !== ''
      ? validateColor(options.color)
      : 'blue'
  let url = `${baseUrl}/${label}-${message}-${color}`

  // Add optional parameters
  const searchParams = new URLSearchParams()

  if (options.labelColor !== undefined) {
    const labelColor = validateColor(options.labelColor)
    searchParams.set('labelColor', labelColor)
  }

  if (options.style !== undefined) {
    searchParams.set('style', options.style)
  }

  if (options.logo !== undefined) {
    searchParams.set('logo', options.logo)
  }

  if (options.logoColor !== undefined) {
    const logoColor = validateColor(options.logoColor)
    searchParams.set('logoColor', logoColor)
  }

  if (options.logoSize !== undefined) {
    const logoSize = validateLogoSize(options.logoSize)
    searchParams.set('logoSize', logoSize)
  }

  if (options.cacheSeconds !== undefined) {
    const cacheSeconds = validateCacheSeconds(options.cacheSeconds)
    searchParams.set('cacheSeconds', cacheSeconds.toString())
  }

  // Append query parameters if any
  const queryString = searchParams.toString()
  if (queryString.length > 0) {
    url += `?${queryString}`
  }

  return url
}
