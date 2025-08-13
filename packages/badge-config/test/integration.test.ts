import {describe, expect, it} from 'vitest'
import {buildStatus, coverage, createBadge, license, social, version} from '../src'

describe('cI/CD integration scenarios', () => {
  describe('gitHub Actions workflows', () => {
    it.concurrent('generates build status badges for different environments', async () => {
      const environments = ['production', 'staging', 'development']
      const statuses = ['success', 'failure', 'pending'] as const

      for (const env of environments) {
        for (const status of statuses) {
          const badgeOptions = buildStatus({
            status,
            label: `${env} build`,
          })
          const result = await createBadge(badgeOptions)

          expect(result.url).toContain(encodeURIComponent(`${env} build`))
          const expectedStatus =
            status === 'success' ? 'passing' : status === 'failure' ? 'failing' : status
          expect(result.url).toContain(expectedStatus)
          expect(result.svg).toBeUndefined()
        }
      }
    })

    it.concurrent('generates coverage badges for different thresholds', async () => {
      const coverageValues = [45, 75, 85, 95, 100]

      for (const percentage of coverageValues) {
        const badgeOptions = coverage({percentage})
        const result = await createBadge(badgeOptions)

        expect(result.url).toContain(`${percentage}%25`)
        if (percentage >= 90) {
          expect(result.url).toContain('brightgreen')
        } else if (percentage >= 80) {
          expect(result.url).toContain('green')
        } else if (percentage >= 60) {
          expect(result.url).toContain('yellow')
        } else {
          expect(result.url).toContain('orange')
        }
      }
    })
  })

  describe('package.json integration', () => {
    it.concurrent('generates version badges for npm packages', async () => {
      const packages = [
        {name: '@bfra.me/badge-config', version: '1.0.0'},
        {name: 'react', version: '18.2.0'},
        {name: '@types/node', version: '20.0.0'},
      ]

      for (const pkg of packages) {
        const badgeOptions = version({
          source: 'npm',
          packageName: pkg.name,
          version: pkg.version,
        })
        const result = await createBadge(badgeOptions)

        expect(result.url).toContain(
          pkg.name.includes('@')
            ? encodeURIComponent(pkg.name).replace('-', '--')
            : pkg.name.replace('-', '--'),
        )
        expect(result.url).toContain(pkg.version)
      }
    })

    it.concurrent('generates license badges for common licenses', async () => {
      const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC']

      for (const licenseType of licenses) {
        const badgeOptions = license({license: licenseType})
        const result = await createBadge(badgeOptions)

        expect(result.url).toContain('license')
        // Specific license encoding patterns observed in URLs:
        const expectedLicense = licenseType
          .replace('BSD-3-', 'BSD%203--') // BSD-3-Clause -> BSD%203--Clause
          .replace('Apache-', 'Apache%20') // Apache-2.0 -> Apache%202.0
          .replace('GPL-', 'GPL%20') // GPL-3.0 -> GPL%203.0
        expect(result.url).toContain(expectedLicense)
      }
    })
  })

  describe('repository statistics', () => {
    it.concurrent('generates social badges for repository metrics', async () => {
      const socialTypes = [
        {type: 'stars', repository: 'facebook/react'},
        {type: 'forks', repository: 'microsoft/vscode'},
        {type: 'watchers', repository: 'nodejs/node'},
      ] as const

      for (const socialData of socialTypes) {
        const badgeOptions = social({
          type: socialData.type,
          repository: socialData.repository,
        })
        const result = await createBadge(badgeOptions)

        expect(result.url).toContain(socialData.type)
        expect(result.url).toContain('logo=github')
      }
    })

    it.concurrent('generates npm download badges', async () => {
      const packages = ['lodash', 'express', 'react']

      for (const packageName of packages) {
        const badgeOptions = social({
          type: 'downloads',
          packageName,
        })
        const result = await createBadge(badgeOptions)

        expect(result.url).toContain('downloads')
        expect(result.url).toContain('0') // default count
      }
    })
  })

  describe('workflow performance', () => {
    it.concurrent('generates multiple badges quickly', async () => {
      const startTime = performance.now()

      const badges = [
        buildStatus({status: 'success'}),
        coverage({percentage: 85}),
        version({source: 'npm', packageName: 'test', version: '1.0.0'}),
        license({license: 'MIT'}),
        social({type: 'stars', repository: 'test/repo'}),
      ]

      const results = await Promise.all(badges.map(async badgeOptions => createBadge(badgeOptions)))

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(results).toHaveLength(5)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms

      for (const result of results) {
        expect(result.url).toMatch(/^https:\/\/img\.shields\.io\/badge\//)
        expect(result.svg).toBeUndefined()
      }
    })

    it.concurrent('handles concurrent badge generation', async () => {
      const concurrentCount = 20
      const promises = Array.from({length: concurrentCount}, async (_, i) =>
        createBadge({
          label: `test-${i}`,
          message: `badge-${i}`,
          color: i % 2 === 0 ? 'green' : 'blue',
        }),
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(concurrentCount)

      for (let i = 0; i < concurrentCount; i++) {
        expect(results[i]?.url).toContain(`test--${i}`)
        expect(results[i]?.url).toContain(`badge--${i}`)
        expect(results[i]?.url).toContain(i % 2 === 0 ? 'green' : 'blue')
      }
    })
  })

  describe('monorepo scenarios', () => {
    it.concurrent('generates badges for multiple packages', async () => {
      const packages = [
        {name: '@bfra.me/eslint-config', version: '1.0.0', coverage: 95},
        {name: '@bfra.me/prettier-config', version: '2.0.0', coverage: 88},
        {name: '@bfra.me/tsconfig', version: '1.5.0', coverage: 92},
      ]

      for (const pkg of packages) {
        // Generate multiple badges per package
        const versionBadge = await createBadge(
          version({
            source: 'npm',
            packageName: pkg.name,
            version: pkg.version,
          }),
        )

        const coverageBadge = await createBadge(
          coverage({
            percentage: pkg.coverage,
            label: `${pkg.name.split('/')[1]} coverage`,
          }),
        )

        const licenseBadge = await createBadge(license({license: 'MIT'}))

        expect(versionBadge.url).toContain(
          pkg.name.replace('@bfra.me/', '%40bfra.me%2F').replace('-', '--'),
        )
        expect(coverageBadge.url).toContain(`${pkg.coverage}%25`)
        expect(licenseBadge.url).toContain('MIT')
      }
    })
  })

  describe('rEADME.md badge embedding', () => {
    it.concurrent('generates markdown-ready badge URLs', async () => {
      const badges = [
        {
          generator: () => buildStatus({status: 'success'}),
          expectedPattern: /build.*passing.*brightgreen/,
        },
        {
          generator: () => coverage({percentage: 95}),
          expectedPattern: /coverage.*95%25.*brightgreen/,
        },
        {
          generator: () => license({license: 'MIT'}),
          expectedPattern: /license.*MIT.*blue/,
        },
      ]

      for (const badge of badges) {
        const badgeOptions = badge.generator()
        const result = await createBadge(badgeOptions)

        // Verify URL is markdown-ready (no spaces, proper encoding)
        expect(result.url).not.toContain(' ')
        expect(result.url).toMatch(/^https:\/\/img\.shields\.io\/badge\//)
        expect(result.url).toMatch(badge.expectedPattern)
      }
    })
  })
})
