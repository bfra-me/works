import {describe, expect, it} from 'vitest'
import {BadgeError, createBadge, createBadgeUrl} from '../src'

describe('createBadgeUrl', () => {
  it('creates basic badge URL', () => {
    const url = createBadgeUrl({
      label: 'build',
      message: 'passing',
    })

    expect(url).toBe('https://img.shields.io/badge/build-passing')
  })

  it('handles special characters in text', () => {
    const url = createBadgeUrl({
      label: 'my-package',
      message: 'v1.0.0',
    })

    expect(url).toBe('https://img.shields.io/badge/my--package-v1.0.0')
  })

  it('includes color parameter', () => {
    const url = createBadgeUrl({
      label: 'build',
      message: 'passing',
      color: 'green',
    })

    expect(url).toBe('https://img.shields.io/badge/build-passing?color=green')
  })

  it('throws error for missing label', () => {
    expect(() =>
      createBadgeUrl({
        label: '',
        message: 'test',
      }),
    ).toThrow(BadgeError)
  })

  it('throws error for missing message', () => {
    expect(() =>
      createBadgeUrl({
        label: 'test',
        message: '',
      }),
    ).toThrow(BadgeError)
  })
})

describe('createBadge', () => {
  it('creates badge without fetching SVG', async () => {
    const result = await createBadge({
      label: 'test',
      message: 'badge',
    })

    expect(result.url).toBe('https://img.shields.io/badge/test-badge')
    expect(result.svg).toBeUndefined()
  })
})
