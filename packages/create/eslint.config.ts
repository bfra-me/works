import {config as rootConfig} from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(rootConfig).insertAfter('@bfra.me/ignores', {
  name: '@bfra.me/create/ignores',
  ignores: ['src/templates/**/package.json'],
})
