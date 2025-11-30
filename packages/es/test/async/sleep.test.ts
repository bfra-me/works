import {describe, expect, it} from 'vitest'

import {sleep} from '../../src/async'

describe('@bfra.me/es/async - sleep()', () => {
  it.concurrent('should resolve after the specified delay', async () => {
    const start = Date.now()
    await sleep(50)
    const elapsed = Date.now() - start

    // Allow some timing variance
    expect(elapsed).toBeGreaterThanOrEqual(45)
    expect(elapsed).toBeLessThan(100)
  })

  it.concurrent('should resolve immediately with 0ms delay', async () => {
    const start = Date.now()
    await sleep(0)
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(50)
  })

  it.concurrent('should return void', async () => {
    const result = await sleep(10)
    expect(result).toBeUndefined()
  })
})
