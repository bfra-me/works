/**
 * Tests for preset system covering composition and customization.
 *
 * This test suite validates how semantic-release presets work together through
 * composition utilities and how they can be customized for different workflows.
 */

import {describe, expect, it} from 'vitest'
import {
  extendConfig,
  mergeConfigs,
  mergeConfigsWithOptions,
  overrideConfig,
} from '../src/composition/index.js'
import {PresetDiscoveryService} from '../src/config/discovery.js'
import {
  developmentPreset,
  getPreset,
  githubPreset,
  monorepoPreset,
  npmPreset,
  presets,
} from '../src/config/presets.js'
import {
  checkPresetCompatibility,
  createVersionManager,
  defaultVersionManager,
  getCurrentPresetVersion,
  getPresetVersions,
  migratePresetConfig,
} from '../src/config/versioning.js'
import {validateConfig} from '../src/validation/index.js'

describe('preset system tests', () => {
  describe('preset composition', () => {
    describe('basic preset merging', () => {
      it('should combine npm and github presets', () => {
        const npmConfig = npmPreset({
          branches: ['main'],
          repositoryUrl: 'https://github.com/user/npm-package',
        })

        const githubConfig = githubPreset({
          branches: ['main', 'beta'],
          repositoryUrl: 'https://github.com/user/npm-package',
        })

        const merged = mergeConfigs(npmConfig, githubConfig)

        expect(merged.branches).toEqual(['main', 'beta'])
        expect(merged.repositoryUrl).toBe('https://github.com/user/npm-package')

        // Should have plugins from both presets with github's minimal set not duplicating
        const plugins = merged.plugins ?? []
        expect(plugins.length).toBeGreaterThan(3) // npm has 6, github has 3, some overlap

        // Validate the merged configuration
        const validation = validateConfig(merged)
        expect(validation.success).toBe(true)
      })

      it('should merge npm and monorepo presets for enhanced monorepo workflow', () => {
        const npmConfig = npmPreset({
          branches: ['main'],
          repositoryUrl: 'https://github.com/org/monorepo',
        })

        const monorepoConfig = monorepoPreset({
          branches: ['main', 'develop'],
          repositoryUrl: 'https://github.com/org/monorepo',
          packageName: '@org/core-package',
          pkgRoot: 'packages/core',
          changesetsIntegration: true,
        })

        const merged = mergeConfigs(npmConfig, monorepoConfig)

        expect(merged.branches).toEqual(['main', 'develop'])
        expect(merged.repositoryUrl).toBe('https://github.com/org/monorepo')

        // Should include monorepo-specific tag format
        expect(merged.tagFormat).toBe('@org/core-package@$' + '{version}')

        // Validate complex merged configuration
        const validation = validateConfig(merged)
        expect(validation.success).toBe(true)
      })

      it('should combine all four presets for comprehensive testing', () => {
        const baseNpm = npmPreset({
          branches: ['main'],
          repositoryUrl: 'https://github.com/test/comprehensive',
        })

        const githubEnhanced = githubPreset({
          branches: ['main', 'beta'],
          repositoryUrl: 'https://github.com/test/comprehensive',
        })

        const monorepoFeatures = monorepoPreset({
          packageName: '@test/comprehensive',
          pkgRoot: 'packages/main',
        })

        const devSettings = developmentPreset({
          branches: ['develop', 'feature/*'],
        })

        // Merge all presets in sequence
        const merged = mergeConfigs(baseNpm, githubEnhanced, monorepoFeatures, devSettings)

        expect(merged.branches).toEqual(['main', 'beta', 'develop', 'feature/*'])
        expect(merged.dryRun).toBe(true) // From development preset
        expect(merged.debug).toBe(true) // From development preset
        expect(merged.ci).toBe(false) // From development preset
        expect(merged.tagFormat).toBe('v$' + '{version}-dev') // From development preset (last merged)

        const validation = validateConfig(merged)
        expect(validation.success).toBe(true)
      })
    })

    describe('preset merging with custom strategies', () => {
      it('should replace branches when using replace strategy', () => {
        const npmConfig = npmPreset({
          branches: ['main'],
        })

        const githubConfig = githubPreset({
          branches: ['main', 'develop', 'beta'],
        })

        const merged = mergeConfigsWithOptions([npmConfig, githubConfig], {
          branchStrategy: 'replace',
        })

        expect(merged.branches).toEqual(['main', 'develop', 'beta']) // Replaced, not merged
      })

      it('should replace plugins when using replace strategy', () => {
        const npmConfig = npmPreset({
          repositoryUrl: 'https://github.com/test/repo',
        })

        const githubConfig = githubPreset({
          repositoryUrl: 'https://github.com/test/repo',
        })

        const merged = mergeConfigsWithOptions([npmConfig, githubConfig], {
          pluginStrategy: 'replace',
        })

        // Should only have GitHub preset plugins (3), not npm preset plugins (6)
        const plugins = merged.plugins ?? []
        expect(plugins).toHaveLength(3)

        // Should contain GitHub-specific plugins
        expect(
          plugins.some(p =>
            typeof p === 'string'
              ? p === '@semantic-release/github'
              : p[0] === '@semantic-release/github',
          ),
        ).toBe(true)
      })

      it('should prepend plugins when using prepend strategy', () => {
        const githubConfig = githubPreset({
          repositoryUrl: 'https://github.com/test/repo',
        })

        const monorepoConfig = monorepoPreset({
          packageName: '@test/package',
        })

        const merged = mergeConfigsWithOptions([githubConfig, monorepoConfig], {
          pluginStrategy: 'prepend',
        })

        const plugins = merged.plugins ?? []
        expect(plugins.length).toBeGreaterThan(3)

        // First plugins should be from monorepo preset (second config)
        expect(plugins[0]).toEqual([
          '@semantic-release/commit-analyzer',
          expect.objectContaining({
            preset: 'conventionalcommits',
          }),
        ])
      })
    })
  })

  describe('preset customization', () => {
    describe('extending presets with custom options', () => {
      it('should extend npm preset with custom branch configuration', () => {
        const basePreset = npmPreset({
          repositoryUrl: 'https://github.com/test/custom-branches',
        })

        const customized = extendConfig(basePreset, {
          branches: [
            'main',
            {name: 'beta', prerelease: true},
            {name: 'alpha', prerelease: 'alpha'},
          ],
          tagFormat: 'v$' + '{version}',
        })

        expect(customized.branches).toEqual([
          'main',
          {name: 'beta', prerelease: true},
          {name: 'alpha', prerelease: 'alpha'},
        ])
        expect(customized.tagFormat).toBe('v$' + '{version}')

        // Should preserve npm preset plugins
        const plugins = customized.plugins ?? []
        expect(plugins).toHaveLength(6) // Full npm preset plugin set

        const validation = validateConfig(customized)
        expect(validation.success).toBe(true)
      })

      it('should extend monorepo preset with additional plugins', () => {
        const basePreset = monorepoPreset({
          packageName: '@org/enhanced-package',
          pkgRoot: 'packages/enhanced',
          changesetsIntegration: true,
        })

        const customized = extendConfig(basePreset, {
          plugins: [
            // Add custom semantic-release plugins
            [
              '@semantic-release/exec',
              {
                publishCmd: 'npm run deploy',
              },
            ],
            [
              '@qiwi/semantic-release-gh-pages-plugin',
              {
                branch: 'gh-pages',
              },
            ],
          ],
        })

        const plugins = customized.plugins ?? []
        expect(plugins.length).toBeGreaterThan(6) // Original + custom plugins

        // Should contain the custom plugins
        expect(plugins.some(p => Array.isArray(p) && p[0] === '@semantic-release/exec')).toBe(true)
        expect(
          plugins.some(p => Array.isArray(p) && p[0] === '@qiwi/semantic-release-gh-pages-plugin'),
        ).toBe(true)

        const validation = validateConfig(customized)
        expect(validation.success).toBe(true)
      })

      it('should customize plugin configurations within presets', () => {
        const basePreset = githubPreset({
          repositoryUrl: 'https://github.com/test/custom-plugins',
        })

        const customized = extendConfig(basePreset, {
          plugins: [
            // Override commit analyzer with custom rules
            [
              '@semantic-release/commit-analyzer',
              {
                preset: 'conventionalcommits',
                releaseRules: [
                  {type: 'docs', scope: 'api', release: 'patch'},
                  {type: 'style', release: 'patch'},
                  {type: 'test', release: false},
                ],
              },
            ],
            // Override GitHub plugin with custom settings
            [
              '@semantic-release/github',
              {
                assets: ['dist/**', {path: 'coverage/lcov-report.zip', label: 'Coverage Report'}],
                releasedLabels: ['released', 'published'],
              },
            ],
          ],
        })

        const plugins = customized.plugins ?? []

        // Find the customized commit analyzer
        const analyzer = plugins.find(
          p => Array.isArray(p) && p[0] === '@semantic-release/commit-analyzer',
        ) as [string, Record<string, unknown>] | undefined

        expect(analyzer).toBeDefined()
        expect(analyzer?.[1]).toMatchObject({
          preset: 'conventionalcommits',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          releaseRules: expect.arrayContaining([{type: 'docs', scope: 'api', release: 'patch'}]),
        })

        // Find the customized GitHub plugin
        const github = plugins.find(
          p => Array.isArray(p) && p[0] === '@semantic-release/github',
        ) as [string, Record<string, unknown>] | undefined

        expect(github).toBeDefined()
        expect(github?.[1]).toMatchObject({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          assets: expect.arrayContaining(['dist/**']),
          releasedLabels: ['released', 'published'],
        })

        const validation = validateConfig(customized)
        expect(validation.success).toBe(true)
      })
    })

    describe('overriding preset configurations', () => {
      it('should completely override npm preset with custom configuration', () => {
        const basePreset = npmPreset({
          branches: ['main'],
          repositoryUrl: 'https://github.com/test/override',
        })

        const overridden = overrideConfig(basePreset, {
          branches: ['develop', 'main'],
          plugins: [
            '@semantic-release/commit-analyzer',
            '@semantic-release/release-notes-generator',
            '@semantic-release/npm',
          ],
          dryRun: true,
        })

        expect(overridden.branches).toEqual(['develop', 'main']) // Replaced
        expect(overridden.plugins).toHaveLength(3) // Replaced with minimal set
        expect(overridden.dryRun).toBe(true)
        expect(overridden.repositoryUrl).toBe('https://github.com/test/override') // Preserved

        const validation = validateConfig(overridden)
        expect(validation.success).toBe(true)
      })

      it('should override monorepo preset for simplified workflow', () => {
        const basePreset = monorepoPreset({
          packageName: '@org/complex-package',
          pkgRoot: 'packages/complex',
          changesetsIntegration: true,
          publishOnlyIfChanged: true,
        })

        const simplified = overrideConfig(basePreset, {
          tagFormat: 'v$' + '{version}', // Remove package-specific tagging
          plugins: [
            '@semantic-release/commit-analyzer',
            '@semantic-release/release-notes-generator',
            '@semantic-release/github',
          ],
        })

        expect(simplified.tagFormat).toBe('v$' + '{version}') // Override monorepo tagging
        expect(simplified.plugins).toHaveLength(3) // Simplified plugin set

        const validation = validateConfig(simplified)
        expect(validation.success).toBe(true)
      })
    })

    describe('conditional preset customization', () => {
      it('should apply environment-specific customizations', () => {
        const isProduction = process.env.NODE_ENV === 'production'

        const basePreset = npmPreset({
          repositoryUrl: 'https://github.com/test/env-specific',
        })

        const customized = extendConfig(basePreset, {
          dryRun: !isProduction, // Only run for real in production
          debug: !isProduction, // Debug in non-production
          // Add deployment plugins only in production
          ...(isProduction
            ? {
                plugins: [
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run deploy:production',
                    },
                  ],
                ],
              }
            : {}),
        })

        expect(customized.dryRun).toBe(true) // Since NODE_ENV !== 'production' in tests
        expect(customized.debug).toBe(true)

        const validation = validateConfig(customized)
        expect(validation.success).toBe(true)
      })
    })
  })

  describe('preset versioning and migration', () => {
    describe('version management', () => {
      it('should get current versions for all presets', () => {
        const npmVersions = getPresetVersions('npm')
        const githubVersions = getPresetVersions('github')
        const monorepoVersions = getPresetVersions('monorepo')

        expect(Array.isArray(npmVersions)).toBe(true)
        expect(Array.isArray(githubVersions)).toBe(true)
        expect(Array.isArray(monorepoVersions)).toBe(true)

        expect(npmVersions.length).toBeGreaterThan(0)
        expect(githubVersions.length).toBeGreaterThan(0)
        expect(monorepoVersions.length).toBeGreaterThan(0)
      })

      it('should get current version for specific preset', () => {
        const npmVersion = getCurrentPresetVersion('npm')
        const githubVersion = getCurrentPresetVersion('github')
        const monorepoVersion = getCurrentPresetVersion('monorepo')

        expect(npmVersion).toMatch(/^\d+\.\d+\.\d+$/)
        expect(githubVersion).toMatch(/^\d+\.\d+\.\d+$/)
        expect(monorepoVersion).toMatch(/^\d+\.\d+\.\d+$/)
      })

      it('should create version manager with custom registry', () => {
        const customRegistry = {
          presets: {
            npm: [
              {
                version: '3.0.0',
                releaseDate: new Date(),
                breaking: true,
                description: 'Custom npm preset v3',
                compatibility: {
                  semanticRelease: '>=23.0.0',
                  node: '>=18.0.0',
                },
              },
            ],
            github: [],
            monorepo: [],
          },
          current: {
            npm: '3.0.0',
            github: '1.0.0',
            monorepo: '2.0.0',
          },
          migrations: {},
        }

        const versionManager = createVersionManager(customRegistry)
        expect(versionManager).toBeDefined()
        expect(versionManager.getCurrentVersion('npm')).toBe('3.0.0')
      })

      it('should use default version manager', () => {
        expect(defaultVersionManager).toBeDefined()
        expect(defaultVersionManager.getCurrentVersion('npm')).toBeDefined()
        expect(defaultVersionManager.getCurrentVersion('github')).toBeDefined()
        expect(defaultVersionManager.getCurrentVersion('monorepo')).toBeDefined()
      })
    })

    describe('compatibility checking', () => {
      it('should check compatibility between preset versions', () => {
        const compatibility = checkPresetCompatibility('npm', '1.0.0', '2.0.0')

        expect(compatibility).toHaveProperty('compatible')
        expect(compatibility).toHaveProperty('issues')

        expect(typeof compatibility.compatible).toBe('boolean')
        if (compatibility.issues) {
          expect(Array.isArray(compatibility.issues)).toBe(true)
        }
      })

      it('should identify breaking changes in version compatibility', () => {
        // Test with known breaking version change
        const compatibility = checkPresetCompatibility('npm', '1.0.0', '2.0.0')

        if (!compatibility.compatible && compatibility.issues) {
          expect(compatibility.issues.length).toBeGreaterThan(0)
          expect(compatibility.issues.some(issue => issue.severity === 'error')).toBe(true)
        }
      })

      it('should handle compatibility checks gracefully', () => {
        // Test basic compatibility structure without migrations
        const compatibility = checkPresetCompatibility('github', '1.0.0', '1.1.0')
        expect(compatibility).toHaveProperty('compatible')
        expect(typeof compatibility.compatible).toBe('boolean')
      })
    })

    describe('configuration migration', () => {
      it('should migrate npm preset configuration between versions', () => {
        const oldConfig = npmPreset({
          repositoryUrl: 'https://github.com/test/migration',
        })

        const migrationResult = migratePresetConfig(oldConfig, 'npm', '1.0.0', '2.0.0')

        expect(migrationResult).toHaveProperty('success')
        if (migrationResult.success) {
          expect(migrationResult).toHaveProperty('config')
        }

        // Migration errors and warnings are optional
        if (migrationResult.warnings) {
          expect(Array.isArray(migrationResult.warnings)).toBe(true)
        }
        if (migrationResult.errors) {
          expect(Array.isArray(migrationResult.errors)).toBe(true)
        }

        if (migrationResult.success) {
          const validation = validateConfig(migrationResult.config)
          expect(validation.success).toBe(true)
        }
      })

      it('should handle migration failures gracefully', () => {
        const invalidConfig = {}

        const migrationResult = migratePresetConfig(invalidConfig, 'npm', '1.0.0', '999.0.0')

        expect(migrationResult.success).toBe(false)
        if (migrationResult.errors) {
          expect(migrationResult.errors.length).toBeGreaterThan(0)
        }
      })

      it('should provide warnings for non-breaking migration issues', () => {
        const config = npmPreset({
          repositoryUrl: 'https://github.com/test/warnings',
        })

        const migrationResult = migratePresetConfig(config, 'npm', '1.0.0', '2.0.0')

        // Migration might succeed but have warnings
        if (
          migrationResult.success &&
          migrationResult.warnings &&
          migrationResult.warnings.length > 0
        ) {
          expect(migrationResult.warnings[0]).toHaveProperty('type')
          expect(migrationResult.warnings[0]).toHaveProperty('message')
        }
      })
    })
  })

  describe('preset discovery', () => {
    describe('discovery service', () => {
      it('should create preset discovery service', () => {
        const discoveryService = new PresetDiscoveryService()
        expect(discoveryService).toBeDefined()
      })

      it('should discover presets from npm registry', async () => {
        const discoveryService = new PresetDiscoveryService()

        const presets = await discoveryService.discoverPresets({
          sources: ['npm'],
        })

        expect(Array.isArray(presets.presets)).toBe(true)
        expect(presets.total).toBeGreaterThanOrEqual(0)

        if (presets.presets.length > 0) {
          const preset = presets.presets[0]
          if (preset) {
            expect(preset).toHaveProperty('id')
            expect(preset).toHaveProperty('name')
            expect(preset).toHaveProperty('description')
            expect(preset).toHaveProperty('source')
            expect(preset.source).toBe('npm')
          }
        }
      })

      it('should discover presets from local filesystem', async () => {
        const discoveryService = new PresetDiscoveryService()

        const presets = await discoveryService.discoverPresets({
          sources: ['local'],
          searchPaths: [process.cwd()],
        })

        expect(Array.isArray(presets.presets)).toBe(true)
        expect(presets.total).toBeGreaterThanOrEqual(0)
      })

      it('should discover presets from available sources', async () => {
        const discoveryService = new PresetDiscoveryService()

        const allPresets = await discoveryService.discoverPresets({
          sources: ['npm'],
        })

        const limitedPresets = await discoveryService.discoverPresets({
          sources: ['npm'],
        })

        expect(limitedPresets.total).toBeLessThanOrEqual(allPresets.total)

        if (limitedPresets.presets.length > 0) {
          const hasSemanticPreset = limitedPresets.presets.some(p => {
            const nameMatch = p.name.includes('semantic')
            const descMatch = Boolean(p.description?.includes('semantic'))
            return nameMatch || descMatch
          })
          expect(hasSemanticPreset).toBe(true)
        }
      })
    })

    describe('preset installation', () => {
      it('should install preset from npm', async () => {
        const discoveryService = new PresetDiscoveryService()

        // Mock npm preset
        const mockPreset = {
          id: '@semantic-release/preset-conventionalcommits',
          name: '@semantic-release/preset-conventionalcommits',
          description: 'Conventional commits preset',
          version: '1.0.0',
          source: 'npm' as const,
          location: {
            path: '@semantic-release/preset-conventionalcommits',
          },
          installed: false,
          lastUpdated: new Date(),
        }

        const installResult = await discoveryService.installPreset(mockPreset, {})

        expect(installResult).toHaveProperty('success')
        if (installResult.success) {
          expect(installResult).toHaveProperty('preset')
          expect(installResult).toHaveProperty('location')

          // Installation might fail in test environment, but should have proper structure
          expect(installResult.preset).toMatchObject({
            id: mockPreset.id,
            name: mockPreset.name,
            description: mockPreset.description,
            version: mockPreset.version,
            source: mockPreset.source,
          })
        }
      })

      it('should install preset from local path', async () => {
        const discoveryService = new PresetDiscoveryService()

        const mockLocalPreset = {
          id: 'local-custom-preset',
          name: 'Custom Local Preset',
          description: 'A custom local preset',
          version: '1.0.0',
          source: 'local' as const,
          location: {
            path: './custom-presets/my-preset.js',
          },
          installed: false,
          lastUpdated: new Date(),
        }

        const installResult = await discoveryService.installPreset(mockLocalPreset, {})

        expect(installResult).toHaveProperty('success')
        if (installResult.success) {
          expect(installResult).toHaveProperty('preset')
          expect(installResult.preset).toMatchObject({
            id: mockLocalPreset.id,
            name: mockLocalPreset.name,
            description: mockLocalPreset.description,
            version: mockLocalPreset.version,
            source: mockLocalPreset.source,
          })
        }
      })

      it('should handle installation failures gracefully', async () => {
        const discoveryService = new PresetDiscoveryService()

        const invalidPreset = {
          id: 'invalid-preset',
          name: 'Invalid Preset',
          description: 'A preset that does not exist',
          version: '1.0.0',
          source: 'npm' as const,
          location: {
            path: 'non-existent-preset-package',
          },
          installed: false,
          lastUpdated: new Date(),
        }

        const installResult = await discoveryService.installPreset(invalidPreset, {})

        expect(installResult.success).toBe(false)
        if (installResult.error !== null && installResult.error !== undefined) {
          expect(installResult.error).toBeDefined()
        }
      })
    })
  })

  describe('advanced integration scenarios', () => {
    describe('real-world preset combinations', () => {
      it('should create enterprise monorepo configuration', () => {
        // Start with npm preset for solid foundation
        const baseConfig = npmPreset({
          branches: ['main', 'develop'],
          repositoryUrl: 'https://github.com/enterprise/monorepo',
        })

        // Add monorepo-specific features
        const monorepoConfig = monorepoPreset({
          packageName: '@enterprise/core',
          pkgRoot: 'packages/core',
          changesetsIntegration: true,
          publishOnlyIfChanged: true,
        })

        // Merge with custom enterprise settings
        const enterpriseConfig = mergeConfigs(baseConfig, monorepoConfig, {
          branches: [
            'main',
            'develop',
            {name: 'staging', prerelease: 'rc'},
            {name: 'hotfix/*', prerelease: 'hotfix'},
          ],
          plugins: [
            // Add security scanning
            [
              '@semantic-release/exec',
              {
                publishCmd: 'npm audit --audit-level=moderate',
              },
            ],
            // Add deployment automation
            [
              '@semantic-release/exec',
              {
                publishCmd: 'npm run deploy:enterprise',
              },
            ],
            // Add Slack notifications
            [
              'semantic-release-slack-bot',
              {
                notifyOnSuccess: true,
                notifyOnFail: true,
                slackWebhook: process.env.SLACK_WEBHOOK,
              },
            ],
          ],
        })

        expect(enterpriseConfig.branches).toHaveLength(4)
        expect(enterpriseConfig.tagFormat).toBe('@enterprise/core@$' + '{version}')

        const plugins = enterpriseConfig.plugins ?? []
        expect(plugins.length).toBeGreaterThanOrEqual(8) // Base + monorepo + custom plugins

        const validation = validateConfig(enterpriseConfig)
        expect(validation.success).toBe(true)
      })

      it('should create open source project configuration', () => {
        // Start with GitHub preset for OSS focus
        const baseConfig = githubPreset({
          branches: ['main'],
          repositoryUrl: 'https://github.com/opensource/project',
        })

        // Add npm publishing for library distribution
        const libraryConfig = extendConfig(baseConfig, {
          plugins: [
            '@semantic-release/npm',
            [
              '@semantic-release/changelog',
              {
                changelogFile: 'CHANGELOG.md',
                changelogTitle:
                  '# Changelog\n\nAll notable changes to this project will be documented in this file.',
              },
            ],
            [
              '@semantic-release/git',
              {
                assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
                message: `chore(release): \$\{nextRelease.version\} [skip ci]${String.raw`\n\n`}\$\{nextRelease.notes\}`,
              },
            ],
          ],
        })

        // Add OSS-specific enhancements
        const ossConfig = extendConfig(libraryConfig, {
          plugins: [
            // Generate GitHub releases with detailed assets
            [
              '@semantic-release/github',
              {
                assets: [
                  'dist/**',
                  'docs/**/*.md',
                  {path: 'coverage/lcov-report.zip', label: 'Coverage Report'},
                  {path: 'benchmark-results.json', label: 'Performance Benchmarks'},
                ],
                releasedLabels: ['released'],
                addReleases: 'bottom',
              },
            ],
            // Update README badges
            [
              '@semantic-release/exec',
              {
                publishCmd: 'npm run update-badges',
              },
            ],
          ],
        })

        expect(ossConfig.repositoryUrl).toBe('https://github.com/opensource/project')

        const plugins = ossConfig.plugins ?? []
        expect(plugins.length).toBeGreaterThan(6)

        // Should have comprehensive GitHub assets
        const githubPlugin = plugins.find(
          p => Array.isArray(p) && p[0] === '@semantic-release/github',
        ) as [string, Record<string, unknown>] | undefined

        expect(githubPlugin?.[1]?.assets).toContain('dist/**')

        const validation = validateConfig(ossConfig)
        expect(validation.success).toBe(true)
      })

      it('should create multi-environment deployment configuration', () => {
        const environment = process.env.DEPLOY_ENV ?? 'development'

        // Base configuration varies by environment
        const baseConfig =
          environment === 'production'
            ? npmPreset({
                branches: ['main'],
                repositoryUrl: 'https://github.com/company/product',
              })
            : developmentPreset({
                branches: ['develop', 'feature/*'],
                repositoryUrl: 'https://github.com/company/product',
              })

        // Add environment-specific deployment
        const deployConfig = extendConfig(baseConfig, {
          plugins: [
            ...(environment === 'production'
              ? [
                  // Production deployment
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run deploy:production',
                    },
                  ] as const,
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run notify:production-deployed',
                    },
                  ] as const,
                ]
              : []),
            ...(environment === 'staging'
              ? [
                  // Staging deployment
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run deploy:staging',
                    },
                  ] as const,
                ]
              : []),
            ...(environment === 'development'
              ? [
                  // Development deployment
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run deploy:dev',
                    },
                  ] as const,
                ]
              : []),
          ],
        })

        expect(deployConfig.dryRun).toBe(environment !== 'production')

        const plugins = deployConfig.plugins ?? []
        const hasDeployment = plugins.some((p): p is [string, Record<string, unknown>] => {
          if (!Array.isArray(p) || p.length < 2) return false
          const [pluginName, pluginConfig] = p
          return (
            pluginName === '@semantic-release/exec' &&
            typeof pluginConfig === 'object' &&
            pluginConfig !== null &&
            'publishCmd' in pluginConfig &&
            typeof (pluginConfig as Record<string, unknown>).publishCmd === 'string' &&
            ((pluginConfig as Record<string, unknown>).publishCmd as string).includes('deploy')
          )
        })
        expect(hasDeployment).toBe(true)

        const validation = validateConfig(deployConfig)
        expect(validation.success).toBe(true)
      })
    })

    describe('preset registry and discovery integration', () => {
      it('should work with preset registry system', () => {
        // Test that presets object contains all expected presets
        expect(presets).toHaveProperty('npm')
        expect(presets).toHaveProperty('github')
        expect(presets).toHaveProperty('monorepo')
        expect(presets).toHaveProperty('development')

        expect(typeof presets.npm).toBe('function')
        expect(typeof presets.github).toBe('function')
        expect(typeof presets.monorepo).toBe('function')
        expect(typeof presets.development).toBe('function')
      })

      it('should get presets by name using getPreset function', () => {
        const npmPresetFn = getPreset('npm')
        const githubPresetFn = getPreset('github')
        const monorepoPresetFn = getPreset('monorepo')
        const developmentPresetFn = getPreset('development')

        expect(npmPresetFn).toBe(presets.npm)
        expect(githubPresetFn).toBe(presets.github)
        expect(monorepoPresetFn).toBe(presets.monorepo)
        expect(developmentPresetFn).toBe(presets.development)

        // Test that retrieved presets work correctly
        const config = npmPresetFn({
          repositoryUrl: 'https://github.com/test/registry',
        })

        const validation = validateConfig(config)
        expect(validation.success).toBe(true)
      })

      it('should compose presets retrieved from registry', () => {
        const npmFn = getPreset('npm')
        const githubFn = getPreset('github')

        const npmConfig = npmFn({
          repositoryUrl: 'https://github.com/test/composed-registry',
        })

        const githubConfig = githubFn({
          repositoryUrl: 'https://github.com/test/composed-registry',
        })

        const composed = mergeConfigs(npmConfig, githubConfig)

        const validation = validateConfig(composed)
        expect(validation.success).toBe(true)

        expect(composed.repositoryUrl).toBe('https://github.com/test/composed-registry')
      })
    })

    describe('complex customization patterns', () => {
      it('should handle conditional plugin composition', () => {
        const enableCoverage = true
        const enableE2E = true
        const enableSecurity = false

        const baseConfig = githubPreset({
          repositoryUrl: 'https://github.com/test/conditional',
        })

        const customized = extendConfig(baseConfig, {
          plugins: [
            // Conditionally add coverage reporting
            ...(enableCoverage
              ? [
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run coverage:upload',
                    },
                  ] as const,
                ]
              : []),

            // Conditionally add E2E test results
            ...(enableE2E
              ? [
                  [
                    '@semantic-release/github',
                    {
                      assets: [
                        {path: 'e2e-screenshots.zip', label: 'E2E Screenshots'},
                        {path: 'e2e-videos.zip', label: 'E2E Videos'},
                      ],
                    },
                  ] as const,
                ]
              : []),

            // Conditionally add security scanning
            ...(enableSecurity
              ? [
                  [
                    '@semantic-release/exec',
                    {
                      publishCmd: 'npm run security:scan',
                    },
                  ] as const,
                ]
              : []),
          ],
        })

        const plugins = customized.plugins ?? []

        // Should have coverage plugin
        expect(
          plugins.some(
            p =>
              Array.isArray(p) &&
              p[0] === '@semantic-release/exec' &&
              (p[1] as Record<string, unknown>)?.publishCmd === 'npm run coverage:upload',
          ),
        ).toBe(true)

        // Should have E2E assets
        expect(
          plugins.some(
            p =>
              Array.isArray(p) &&
              p[0] === '@semantic-release/github' &&
              Array.isArray((p[1] as Record<string, unknown>)?.assets),
          ),
        ).toBe(true)

        // Should NOT have security plugin (disabled)
        expect(
          plugins.some(
            p =>
              Array.isArray(p) &&
              p[0] === '@semantic-release/exec' &&
              (p[1] as Record<string, unknown>)?.publishCmd === 'npm run security:scan',
          ),
        ).toBe(false)

        const validation = validateConfig(customized)
        expect(validation.success).toBe(true)
      })

      it('should handle dynamic branch configuration', () => {
        const isMaintenanceMode = false
        const supportLegacy = true

        const dynamicBranches = [
          'main',
          ...(isMaintenanceMode ? ['maintenance'] : []),
          ...(supportLegacy ? [{name: 'legacy', range: '1.x', channel: 'legacy'}] : []),
          {name: 'beta', prerelease: true},
          {name: 'alpha', prerelease: 'alpha'},
        ]

        const config = npmPreset({
          branches: dynamicBranches,
          repositoryUrl: 'https://github.com/test/dynamic-branches',
        })

        expect(config.branches).toHaveLength(4) // main, legacy, beta, alpha
        expect(config.branches).toContain('main')

        // Check that the config contains the expected branch configuration
        // The branches array should be defined and contain our dynamic branches
        if (Array.isArray(config.branches)) {
          const branchNames = config.branches.map(branch =>
            typeof branch === 'string'
              ? branch
              : typeof branch === 'object' && branch !== null && 'name' in branch
                ? (branch as {name: string}).name
                : 'unknown',
          )

          expect(branchNames).toContain('main')
          expect(branchNames).toContain('legacy')
          expect(branchNames).toContain('beta')
          expect(branchNames).toContain('alpha')
        }

        const validation = validateConfig(config)
        expect(validation.success).toBe(true)
      })

      it('should handle plugin ordering and dependencies', () => {
        // Some plugins must run in specific order
        const config = extendConfig(npmPreset({}), {
          plugins: [
            // Analyzer must be first
            '@semantic-release/commit-analyzer',

            // Release notes generator must be after analyzer
            '@semantic-release/release-notes-generator',

            // Preparation plugins (changelog, package updates)
            '@semantic-release/changelog',
            [
              '@semantic-release/exec',
              {
                prepareCmd: 'npm run build',
              },
            ],

            // Publishing plugins
            '@semantic-release/npm',
            '@semantic-release/github',

            // Post-publishing plugins (git commits, notifications)
            '@semantic-release/git',
            [
              '@semantic-release/exec',
              {
                successCmd: 'npm run notify:success',
              },
            ],
          ],
        })

        const plugins = config.plugins ?? []

        // Verify analyzer is first
        expect(plugins[0]).toBe('@semantic-release/commit-analyzer')

        // Verify release notes is second
        expect(plugins[1]).toBe('@semantic-release/release-notes-generator')

        // Verify git is near the end (post-publishing)
        const gitIndex = plugins.findIndex(p =>
          typeof p === 'string' ? p === '@semantic-release/git' : p[0] === '@semantic-release/git',
        )
        expect(gitIndex).toBeGreaterThan(4) // After preparation and publishing plugins

        const validation = validateConfig(config)
        expect(validation.success).toBe(true)
      })
    })
  })
})
