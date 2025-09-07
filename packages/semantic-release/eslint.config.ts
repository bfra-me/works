import config from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(config).insertAfter('@bfra.me/ignores', {
  name: '@bfra.me/semantic-release/ignores',
  ignores: ['docs/getting-started.md'],
})
