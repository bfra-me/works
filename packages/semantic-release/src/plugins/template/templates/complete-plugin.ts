/**
 * Template for complete plugins with all lifecycle hooks.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for complete plugins that implement all lifecycle hooks.
 */
export const completePluginTemplate: PluginTemplate = {
  name: 'Complete Plugin',
  description: 'Template for complete plugins with all lifecycle hooks',
  pluginType: 'complete',
  defaultHooks: [
    'verifyConditions',
    'analyzeCommits',
    'verifyRelease',
    'generateNotes',
    'prepare',
    'publish',
    'success',
    'fail',
  ],
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
      sourcePath: 'src/plugin.ts.eta',
      targetPath: 'src/plugin.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'test/plugin.test.ts.eta',
      targetPath: 'test/plugin.test.ts',
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
