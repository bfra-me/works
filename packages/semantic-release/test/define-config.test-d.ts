import type {SemanticReleaseConfig} from '@bfra.me/semantic-release'
import {defineConfig} from '@bfra.me/semantic-release'
import {describe, expectTypeOf, test} from 'vitest'

describe('defineConfig', {}, () => {
  test('minimal config', () => {
    const config = defineConfig({
      branches: 'main',
    })
    expectTypeOf(config).toEqualTypeOf<SemanticReleaseConfig>()
  })
})
