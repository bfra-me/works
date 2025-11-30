import type {FileChange, FileWatcher, WatcherEvent, WatcherOptions} from './types'

/**
 * Creates a file watcher that monitors file system changes.
 * Requires chokidar as an optional peer dependency.
 *
 * @param paths - Paths to watch
 * @param options - Watcher configuration options
 * @returns A FileWatcher instance
 */
export function createFileWatcher(
  paths: string | readonly string[],
  options: WatcherOptions = {},
): FileWatcher {
  const {debounceMs = 100, ignored, usePolling = false, pollingInterval = 100} = options
  const handlers: Set<(event: WatcherEvent) => void> = new Set()
  let pendingChanges: FileChange[] = []
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined
  let watcher: unknown

  const emitChanges = (): void => {
    if (pendingChanges.length > 0) {
      const event: WatcherEvent = {
        changes: [...pendingChanges],
        timestamp: Date.now(),
      }
      pendingChanges = []
      for (const handler of handlers) {
        handler(event)
      }
    }
  }

  const queueChange = (change: FileChange): void => {
    pendingChanges.push(change)
    if (debounceTimeout !== undefined) {
      clearTimeout(debounceTimeout)
    }
    debounceTimeout = setTimeout(emitChanges, debounceMs)
  }

  return {
    async start(): Promise<void> {
      // Dynamic import to handle optional peer dependency
      const chokidar = await import('chokidar').catch(() => undefined)
      if (chokidar === undefined) {
        throw new Error(
          'chokidar is required for file watching. Install it with: pnpm add chokidar',
        )
      }

      const pathsArray = typeof paths === 'string' ? [paths] : [...paths]

      const chokidarOptions: {
        usePolling: boolean
        interval: number
        ignoreInitial: boolean
        ignored?: string | string[]
      } = {
        usePolling,
        interval: pollingInterval,
        ignoreInitial: true,
      }

      if (ignored !== undefined) {
        chokidarOptions.ignored = typeof ignored === 'string' ? ignored : [...ignored]
      }

      watcher = chokidar.watch(pathsArray, chokidarOptions)

      const w = watcher as {on: (event: string, handler: (path: string) => void) => void}

      w.on('add', (path: string) => {
        queueChange({path, type: 'add', timestamp: Date.now()})
      })

      w.on('change', (path: string) => {
        queueChange({path, type: 'change', timestamp: Date.now()})
      })

      w.on('unlink', (path: string) => {
        queueChange({path, type: 'unlink', timestamp: Date.now()})
      })
    },

    async close(): Promise<void> {
      if (debounceTimeout !== undefined) {
        clearTimeout(debounceTimeout)
        debounceTimeout = undefined
      }
      if (watcher !== undefined) {
        const w = watcher as {close: () => Promise<void>}
        await w.close()
        watcher = undefined
      }
    },

    on(event: 'change', handler: (event: WatcherEvent) => void): void {
      if (event === 'change') {
        handlers.add(handler)
      }
    },

    off(event: 'change', handler: (event: WatcherEvent) => void): void {
      if (event === 'change') {
        handlers.delete(handler)
      }
    },
  }
}
