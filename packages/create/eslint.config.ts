import {composeConfig, config as rootConfig} from '@bfra.me/works/eslint.config'

export default composeConfig(rootConfig)
  .insertAfter('@bfra.me/ignores', {
    name: '@bfra.me/create/ignores',
    ignores: [
      'templates/**/*', // Exclude all template files including subdirectories
      'MIGRATION.md',
      'README.md',
    ],
  })
  .append({
    name: '@bfra.me/create/overrides',
    files: ['src/templates/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
  .append({
    name: '@bfra.me/create/tests/overrides',
    files: ['test/**/*.ts'],
    rules: {
      'vitest/prefer-lowercase-title': 'off',
    },
  })
