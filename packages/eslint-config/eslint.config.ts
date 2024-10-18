import {composeConfig} from './src'
import config from '../../eslint.config'

export default composeConfig(
  config,
  {
    name: '@bfra.me/works/eslint-config/ignores',
    ignores: ['.eslint-config-inspector/', 'src/types.ts'],
  },
  {
    name: '@bfra.me/works/eslint-config',
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
