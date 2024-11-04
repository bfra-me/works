import {composeConfig} from './src/compose-config'
import config from '../../eslint.config'

export default composeConfig(
  config,
  {
    name: '@bfra.me/eslint-config/ignores',
    ignores: ['.eslint-config-inspector/', 'src/rules.d.ts'],
  },
  {
    name: '@bfra.me/eslint-config',
    files: ['src/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': [
        'error',
        {
          customGroups: {top: ['name']},
          groups: ['top', 'unknown'],
        },
      ],
    },
  },
)
