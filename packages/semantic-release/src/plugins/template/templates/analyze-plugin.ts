/**
 * Template for commit analysis plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that analyze commits to determine release type.
 */
export const analyzePluginTemplate: PluginTemplate = {
  name: 'Analyze Plugin',
  description: 'Template for commit analysis plugins that determine release type',
  pluginType: 'analyze',
  defaultHooks: ['verifyConditions', 'analyzeCommits'],
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
      sourcePath: 'src/analyzer.ts.eta',
      targetPath: 'src/analyzer.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'test/analyzer.test.ts.eta',
      targetPath: 'test/analyzer.test.ts',
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
