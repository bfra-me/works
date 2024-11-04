import fs from 'node:fs/promises'
import {builtinRules} from 'eslint/use-at-your-own-risk'
import {composer} from 'eslint-flat-config-utils'
import {flatConfigsToRulesDTS} from 'eslint-typegen/core'
import type vitest from '@vitest/eslint-plugin'
import {defineConfig} from '../src/define-config'

const configs = await composer(
  defineConfig({
    plugins: {
      '': {
        rules: Object.fromEntries(builtinRules),
      },
    },
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    vitest: true,
  }),
  // TODO: The `vitest/valid-title` rule breaks the generated types if saved as a .ts instead of a .d.ts file.
).override('@bfra.me/vitest/plugin', config => {
  const {
    plugins: {vitest: vitestPlugin},
  } = config as {plugins: {vitest: typeof vitest}}
  if (vitestPlugin.rules && 'valid-title' in vitestPlugin.rules) {
    // HACK: Remove the rule before passing the config to the type generator.
    delete (vitestPlugin.rules as {[key: string]: unknown})['valid-title']
  }
  return config
})

const rulesTypeName = 'Rules'
const configNames = configs.map(config => config.name).filter(Boolean) as string[]

let dts = await flatConfigsToRulesDTS(configs, {
  exportTypeName: rulesTypeName,
  includeAugmentation: false,
  includeIgnoreComments: false,
})

dts =
  `// This file is generated by scripts/generate-types.ts
// Do not edit this file directly.

/* eslint-disable */

import type {FlatConfigComposer, ResolvableFlatConfig} from 'eslint-flat-config-utils'
export type {Arrayable, Awaitable, FlatConfigComposer, ResolvableFlatConfig} from 'eslint-flat-config-utils'
export type * from './define-config'
` +
  dts +
  `

/**
 * Represents a value that resolves to one or more ESLint flat configurations.
 * @see https://jsr.io/@antfu/eslint-flat-config-utils/doc/~/ResolvableFlatConfig
 */
export type AwaitableFlatConfig = ResolvableFlatConfig<Config>

/**
 * Represents the configuration for the linter.
 * This interface extends the {@link Linter.Config} interface, expanding {@link Rules} to include the rules defined in all configurations.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
 */
export interface Config extends Linter.Config<Linter.RulesRecord & ${rulesTypeName}> {}

/**
 * Defines a 'composer' for ESLint flat configurations.
 * @see https://jsr.io/@antfu/eslint-flat-config-utils/doc/~/FlatConfigComposer
 */
export type ConfigComposer = FlatConfigComposer<
  Config,
  ConfigNames
>

/**
 * Defines the names of the available ESLint configurations.
 */
export type ConfigNames = ${configNames.length > 0 ? `\n  ${configNames.map(name => `'${name}'`).join(' |\n  ')}` : 'never'}
`

await fs.writeFile('src/types.ts', dts)
