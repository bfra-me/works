import type {WatcherEvent} from '../../src/watcher/types'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createFileWatcher} from '../../src/watcher/file-watcher'

type ChokidarEventType = 'add' | 'change' | 'unlink'
type ChokidarEventHandler = (path: string) => void

const eventHandlers = new Map<ChokidarEventType, ChokidarEventHandler>()

const mockClose = vi.fn<() => Promise<void>>()
const mockOn = vi.fn<(event: ChokidarEventType, handler: ChokidarEventHandler) => void>()

const mockWatcher = {
  on: (event: ChokidarEventType, handler: ChokidarEventHandler) => {
    eventHandlers.set(event, handler)
    mockOn(event, handler)
    return mockWatcher
  },
  close: mockClose,
}

const mockWatch =
  vi.fn<(paths: string | string[], options?: Record<string, unknown>) => typeof mockWatcher>()

vi.mock('chokidar', () => ({
  watch: (paths: string | string[], options?: Record<string, unknown>) =>
    mockWatch(paths, options) ?? mockWatcher,
}))

function triggerEvent(event: ChokidarEventType, path: string): void {
  const handler = eventHandlers.get(event)
  if (handler != null) {
    handler(path)
  }
}

describe('@bfra.me/es/watcher - createFileWatcher()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    eventHandlers.clear()
    mockClose.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('start()', () => {
    it('should start watching specified paths', async () => {
      const watcher = createFileWatcher(['/path/to/watch'])
      await watcher.start()

      expect(mockWatch).toHaveBeenCalledWith(
        ['/path/to/watch'],
        expect.objectContaining({
          usePolling: false,
          ignoreInitial: true,
        }),
      )
    })

    it('should accept a single path string', async () => {
      const watcher = createFileWatcher('/single/path')
      await watcher.start()

      expect(mockWatch).toHaveBeenCalledWith(['/single/path'], expect.any(Object))
    })

    it('should accept multiple paths', async () => {
      const watcher = createFileWatcher(['/path/one', '/path/two', '/path/three'])
      await watcher.start()

      expect(mockWatch).toHaveBeenCalledWith(
        ['/path/one', '/path/two', '/path/three'],
        expect.any(Object),
      )
    })

    it('should configure ignored patterns as string', async () => {
      const watcher = createFileWatcher(['/path'], {ignored: 'node_modules/**'})
      await watcher.start()

      expect(mockWatch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          ignored: 'node_modules/**',
        }),
      )
    })

    it('should configure ignored patterns as array', async () => {
      const watcher = createFileWatcher(['/path'], {
        ignored: ['node_modules/**', '.git/**', 'dist/**'],
      })
      await watcher.start()

      expect(mockWatch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          ignored: ['node_modules/**', '.git/**', 'dist/**'],
        }),
      )
    })

    it('should configure polling mode', async () => {
      const watcher = createFileWatcher(['/path'], {usePolling: true, pollingInterval: 200})
      await watcher.start()

      expect(mockWatch).toHaveBeenCalledWith(
        ['/path'],
        expect.objectContaining({
          usePolling: true,
          interval: 200,
        }),
      )
    })

    it('should register event handlers for add, change, unlink', async () => {
      const watcher = createFileWatcher(['/path'])
      await watcher.start()

      expect(mockOn).toHaveBeenCalledWith('add', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('change', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('unlink', expect.any(Function))
    })
  })

  describe('close()', () => {
    it('should close the watcher', async () => {
      const watcher = createFileWatcher(['/path'])
      await watcher.start()
      await watcher.close()

      expect(mockClose).toHaveBeenCalled()
    })

    it('should clear pending debounced events', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'], {debounceMs: 100})
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file.txt')

      await watcher.close()

      vi.advanceTimersByTime(200)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle close when not started', async () => {
      const watcher = createFileWatcher(['/path'])

      await expect(watcher.close()).resolves.not.toThrow()
    })
  })

  describe('on() and off()', () => {
    it('should register change event handler', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file.txt')

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalled()
    })

    it('should unregister change event handler with off()', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      watcher.off('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file.txt')

      vi.advanceTimersByTime(100)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should support multiple handlers', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler1)
      watcher.on('change', handler2)
      await watcher.start()

      triggerEvent('add', '/path/file.txt')

      vi.advanceTimersByTime(100)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should only remove specified handler with off()', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler1)
      watcher.on('change', handler2)
      watcher.off('change', handler1)
      await watcher.start()

      triggerEvent('add', '/path/file.txt')

      vi.advanceTimersByTime(100)
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('event emission', () => {
    it('should emit add events', async () => {
      const handler = vi.fn<(event: WatcherEvent) => void>()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/new-file.txt')

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0]?.[0]
      expect(event?.changes).toBeDefined()
      expect(event?.changes[0]?.path).toBe('/path/new-file.txt')
      expect(event?.changes[0]?.type).toBe('add')
    })

    it('should emit change events', async () => {
      const handler = vi.fn<(event: WatcherEvent) => void>()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('change', '/path/modified-file.txt')

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0]?.[0]
      expect(event?.changes).toBeDefined()
      expect(event?.changes[0]?.path).toBe('/path/modified-file.txt')
      expect(event?.changes[0]?.type).toBe('change')
    })

    it('should emit unlink events', async () => {
      const handler = vi.fn<(event: WatcherEvent) => void>()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('unlink', '/path/deleted-file.txt')

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0]?.[0]
      expect(event?.changes).toBeDefined()
      expect(event?.changes[0]?.path).toBe('/path/deleted-file.txt')
      expect(event?.changes[0]?.type).toBe('unlink')
    })

    it('should include timestamp in events', async () => {
      const handler = vi.fn<(event: WatcherEvent) => void>()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      const beforeTime = Date.now()

      triggerEvent('add', '/path/file.txt')

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalled()
      const event = handler.mock.calls[0]?.[0]
      expect(event?.timestamp).toBeGreaterThanOrEqual(beforeTime)
    })

    it('should include timestamp in file changes', async () => {
      const handler = vi.fn<(event: WatcherEvent) => void>()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      const beforeTime = Date.now()

      triggerEvent('change', '/path/file.txt')

      vi.advanceTimersByTime(100)

      const event = handler.mock.calls[0]?.[0]
      const change = event?.changes[0]
      expect(change?.timestamp).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe('debouncing behavior', () => {
    it('should batch rapid events using default debounce (100ms)', async () => {
      const handler = vi.fn<(event: WatcherEvent) => void>()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file1.txt')
      triggerEvent('add', '/path/file2.txt')
      triggerEvent('add', '/path/file3.txt')

      expect(handler).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0]?.[0]
      expect(event?.changes).toHaveLength(3)
    })

    it('should use custom debounce delay', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'], {debounceMs: 50})
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file.txt')

      vi.advanceTimersByTime(25)
      expect(handler).not.toHaveBeenCalled()

      vi.advanceTimersByTime(25)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should reset debounce timer on new events', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'], {debounceMs: 100})
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file1.txt')

      vi.advanceTimersByTime(50)
      expect(handler).not.toHaveBeenCalled()

      triggerEvent('add', '/path/file2.txt')

      vi.advanceTimersByTime(50)
      expect(handler).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should batch mixed event types together', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'])
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/new.txt')
      triggerEvent('change', '/path/modified.txt')
      triggerEvent('unlink', '/path/deleted.txt')

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0]?.[0] as WatcherEvent | undefined
      expect(event?.changes).toHaveLength(3)
      expect(event?.changes.map(c => c.type)).toEqual(['add', 'change', 'unlink'])
    })

    it('should separate batches after debounce delay passes', async () => {
      const handler = vi.fn()
      const watcher = createFileWatcher(['/path'], {debounceMs: 100})
      watcher.on('change', handler)
      await watcher.start()

      triggerEvent('add', '/path/file1.txt')
      vi.advanceTimersByTime(100)

      triggerEvent('add', '/path/file2.txt')
      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(2)

      const event1 = handler.mock.calls[0]?.[0] as WatcherEvent | undefined
      const event2 = handler.mock.calls[1]?.[0] as WatcherEvent | undefined

      expect(event1?.changes).toHaveLength(1)
      expect(event1?.changes[0]?.path).toBe('/path/file1.txt')

      expect(event2?.changes).toHaveLength(1)
      expect(event2?.changes[0]?.path).toBe('/path/file2.txt')
    })
  })

  describe('error handling', () => {
    it('should throw error when chokidar is not available', async () => {
      vi.doUnmock('chokidar')
      vi.doMock('chokidar', () => {
        throw new Error('Cannot find module')
      })

      vi.resetModules()

      const {createFileWatcher: createWatcherFresh} = await import('../../src/watcher/file-watcher')
      const watcher = createWatcherFresh(['/path'])

      await expect(watcher.start()).rejects.toThrow()

      vi.doMock('chokidar', () => ({
        watch: mockWatch,
      }))
    })
  })

  describe('return type interface', () => {
    it('should return object with start, close, on, off methods', () => {
      const watcher = createFileWatcher(['/path'])

      expect(watcher.start).toBeTypeOf('function')
      expect(watcher.close).toBeTypeOf('function')
      expect(watcher.on).toBeTypeOf('function')
      expect(watcher.off).toBeTypeOf('function')
    })
  })
})
