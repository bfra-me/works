/**
 * Performance benchmarks for file watcher debouncing utilities.
 *
 * Validates TEST-037: File watcher debouncing batches 1000 events/sec without drops
 * Validates PER-003: File watcher debouncing must batch events within configurable time windows
 *
 * These benchmarks measure the performance of the createDebouncer function
 * under various event rates and batch sizes.
 */

import {afterEach, beforeEach, bench, describe} from 'vitest'

import {createDebouncer} from '../../src/watcher/debouncer'

/**
 * Result holder to prevent JIT from eliminating benchmark code.
 */
const results = {
  value: undefined as unknown,
  batches: [] as unknown[][],
  eventCount: 0,
}

describe('debouncer creation overhead', () => {
  bench('create debouncer instance', () => {
    results.value = createDebouncer(() => {}, 100)
  })

  bench('create debouncer with complex callback', () => {
    results.value = createDebouncer((items: string[]) => {
      results.batches.push(items)
      results.eventCount += items.length
    }, 100)
  })
})

describe('debouncer add() performance', () => {
  describe('single adds', () => {
    const debouncer = createDebouncer<string>(() => {}, 1000)

    bench('add single string item', () => {
      debouncer.add('event')
    })

    afterEach(() => {
      debouncer.cancel()
    })
  })

  describe('numeric events', () => {
    const debouncer = createDebouncer<number>(() => {}, 1000)

    bench('add single numeric item', () => {
      debouncer.add(42)
    })

    afterEach(() => {
      debouncer.cancel()
    })
  })

  describe('object events', () => {
    const debouncer = createDebouncer<{path: string; type: string}>(() => {}, 1000)

    bench('add file change event object', () => {
      debouncer.add({path: '/path/to/file.ts', type: 'change'})
    })

    afterEach(() => {
      debouncer.cancel()
    })
  })
})

describe('debouncer rapid event simulation', () => {
  describe('100 events/batch', () => {
    let batchCount = 0
    let totalEvents = 0

    beforeEach(() => {
      batchCount = 0
      totalEvents = 0
    })

    bench('100 rapid adds then flush', () => {
      const debouncer = createDebouncer<number>(items => {
        batchCount++
        totalEvents += items.length
      }, 10)

      for (let i = 0; i < 100; i++) {
        debouncer.add(i)
      }
      debouncer.flush()

      results.value = {batchCount, totalEvents}
    })
  })

  describe('1000 events/batch (target rate)', () => {
    let batchCount = 0
    let totalEvents = 0

    beforeEach(() => {
      batchCount = 0
      totalEvents = 0
    })

    bench('1000 rapid adds then flush', () => {
      const debouncer = createDebouncer<number>(items => {
        batchCount++
        totalEvents += items.length
      }, 10)

      for (let i = 0; i < 1000; i++) {
        debouncer.add(i)
      }
      debouncer.flush()

      results.value = {batchCount, totalEvents}
    })
  })

  describe('10000 events/batch (stress test)', () => {
    let batchCount = 0
    let totalEvents = 0

    beforeEach(() => {
      batchCount = 0
      totalEvents = 0
    })

    bench('10000 rapid adds then flush', () => {
      const debouncer = createDebouncer<number>(items => {
        batchCount++
        totalEvents += items.length
      }, 10)

      for (let i = 0; i < 10000; i++) {
        debouncer.add(i)
      }
      debouncer.flush()

      results.value = {batchCount, totalEvents}
    })
  })
})

describe('debouncer flush() performance', () => {
  describe('flush with small batch', () => {
    const items: number[] = []
    const debouncer = createDebouncer<number>(batch => {
      items.push(...batch)
    }, 1000)

    for (let i = 0; i < 10; i++) debouncer.add(i)

    bench('flush 10 items', () => {
      // Re-add items after each flush
      for (let i = 0; i < 10; i++) debouncer.add(i)
      debouncer.flush()
      results.value = items.length
    })
  })

  describe('flush with medium batch', () => {
    const items: number[] = []
    const debouncer = createDebouncer<number>(batch => {
      items.push(...batch)
    }, 1000)

    bench('flush 100 items', () => {
      for (let i = 0; i < 100; i++) debouncer.add(i)
      debouncer.flush()
      results.value = items.length
    })
  })

  describe('flush with large batch', () => {
    const items: number[] = []
    const debouncer = createDebouncer<number>(batch => {
      items.push(...batch)
    }, 1000)

    bench('flush 1000 items', () => {
      for (let i = 0; i < 1000; i++) debouncer.add(i)
      debouncer.flush()
      results.value = items.length
    })
  })
})

