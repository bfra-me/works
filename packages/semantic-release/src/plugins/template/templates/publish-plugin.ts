/**
 * Template for publish plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that publish releases to external services.
 */
export const publishPluginTemplate: PluginTemplate = {
  name: 'Publish Plugin',
  description: 'Template for plugins that publish releases to external services',
  pluginType: 'publish',
  defaultHooks: ['verifyConditions', 'publish'],
  dependencies: ['semantic-release'],
  devDependencies: [
    '@types/node',
    'typescript',
    'vitest',
    '@vitest/coverage-v8',
    'eslint',
    'prettier',
  ],
  variables: {},
  files: [
    {
      sourcePath: 'package.json.eta',
      targetPath: 'package.json',
      processTemplate: true,
    },
    {
      sourcePath: 'tsconfig.json.eta',
      targetPath: 'tsconfig.json',
      processTemplate: true,
    },
    {
      sourcePath: 'src/index.ts.eta',
      targetPath: 'src/index.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'src/types.ts.eta',
      targetPath: 'src/types.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'src/publisher.ts.eta',
      targetPath: 'src/publisher.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'test/publisher.test.ts.eta',
      targetPath: 'test/publisher.test.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'README.md.eta',
      targetPath: 'README.md',
      processTemplate: true,
    },
    {
      sourcePath: 'vitest.config.ts',
      targetPath: 'vitest.config.ts',
      processTemplate: false,
    },
    {
      sourcePath: 'tsup.config.ts',
      targetPath: 'tsup.config.ts',
      processTemplate: false,
    },
  ],
}
