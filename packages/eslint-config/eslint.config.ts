import config from '../../eslint.config'
import {composeConfig} from './src/compose-config'

export default composeConfig(config)
  .insertAfter('@bfra.me/ignores', {
    name: '@bfra.me/eslint-config/ignores',
    ignores: ['.eslint-config-inspector', 'lib', 'src/rules.d.ts'],
  })
  .append({
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
  })
