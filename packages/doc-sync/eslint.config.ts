import {composeConfig, config as rootConfig} from '@bfra.me/works/eslint.config'

export default composeConfig(rootConfig).append({
  name: '@bfra.me/doc-sync/overrides',
  files: ['test/**/*.test.ts'],
  rules: {
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
  },
})
