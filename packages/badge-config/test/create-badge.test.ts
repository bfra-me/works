import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'
import {BadgeError, createBadge, createBadgeUrl, type BadgeOptions} from '../src'

// Load test fixtures
const basicBadges = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/input/basic-badges.json'), 'utf-8'),
) as Record<string, BadgeOptions>
const expectedUrls = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/output/basic-badge-urls.json'), 'utf-8'),
) as Record<string, string>

describe('createBadgeUrl', () => {
  it.concurrent('creates basic badge URL', () => {
    const config = basicBadges.basic
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.basic)
  })

  it.concurrent('handles special characters in text', () => {
    const config = basicBadges.specialCharacters
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.specialCharacters)
  })

  it.concurrent('includes color parameter', () => {
    const config = basicBadges.withColor
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withColor)
  })

  it.concurrent('includes named color parameter', () => {
    const config = basicBadges.withNamedColor
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withNamedColor)
  })

  it.concurrent('includes hex color parameter', () => {
    const config = basicBadges.withHexColor
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withHexColor)
  })

  it.concurrent('includes style parameter', () => {
    const config = basicBadges.withStyle
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withStyle)
  })

  it.concurrent('includes logo parameters', () => {
    const config = basicBadges.withLogo
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withLogo)
  })

  it.concurrent('includes label color parameter', () => {
    const config = basicBadges.withLabelColor
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withLabelColor)
  })

  it.concurrent('includes cache seconds parameter', () => {
    const config = basicBadges.withCacheSeconds
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.withCacheSeconds)
  })

  it.concurrent('handles spaces in text', () => {
    const config = basicBadges.spaces
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.spaces)
  })

  it.concurrent('handles unicode symbols', () => {
    const config = basicBadges.symbols
    if (!config) throw new Error('Config not found')
    const url = createBadgeUrl(config)
    expect(url).toBe(expectedUrls.symbols)
  })

  // Error handling tests
  it.concurrent('throws error for missing label', () => {
    expect(() =>
      createBadgeUrl({
        label: '',
        message: 'test',
      }),
    ).toThrow(BadgeError)
  })

  it.concurrent('throws error for missing message', () => {
    expect(() =>
      createBadgeUrl({
        label: 'test',
        message: '',
      }),
    ).toThrow(BadgeError)
  })

  it.concurrent('accepts invalid color format (passed to shields.io)', () => {
    const url = createBadgeUrl({
      label: 'test',
      message: 'badge',

      color: 'invalid-color-123' as any,
    })
    expect(url).toContain('invalid-color-123')
  })

  it.concurrent('throws error for invalid logo size', () => {
    expect(() =>
      createBadgeUrl({
        label: 'test',
        message: 'badge',
        logoSize: -1,
      }),
    ).toThrow(BadgeError)
  })

  it.concurrent('throws error for invalid cache seconds', () => {
    expect(() =>
      createBadgeUrl({
        label: 'test',
        message: 'badge',
        cacheSeconds: -100,
      }),
    ).toThrow(BadgeError)
  })
})

describe('createBadge function', () => {
  it.concurrent('creates badge without fetching SVG', async () => {
    const result = await createBadge({
      label: 'test',
      message: 'badge',
    })

    expect(result.url).toBe('https://img.shields.io/badge/test-badge-blue')
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('creates badge with all parameters', async () => {
    const result = await createBadge({
      label: 'coverage',
      message: '95%',
      color: 'green',
      style: 'flat-square',
      logo: 'github',
      logoColor: 'white',
      labelColor: 'blue',
    })

    expect(result.url).toContain('coverage-95%25-green')
    expect(result.url).toContain('style=flat-square')
    expect(result.url).toContain('logo=github')
    expect(result.url).toContain('logoColor=white')
    expect(result.url).toContain('labelColor=blue')
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('handles error cases gracefully', async () => {
    await expect(async () => {
      await createBadge({
        label: '',
        message: 'test',
      })
    }).rejects.toThrow(BadgeError)
  })
})

describe('url encoding and special characters', () => {
  it.concurrent('properly encodes hyphens', () => {
    const url = createBadgeUrl({
      label: 'my-package',
      message: 'v1.0.0-beta',
    })
    expect(url).toContain('my--package-v1.0.0--beta')
  })

  it.concurrent('properly encodes underscores', () => {
    const url = createBadgeUrl({
      label: 'test_file',
      message: 'pass_all',
    })
    expect(url).toContain('test__file-pass__all')
  })

  it.concurrent('properly encodes spaces', () => {
    const url = createBadgeUrl({
      label: 'test suite',
      message: 'all passing',
    })
    expect(url).toBe('https://img.shields.io/badge/test%20suite-all%20passing-blue')
  })

  it.concurrent('properly encodes percentage signs', () => {
    const url = createBadgeUrl({
      label: 'coverage',
      message: '85%',
    })
    expect(url).toBe('https://img.shields.io/badge/coverage-85%25-blue')
  })
})

describe('createBadge', () => {
  it('creates badge without fetching SVG', async () => {
    const result = await createBadge({
      label: 'test',
      message: 'badge',
    })

    expect(result.url).toBe('https://img.shields.io/badge/test-badge-blue')
    expect(result.svg).toBeUndefined()
  })
})
