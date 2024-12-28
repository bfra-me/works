import type {Config} from '../config'
import type {Flatten, OptionsFiles} from '../options'
import {anyParser} from '../parsers/any-parser'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

export type PackageJsonOptions = Flatten<OptionsFiles>

export const packageJsonFiles = ['package.json', 'package.json5', 'package.jsonc'].flatMap(file => [
  file,
  `**/${file}`,
])

export async function packageJson(options: PackageJsonOptions = {}): Promise<Config[]> {
  const {files = packageJsonFiles} = options
  return requireOf(
    ['eslint-plugin-node-dependencies'],
    async () => {
      // @ts-expect-error: Missing type definitions
      const pluginNodeDependencies = await interopDefault(import('eslint-plugin-node-dependencies'))
      return [
        ...pluginNodeDependencies.configs['flat/recommended'].map(
          (config: Config, index: number) => ({
            ...config,
            name: config.plugins
              ? `@bfra.me/package-json/plugins`
              : `@bfra.me/${config.name || `package-json/unnamed${index}`}`,
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
