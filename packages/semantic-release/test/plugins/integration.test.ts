/**
 * Integration tests for all supported plugin configurations.
 *
 * This test suite validates that plugin config      // Validate release rule structure
      const rules = configObj.releaseRules
      if (rules) {
        expect(rules).toHaveLength(3)
        expect(rules[0]).toMatchObject({
          type: 'docs',
          scope: 'README',
          release: 'patch'
        })
        expect(rules[1]).toMatchObject({
          type: 'refactor',
          release: 'patch'
        })
        expect(rules[2]).toMatchObject({
          scope: 'no-release',
          release: false
        })
      }orrectly with semantic-release
 * by testing real-world scenarios using fixture-based testing approach.
 */

import type {
  ChangelogConfig,
  CommitAnalyzerConfig,
  GitConfig,
  GithubConfig,
  NpmConfig,
  ReleaseNotesGeneratorConfig,
} from '../../src/types/index.js'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {defineConfig} from '../../src/config/define-config.js'
import {
  changelog,
  commitAnalyzer,
  git,
  github,
  npm,
  releaseNotesGenerator,
} from '../../src/config/helpers.js'
import {setupFixtures, teardownFixtures, testUtils} from '../test-utils.js'

// Type definition for plugin configurations fixture
interface PluginConfigsFixture {
  'commit-analyzer': {
    basic: CommitAnalyzerConfig
    'with-custom-rules': CommitAnalyzerConfig
    'with-parser-opts': CommitAnalyzerConfig
  }
  'release-notes-generator': {
    basic: ReleaseNotesGeneratorConfig
    'with-writer-opts': ReleaseNotesGeneratorConfig
    'conventional-commits': ReleaseNotesGeneratorConfig
  }
  changelog: {
    basic: ChangelogConfig
    'custom-file': ChangelogConfig
    'custom-title': ChangelogConfig
  }
  npm: {
    basic: NpmConfig
    'with-tarball': NpmConfig
    monorepo: NpmConfig
    'no-publish': NpmConfig
  }
  github: {
    basic: GithubConfig
    'with-assets': GithubConfig
    'with-labels': GithubConfig
    'draft-releases': GithubConfig
  }
  git: {
    basic: GitConfig
    'custom-message': GitConfig
    monorepo: GitConfig
  }
}

// Setup and teardown
beforeAll(() => {
  setupFixtures()
})

afterAll(() => {
  teardownFixtures()
})

