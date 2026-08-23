import {describe, expect, it} from 'vitest'
import {unicorn} from '../src/configs/unicorn'
import {defineConfig} from '../src/define-config'
import {GLOB_JS, GLOB_JSX, GLOB_SRC} from '../src/globs'

describe('unicorn', () => {
  it('only applies rules to source files', async () => {
    const [config] = await unicorn()

    expect(config?.files).toEqual([GLOB_SRC])
  })

  it('does not configure TypeScript files when TypeScript is disabled', async () => {
    const config = await defineConfig({prettier: false, typescript: false})
    const unicornConfig = config.find(({name}) => name === '@bfra.me/unicorn')

    expect(unicornConfig?.files).toEqual([GLOB_JS, GLOB_JSX])
  }, 30_000)
})
