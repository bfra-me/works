// This file is generated by scripts/generate-types.ts
// Do not edit this file directly.

import type {Linter} from 'eslint'
import type {FlatConfigComposer, ResolvableFlatConfig} from 'eslint-flat-config-utils'
import type {Rules} from './rules'

export type {FlatConfigComposer, ResolvableFlatConfig}

/**
 * Represents the configuration for the linter.
 * This interface extends the {@link Linter.Config} interface, expanding {@link Rules} to include the rules defined in all configurations.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
 */
export type Config<R extends Linter.RulesRecord | Rules = Linter.RulesRecord & Rules> = Linter.Config<R>

/**
 * Defines the names of the available ESLint configurations.
 */
export type ConfigNames =
  | '@bfra.me/gitignore'
  | '@bfra.me/ignores'
  | '@bfra.me/javascript/options'
  | '@bfra.me/javascript/rules'
  | '@bfra.me/jsx'
  | '@bfra.me/eslint-comments/rules'
  | '@bfra.me/node'
  | '@bfra.me/jsdoc'
  | '@bfra.me/imports'
  | '@bfra.me/command'
  | '@bfra.me/package-json/plugins'
  | '@bfra.me/package-json/unnamed1'
  | '@bfra.me/package-json/json-schema/plugins'
  | '@bfra.me/package-json/json-schema/unnamed1'
  | '@bfra.me/package-json/json-schema'
  | '@bfra.me/perfectionist'
  | '@bfra.me/unicorn'
  | '@bfra.me/typescript/plugins'
  | '@bfra.me/typescript/parser'
  | '@bfra.me/typescript/type-aware-parser'
  | '@bfra.me/typescript/rules'
  | '@bfra.me/typescript/type-aware-rules'
  | '@bfra.me/regexp'
  | '@bfra.me/vitest/plugin'
  | '@bfra.me/vitest/rules'
  | '@bfra.me/jsonc/plugins'
  | '@bfra.me/jsonc/unnamed1'
  | '@bfra.me/jsonc/json-schema/plugins'
  | '@bfra.me/jsonc/json-schema/unnamed1'
  | '@bfra.me/jsonc/json-schema/unnamed2'
  | '@bfra.me/jsonc/json-schema'
  | '@bfra.me/jsonc'
  | '@bfra.me/toml/plugins'
  | '@bfra.me/toml/unnamed1'
  | '@bfra.me/toml/unnamed2'
  | '@bfra.me/toml/json-schema/plugins'
  | '@bfra.me/toml/json-schema/unnamed1'
  | '@bfra.me/toml/json-schema/unnamed2'
  | '@bfra.me/toml/json-schema'
  | '@bfra.me/toml'
  | '@bfra.me/yaml/plugins'
  | '@bfra.me/yaml/unnamed1'
  | '@bfra.me/yaml/unnamed2'
  | '@bfra.me/yaml/json-schema/plugins'
  | '@bfra.me/yaml/json-schema/unnamed1'
  | '@bfra.me/yaml/json-schema/unnamed2'
  | '@bfra.me/yaml/json-schema'
  | '@bfra.me/yaml'
  | '@bfra.me/markdown/recommended/plugin'
  | '@bfra.me/markdown/recommended/processor'
  | '@bfra.me/markdown/recommended/code-blocks'
  | '@bfra.me/markdown/overrides'
  | '@bfra.me/prettier'
  | '@bfra.me/prettier/markdown'
  | '@bfra.me/prettier/toml'
  | '@bfra.me/prettier/overrides'
  | '@bfra.me/epilogue/cli'
  | '@bfra.me/epilogue/configs'
  | '@bfra.me/epilogue/scripts'
  | '@bfra.me/epilogue/commonjs'
  | '@bfra.me/epilogue/dts'
  | '@bfra.me/epilogue'
