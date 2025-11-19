import {describe, expectTypeOf, test} from 'vitest'
import {defineConfig} from '../src'

describe('defineConfig', {}, () => {
  test('minimal config', () => {
    const config = defineConfig({
      branches: 'main',
    })
    expectTypeOf(config).toHaveProperty('branches')
    expectTypeOf(config).toBeObject()
  })
})
