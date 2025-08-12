import type {Linter} from 'eslint'
import type {Config} from '../config'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Configures the ESLint rules for pnpm package management.
 * @see https://github.com/antfu/pnpm-workspace-utils#readme
 */
export async function pnpm(): Promise<Config[]> {
  return requireOf(
    ['eslint-plugin-jsonc', 'eslint-plugin-pnpm', 'eslint-plugin-yml'],
    async () => {
      const [pluginJsonc, pluginPnpm, pluginYaml] = await Promise.all([
        interopDefault(import('eslint-plugin-jsonc')),
        interopDefault(import('eslint-plugin-pnpm')),
        interopDefault(import('eslint-plugin-yml')),
      ])

      return [
        {
          name: '@bfra.me/pnpm/package-json',
          files: ['package.json', '**/package.json'],
          languageOptions: {parser: pluginJsonc as unknown as Linter.Parser},
          plugins: {
            pnpm: pluginPnpm,
          },
          rules: {
            'pnpm/json-enforce-catalog': 'error',
            'pnpm/json-prefer-workspace-settings': 'error',
            'pnpm/json-valid-catalog': 'error',
          },
        },
        {
          name: '@bfra.me/pnpm/pnpm-workspace-yaml',
          files: ['pnpm-workspace.yaml'],
          languageOptions: {parser: pluginYaml as unknown as Linter.Parser},
          plugins: {
            pnpm: pluginPnpm,
          },
          rules: {
            'pnpm/yaml-no-duplicate-catalog-item': 'error',
            'pnpm/yaml-no-unused-catalog-item': 'error',
          },
        },
      ]
    },
    fallback,
  )
}
