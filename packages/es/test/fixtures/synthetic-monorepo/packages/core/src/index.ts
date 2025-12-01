/**
 * Core utilities module for synthetic monorepo testing.
 * This simulates a foundation package that other packages depend on.
 */

import type {Result} from '@bfra.me/es/result'
import {err, ok} from '@bfra.me/es/result'

/** Represents a user in the system */
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

/** Error types for core operations */
export interface CoreError {
  code: 'NOT_FOUND' | 'INVALID_INPUT' | 'PERMISSION_DENIED'
  message: string
}

/** Creates a validated user object */
export function createUser(input: Partial<User>): Result<User, CoreError> {
  if (!input.id || !input.name || !input.email) {
    return err({
      code: 'INVALID_INPUT',
      message: 'Missing required user fields: id, name, email',
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.email)) {
    return err({
      code: 'INVALID_INPUT',
      message: 'Invalid email format',
    })
  }

  return ok({
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role ?? 'user',
  })
}

/** Finds a user by ID from a user list */
export function findUser(users: User[], id: string): Result<User, CoreError> {
  const user = users.find(u => u.id === id)
  if (!user) {
    return err({
      code: 'NOT_FOUND',
      message: `User with id ${id} not found`,
    })
  }
  return ok(user)
}

/** Core version constant */
export const CORE_VERSION = '1.0.0'

export {formatUserName, normalizeEmail} from './utils'
