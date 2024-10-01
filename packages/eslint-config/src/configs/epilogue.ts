import type {Config} from '../types'

export async function epilogue(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/epilogue/dts',
      files: ['**/*.d.?([cm])ts'],
      rules: {
        'eslint-comments/no-unlimited-disable': 'off',
        'import/no-duplicates': 'off',
        'no-restricted-syntax': 'off',
        'unused-imports/no-unused-vars': 'off',
      },
    },
  ]
}
