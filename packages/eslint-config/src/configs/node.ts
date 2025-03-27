import type {Config} from '../config'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

export async function node(): Promise<Config[]> {
  return requireOf(
    ['eslint-plugin-n'],
    async () => {
      const pluginNode = await interopDefault(import('eslint-plugin-n'))
      return [
        {
          name: '@bfra.me/node',
          plugins: {
            node: pluginNode,
          },
          rules: {
            'node/handle-callback-err': ['error', '^(err|error)$'],
            'node/no-deprecated-api': 'error',
            'node/no-exports-assign': 'error',
            'node/no-new-require': 'error',
            'node/no-path-concat': 'error',
            'node/no-unsupported-features/es-builtins': 'error',
            'node/prefer-global/buffer': ['error', 'never'],
            'node/prefer-global/process': ['error', 'never'],
            'node/process-exit-as-throw': 'error',
          },
        },
      ]
    },
    fallback,
  )
}
