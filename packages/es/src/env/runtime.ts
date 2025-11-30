import process from 'node:process'
import {isInCI} from './ci'
import {isInEditorEnv} from './editor'
import {isInGitLifecycle} from './git'

/**
 * Environment information structure.
 */
export interface EnvironmentInfo {
  readonly isNode: boolean
  readonly isBrowser: boolean
  readonly isDeno: boolean
  readonly isCI: boolean
  readonly isEditor: boolean
  readonly isGitLifecycle: boolean
}

declare const window: unknown
declare const document: unknown
declare const Deno: unknown

/**
 * Check if running in Node.js environment.
 */
export function isNode(): boolean {
  return (
    process !== undefined && process.versions !== undefined && process.versions.node !== undefined
  )
}

/**
 * Check if running in a browser environment.
 */
export function isBrowser(): boolean {
  return window !== undefined && document !== undefined
}

/**
 * Check if running in Deno environment.
 */
export function isDeno(): boolean {
  return Deno !== undefined
}

/**
 * Get comprehensive environment information.
 */
export function getEnvironment(): EnvironmentInfo {
  return {
    isNode: isNode(),
    isBrowser: isBrowser(),
    isDeno: isDeno(),
    isCI: isInCI(),
    isEditor: isInEditorEnv(),
    isGitLifecycle: isInGitLifecycle(),
  }
}
