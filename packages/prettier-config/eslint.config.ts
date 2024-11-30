import config from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(config, {
  name: '@bfra.me/prettier-config/bundled',
  ignores: ['prettier.config.js'],
})
