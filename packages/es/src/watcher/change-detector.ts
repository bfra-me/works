import type {ChangeDetector, ChangeDetectorOptions} from './types'
import {createFileHasher} from './hasher'

/**
 * Creates a change detector that tracks file changes by content hash.
 *
 * @param options - Change detector configuration options
 * @returns A ChangeDetector instance
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
