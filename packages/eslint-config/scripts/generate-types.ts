import fs from 'node:fs/promises'
import {builtinRules} from 'eslint/use-at-your-own-risk'
import {flatConfigsToRulesDTS} from 'eslint-typegen/core'
import {defineConfig} from '../src/define-config'

const configs = await defineConfig({
  plugins: {
    '': {
      rules: Object.fromEntries(builtinRules.entries()),
    },
  },
}).toConfigs()

let dts = await flatConfigsToRulesDTS(configs, {
  exportTypeName: 'Rules',
  includeAugmentation: false,
})

const configNames = configs.map(config => config.name).filter(Boolean) as string[]

dts += `

/**
 * Each configuration object contains all of the information ESLint needs to execute on a set of files.
 * @see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
 */
export type Config = Linter.Config<Linter.RulesRecord & Rules>

/**
 * Contains the names of all the configurations in this package.
 */
export type ConfigNames = ${configNames.length > 0 ? configNames.map(name => `'${name}'`).join(' | ') : 'never'}

import type {FlatConfigComposer} from 'eslint-flat-config-utils'
export type ComposableConfig = FlatConfigComposer<Config, ConfigNames>

`

await fs.writeFile('src/types.ts', dts)