describe('plugin integration tests', () => {
  let pluginConfigs: PluginConfigsFixture

  beforeAll(() => {
    // Load all plugin configurations from fixtures
    pluginConfigs = testUtils.loadJsonFixture<PluginConfigsFixture>(
      'input',
      'plugins',
      'plugin-configs.json',
    )
  })

  describe('@semantic-release/commit-analyzer integration', () => {
    it('should handle basic preset configuration', () => {
      const config = pluginConfigs['commit-analyzer'].basic
      const plugin = commitAnalyzer(config)

      expect(plugin).toEqual([
        '@semantic-release/commit-analyzer',
        {
          preset: 'angular',
        },
      ])

      // Test with full semantic-release configuration
      const semanticConfig = defineConfig({
        plugins: [plugin],
      })

      expect(semanticConfig.plugins).toBeDefined()
      expect(semanticConfig.plugins).toHaveLength(1)
      expect(semanticConfig.plugins?.[0]).toEqual(plugin)
    })

    it('should handle custom rules configuration', () => {
      const config = pluginConfigs['commit-analyzer']['with-custom-rules']
      const plugin = commitAnalyzer(config)

      expect(plugin[1]).toHaveProperty('preset', 'angular')
      expect(plugin[1]).toHaveProperty('releaseRules')

      const configObj = plugin[1] as CommitAnalyzerConfig
      expect(configObj.releaseRules).toHaveLength(3)

      // Validate release rule structure
      const rules = configObj.releaseRules!
      expect(rules[0]).toMatchObject({
        type: 'docs',
        scope: 'README',
        release: 'patch',
      })
      expect(rules[1]).toMatchObject({
        type: 'refactor',
        release: 'patch',
      })
      expect(rules[2]).toMatchObject({
        scope: 'no-release',
        release: false,
      })
    })

    it('should handle parser options configuration', () => {
      const config = pluginConfigs['commit-analyzer']['with-parser-opts']
      const plugin = commitAnalyzer(config)

      expect(plugin[1]).toHaveProperty('parserOpts')
      const configObj = plugin[1] as CommitAnalyzerConfig
      const parserOpts = configObj.parserOpts!
      expect(parserOpts).toHaveProperty('noteKeywords')
      expect(parserOpts.noteKeywords).toEqual(['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING'])
      expect(parserOpts).toHaveProperty('headerPattern')
      expect(parserOpts).toHaveProperty('headerCorrespondence')
    })

    it('should integrate with full semantic-release workflow', () => {
      const configs = [
        pluginConfigs['commit-analyzer'].basic,
        pluginConfigs['commit-analyzer']['with-custom-rules'],
        pluginConfigs['commit-analyzer']['with-parser-opts'],
      ]

      for (const config of configs) {
        const fullConfig = defineConfig({
          branches: ['main'],
          plugins: [commitAnalyzer(config), releaseNotesGenerator(), npm(), github()],
        })

        expect(fullConfig).toMatchObject({
          branches: ['main'],
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          plugins: expect.arrayContaining([
            expect.arrayContaining(['@semantic-release/commit-analyzer']),
          ]),
        })
      }
    })
  })

  describe('@semantic-release/release-notes-generator integration', () => {
    it('should handle basic preset configuration', () => {
      const config = pluginConfigs['release-notes-generator'].basic
      const plugin = releaseNotesGenerator(config)

      expect(plugin).toEqual([
        '@semantic-release/release-notes-generator',
        {
          preset: 'angular',
        },
      ])
    })

    it('should handle writer options configuration', () => {
      const config = pluginConfigs['release-notes-generator']['with-writer-opts']
      const plugin = releaseNotesGenerator(config)

      expect(plugin[1]).toHaveProperty('writerOpts')
      const configObj = plugin[1] as ReleaseNotesGeneratorConfig
      const writerOpts = configObj.writerOpts!
      expect(writerOpts).toMatchObject({
        commitsSort: ['subject', 'scope'],
        noteGroupsSort: 'title',
        notesSort: 'text',
      })
    })

    it('should handle conventional commits preset', () => {
      const config = pluginConfigs['release-notes-generator']['conventional-commits']
      const plugin = releaseNotesGenerator(config)

      expect(plugin[1]).toHaveProperty('preset', 'conventionalcommits')
      expect(plugin[1]).toHaveProperty('presetConfig')

      const configObj = plugin[1] as ReleaseNotesGeneratorConfig
      const presetConfig = configObj.presetConfig!
      expect(presetConfig).toHaveProperty('types')
      expect(Array.isArray(presetConfig.types)).toBe(true)
      expect(presetConfig.types).toHaveLength(9)

      // Validate type structure
      const types = presetConfig.types as {type: string; section: string}[]
      const featType = types.find(t => t.type === 'feat')
      expect(featType).toMatchObject({
        type: 'feat',
        section: 'Features',
      })
    })

    it('should work with commit-analyzer in full workflow', () => {
      const analyzerConfig = pluginConfigs['commit-analyzer'].basic
      const notesConfig = pluginConfigs['release-notes-generator']['conventional-commits']

      const fullConfig = defineConfig({
        branches: ['main', 'next'],
        plugins: [
          commitAnalyzer(analyzerConfig),
          releaseNotesGenerator(notesConfig),
          changelog(),
          npm(),
          github(),
        ],
      })

      expect(fullConfig.plugins).toHaveLength(5)
      expect(fullConfig.plugins?.[0]).toEqual(['@semantic-release/commit-analyzer', analyzerConfig])
      expect(fullConfig.plugins?.[1]).toEqual([
        '@semantic-release/release-notes-generator',
        notesConfig,
      ])
    })
  })

  describe('@semantic-release/changelog integration', () => {
    it('should handle basic configuration', () => {
      const config = pluginConfigs.changelog.basic
      const plugin = changelog(config)

      expect(plugin).toEqual([
        '@semantic-release/changelog',
        {
          changelogFile: 'CHANGELOG.md',
        },
      ])
    })

    it('should handle custom file configuration', () => {
      const config = pluginConfigs.changelog['custom-file']
      const plugin = changelog(config)

      expect(plugin[1]).toMatchObject({
        changelogFile: 'HISTORY.md',
      })
    })

    it('should handle custom title configuration', () => {
      const config = pluginConfigs.changelog['custom-title']
      const plugin = changelog(config)

      expect(plugin[1]).toMatchObject({
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Release Notes',
      })
    })

    it('should integrate with git plugin for committing changelog', () => {
      const changelogConfig = pluginConfigs.changelog.basic
      const gitConfig = pluginConfigs.git.basic

      const fullConfig = defineConfig({
        plugins: [
          commitAnalyzer(),
          releaseNotesGenerator(),
          changelog(changelogConfig),
          npm(),
          git(gitConfig),
          github(),
        ],
      })

      // Verify changelog is before git plugin for proper file generation
      const plugins = fullConfig.plugins
      const changelogIndex = plugins.findIndex(
        p => Array.isArray(p) && p[0] === '@semantic-release/changelog',
      )
      const gitIndex = plugins.findIndex(p => Array.isArray(p) && p[0] === '@semantic-release/git')

      expect(changelogIndex).toBeLessThan(gitIndex)
    })
  })

  describe('@semantic-release/npm integration', () => {
    it('should handle basic publish configuration', () => {
      const config = pluginConfigs.npm.basic
      const plugin = npm(config)

      expect(plugin).toEqual([
        '@semantic-release/npm',
        {
          npmPublish: true,
        },
      ])
    })

    it('should handle tarball directory configuration', () => {
      const config = pluginConfigs.npm['with-tarball']
      const plugin = npm(config)

      expect(plugin[1]).toMatchObject({
        npmPublish: true,
        tarballDir: 'dist',
      })
    })

    it('should handle monorepo configuration', () => {
      const config = pluginConfigs.npm.monorepo
      const plugin = npm(config)

      expect(plugin[1]).toMatchObject({
        npmPublish: true,
        pkgRoot: './packages/core',
      })
    })

    it('should handle no-publish configuration', () => {
      const config = pluginConfigs.npm['no-publish']
      const plugin = npm(config)

      expect(plugin[1]).toMatchObject({
        npmPublish: false,
      })
    })

    it('should work in different workflow contexts', () => {
      // Library workflow
      const libraryConfig = defineConfig({
        branches: ['main'],
        plugins: [
          commitAnalyzer(),
          releaseNotesGenerator(),
          changelog(),
          npm(pluginConfigs.npm.basic),
          github(),
        ],
      })

      // Monorepo workflow
      const monorepoConfig = defineConfig({
        branches: ['main'],
        plugins: [
          commitAnalyzer(),
          releaseNotesGenerator(),
          npm(pluginConfigs.npm.monorepo),
          git(),
          github(),
        ],
      })

      expect(libraryConfig.plugins).toBeDefined()
      expect(monorepoConfig.plugins).toBeDefined()

      const libraryNpm = libraryConfig.plugins.find(
        p => Array.isArray(p) && p[0] === '@semantic-release/npm',
      )
      const monorepoNpm = monorepoConfig.plugins.find(
        p => Array.isArray(p) && p[0] === '@semantic-release/npm',
      )

      expect(libraryNpm).toBeDefined()
      expect(monorepoNpm).toBeDefined()
      expect((libraryNpm as [string, NpmConfig])[1].npmPublish).toBe(true)
      expect((monorepoNpm as [string, NpmConfig])[1].pkgRoot).toBe('./packages/core')
    })
  })

  describe('@semantic-release/github integration', () => {
    it('should handle basic configuration', () => {
      const config = pluginConfigs.github.basic
      const plugin = github(config)

      expect(plugin).toEqual(['@semantic-release/github', {}])
    })

    it('should handle assets configuration', () => {
      const config = pluginConfigs.github['with-assets']
      const plugin = github(config)

      expect(plugin[1]).toHaveProperty('assets')
      const configObj = plugin[1] as GithubConfig
      const assets = configObj.assets!
      expect(assets).toHaveLength(2)
      expect(assets[0]).toMatchObject({
        path: 'dist/*.tgz',
        label: 'NPM Package',
      })
      expect(assets[1]).toMatchObject({
        path: 'dist/*.zip',
        label: 'Archive',
      })
    })

    it('should handle labels and assignees configuration', () => {
      const config = pluginConfigs.github['with-labels']
      const plugin = github(config)

      expect(plugin[1]).toMatchObject({
        labels: ['released'],
        assignees: ['@semantic-release-bot'],
      })
    })

    it('should handle draft releases configuration', () => {
      const config = pluginConfigs.github['draft-releases']
      const plugin = github(config)

      expect(plugin[1]).toMatchObject({
        releasedLabels: ['released'],
        addReleases: 'bottom',
      })
    })

    it('should work in complete release workflow', () => {
      const fullConfig = defineConfig({
        branches: ['main', 'next', {name: 'beta', prerelease: true}],
        plugins: [
          commitAnalyzer(),
          releaseNotesGenerator(),
          changelog(),
          npm(),
          github(pluginConfigs.github['with-assets']),
          git(),
        ],
      })

      // Verify GitHub plugin comes after npm for proper asset handling
      const plugins = fullConfig.plugins
      const npmIndex = plugins.findIndex(p =>
        Array.isArray(p) ? p[0] === '@semantic-release/npm' : p === '@semantic-release/npm',
      )
      const githubIndex = plugins.findIndex(
        p => Array.isArray(p) && p[0] === '@semantic-release/github',
      )

      expect(npmIndex).toBeLessThan(githubIndex)
    })
  })

  describe('@semantic-release/git integration', () => {
    it('should handle basic assets configuration', () => {
      const config = pluginConfigs.git.basic
      const plugin = git(config)

      expect(plugin).toEqual([
        '@semantic-release/git',
        {
          assets: ['CHANGELOG.md', 'package.json'],
        },
      ])
    })

    it('should handle custom commit message configuration', () => {
      const config = pluginConfigs.git['custom-message']
      const plugin = git(config)

      expect(plugin[1]).toMatchObject({
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        // eslint-disable-next-line no-template-curly-in-string
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      })
    })

    it('should handle monorepo configuration', () => {
      const config = pluginConfigs.git.monorepo
      const plugin = git(config)

      expect(plugin[1]).toMatchObject({
        assets: ['packages/*/CHANGELOG.md', 'packages/*/package.json'],
        // eslint-disable-next-line no-template-curly-in-string
        message: 'chore(release): ${nextRelease.name}@${nextRelease.version} [skip ci]',
      })
    })

    it('should be properly ordered in workflow', () => {
      const fullConfig = defineConfig({
        plugins: [
          commitAnalyzer(),
          releaseNotesGenerator(),
          changelog(),
          npm(),
          github(),
          git(pluginConfigs.git['custom-message']),
        ],
      })

      // Git should be last to commit all generated files
      const plugins = fullConfig.plugins
      const gitIndex = plugins.findIndex(p => Array.isArray(p) && p[0] === '@semantic-release/git')

      expect(gitIndex).toBe(plugins.length - 1)
    })
  })

  describe('multi-plugin integration scenarios', () => {
    it('should handle standard library release workflow', () => {
      const config = defineConfig({
        branches: ['main'],
        plugins: [
          commitAnalyzer(pluginConfigs['commit-analyzer'].basic),
          releaseNotesGenerator(pluginConfigs['release-notes-generator'].basic),
          changelog(pluginConfigs.changelog.basic),
          npm(pluginConfigs.npm.basic),
          github(pluginConfigs.github.basic),
          git(pluginConfigs.git.basic),
        ],
      })

      expect(config.plugins).toHaveLength(6)

      // Verify proper plugin ordering
      const pluginNames = (config.plugins as (string | [string, unknown])[]).map(p =>
        Array.isArray(p) ? p[0] : p,
      )

      expect(pluginNames).toEqual([
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog',
        '@semantic-release/npm',
        '@semantic-release/github',
        '@semantic-release/git',
      ])
    })

    it('should handle monorepo release workflow', () => {
      const config = defineConfig({
        branches: ['main', 'next'],
        plugins: [
          commitAnalyzer(pluginConfigs['commit-analyzer']['with-custom-rules']),
          releaseNotesGenerator(pluginConfigs['release-notes-generator']['conventional-commits']),
          npm(pluginConfigs.npm.monorepo),
          github(pluginConfigs.github['with-labels']),
          git(pluginConfigs.git.monorepo),
        ],
      })

      expect(config.plugins).toHaveLength(5)
      expect(config.branches).toEqual(['main', 'next'])

      // Verify monorepo-specific configurations
      const npmConfig = config.plugins.find(
        p => Array.isArray(p) && p[0] === '@semantic-release/npm',
      ) as [string, NpmConfig]

      const gitConfig = config.plugins.find(
        p => Array.isArray(p) && p[0] === '@semantic-release/git',
      ) as [string, GitConfig]

      expect(npmConfig[1].pkgRoot).toBe('./packages/core')
      // eslint-disable-next-line no-template-curly-in-string
      expect(gitConfig[1].message).toContain('${nextRelease.name}@${nextRelease.version}')
    })

    it('should handle private package workflow', () => {
      const config = defineConfig({
        branches: ['main'],
        plugins: [
          commitAnalyzer(),
          releaseNotesGenerator(),
          changelog(),
          npm(pluginConfigs.npm['no-publish']),
          github(pluginConfigs.github['with-assets']),
          git(),
        ],
      })

      const npmConfig = config.plugins.find(
        p => Array.isArray(p) && p[0] === '@semantic-release/npm',
      ) as [string, NpmConfig]

      expect(npmConfig[1].npmPublish).toBe(false)
    })

    it('should validate plugin configuration consistency', () => {
      // Test that all configurations are valid semantic-release configs
      const testConfigs = [
        defineConfig({
          plugins: [
            commitAnalyzer(pluginConfigs['commit-analyzer'].basic),
            releaseNotesGenerator(pluginConfigs['release-notes-generator'].basic),
          ],
        }),
        defineConfig({
          plugins: [
            changelog(pluginConfigs.changelog['custom-title']),
            git(pluginConfigs.git['custom-message']),
          ],
        }),
        defineConfig({
          plugins: [
            npm(pluginConfigs.npm['with-tarball']),
            github(pluginConfigs.github['draft-releases']),
          ],
        }),
      ]

      for (const config of testConfigs) {
        expect(testUtils.isValidSemanticReleaseConfig(config)).toBe(true)
      }
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle empty plugin configurations gracefully', () => {
      const plugins = [
        commitAnalyzer(),
        releaseNotesGenerator(),
        changelog(),
        npm(),
        github(),
        git(),
      ]

      for (const plugin of plugins) {
        expect(typeof plugin === 'string' || Array.isArray(plugin)).toBe(true)
        if (Array.isArray(plugin)) {
          expect(plugin).toHaveLength(2)
          expect(typeof plugin[0]).toBe('string')
          expect(typeof plugin[1]).toBe('object')
        }
      }
    })

    it('should validate plugin configurations types', () => {
      // Test type safety at runtime
      const configs = [
        () => commitAnalyzer({preset: 'angular'}),
        () => releaseNotesGenerator({preset: 'conventionalcommits'}),
        () => changelog({changelogFile: 'CHANGELOG.md'}),
        () => npm({npmPublish: true}),
        () => github({assets: []}),
        () => git({assets: ['package.json']}),
      ]

      for (const configFn of configs) {
        expect(() => configFn()).not.toThrow()
      }
    })

    it('should handle malformed fixture data gracefully', () => {
      // Test with minimal valid configurations
      const minimalConfig = defineConfig({
        plugins: [
          '@semantic-release/commit-analyzer',
          '@semantic-release/release-notes-generator',
          '@semantic-release/npm',
        ],
      })

      expect(testUtils.isValidSemanticReleaseConfig(minimalConfig)).toBe(true)
    })
  })
})
