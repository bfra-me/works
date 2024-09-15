import {type Awaitable, FlatConfigComposer} from 'eslint-flat-config-utils'
import type {Linter} from 'eslint'
import type {ComposableConfig, Config, ConfigNames} from './types'

export function defineConfig(
  ...userConfigs: Awaitable<Config | Config[] | FlatConfigComposer | Linter.Config[]>[]
): ComposableConfig {
  const configs: Awaitable<Config[]>[] = []
  let composer = new FlatConfigComposer<Config, ConfigNames>().append(
    ...configs,
    ...(userConfigs as any),
  )

  return composer
}
