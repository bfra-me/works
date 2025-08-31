/**
 * Template for verify plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that verify conditions and releases.
 */
export const verifyPluginTemplate: PluginTemplate = {
  name: 'Verify Plugin',
  description: 'Template for plugins that verify conditions and releases',
  pluginType: 'verify',
  defaultHooks: ['verifyConditions', 'verifyRelease'],
  dependencies: ['semantic-release'],
  devDependencies: ['@types/node', 'typescript', 'vitest'],
  variables: {},
  files: [],
}
