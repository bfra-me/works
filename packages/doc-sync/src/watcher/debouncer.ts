import type {Debouncer} from '@bfra.me/es/watcher'
import type {FileChangeEvent} from '../types'

import {createDebouncer as createBaseDebouncer} from '@bfra.me/es/watcher'

export interface DocDebouncerOptions {
  readonly debounceMs?: number
  readonly maxWaitMs?: number
}

export type BatchChangeHandler = (events: readonly FileChangeEvent[]) => void | Promise<void>

export interface DocDebouncer {
  readonly add: (event: FileChangeEvent) => void
  readonly addAll: (events: readonly FileChangeEvent[]) => void
  readonly flush: () => void
  readonly cancel: () => void
  readonly getPendingCount: () => number
}

export function createDocDebouncer(
  handler: BatchChangeHandler,
  options: DocDebouncerOptions = {},
): DocDebouncer {
  const {debounceMs = 300, maxWaitMs = 5000} = options

  let pendingEvents: FileChangeEvent[] = []
  let maxWaitTimeout: ReturnType<typeof setTimeout> | undefined

  function processEvents(events: FileChangeEvent[]): void {
    if (maxWaitTimeout !== undefined) {
      clearTimeout(maxWaitTimeout)
      maxWaitTimeout = undefined
    }

    const deduplicated = deduplicateEvents(events)
    if (deduplicated.length > 0) {
      Promise.resolve(handler(deduplicated)).catch(error => {
        console.error('[doc-sync] Error in batch handler:', error)
      })
    }
  }

  const baseDebouncer: Debouncer<FileChangeEvent> = createBaseDebouncer(events => {
    processEvents(events)
    pendingEvents = []
  }, debounceMs)

  function startMaxWaitTimer(): void {
    if (maxWaitTimeout === undefined) {
      maxWaitTimeout = setTimeout(() => {
        baseDebouncer.flush()
      }, maxWaitMs)
    }
  }

  return {
    add(event: FileChangeEvent): void {
      pendingEvents.push(event)
      startMaxWaitTimer()
      baseDebouncer.add(event)
    },

    addAll(events: readonly FileChangeEvent[]): void {
      for (const event of events) {
        pendingEvents.push(event)
        baseDebouncer.add(event)
      }
      if (events.length > 0) {
        startMaxWaitTimer()
      }
    },

    flush(): void {
      if (maxWaitTimeout !== undefined) {
        clearTimeout(maxWaitTimeout)
        maxWaitTimeout = undefined
      }
      baseDebouncer.flush()
    },

    cancel(): void {
      if (maxWaitTimeout !== undefined) {
        clearTimeout(maxWaitTimeout)
        maxWaitTimeout = undefined
      }
      pendingEvents = []
      baseDebouncer.cancel()
    },

    getPendingCount(): number {
      return pendingEvents.length
    },
  }
}

export function deduplicateEvents(events: readonly FileChangeEvent[]): FileChangeEvent[] {
  const latestByPath = new Map<string, FileChangeEvent>()

  for (const event of events) {
    const existing = latestByPath.get(event.path)

    // Keep the most recent event for each path
    if (existing === undefined || event.timestamp > existing.timestamp) {
      latestByPath.set(event.path, event)
    }
  }

  return [...latestByPath.values()]
}

export function consolidateEvents(events: readonly FileChangeEvent[]): FileChangeEvent[] {
  const byPath = new Map<string, FileChangeEvent[]>()

  for (const event of events) {
    const existing = byPath.get(event.path)
    if (existing === undefined) {
      byPath.set(event.path, [event])
    } else {
      existing.push(event)
    }
  }

  const consolidated: FileChangeEvent[] = []

  for (const [, pathEvents] of byPath) {
    const firstEvent = pathEvents[0]
    if (firstEvent === undefined) {
      continue
    }

    if (pathEvents.length === 1) {
      consolidated.push(firstEvent)
      continue
    }

    // Sort by timestamp to get event sequence
    pathEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const first = pathEvents[0]
    const last = pathEvents.at(-1)

    if (first === undefined || last === undefined) {
      continue
    }

    // If file was added then removed, skip entirely
    if (first.type === 'add' && last.type === 'unlink') {
      continue
    }

    // If file was removed then added, treat as change
    if (first.type === 'unlink' && last.type === 'add') {
      consolidated.push({
        type: 'change',
        path: last.path,
        packageName: last.packageName,
        timestamp: last.timestamp,
      })
      continue
    }

    // Otherwise use the latest event
    consolidated.push(last)
  }

  return consolidated
}
