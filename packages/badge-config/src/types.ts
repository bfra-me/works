/**
 * @module
 * This module contains type definitions for the @bfra.me/badge-config package.
 * It includes types for badge styles, colors, options, and results.
 */

/**
 * Defines the visual style of the badge.
 * @see https://shields.io/#style
 */
export type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social'

/**
 * A set of named colors supported by shields.io for badges.
 */
export type BadgeNamedColor =
  | 'brightgreen'
  | 'green'
  | 'yellowgreen'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'lightgrey'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'black'
  | 'white'

/**
 * Represents a color for a badge, which can be a named color, a hex code, or an RGB value.
 */
export type BadgeColor = BadgeNamedColor | `#${string}` | `rgb(${string})`

/**
 * Defines the core configuration options for creating a badge.
 */
export interface BadgeOptions {
  /**
   * The text displayed on the left side of the badge.
   * @example 'build'
   */
  label: string
  /**
   * The text displayed on the right side of the badge.
   * @example 'passing'
   */
  message: string
  /**
   * The color of the message part of the badge.
   * @default 'lightgrey'
   */
  color?: BadgeColor
  /**
   * The color of the label part of the badge.
   */
  labelColor?: BadgeColor
  /**
   * The visual style of the badge.
   * @default 'flat'
   */
  style?: BadgeStyle
  /**
   * A logo from simple-icons to embed in the badge, or a data URI.
   * @see https://simpleicons.org/
   */
  logo?: string
  /**
   * The color of the embedded logo.
   */
  logoColor?: BadgeColor
  /**
   * The width of the embedded logo.
   */
  logoSize?: number | 'auto'
  /**
   * The number of seconds to cache the badge URL.
   * @see https://shields.io/docs/performance
   */
  cacheSeconds?: number
}

/**
 * Represents the result of a badge generation operation.
 */
export interface BadgeResult {
  /** The complete shields.io URL for the generated badge. */
  url: string
  /** The SVG content of the badge, if fetched. */
  svg?: string
}

/**
 * Custom error class for badge generation failures.
 */
export class BadgeError extends Error {
  /** An optional error code for specific failure types. */
  readonly code?: string

  /**
   * Creates a new BadgeError instance.
   * @param message - The error message.
   * @param code - An optional error code.
   */
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'BadgeError'
    this.code = code
  }
}

/**
 * Options for fetching the SVG content of a generated badge.
 */
export interface FetchOptions {
  /**
   * If true, the SVG content of the badge will be fetched and included in the result.
   * @default false
   */
  fetchSvg?: boolean
  /**
   * The timeout for the fetch request in milliseconds.
   * @default 5000
   */
  timeout?: number
}
