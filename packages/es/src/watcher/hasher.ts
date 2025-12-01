import type {FileHasher} from './types'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'

/**
 * Creates a file hasher for change detection.
 *
 * @param algorithm - The hash algorithm to use (default: 'sha256')
 * @returns A FileHasher instance
 *
 * @example
 * ```ts
 * const hasher = createFileHasher('sha256')
 * const hash = await hasher.hash('/path/to/file.ts')
 * // 'a3f2b7c9d4e5f6...'
 * ```
 */
export function createFileHasher(algorithm: 'sha256' | 'md5' = 'sha256'): FileHasher {
  return {
    async hash(path: string): Promise<string> {
      const content = await readFile(path)
      return createHash(algorithm).update(content).digest('hex')
    },

    hashContent(content: string | Uint8Array): string {
      return createHash(algorithm).update(content).digest('hex')
    },
  }
}
