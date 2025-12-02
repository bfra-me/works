import type {ChangeDetector, ChangeDetectorOptions} from './types'
import {createFileHasher} from './hasher'

/**
 * Creates a change detector that tracks file changes by content hash.
 *
 * @param options - Change detector configuration options
 * @returns A ChangeDetector instance
 *
 * @example
 * ```ts
 * const detector = createChangeDetector({ algorithm: 'sha256' })
 *
 * // Record initial state
 * await detector.record('src/index.ts')
 *
 * // Later, check for changes
 * if (await detector.hasChanged('src/index.ts')) {
 *   console.log('File was modified')
 * }
 * ```
 */
export function createChangeDetector(options: ChangeDetectorOptions = {}): ChangeDetector {
  const {algorithm = 'sha256'} = options
  const hasher = createFileHasher(algorithm)
  const hashes = new Map<string, string>()

  return {
    async hasChanged(path: string): Promise<boolean> {
      const currentHash = await hasher.hash(path)
      const previousHash = hashes.get(path)
      return previousHash !== currentHash
    },

    async record(path: string): Promise<void> {
      const currentHash = await hasher.hash(path)
      hashes.set(path, currentHash)
    },

    clear(path: string): void {
      hashes.delete(path)
    },

    clearAll(): void {
      hashes.clear()
    },
  }
}
