import type {
  BuildStatusOptions,
  CoverageOptions,
  LicenseOptions,
  SocialBadgeOptions,
  VersionOptions,
} from '../src'
import {readFileSync} from 'node:fs'

import {join} from 'node:path'

import {describe, expect, it} from 'vitest'
import {buildStatus, coverage, createBadge, license, social, version} from '../src'

// Helper to load preset fixture data with proper typing
const loadPresetFixtures = (): {
  buildStatus: Record<string, BuildStatusOptions>
  coverage: Record<string, CoverageOptions>
  license: Record<string, LicenseOptions>
  version: Record<string, VersionOptions>
  social: Record<string, SocialBadgeOptions>
} => {
  const filePath = join(__dirname, 'fixtures', 'input', 'preset-configs.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

// Helper to load expected preset outputs
const loadPresetOutputs = (): Record<string, Record<string, string>> => {
  const filePath = join(__dirname, 'fixtures', 'output', 'preset-urls.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

describe('buildStatus generator', () => {
  const fixtures = loadPresetFixtures()
  const expectedOutputs = loadPresetOutputs()

  it.concurrent('generates success status badge', async () => {
    const config = fixtures.buildStatus.success
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = buildStatus(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.buildStatus?.success
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates failure status badge', async () => {
    const config = fixtures.buildStatus.failure
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = buildStatus(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.buildStatus?.failure
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates pending status badge', async () => {
    const config = fixtures.buildStatus.pending
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = buildStatus(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.buildStatus?.pending
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates cancelled status badge', async () => {
    const config = fixtures.buildStatus.cancelled
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = buildStatus(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.buildStatus?.cancelled
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('supports custom label', async () => {
    const config = fixtures.buildStatus.withCustomLabel
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = buildStatus(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('tests')
    expect(result.url).toContain('passing')
  })

  it.concurrent('defaults to "build" label when not specified', async () => {
    const badgeOptions = buildStatus({status: 'success'})
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('build')
    expect(result.url).toContain('passing')
  })
})

describe('coverage generator', () => {
  const fixtures = loadPresetFixtures()
  const expectedOutputs = loadPresetOutputs()

  it.concurrent('generates high coverage badge (green)', async () => {
    const config = fixtures.coverage.high
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = coverage(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toBe(expectedOutputs.coverage?.high)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates medium coverage badge (yellow)', async () => {
    const config = fixtures.coverage.medium
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = coverage(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toBe(expectedOutputs.coverage?.medium)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates low coverage badge (red)', async () => {
    const config = fixtures.coverage.low
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = coverage(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toBe(expectedOutputs.coverage?.low)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('supports custom thresholds', async () => {
    const config = fixtures.coverage.customThresholds
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = coverage(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('82%')
    expect(result.url).toContain('green') // 82% should be green with custom thresholds (between good 80 and excellent 90)
  })

  it.concurrent('supports custom label', async () => {
    const config = fixtures.coverage.withLabel
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = coverage(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('test%20coverage')
  })

  it.concurrent('defaults to "coverage" label when not specified', async () => {
    const badgeOptions = coverage({percentage: 90})
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('coverage')
  })

  it.concurrent('handles edge case percentages', async () => {
    const lowCoverage = await createBadge(coverage({percentage: 0}))
    const highCoverage = await createBadge(coverage({percentage: 100}))
    expect(lowCoverage.url).toContain('red')
    expect(highCoverage.url).toContain('brightgreen')
  })
})

describe('license generator', () => {
  const fixtures = loadPresetFixtures()
  const expectedOutputs = loadPresetOutputs()

  it.concurrent('generates MIT license badge', async () => {
    const config = fixtures.license.mit
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = license(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.license?.mit
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates Apache license badge', async () => {
    const config = fixtures.license.apache
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = license(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.license?.apache
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates GPL license badge', async () => {
    const config = fixtures.license.gpl
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = license(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.license?.gpl
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('handles BSD license', async () => {
    const config = fixtures.license.bsd
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = license(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('BSD%203--Clause')
  })

  it.concurrent('handles Unlicense', async () => {
    const config = fixtures.license.unlicense
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = license(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('Unlicense')
  })

  it.concurrent('defaults to "license" label', async () => {
    const badgeOptions = license({license: 'MIT'})
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('license')
  })

  it.concurrent('supports custom label', async () => {
    const badgeOptions = license({license: 'MIT', label: 'License Type'})
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('License%20Type')
  })
})

describe('version generator', () => {
  const fixtures = loadPresetFixtures()
  const expectedOutputs = loadPresetOutputs()

  it.concurrent('generates npm version badge', async () => {
    const config = fixtures.version.npm
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = version(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.version?.npm
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates GitHub release badge', async () => {
    const config = fixtures.version.github
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = version(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.version?.github
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates custom version badge', async () => {
    const config = fixtures.version.custom
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = version(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('1.2.3')
  })

  it.concurrent('handles semantic version', async () => {
    const config = fixtures.version.semver
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = version(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('2.0.0--beta.1')
  })

  it.concurrent('defaults to "version" label', async () => {
    const badgeOptions = version({source: 'custom', version: '1.0.0'})
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('version')
  })

  it.concurrent('supports custom label', async () => {
    const badgeOptions = version({source: 'custom', version: '1.0.0', label: 'Release'})
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('Release')
  })
})

describe('social generator', () => {
  const fixtures = loadPresetFixtures()
  const expectedOutputs = loadPresetOutputs()

  it.concurrent('generates GitHub stars badge', async () => {
    const config = fixtures.social.githubStars
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = social(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.social?.githubStars
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates GitHub forks badge', async () => {
    const config = fixtures.social.githubForks
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = social(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.social?.githubForks
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates GitHub watchers badge', async () => {
    const config = fixtures.social.githubWatchers
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = social(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('watchers')
  })

  it.concurrent('generates npm downloads badge', async () => {
    const config = fixtures.social.npmDownloads
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = social(config)
    const result = await createBadge(badgeOptions)
    const expectedUrl = expectedOutputs.social?.npmDownloads
    expect(expectedUrl).toBeDefined()
    expect(result.url).toBe(expectedUrl)
    expect(result.svg).toBeUndefined()
  })

  it.concurrent('generates user followers badge', async () => {
    const config = fixtures.social.userFollowers
    expect(config).toBeDefined()
    if (!config) throw new Error('Config not found')
    const badgeOptions = social(config)
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('followers')
  })

  it.concurrent('supports custom labels', async () => {
    const badgeOptions = social({
      type: 'stars',
      repository: 'test/repo',
      label: 'GitHub Stars',
    })
    const result = await createBadge(badgeOptions)
    expect(result.url).toContain('GitHub%20Stars')
  })
})

describe('generator error handling', () => {
  it.concurrent('buildStatus handles invalid status gracefully', () => {
    // TypeScript would normally catch this, but runtime should handle gracefully
    const result = buildStatus({status: 'unknown'})
    expect(result.label).toBe('build')
    expect(result.message).toBe('unknown')
  })

  it.concurrent('coverage throws for invalid percentage', () => {
    expect(() => coverage({percentage: -1})).toThrow()
    expect(() => coverage({percentage: 101})).toThrow()
  })

  it.concurrent('version throws for missing required fields', () => {
    expect(() => version({source: 'npm'} as never)).toThrow()
    expect(() => version({source: 'github'} as never)).toThrow()
    expect(() => version({source: 'custom'} as never)).toThrow()
  })

  it.concurrent('social throws for missing required fields', () => {
    expect(() => social({type: 'stars'} as never)).toThrow()
    expect(() => social({type: 'downloads'} as never)).toThrow()
  })
})

describe('generator performance', () => {
  it.concurrent('all generators execute quickly', async () => {
    const startTime = performance.now()

    // Execute multiple generator calls
    const badgeOptions = [
      buildStatus({status: 'success'}),
      coverage({percentage: 85}),
      license({license: 'MIT'}),
      version({source: 'custom', version: '1.0.0'}),
      social({type: 'stars', repository: 'test/repo'}),
    ]

    const results = await Promise.all(badgeOptions.map(async options => createBadge(options)))

    const endTime = performance.now()
    const executionTime = endTime - startTime

    expect(results).toHaveLength(5)
    expect(executionTime).toBeLessThan(100) // Should complete in under 100ms
    results.forEach(result => {
      expect(result.url).toMatch(/^https:\/\/img\.shields\.io\//)
    })
  })
})
