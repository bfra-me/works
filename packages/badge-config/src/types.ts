/**
 * Badge style options supported by shields.io
 */
export type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social'

/**
 * Named colors supported by shields.io
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
 * Badge color type supporting hex colors, named colors, and RGB values
 */
export type BadgeColor = BadgeNamedColor | `#${string}` | `rgb(${string})`

/**
 * Core badge configuration interface
 */
export interface BadgeOptions {
  /** The left-hand-side text */
  label: string
  /** The right-hand-side text */
  message: string
  /** Badge color (hex, named color, or RGB) */
  color?: BadgeColor
  /** Badge style */
  style?: BadgeStyle
  /** Custom logo name or data URI */
  logo?: string
  /** Logo color */
  logoColor?: BadgeColor
  /** Logo width */
  logoWidth?: number
  /** Cache seconds for the badge */
  cacheSeconds?: number
}

/**
 * Result from badge generation
 */
export interface BadgeResult {
  /** The generated shields.io URL */
  url: string
  /** Optional SVG content if fetched */
  svg?: string
}

/**
 * Badge generation error
 */
export class BadgeError extends Error {
  readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'BadgeError'
    this.code = code
  }
}

/**
 * Options for fetching badge SVG content
 */
export interface FetchOptions {
  /** Whether to fetch the SVG content */
  fetchSvg?: boolean
  /** Timeout for fetch request in milliseconds */
  timeout?: number
}
