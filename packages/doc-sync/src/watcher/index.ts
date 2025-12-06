export {
  createDocChangeDetector,
  determineRegenerationScope,
  hasAnyFileChanged,
} from './change-detector'
export type {
  DocChangeDetector,
  DocChangeDetectorOptions,
  PackageChangeAnalysis,
  RegenerationScope,
} from './change-detector'

export {consolidateEvents, createDocDebouncer, deduplicateEvents} from './debouncer'
export type {BatchChangeHandler, DocDebouncer, DocDebouncerOptions} from './debouncer'

export {
  categorizeFile,
  createDocWatcher,
  filterDocumentationChanges,
  groupChangesByPackage,
} from './file-watcher'
export type {
  DocChangeHandler,
  DocFileWatcher,
  DocWatcherOptions,
  FileCategory,
} from './file-watcher'
