import fs from 'node:fs/promises'
import {builtinRules} from 'eslint/use-at-your-own-risk'
import {concat} from 'eslint-flat-config-utils'
import {flatConfigsToRulesDTS} from 'eslint-typegen/core'
import {ignores, typescript} from '../src/configs'

const configs = await concat(
  {
    plugins: {
      '': {
        rules: Object.fromEntries(builtinRules.entries()),
      },
    },
  },
  ignores(),
  typescript(),
)

let dts = await flatConfigsToRulesDTS(configs, {
  exportTypeName: 'Rules',
  includeAugmentation: false,
})

const configNames = configs.map(config => config.name).filter(Boolean) as string[]

dts += `

import type {FlatConfigComposer} from 'eslint-flat-config-utils'
export type {Awaitable} from 'eslint-flat-config-utils'

/**
 * Each configuration object contains all of the information ESLint needs to execute on a set of files.
 * @see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
 */
export type Config = Linter.Config<Linter.RulesRecord & Rules>

/**
 * Contains the names of all the configurations in this package.
 */
export type ConfigNames = ${configNames.length > 0 ? configNames.map(name => `'${name}'`).join(' | ') : 'never'}

export type ComposableConfig = FlatConfigComposer<Config, ConfigNames>

export type * from './define-config'

`

await fs.writeFile('src/types.ts', dts)
