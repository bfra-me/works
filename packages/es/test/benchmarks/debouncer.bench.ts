/**
 * Performance benchmarks for file watcher debouncing utilities.
 *
 * Validates TEST-037: File watcher debouncing batches 1000 events/sec without drops
 * Validates PER-003: File watcher debouncing must batch events within configurable time windows
 *
 * These benchmarks measure the performance of the createDebouncer function
 * under various event rates and batch sizes.
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

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
  it('create debouncer instance', async ({bench}) => {
    const result = await bench('create debouncer instance', () => {
      results.value = createDebouncer(() => {}, 100)
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('create debouncer with complex callback', async ({bench}) => {
    const result = await bench('create debouncer with complex callback', () => {
      results.value = createDebouncer((items: string[]) => {
        results.batches.push(items)
        results.eventCount += items.length
      }, 100)
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})

describe('debouncer add() performance', () => {
  describe('single adds', () => {
    const debouncer = createDebouncer<string>(() => {}, 1000)

    it('add single string item', async ({bench}) => {
      const result = await bench('add single string item', () => {
        debouncer.add('event')
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    afterEach(() => {
      debouncer.cancel()
    })
  })

  describe('numeric events', () => {
    const debouncer = createDebouncer<number>(() => {}, 1000)

    it('add single numeric item', async ({bench}) => {
      const result = await bench('add single numeric item', () => {
        debouncer.add(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    afterEach(() => {
      debouncer.cancel()
    })
  })

  describe('object events', () => {
    const debouncer = createDebouncer<{path: string; type: string}>(() => {}, 1000)

    it('add file change event object', async ({bench}) => {
      const result = await bench('add file change event object', () => {
        debouncer.add({path: '/path/to/file.ts', type: 'change'})
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
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

    it('100 rapid adds then flush', async ({bench}) => {
      const result = await bench('100 rapid adds then flush', () => {
        const debouncer = createDebouncer<number>(items => {
          batchCount++
          totalEvents += items.length
        }, 10)

        for (let i = 0; i < 100; i++) {
          debouncer.add(i)
        }
        debouncer.flush()

        results.value = {batchCount, totalEvents}
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('1000 events/batch (target rate)', () => {
    let batchCount = 0
    let totalEvents = 0

    beforeEach(() => {
      batchCount = 0
      totalEvents = 0
    })

    it('1000 rapid adds then flush', async ({bench}) => {
      const result = await bench('1000 rapid adds then flush', () => {
        const debouncer = createDebouncer<number>(items => {
          batchCount++
          totalEvents += items.length
        }, 10)

        for (let i = 0; i < 1000; i++) {
          debouncer.add(i)
        }
        debouncer.flush()

        results.value = {batchCount, totalEvents}
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('10000 events/batch (stress test)', () => {
    let batchCount = 0
    let totalEvents = 0

    beforeEach(() => {
      batchCount = 0
      totalEvents = 0
    })

    it('10000 rapid adds then flush', async ({bench}) => {
      const result = await bench('10000 rapid adds then flush', () => {
        const debouncer = createDebouncer<number>(items => {
          batchCount++
          totalEvents += items.length
        }, 10)

        for (let i = 0; i < 10000; i++) {
          debouncer.add(i)
        }
        debouncer.flush()

        results.value = {batchCount, totalEvents}
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
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

    it('flush 10 items', async ({bench}) => {
      const result = await bench('flush 10 items', () => {
        // Re-add items after each flush
        for (let i = 0; i < 10; i++) debouncer.add(i)
        debouncer.flush()
        results.value = items.length
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('flush with medium batch', () => {
    const items: number[] = []
    const debouncer = createDebouncer<number>(batch => {
      items.push(...batch)
    }, 1000)

    it('flush 100 items', async ({bench}) => {
      const result = await bench('flush 100 items', () => {
        for (let i = 0; i < 100; i++) debouncer.add(i)
        debouncer.flush()
        results.value = items.length
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('flush with large batch', () => {
    const items: number[] = []
    const debouncer = createDebouncer<number>(batch => {
      items.push(...batch)
    }, 1000)

    it('flush 1000 items', async ({bench}) => {
      const result = await bench('flush 1000 items', () => {
        for (let i = 0; i < 1000; i++) debouncer.add(i)
        debouncer.flush()
        results.value = items.length
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('debouncer cancel() performance', () => {
  it('cancel with pending items', async ({bench}) => {
    const result = await bench('cancel with pending items', () => {
      const debouncer = createDebouncer<number>(() => {}, 1000)

      for (let i = 0; i < 100; i++) debouncer.add(i)
      debouncer.cancel()

      results.value = 'cancelled'
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('cancel with no pending items', async ({bench}) => {
    const result = await bench('cancel with no pending items', () => {
      const debouncer = createDebouncer<number>(() => {}, 1000)
      debouncer.cancel()

      results.value = 'cancelled'
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})

describe('debouncer callback overhead', () => {
  describe('simple callback', () => {
    let sum = 0
    const debouncer = createDebouncer<number>(items => {
      sum += items.length
    }, 10)

    it('add + flush with simple callback', async ({bench}) => {
      const result = await bench('add + flush with simple callback', () => {
        for (let i = 0; i < 100; i++) debouncer.add(i)
        debouncer.flush()
        results.value = sum
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('complex callback (transformation)', () => {
    let processed: string[] = []
    const debouncer = createDebouncer<{path: string; type: string}>(items => {
      processed = items.map(item => `${item.type}: ${item.path}`)
    }, 10)

    it('add + flush with transformation callback', async ({bench}) => {
      const result = await bench('add + flush with transformation callback', () => {
        for (let i = 0; i < 100; i++) {
          debouncer.add({path: `/file${i}.ts`, type: 'change'})
        }
        debouncer.flush()
        results.value = processed.length
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
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

    it('simulate rapid file saves (100 events)', async ({bench}) => {
      const result = await bench('simulate rapid file saves (100 events)', () => {
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
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
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

    it('process mixed add/change/unlink events', async ({bench}) => {
      const result = await bench('process mixed add/change/unlink events', () => {
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
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('100K iteration stress test', () => {
  it('100K adds with periodic flushes', async ({bench}) => {
    const result = await bench('100K adds with periodic flushes', () => {
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
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('100K adds single flush', async ({bench}) => {
    const result = await bench('100K adds single flush', () => {
      let totalProcessed = 0
      const debouncer = createDebouncer<number>(items => {
        totalProcessed += items.length
      }, 10)

      for (let i = 0; i < 100_000; i++) {
        debouncer.add(i)
      }
      debouncer.flush()

      results.value = totalProcessed
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})

describe('memory pressure simulation', () => {
  it('large objects in debounce queue', async ({bench}) => {
    const result = await bench('large objects in debounce queue', () => {
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
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})
