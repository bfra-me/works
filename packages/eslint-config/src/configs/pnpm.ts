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
    ['eslint-plugin-pnpm'],
    async () => {
      const [pluginPnpm, pluginYaml] = await Promise.all([
        interopDefault(import('eslint-plugin-pnpm')),
        interopDefault(import('eslint-plugin-yml')),
      ])

      return [
        {
          name: '@bfra.me/pnpm/package-json',
          files: ['package.json', '**/package.json'],
          language: 'jsonc/x',
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
          language: 'yaml',
          plugins: {
            pnpm: pluginPnpm,
            yml: pluginYaml,
          },
          rules: {
            'pnpm/yaml-no-duplicate-catalog-item': 'error',
            'pnpm/yaml-no-unused-catalog-item': 'error',
          },
        },
      ] as Config[]
    },
    fallback,
  )
}
