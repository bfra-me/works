/**
 * Template for success plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that handle successful releases.
 */
export const successPluginTemplate: PluginTemplate = {
  name: 'Success Plugin',
  description: 'Template for plugins that handle successful releases',
  pluginType: 'success',
  defaultHooks: ['success'],
  dependencies: ['semantic-release'],
  devDependencies: ['@types/node', 'typescript', 'vitest'],
  variables: {},
  files: [],
}
