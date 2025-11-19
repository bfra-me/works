import {composeConfig, config} from '@bfra.me/works/eslint.config'

export default composeConfig(config).insertAfter('@bfra.me/ignores', {
  name: '@bfra.me/prettier-config/ignores',
  ignores: ['prettier.config.cjs'],
})
