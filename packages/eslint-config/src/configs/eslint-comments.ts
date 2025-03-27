import type {Config} from '../config'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

export async function eslintComments(): Promise<Config[]> {
  return requireOf(
    ['@eslint-community/eslint-plugin-eslint-comments'],
    async () => {
      const pluginEslintComments = await interopDefault(
        // @ts-expect-error - No types
        import('@eslint-community/eslint-plugin-eslint-comments'),
      )
      return [
        {
          name: '@bfra.me/eslint-comments/rules',
          plugins: {'eslint-comments': pluginEslintComments},
          rules: {
            'eslint-comments/disable-enable-pair': ['error', {allowWholeFile: true}],
            'eslint-comments/no-aggregating-enable': 'error',
            'eslint-comments/no-duplicate-disable': 'error',
            'eslint-comments/no-unlimited-disable': 'error',
            'eslint-comments/no-unused-disable': 'error',
            'eslint-comments/no-unused-enable': 'error',
          },
        },
      ]
    },
    fallback,
  )
}
