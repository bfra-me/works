import {GLOB_SRC, GLOB_SRC_EXT} from '../globs'
import type {Config} from '../config'

export async function epilogue(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/epilogue/cli',
      files: [`**/cli/${GLOB_SRC}`, `**/cli.${GLOB_SRC_EXT}`],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        'no-console': 'off',
      },
    },
    {
      name: '@bfra.me/epilogue/configs',
      files: [`**/*.config.${GLOB_SRC_EXT}`, `**/*.config.*.${GLOB_SRC_EXT}`],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        'no-console': 'off',
      },
    },
    {
      name: '@bfra.me/epilogue/scripts',
      files: [`**/scripts/${GLOB_SRC}`],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        'no-console': 'off',
      },
    },
    {
      name: '@bfra.me/epilogue/commonjs',
      files: ['**/*.js', '**/*.cjs'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      name: '@bfra.me/epilogue/dts',
      files: ['**/*.d.?([cm])ts'],
      rules: {
        'eslint-comments/no-unlimited-disable': 'off',
        'import-x/no-duplicates': 'off',
        'no-restricted-syntax': 'off',
        'unused-imports/no-unused-vars': 'off',
      },
    },
    {
      name: '@bfra.me/epilogue',
    },
  ]
}
