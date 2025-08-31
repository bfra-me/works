/**
 * @file Tests for type-safe plugin configuration helpers
 */

import {describe, expect, it} from 'vitest'
import {
  changelog,
  commitAnalyzer,
  git,
  github,
  npm,
  pluginPresets,
  releaseNotesGenerator,
} from '../../src/config/helpers.js'

describe('plugin helpers', () => {
  describe('commitAnalyzer', () => {
    it('returns string when no config provided', () => {
      const result = commitAnalyzer()
      expect(result).toBe('@semantic-release/commit-analyzer')
    })

    it('returns tuple when config provided', () => {
      const config = {preset: 'conventionalcommits' as const}
      const result = commitAnalyzer(config)
      expect(result).toEqual(['@semantic-release/commit-analyzer', config])
    })

    it('works with complex config', () => {
      const config = {
        preset: 'conventionalcommits' as const,
        releaseRules: [
          {type: 'docs', scope: 'README', release: 'patch' as const},
          {type: 'refactor', release: 'patch' as const},
        ],
      }
      const result = commitAnalyzer(config)
      expect(result).toEqual(['@semantic-release/commit-analyzer', config])
    })
  })

  describe('releaseNotesGenerator', () => {
    it('returns string when no config provided', () => {
      const result = releaseNotesGenerator()
      expect(result).toBe('@semantic-release/release-notes-generator')
    })

    it('returns tuple when config provided', () => {
      const config = {preset: 'conventionalcommits' as const}
      const result = releaseNotesGenerator(config)
      expect(result).toEqual(['@semantic-release/release-notes-generator', config])
    })

    it('works with preset config', () => {
      const config = {
        preset: 'conventionalcommits' as const,
        presetConfig: {
          types: [
            {type: 'feat', section: 'Features'},
            {type: 'fix', section: 'Bug Fixes'},
          ],
        },
      }
      const result = releaseNotesGenerator(config)
      expect(result).toEqual(['@semantic-release/release-notes-generator', config])
    })
  })

  describe('changelog', () => {
    it('returns string when no config provided', () => {
      const result = changelog()
      expect(result).toBe('@semantic-release/changelog')
    })

    it('returns tuple when config provided', () => {
      const config = {changelogFile: 'CHANGELOG.md'}
      const result = changelog(config)
      expect(result).toEqual(['@semantic-release/changelog', config])
    })
  })

  describe('npm', () => {
    it('returns string when no config provided', () => {
      const result = npm()
      expect(result).toBe('@semantic-release/npm')
    })

    it('returns tuple when config provided', () => {
      const config = {npmPublish: true, access: 'public' as const}
      const result = npm(config)
      expect(result).toEqual(['@semantic-release/npm', config])
    })

    it('works with private package config', () => {
      const config = {npmPublish: true, access: 'restricted' as const}
      const result = npm(config)
      expect(result).toEqual(['@semantic-release/npm', config])
    })
  })

  describe('github', () => {
    it('returns string when no config provided', () => {
      const result = github()
      expect(result).toBe('@semantic-release/github')
    })

    it('returns tuple when config provided', () => {
      const config = {
        // eslint-disable-next-line no-template-curly-in-string
        successComment: 'Released in version ${nextRelease.version}',
      }
      const result = github(config)
      expect(result).toEqual(['@semantic-release/github', config])
    })

    it('works with asset configuration', () => {
      const config = {
        assets: ['dist/**/*.zip'],
      }
      const result = github(config)
      expect(result).toEqual(['@semantic-release/github', config])
    })
  })

  describe('git', () => {
    it('returns string when no config provided', () => {
      const result = git()
      expect(result).toBe('@semantic-release/git')
    })

    it('returns tuple when config provided', () => {
      const config = {
        assets: ['CHANGELOG.md', 'package.json'],
        // eslint-disable-next-line no-template-curly-in-string
        message: 'chore(release): ${nextRelease.version}',
      }
      const result = git(config)
      expect(result).toEqual(['@semantic-release/git', config])
    })
  })

  describe('pluginPresets', () => {
    it('provides standardCommitAnalyzer preset', () => {
      const preset = pluginPresets.standardCommitAnalyzer
      expect(preset).toEqual([
        '@semantic-release/commit-analyzer',
        {
          preset: 'conventionalcommits',
          releaseRules: [
            {type: 'docs', scope: 'README', release: 'patch'},
            {type: 'refactor', release: 'patch'},
            {scope: 'no-release', release: false},
          ],
        },
      ])
    })

    it('provides standardReleaseNotes preset', () => {
      const preset = pluginPresets.standardReleaseNotes
      expect(preset).toEqual([
        '@semantic-release/release-notes-generator',
        {
          preset: 'conventionalcommits',
          presetConfig: {
            types: [
              {type: 'feat', section: 'Features'},
              {type: 'fix', section: 'Bug Fixes'},
              {type: 'perf', section: 'Performance Improvements'},
              {type: 'revert', section: 'Reverts'},
              {type: 'docs', section: 'Documentation', hidden: true},
              {type: 'style', section: 'Styles', hidden: true},
              {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
              {type: 'refactor', section: 'Code Refactoring', hidden: true},
              {type: 'test', section: 'Tests', hidden: true},
              {type: 'build', section: 'Build System', hidden: true},
              {type: 'ci', section: 'Continuous Integration', hidden: true},
            ],
          },
        },
      ])
    })

    it('provides standardChangelog preset', () => {
      const preset = pluginPresets.standardChangelog
      expect(preset).toEqual([
        '@semantic-release/changelog',
        {
          changelogFile: 'CHANGELOG.md',
          changelogTitle: '# Changelog',
        },
      ])
    })

    it('provides npmPublicPackage preset', () => {
      const preset = pluginPresets.npmPublicPackage
      expect(preset).toEqual([
        '@semantic-release/npm',
        {
          npmPublish: true,
          access: 'public',
        },
      ])
    })

    it('provides npmPrivatePackage preset', () => {
      const preset = pluginPresets.npmPrivatePackage
      expect(preset).toEqual([
        '@semantic-release/npm',
        {
          npmPublish: true,
          access: 'restricted',
        },
      ])
    })

    it('provides githubStandard preset', () => {
      const preset = pluginPresets.githubStandard
      expect(preset).toEqual([
        '@semantic-release/github',
        expect.objectContaining({
          // eslint-disable-next-line no-template-curly-in-string
          successComment: expect.stringContaining('${nextRelease.version}') as string,
          // eslint-disable-next-line no-template-curly-in-string
          failComment: expect.stringContaining('${branch.name}') as string,
          // eslint-disable-next-line no-template-curly-in-string
          releasedLabels: ['released<%= nextRelease.channel ? `-\${nextRelease.channel}` : "" %>'],
        }),
      ])
    })

    it('provides gitStandard preset', () => {
      const preset = pluginPresets.gitStandard
      expect(preset).toEqual([
        '@semantic-release/git',
        {
          assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
          // eslint-disable-next-line no-template-curly-in-string
          message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        },
      ])
    })
  })

  describe('type safety', () => {
    it('enforces correct configuration types', () => {
      // This test mainly ensures TypeScript compilation passes
      // with correct types being enforced at compile time

      // Should compile with valid configs
      commitAnalyzer({preset: 'conventionalcommits'})
      releaseNotesGenerator({preset: 'conventionalcommits'})
      changelog({changelogFile: 'CHANGELOG.md'})
      npm({npmPublish: true, access: 'public'})
      github({successComment: 'Success!'})
      git({assets: ['CHANGELOG.md']})

      // Should provide IntelliSense and type checking
      const config = {
        preset: 'conventionalcommits' as const,
        releaseRules: [
          {type: 'feat', release: 'minor' as const},
          {type: 'fix', release: 'patch' as const},
        ],
      }
      const result = commitAnalyzer(config)
      expect(result[0]).toBe('@semantic-release/commit-analyzer')
      expect(result[1]).toBe(config)
    })

    it('allows undefined config for all helpers', () => {
      // All helpers should accept undefined and return string
      expect(commitAnalyzer()).toBe('@semantic-release/commit-analyzer')
      expect(releaseNotesGenerator()).toBe('@semantic-release/release-notes-generator')
      expect(changelog()).toBe('@semantic-release/changelog')
      expect(npm()).toBe('@semantic-release/npm')
      expect(github()).toBe('@semantic-release/github')
      expect(git()).toBe('@semantic-release/git')
    })
  })

  describe('integration with real configurations', () => {
    it('creates valid plugin array for standard setup', () => {
      const plugins = [
        pluginPresets.standardCommitAnalyzer,
        pluginPresets.standardReleaseNotes,
        pluginPresets.standardChangelog,
        pluginPresets.npmPublicPackage,
        pluginPresets.githubStandard,
        pluginPresets.gitStandard,
      ]

      expect(plugins).toHaveLength(6)
      plugins.forEach(plugin => {
        expect(plugin).toSatisfy((p: unknown) => {
          return typeof p === 'string' || (Array.isArray(p) && p.length === 2)
        })
      })
    })

    it('creates valid plugin array with custom configurations', () => {
      const plugins = [
        commitAnalyzer({
          preset: 'conventionalcommits',
          releaseRules: [{type: 'docs', release: 'patch'}],
        }),
        releaseNotesGenerator({preset: 'conventionalcommits'}),
        changelog({changelogFile: 'HISTORY.md'}),
        npm({npmPublish: true, access: 'restricted'}),
        github({assets: ['dist/**']}),
        git({assets: ['HISTORY.md', 'package.json']}),
      ]

      expect(plugins).toHaveLength(6)
      plugins.forEach(plugin => {
        expect(Array.isArray(plugin)).toBe(true)
        expect(plugin).toHaveLength(2)
        expect(typeof plugin[0]).toBe('string')
        expect(typeof plugin[1]).toBe('object')
      })
    })
  })
})
