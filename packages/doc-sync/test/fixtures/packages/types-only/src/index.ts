/**
 * @module types-only
 * Package containing only type definitions for testing edge cases
 */

/**
 * User information structure
 */
export interface User {
  /** Unique user identifier */
  readonly id: string
  /** User's display name */
  readonly name: string
  /** User's email address */
  readonly email: string
  /** User creation timestamp */
  readonly createdAt: Date
}

/**
 * Permission levels for access control
 */
export type Permission = 'read' | 'write' | 'admin'

/**
 * Generic response wrapper
 */
export type Response<T> = {
  readonly data: T
  readonly status: number
  readonly message?: string
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>

/**
 * Configuration for API clients
 */
export interface ApiConfig {
  /** Base URL for API requests */
  readonly baseUrl: string
  /** Request timeout in milliseconds */
  readonly timeout?: number
  /** Custom headers to include */
  readonly headers?: Record<string, string>
}
