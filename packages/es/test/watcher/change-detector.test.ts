import {Buffer} from 'node:buffer'
import {readFile} from 'node:fs/promises'
import {describe, expect, it, vi} from 'vitest'

import {createChangeDetector} from '../../src/watcher/change-detector'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

const mockedReadFile = vi.mocked(readFile)

describe('@bfra.me/es/watcher - createChangeDetector()', () => {
  describe('hasChanged()', () => {
    it('should return true for first check of a file (no recorded state)', async () => {
      mockedReadFile.mockResolvedValueOnce(Buffer.from('content'))

      const detector = createChangeDetector()
      const changed = await detector.hasChanged('/path/to/file.txt')

      expect(changed).toBe(true)
    })

    it('should return false when file content has not changed', async () => {
      const content = 'same content'
      mockedReadFile.mockResolvedValue(Buffer.from(content))

      const detector = createChangeDetector()

      await detector.record('/path/to/file.txt')
      const changed = await detector.hasChanged('/path/to/file.txt')

      expect(changed).toBe(false)
    })

    it('should return true when file content has changed', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('original content'))
      await detector.record('/path/to/file.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('modified content'))
      const changed = await detector.hasChanged('/path/to/file.txt')

      expect(changed).toBe(true)
    })

    it('should detect changes for multiple files independently', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      await detector.record('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      await detector.record('/file-b.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      const changedA = await detector.hasChanged('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B modified'))
      const changedB = await detector.hasChanged('/file-b.txt')

      expect(changedA).toBe(false)
      expect(changedB).toBe(true)
    })

    it('should propagate file read errors', async () => {
      mockedReadFile.mockRejectedValueOnce(new Error('ENOENT: file not found'))

      const detector = createChangeDetector()

      await expect(detector.hasChanged('/nonexistent.txt')).rejects.toThrow(
        'ENOENT: file not found',
      )
    })
  })

  describe('record()', () => {
    it('should record the current state of a file', async () => {
      mockedReadFile.mockResolvedValue(Buffer.from('content'))

      const detector = createChangeDetector()
      await detector.record('/path/to/file.txt')

      const changed = await detector.hasChanged('/path/to/file.txt')
      expect(changed).toBe(false)
    })

    it('should update recorded state on subsequent records', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('first content'))
      await detector.record('/path/to/file.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('second content'))
      await detector.record('/path/to/file.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('second content'))
      const changed = await detector.hasChanged('/path/to/file.txt')
      expect(changed).toBe(false)
    })

    it('should record multiple files', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      await detector.record('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      await detector.record('/file-b.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content C'))
      await detector.record('/file-c.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      const changedB = await detector.hasChanged('/file-b.txt')
      expect(changedB).toBe(false)
    })

    it('should propagate file read errors', async () => {
      mockedReadFile.mockRejectedValueOnce(new Error('EACCES: permission denied'))

      const detector = createChangeDetector()

      await expect(detector.record('/protected.txt')).rejects.toThrow('EACCES: permission denied')
    })
  })

  describe('clear()', () => {
    it('should clear recorded state for a specific file', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content'))
      await detector.record('/path/to/file.txt')

      detector.clear('/path/to/file.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content'))
      const changed = await detector.hasChanged('/path/to/file.txt')
      expect(changed).toBe(true)
    })

    it('should not affect other recorded files', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      await detector.record('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      await detector.record('/file-b.txt')

      detector.clear('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      const changedB = await detector.hasChanged('/file-b.txt')
      expect(changedB).toBe(false)
    })

    it('should handle clearing non-existent file', () => {
      const detector = createChangeDetector()

      expect(() => detector.clear('/nonexistent.txt')).not.toThrow()
    })
  })

  describe('clearAll()', () => {
    it('should clear all recorded states', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      await detector.record('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      await detector.record('/file-b.txt')

      detector.clearAll()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content A'))
      const changedA = await detector.hasChanged('/file-a.txt')

      mockedReadFile.mockResolvedValueOnce(Buffer.from('content B'))
      const changedB = await detector.hasChanged('/file-b.txt')

      expect(changedA).toBe(true)
      expect(changedB).toBe(true)
    })

    it('should handle clearing when no files recorded', () => {
      const detector = createChangeDetector()

      expect(() => detector.clearAll()).not.toThrow()
    })
  })

  describe('algorithm selection', () => {
    it('should use sha256 by default', async () => {
      const detector = createChangeDetector()

      mockedReadFile.mockResolvedValueOnce(Buffer.from('test'))
      await detector.record('/file.txt')

      expect(mockedReadFile).toHaveBeenCalled()
    })

    it('should use sha256 when explicitly specified', async () => {
      const detector = createChangeDetector({algorithm: 'sha256'})

      mockedReadFile.mockResolvedValueOnce(Buffer.from('test'))
      await detector.record('/file.txt')

      expect(mockedReadFile).toHaveBeenCalled()
    })

    it('should use md5 when specified', async () => {
      const detector = createChangeDetector({algorithm: 'md5'})

      mockedReadFile.mockResolvedValue(Buffer.from('test'))
      await detector.record('/file.txt')

      const changed = await detector.hasChanged('/file.txt')
      expect(changed).toBe(false)
    })
  })

  describe('return type interface', () => {
    it('should return object with hasChanged, record, clear, clearAll methods', () => {
      const detector = createChangeDetector()

      expect(detector.hasChanged).toBeTypeOf('function')
      expect(detector.record).toBeTypeOf('function')
      expect(detector.clear).toBeTypeOf('function')
      expect(detector.clearAll).toBeTypeOf('function')
    })
  })
})
