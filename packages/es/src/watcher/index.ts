/**
 * @bfra.me/es/watcher - File watcher abstraction with debouncing and change detection
 */

export {createChangeDetector} from './change-detector'
export {createDebouncer} from './debouncer'
export type {Debouncer} from './debouncer'
export {createFileWatcher} from './file-watcher'
export {createFileHasher} from './hasher'
export type {
  ChangeDetector,
  ChangeDetectorOptions,
  FileChange,
  FileHasher,
  FileWatcher,
  WatcherEvent,
  WatcherOptions,
} from './types'
