import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_JSON, GLOB_JSON5, GLOB_JSONC} from '../globs'
import {interopDefault} from '../plugins'

export type JsoncOptions = Flatten<OptionsFiles & OptionsOverrides>

export async function jsonc(options: JsoncOptions): Promise<Config[]> {
  const {files = [GLOB_JSONC, GLOB_JSON, GLOB_JSON5], overrides = {}} = options
  const [pluginJsonc, parserJsonc] = await Promise.all([
    interopDefault(import('eslint-plugin-jsonc')),
    interopDefault(import('jsonc-eslint-parser')),
  ])

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
        ...(pluginJsonc.configs['recommended-with-jsonc'].rules as Record<string, any>),

        ...overrides,
      },
    },
  ]
}
