import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_JSON_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'
/**
 * Represents the options for configuring JSONC files in the ESLint configuration.
 */
export type JsoncOptions = Flatten<OptionsFiles & OptionsOverrides>

/**
 * Configures the ESLint rules for JSONC files.
 * @param options - The configuration options for JSONC files.
 * @see https://ota-meshi.github.io/eslint-plugin-jsonc/
 */
export async function jsonc(options: JsoncOptions = {}): Promise<Config[]> {
  const {files = GLOB_JSON_FILES, overrides = {}} = options

  return requireOf(
    ['eslint-plugin-jsonc'],
    async () => {
      const pluginJsonc = await interopDefault(import('eslint-plugin-jsonc'))

      return [
        ...(pluginJsonc.configs['flat/base'] as unknown as Config[]).map(
          (config: Config, index) => ({
            ...config,
            name: config.plugins
              ? `@bfra.me/jsonc/plugins`
              : `@bfra.me/${(config.name ?? '') || `jsonc/unnamed${index}`}`,
          }),
        ),
        ...(await jsonSchema('jsonc', files as string[])),
        {
          name: '@bfra.me/jsonc',
          files,
          rules: {
            ...overrides,
          },
        },
      ]
    },
    async missingList =>
      fallback(missingList, {
        files,
        languageOptions: {parser: anyParser},
      }),
  )
}
