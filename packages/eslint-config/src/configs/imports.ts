import type {Config} from '../config'
import {importX as pluginImportX} from '../plugins'

export async function imports(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/imports',
      plugins: {
        'import-x': pluginImportX as any,
      },
      rules: {
        'import-x/first': 'error',
        'import-x/no-duplicates': 'error',
        'import-x/no-mutable-exports': 'error',
        'import-x/no-named-default': 'error',
        'import-x/no-self-import': 'error',
        'import-x/no-useless-path-segments': 'error',
        'import-x/no-webpack-loader-syntax': 'error',
      },
    },
  ]
}
