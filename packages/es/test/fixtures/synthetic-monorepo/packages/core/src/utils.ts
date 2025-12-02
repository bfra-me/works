/**
 * Core utility functions for string and data manipulation.
 */

/** Formats a user's display name */
export function formatUserName(firstName: string, lastName?: string): string {
  if (!lastName) {
    return firstName.trim()
  }
  return `${firstName.trim()} ${lastName.trim()}`
}

/** Normalizes an email address to lowercase and trims whitespace */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/** Generates a unique ID with optional prefix */
export function generateId(prefix = 'id'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

/** Deep clones an object */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
