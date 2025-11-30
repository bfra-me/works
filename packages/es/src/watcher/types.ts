/**
 * A file change event.
 */
export interface FileChange {
  readonly path: string
  readonly type: 'add' | 'change' | 'unlink'
  readonly timestamp: number
}

/**
 * A watcher event emitted by the file watcher.
 */
export interface WatcherEvent {
  readonly changes: readonly FileChange[]
  readonly timestamp: number
}

/**
 * Options for creating a file watcher.
 */
export interface WatcherOptions {
  /** Debounce delay in milliseconds (default: 100) */
  readonly debounceMs?: number
  /** Patterns to ignore */
  readonly ignored?: string | readonly string[]
  /** Use polling instead of native file watching */
  readonly usePolling?: boolean
  /** Polling interval in milliseconds (if usePolling is true) */
  readonly pollingInterval?: number
}

/**
 * A file watcher that monitors file system changes.
 */
export interface FileWatcher {
  /** Start watching for changes */
  readonly start: () => Promise<void>
  /** Stop watching for changes */
  readonly close: () => Promise<void>
  /** Subscribe to change events */
  readonly on: (event: 'change', handler: (event: WatcherEvent) => void) => void
  /** Unsubscribe from change events */
  readonly off: (event: 'change', handler: (event: WatcherEvent) => void) => void
}

/**
 * A file hasher for change detection.
 */
export interface FileHasher {
  /** Compute the hash of a file */
  readonly hash: (path: string) => Promise<string>
  /** Compute the hash of content */
  readonly hashContent: (content: string | Uint8Array) => string
}

/**
 * Options for the change detector.
 */
export interface ChangeDetectorOptions {
  /** Hash algorithm to use (default: 'sha256') */
  readonly algorithm?: 'sha256' | 'md5'
}

/**
 * A change detector that tracks file changes by content hash.
 */
export interface ChangeDetector {
  /** Check if a file has changed since the last check */
  readonly hasChanged: (path: string) => Promise<boolean>
  /** Record the current state of a file */
  readonly record: (path: string) => Promise<void>
  /** Clear recorded state for a file */
  readonly clear: (path: string) => void
  /** Clear all recorded state */
  readonly clearAll: () => void
}
