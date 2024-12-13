import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_JSON, GLOB_JSON5, GLOB_JSONC} from '../globs'
import {interopDefault} from '../plugins'

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
  const {files = [GLOB_JSONC, GLOB_JSON, GLOB_JSON5], overrides = {}} = options
  const [pluginJsonc, parserJsonc] = await Promise.all([
    interopDefault(import('eslint-plugin-jsonc')),
    interopDefault(import('jsonc-eslint-parser')),
  ] as const)

  return [
    {
      name: '@bfra.me/jsonc/plugins',
      plugins: {jsonc: pluginJsonc as any},
    },
    {
      name: '@bfra.me/jsonc',
      files,
      languageOptions: {
        parser: parserJsonc,
      },
      rules: {
        ...overrides,
      },
    },
  ]
}
