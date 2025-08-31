/**
 * Template for prepare plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that prepare releases.
 */
export const preparePluginTemplate: PluginTemplate = {
  name: 'Prepare Plugin',
  description: 'Template for plugins that prepare releases',
  pluginType: 'prepare',
  defaultHooks: ['verifyConditions', 'prepare'],
  dependencies: ['semantic-release'],
  devDependencies: ['@types/node', 'typescript', 'vitest'],
  variables: {},
  files: [],
}
