import {describe, expectTypeOf, test} from 'vitest'
import {defineConfig} from '@bfra.me/semantic-release'
import type {SemanticReleaseConfig} from '@bfra.me/semantic-release'

describe('defineConfig', {}, () => {
  test('minimal config', () => {
    const config = defineConfig({
      branches: 'main',
    })
    expectTypeOf(config).toEqualTypeOf<SemanticReleaseConfig>()
  })
})
