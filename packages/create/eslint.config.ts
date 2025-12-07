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
      // Allow vi.mocked() pattern on object methods in tests
      '@typescript-eslint/unbound-method': 'off',
      // Allow mock type assertions in tests where strict type checking is impractical
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  })
