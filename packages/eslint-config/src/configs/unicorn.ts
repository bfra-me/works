import type {Config} from '../config'
import type {OptionsOverrides} from '../options'
import {unicorn as pluginUnicorn} from '../plugins'

export type UnicornOptions = OptionsOverrides

export async function unicorn(options: UnicornOptions = {}): Promise<Config[]> {
  const {overrides = {}} = options

  return [
    {
      name: '@bfra.me/unicorn',
      plugins: {
        unicorn: pluginUnicorn,
      },
      rules: {
        ...overrides,
      },
    },
  ]
}
