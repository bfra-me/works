/**
 * Template for generate plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that generate release notes.
 */
export const generatePluginTemplate: PluginTemplate = {
  name: 'Generate Plugin',
  description: 'Template for plugins that generate release notes',
  pluginType: 'generate',
  defaultHooks: ['verifyConditions', 'generateNotes'],
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
      sourcePath: 'src/generator.ts.eta',
      targetPath: 'src/generator.ts',
      processTemplate: true,
    },
    {
      sourcePath: 'test/generator.test.ts.eta',
      targetPath: 'test/generator.test.ts',
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
