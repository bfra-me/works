import fs from 'node:fs/promises'
import {builtinRules} from 'eslint/use-at-your-own-risk'
import {composer} from 'eslint-flat-config-utils'
import {flatConfigsToRulesDTS} from 'eslint-typegen/core'
import type vitest from '@vitest/eslint-plugin'
import {defineConfig} from '../src/define-config'

let configs = await defineConfig({
  plugins: {
    '': {
      rules: Object.fromEntries(builtinRules.entries()),
    },
  },
  vitest: true,
})

// TODO: The `vitest/valid-title` rule breaks the generated types if saved as a .ts instead of a .d.ts file.
// HACK: Remove the rule before passing the config to the type generator.
configs = await composer(configs).override('@bfra.me/vitest/plugin', config => {
  const {
    plugins: {vitest: vitestPlugin},
  } = config as {plugins: {vitest: typeof vitest}}
  if (vitestPlugin.rules && 'valid-title' in vitestPlugin.rules) {
    delete (vitestPlugin.rules as {[key: string]: unknown})['valid-title']
  }
  return config
})

let dts = await flatConfigsToRulesDTS(configs, {
  exportTypeName: 'Rules',
  includeAugmentation: false,
  includeIgnoreComments: false,
})

const configNames = configs.map(config => config.name).filter(Boolean) as string[]

dts =
  `// This file is generated by scripts/generate-types.ts
// Do not edit this file directly.

/* eslint-disable */
` +
  dts +
  `

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

export type * from './define-config'

`

await fs.writeFile('src/types.ts', dts)