import {composeConfig, config as rootConfig} from '@bfra.me/works/eslint.config'

const config = composeConfig(rootConfig)
  .insertAfter('@bfra.me/ignores', {
    name: 'semantic-release/ignores',
    ignores: ['node_modules', 'lib', 'docs/**/*.md'],
  })
  .append({
    name: 'semantic-release/docs',
    files: ['docs/**/*.md'],
    rules: {
      'prettier/prettier': 'off',
    },
  })

export default config
