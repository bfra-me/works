import type {Config} from '../config'
import type {Flatten, OptionsFiles} from '../options'
import {GLOB_PACKAGE_JSON_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

export type PackageJsonOptions = Flatten<OptionsFiles>

export async function packageJson(options: PackageJsonOptions = {}): Promise<Config[]> {
  const {files = GLOB_PACKAGE_JSON_FILES} = options
  return requireOf(
    ['eslint-plugin-node-dependencies'],
    async () => {
      const pluginNodeDependencies = await interopDefault(import('eslint-plugin-node-dependencies'))
      return [
        ...pluginNodeDependencies.configs['flat/recommended'].map(
          (config: unknown, index: number) => ({
            ...(config as Config),
            name: (config as Config).plugins
              ? `@bfra.me/package-json/plugins`
              : `@bfra.me/${((config as Config).name ?? '') || `package-json/unnamed${index}`}`,
            files,
          }),
        ),
        ...(await jsonSchema('package-json', files as string[])),
      ]
    },
    async missingList =>
      fallback(missingList, {
        name: '@bfra.me/package-json/fallback',
        files,
        languageOptions: {parser: anyParser},
      }),
  )
}