describe('debouncer cancel() performance', () => {
  bench('cancel with pending items', () => {
    const debouncer = createDebouncer<number>(() => {}, 1000)

    for (let i = 0; i < 100; i++) debouncer.add(i)
    debouncer.cancel()

    results.value = 'cancelled'
  })

  bench('cancel with no pending items', () => {
    const debouncer = createDebouncer<number>(() => {}, 1000)
    debouncer.cancel()

    results.value = 'cancelled'
  })
})

describe('debouncer callback overhead', () => {
  describe('simple callback', () => {
    let sum = 0
    const debouncer = createDebouncer<number>(items => {
      sum += items.length
    }, 10)

    bench('add + flush with simple callback', () => {
      for (let i = 0; i < 100; i++) debouncer.add(i)
      debouncer.flush()
      results.value = sum
    })
  })

  describe('complex callback (transformation)', () => {
    let processed: string[] = []
    const debouncer = createDebouncer<{path: string; type: string}>(items => {
      processed = items.map(item => `${item.type}: ${item.path}`)
    }, 10)

    bench('add + flush with transformation callback', () => {
      for (let i = 0; i < 100; i++) {
        debouncer.add({path: `/file${i}.ts`, type: 'change'})
      }
      debouncer.flush()
      results.value = processed.length
    })
  })
})

describe('file watcher event patterns', () => {
  interface FileEvent {
    path: string
    type: 'add' | 'change' | 'unlink'
    timestamp: number
  }

  describe('realistic file change events', () => {
    let processedEvents: FileEvent[] = []

    const debouncer = createDebouncer<FileEvent>(events => {
      processedEvents = events
    }, 100)

    bench('simulate rapid file saves (100 events)', () => {
      const now = Date.now()
      for (let i = 0; i < 100; i++) {
        debouncer.add({
          path: `/src/components/Component${i % 10}.tsx`,
          type: 'change',
          timestamp: now + i,
        })
      }
      debouncer.flush()
      results.value = processedEvents.length
    })
  })

  describe('mixed event types', () => {
    let eventsByType: Record<string, number> = {}

    const debouncer = createDebouncer<FileEvent>(events => {
      eventsByType = {}
      for (const event of events) {
        eventsByType[event.type] = (eventsByType[event.type] ?? 0) + 1
      }
    }, 100)

    bench('process mixed add/change/unlink events', () => {
      const types: FileEvent['type'][] = ['add', 'change', 'unlink']
      const now = Date.now()

      for (let i = 0; i < 300; i++) {
        const eventType = types[i % 3] ?? 'change'
        debouncer.add({
          path: `/src/file${i}.ts`,
          type: eventType,
          timestamp: now + i,
        })
      }
      debouncer.flush()
      results.value = eventsByType
    })
  })
})

describe('100K iteration stress test', () => {
  bench('100K adds with periodic flushes', () => {
    let totalProcessed = 0
    const debouncer = createDebouncer<number>(items => {
      totalProcessed += items.length
    }, 10)

    for (let i = 0; i < 100_000; i++) {
      debouncer.add(i)
      if (i % 1000 === 999) {
        debouncer.flush()
      }
    }
    debouncer.flush()

    results.value = totalProcessed
  })

  bench('100K adds single flush', () => {
    let totalProcessed = 0
    const debouncer = createDebouncer<number>(items => {
      totalProcessed += items.length
    }, 10)

    for (let i = 0; i < 100_000; i++) {
      debouncer.add(i)
    }
    debouncer.flush()

    results.value = totalProcessed
  })
})

describe('memory pressure simulation', () => {
  bench('large objects in debounce queue', () => {
    interface LargeEvent {
      path: string
      type: string
      content: string
      metadata: Record<string, unknown>
    }

    let processed = 0
    const debouncer = createDebouncer<LargeEvent>(items => {
      processed += items.length
    }, 10)

    for (let i = 0; i < 100; i++) {
      debouncer.add({
        path: `/very/long/path/to/some/deeply/nested/file${i}.ts`,
        type: 'change',
        content: 'x'.repeat(1000),
        metadata: {
          size: 1000,
          mtime: Date.now(),
          inode: i,
          permissions: '0644',
        },
      })
    }
    debouncer.flush()
    results.value = processed
  })
})
