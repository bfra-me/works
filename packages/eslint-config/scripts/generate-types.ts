import fs from 'node:fs/promises'
import {flatConfigsToRulesDTS} from 'eslint-typegen/core'
import {builtinRules} from 'eslint/use-at-your-own-risk'
import {fallback} from '../src/configs'
import {defineConfig} from '../src/define-config'

const configs = await defineConfig(
  {
    plugins: {
      '': {
        rules: Object.fromEntries(builtinRules),
      },
    },
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    vitest: true,
  },
  fallback([]),
)

const rulesTypeName = 'Rules'
const rulesDts = await flatConfigsToRulesDTS(configs, {
  exportTypeName: rulesTypeName,
  includeAugmentation: false,
  includeIgnoreComments: false,
})

const configNames = configs.map(config => config.name).filter(Boolean) as string[]
const configDts = `import type {Linter} from 'eslint'
import type {FlatConfigComposer, ResolvableFlatConfig} from 'eslint-flat-config-utils'
import type {${rulesTypeName}} from './rules'

export type {FlatConfigComposer, ResolvableFlatConfig}

/**
 * Represents the configuration for the linter.
 * This interface extends the {@link Linter.Config} interface, expanding {@link Rules} to include the rules defined in all configurations.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
 */
export interface Config extends Linter.Config<Linter.RulesRecord & ${rulesTypeName}> {}

/**
 * Represents a value that resolves to one or more ESLint flat configurations.
 * @see https://jsr.io/@antfu/eslint-flat-config-utils/doc/~/ResolvableFlatConfig
 */
export type AwaitableFlatConfig = ResolvableFlatConfig<Config>

/**
 * Defines the names of the available ESLint configurations.
 */
export type ConfigNames =${configNames.length > 0 ? `\n  | ${configNames.map(name => `'${name}'`).join('\n  | ')}` : ' never'}

/**
 * Defines a 'composer' for ESLint flat configurations.
 * @see https://jsr.io/@antfu/eslint-flat-config-utils/doc/~/FlatConfigComposer
 */
export type ConfigComposer = FlatConfigComposer<Config, ConfigNames>
`

const preamble = `// This file is generated by scripts/generate-types.ts
// Do not edit this file directly.

`

await fs.writeFile('src/config.d.ts', preamble + configDts)
await fs.writeFile('src/rules.d.ts', preamble + rulesDts)
