import type {Config} from '../config'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

export async function imports(): Promise<Config[]> {
  return requireOf(
    ['eslint-plugin-import-x'],
    async () => {
      const pluginImportX = await interopDefault(import('eslint-plugin-import-x'))
      return [
        {
          name: '@bfra.me/imports',
          plugins: {
            'import-x': pluginImportX,
          },
          rules: {
            'import-x/no-named-default': 'error',
            'import-x/first': 'error',
            'import-x/no-duplicates': 'error',
            'import-x/no-mutable-exports': 'error',
            'import-x/no-self-import': 'error',
            'import-x/no-useless-path-segments': 'error',
            'import-x/no-webpack-loader-syntax': 'error',
          },
        },
      ]
    },
    fallback,
  )
}
