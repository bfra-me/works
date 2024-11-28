import {composeConfig} from '../eslint-config/src'
import config from '../../eslint.config'

export default composeConfig(config, {
  name: '@bfra.me/prettier-config/bundled',
  ignores: ['index.js'],
})
