import {composeConfig} from '../eslint-config/src'
import {config} from '../../eslint.config'

export default composeConfig(
  config,
  {
    name: '@bfra.me/api-core',
    ignores: ['test-utils'],
  },
  {
    name: '@bfra.me/eslint-config',
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          name: 'fs/promises',
          message:
            "Please use `fs` instead as some client frameworks don't polyfill `fs/promises`.",
        },
      ],

      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
)
