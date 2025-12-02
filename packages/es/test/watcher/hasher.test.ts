import {Buffer} from 'node:buffer'
import {readFile} from 'node:fs/promises'
import {describe, expect, it, vi} from 'vitest'

import {createFileHasher} from '../../src/watcher/hasher'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

const mockedReadFile = vi.mocked(readFile)

describe('@bfra.me/es/watcher - createFileHasher()', () => {
  describe('hashContent()', () => {
    it.concurrent('should hash string content with sha256 by default', () => {
      const hasher = createFileHasher()
      const hash = hasher.hashContent('hello world')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
    })

    it.concurrent('should hash string content with md5', () => {
      const hasher = createFileHasher('md5')
      const hash = hasher.hashContent('hello world')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(32)
      expect(hash).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3')
    })

    it.concurrent('should hash Uint8Array content with sha256', () => {
      const hasher = createFileHasher('sha256')
      const content = new TextEncoder().encode('hello world')
      const hash = hasher.hashContent(content)

      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
    })

    it.concurrent('should hash Uint8Array content with md5', () => {
      const hasher = createFileHasher('md5')
      const content = new TextEncoder().encode('hello world')
      const hash = hasher.hashContent(content)

      expect(hash).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3')
    })

    it.concurrent('should produce different hashes for different content', () => {
      const hasher = createFileHasher()

      const hash1 = hasher.hashContent('content1')
      const hash2 = hasher.hashContent('content2')

      expect(hash1).not.toBe(hash2)
    })

    it.concurrent('should produce consistent hashes for same content', () => {
      const hasher = createFileHasher()

      const hash1 = hasher.hashContent('same content')
      const hash2 = hasher.hashContent('same content')

      expect(hash1).toBe(hash2)
    })

    it.concurrent('should hash empty string', () => {
      const hasher = createFileHasher()
      const hash = hasher.hashContent('')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it.concurrent('should hash empty Uint8Array', () => {
      const hasher = createFileHasher()
      const hash = hasher.hashContent(new Uint8Array(0))

      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it.concurrent('should handle unicode content', () => {
      const hasher = createFileHasher()
      const hash = hasher.hashContent('こんにちは世界')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
    })

    it.concurrent('should handle binary-like content', () => {
      const hasher = createFileHasher()
      const binaryContent = new Uint8Array([0x00, 0xff, 0x01, 0xfe, 0x02, 0xfd])
      const hash = hasher.hashContent(binaryContent)

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
    })

    it.concurrent('should handle large content', () => {
      const hasher = createFileHasher()
      const largeContent = 'x'.repeat(1_000_000)
      const hash = hasher.hashContent(largeContent)

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
    })
  })

  describe('hash() - file hashing', () => {
    it('should hash file content with sha256 by default', async () => {
      mockedReadFile.mockResolvedValueOnce(Buffer.from('file content'))

      const hasher = createFileHasher()
      const hash = await hasher.hash('/path/to/file.txt')

      expect(mockedReadFile).toHaveBeenCalledWith('/path/to/file.txt')
      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
    })

    it('should hash file content with md5', async () => {
      mockedReadFile.mockResolvedValueOnce(Buffer.from('file content'))

      const hasher = createFileHasher('md5')
      const hash = await hasher.hash('/path/to/file.txt')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(32)
    })

    it('should read and hash the actual file content', async () => {
      mockedReadFile.mockResolvedValueOnce(Buffer.from('hello world'))

      const hasher = createFileHasher()
      const hash = await hasher.hash('/any/path.txt')

      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
    })

    it('should produce different hashes for different file contents', async () => {
      const hasher = createFileHasher()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      const hash1 = await hasher.hash('/file1.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      const hash2 = await hasher.hash('/file2.txt')

      expect(hash1).not.toBe(hash2)
    })

    it('should propagate file read errors', async () => {
      mockedReadFile.mockRejectedValueOnce(new Error('ENOENT: file not found'))

      const hasher = createFileHasher()

      await expect(hasher.hash('/nonexistent.txt')).rejects.toThrow('ENOENT: file not found')
    })

    it('should handle empty file', async () => {
      mockedReadFile.mockResolvedValueOnce(Buffer.from(''))

      const hasher = createFileHasher()
      const hash = await hasher.hash('/empty.txt')

      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it('should handle binary file content', async () => {
      mockedReadFile.mockResolvedValueOnce(Buffer.from([0x00, 0xff, 0x01, 0xfe]))

      const hasher = createFileHasher()
      const hash = await hasher.hash('/binary.bin')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
    })
  })

  describe('algorithm selection', () => {
    it.concurrent('should default to sha256', () => {
      const hasher = createFileHasher()
      const hash = hasher.hashContent('test')

      expect(hash).toHaveLength(64)
    })

    it.concurrent('should use sha256 when explicitly specified', () => {
      const hasher = createFileHasher('sha256')
      const hash = hasher.hashContent('test')

      expect(hash).toHaveLength(64)
    })

    it.concurrent('should use md5 when specified', () => {
      const hasher = createFileHasher('md5')
      const hash = hasher.hashContent('test')

      expect(hash).toHaveLength(32)
    })

    it.concurrent('md5 and sha256 should produce different hashes for same content', () => {
      const sha256Hasher = createFileHasher('sha256')
      const md5Hasher = createFileHasher('md5')

      const sha256Hash = sha256Hasher.hashContent('same content')
      const md5Hash = md5Hasher.hashContent('same content')

      expect(sha256Hash).not.toBe(md5Hash)
      expect(sha256Hash).toHaveLength(64)
      expect(md5Hash).toHaveLength(32)
    })
  })

  describe('return type interface', () => {
    it.concurrent('should return object with hash and hashContent methods', () => {
      const hasher = createFileHasher()

      expect(hasher.hash).toBeTypeOf('function')
      expect(hasher.hashContent).toBeTypeOf('function')
    })
  })
})
