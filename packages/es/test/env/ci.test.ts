import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('@bfra.me/es/env - isInCI', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should return false when not in CI environment', async () => {
    vi.doMock('is-in-ci', () => ({default: false}))
    const {isInCI} = await import('../../src/env/ci')
    expect(isInCI()).toBe(false)
  })

  it('should return true when in CI environment', async () => {
    vi.doMock('is-in-ci', () => ({default: true}))
    const {isInCI} = await import('../../src/env/ci')
    expect(isInCI()).toBe(true)
  })

  it('should return a boolean type', async () => {
    vi.doMock('is-in-ci', () => ({default: false}))
    const {isInCI} = await import('../../src/env/ci')
    const result = isInCI()
    expect(typeof result).toBe('boolean')
  })
})
