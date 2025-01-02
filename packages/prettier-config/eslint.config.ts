import config from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(config).insertAfter('@bfra.me/ignores', {
  name: '@bfra.me/prettier-config/ignores',
  ignores: ['prettier.config.mjs'],
})
