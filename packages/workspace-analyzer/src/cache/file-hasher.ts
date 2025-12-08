/**
 * File hasher for cache invalidation and change detection.
 *
 * Re-exports from @bfra.me/es/watcher with workspace-analyzer-specific utilities.
 */

import type {FileHasher} from '@bfra.me/es/watcher'
import {createFileHasher} from '@bfra.me/es/watcher'

// Re-export the core hasher factory
export {createFileHasher}
export type {FileHasher}

/**
 * Options for creating a workspace file hasher.
 */
export interface WorkspaceHasherOptions {
  /** Hash algorithm to use (default: sha256) */
  readonly algorithm?: 'sha256' | 'md5'
  /** Whether to normalize line endings before hashing (default: true) */
  readonly normalizeLineEndings?: boolean
}

/**
 * Extended file hasher with workspace-specific utilities.
 */
export interface WorkspaceFileHasher extends FileHasher {
  /** Hash a JSON object consistently (keys sorted) */
  readonly hashJson: (obj: unknown) => string
  /** Hash multiple files and return combined hash */
  readonly hashFiles: (paths: readonly string[]) => Promise<string>
}

/**
 * Creates an extended file hasher with workspace-specific utilities.
 *
 * @param options - Hasher configuration options
 * @returns A WorkspaceFileHasher instance
 *
 * @example
 * ```ts
 * const hasher = createWorkspaceHasher()
 * const configHash = hasher.hashJson(analyzerConfig)
 * const filesHash = await hasher.hashFiles(['package.json', 'tsconfig.json'])
 * ```
 */
export function createWorkspaceHasher(options: WorkspaceHasherOptions = {}): WorkspaceFileHasher {
  const {algorithm = 'sha256'} = options
  const baseHasher = createFileHasher(algorithm)

  return {
    ...baseHasher,

    hashJson(obj: unknown): string {
      const normalized = JSON.stringify(obj, Object.keys(obj as object).sort(), 0)
      return baseHasher.hashContent(normalized)
    },

    async hashFiles(paths: readonly string[]): Promise<string> {
      const hashes = await Promise.all(paths.map(async path => baseHasher.hash(path)))
      const combined = hashes.join(':')
      return baseHasher.hashContent(combined)
    },
  }
}
