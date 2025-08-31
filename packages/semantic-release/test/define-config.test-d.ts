import {defineConfig} from '@bfra.me/semantic-release'
import {describe, expectTypeOf, test} from 'vitest'

describe('defineConfig', {}, () => {
  test('minimal config', () => {
    const config = defineConfig({
      branches: 'main',
    })
    expectTypeOf(config).toHaveProperty('branches')
    expectTypeOf(config).toBeObject()
  })
})
