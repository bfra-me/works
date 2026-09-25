import type {SemanticReleaseConfig} from '../src/types.d.ts'
import type {PluginSpec} from '../src/types/plugin-spec.d.ts'
import type {Plugin} from '../src/types/plugin.d.ts'
import {describe, expectTypeOf, test} from 'vitest'

describe('PluginSpec default type parameter', () => {
  test('string-only plugin specs and tuple plugin specs both satisfy PluginSpec', () => {
    const stringSpec: PluginSpec<['@semantic-release/npm', {npmPublish: boolean}]> =
      '@semantic-release/npm'
    const tupleSpec: PluginSpec<['@semantic-release/npm', {npmPublish: boolean}]> = [
      '@semantic-release/npm',
      {npmPublish: false},
    ]

    expectTypeOf(stringSpec).not.toBeNever()
    expectTypeOf(tupleSpec).not.toBeNever()
  })
})

describe('Plugin<TLookup> default resolution', () => {
  test('a known plugin name resolves to a concrete PluginSpec tuple', () => {
    type NpmPlugin = Plugin<'@semantic-release/npm'>

    const known: NpmPlugin = ['@semantic-release/npm', {npmPublish: false}]
    const knownStringForm: NpmPlugin = '@semantic-release/npm'

    expectTypeOf(known).not.toBeNever()
    expectTypeOf(knownStringForm).not.toBeNever()
  })
})

describe('SemanticReleaseConfig (the actual exported, consumer-facing type)', () => {
  test('known semantic-release plugins as plain strings', () => {
    const config: SemanticReleaseConfig = {
      branches: ['main'],
      plugins: ['@semantic-release/npm'],
    }
    expectTypeOf(config).toMatchTypeOf<SemanticReleaseConfig>()
  })

  test('known semantic-release plugins as [name, config] tuples', () => {
    const config: SemanticReleaseConfig = {
      branches: ['main'],
      plugins: [['@semantic-release/npm', {npmPublish: false}]],
    }
    expectTypeOf(config).toMatchTypeOf<SemanticReleaseConfig>()
  })

  test('unknown/third-party plugins as plain strings', () => {
    const config: SemanticReleaseConfig = {
      branches: ['main'],
      plugins: ['some-custom-plugin'],
    }
    expectTypeOf(config).toMatchTypeOf<SemanticReleaseConfig>()
  })

  test('unknown/third-party plugins as [name, arbitraryConfig] tuples', () => {
    const config: SemanticReleaseConfig = {
      branches: ['main'],
      plugins: [['some-custom-plugin', {foo: 'bar', nested: {a: 1}}]],
    }
    expectTypeOf(config).toMatchTypeOf<SemanticReleaseConfig>()
  })

  test('a realistic mixed plugins array', () => {
    const config: SemanticReleaseConfig = {
      branches: ['main'],
      plugins: [
        '@semantic-release/commit-analyzer',
        ['@semantic-release/npm', {npmPublish: true}],
        'some-custom-plugin',
        ['some-custom-plugin', {foo: 'bar'}],
      ],
    }
    expectTypeOf(config).toMatchTypeOf<SemanticReleaseConfig>()
  })
})
