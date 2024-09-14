import fs from 'node:fs/promises'
import {builtinRules} from 'eslint/use-at-your-own-risk'
import {flatConfigsToRulesDTS} from 'eslint-typegen/core'
import eslintConfig from '../src'

const configs = [
  ...eslintConfig,
  {
    plugins: {
      '': {
        rules: Object.fromEntries(builtinRules.entries()),
      },
    },
  },
]

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
export type ConfigNames = ${configNames.map(name => `'${name}'`).join(' | ')}

`

await fs.writeFile('src/types.ts', dts)
