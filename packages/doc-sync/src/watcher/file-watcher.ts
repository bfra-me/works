import type {WatcherOptions} from '@bfra.me/es/watcher'
import type {FileChangeEvent} from '../types'

import path from 'node:path'
import process from 'node:process'

import {createFileWatcher as createBaseWatcher} from '@bfra.me/es/watcher'

export interface DocWatcherOptions {
  readonly rootDir?: string
  readonly debounceMs?: number
  readonly additionalIgnore?: readonly string[]
  readonly usePolling?: boolean
}

const DEFAULT_WATCH_PATTERNS = [
  'packages/*/README.md',
  'packages/*/readme.md',
  'packages/*/package.json',
  'packages/*/src/**/*.ts',
  'packages/*/src/**/*.tsx',
] as const

const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/lib/**',
  '**/dist/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/__tests__/**',
  '**/__mocks__/**',
] as const

export type DocChangeHandler = (events: readonly FileChangeEvent[]) => void | Promise<void>

export interface DocFileWatcher {
  readonly start: () => Promise<void>
  readonly close: () => Promise<void>
  readonly onChanges: (handler: DocChangeHandler) => () => void
  readonly getWatchedPaths: () => readonly string[]
}

function extractPackageName(filePath: string, root: string): string | undefined {
  const relativePath = path.relative(root, filePath)
  const parts = relativePath.split(path.sep)

  if (parts[0] === 'packages' && parts.length > 1) {
    return parts[1]
  }

  return undefined
}

export function createDocWatcher(options: DocWatcherOptions = {}): DocFileWatcher {
  const {
    rootDir = process.cwd(),
    debounceMs = 300,
    additionalIgnore = [],
    usePolling = false,
  } = options

  const watchPaths = DEFAULT_WATCH_PATTERNS.map(pattern => path.join(rootDir, pattern))
  const ignoredPatterns: string[] = [...DEFAULT_IGNORE_PATTERNS, ...additionalIgnore]

  const watcherOptions: WatcherOptions = {
    debounceMs,
    ignored: ignoredPatterns,
    usePolling,
  }

  const baseWatcher = createBaseWatcher(watchPaths, watcherOptions)
  const handlers = new Set<DocChangeHandler>()

  function transformToDocEvents(
    changes: readonly {path: string; type: 'add' | 'change' | 'unlink'; timestamp: number}[],
  ): FileChangeEvent[] {
    return changes.map(change => ({
      type: change.type,
      path: change.path,
      packageName: extractPackageName(change.path, rootDir),
      timestamp: new Date(change.timestamp),
    }))
  }

  return {
    async start(): Promise<void> {
      baseWatcher.on('change', event => {
        const docEvents = transformToDocEvents(event.changes)
        for (const handler of handlers) {
          Promise.resolve(handler(docEvents)).catch(error => {
            console.error('[doc-sync] Error in change handler:', error)
          })
        }
      })

      await baseWatcher.start()
    },

    async close(): Promise<void> {
      await baseWatcher.close()
      handlers.clear()
    },

    onChanges(handler: DocChangeHandler): () => void {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    },

    getWatchedPaths(): readonly string[] {
      return watchPaths
    },
  }
}

export type FileCategory = 'readme' | 'source' | 'package-json' | 'unknown'

export function categorizeFile(filePath: string): FileCategory {
  const basename = path.basename(filePath).toLowerCase()

  if (basename === 'readme.md' || basename === 'readme') {
    return 'readme'
  }

  if (basename === 'package.json') {
    return 'package-json'
  }

  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.ts' || ext === '.tsx') {
    return 'source'
  }

  return 'unknown'
}

export function groupChangesByPackage(
  events: readonly FileChangeEvent[],
): Map<string, FileChangeEvent[]> {
  const grouped = new Map<string, FileChangeEvent[]>()

  for (const event of events) {
    const pkg = event.packageName ?? '__unknown__'
    const existing = grouped.get(pkg)

    if (existing === undefined) {
      grouped.set(pkg, [event])
    } else {
      existing.push(event)
    }
  }

  return grouped
}

export function filterDocumentationChanges(events: readonly FileChangeEvent[]): FileChangeEvent[] {
  return events.filter(event => {
    const category = categorizeFile(event.path)
    return category !== 'unknown'
  })
}
