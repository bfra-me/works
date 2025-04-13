import {config as rootConfig} from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(rootConfig)
  .insertAfter('@bfra.me/ignores', {
    name: '@bfra.me/create/ignores',
    ignores: ['src/templates/**/package.json'],
  })
  .append({
    name: '@bfra.me/create/overrides',
    files: ['src/templates/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
