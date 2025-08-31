/**
 * Template for fail plugins.
 */

import type {PluginTemplate} from '../types.js'

/**
 * Template for plugins that handle release failures.
 */
export const failPluginTemplate: PluginTemplate = {
  name: 'Fail Plugin',
  description: 'Template for plugins that handle release failures',
  pluginType: 'fail',
  defaultHooks: ['fail'],
  dependencies: ['semantic-release'],
  devDependencies: ['@types/node', 'typescript', 'vitest'],
  variables: {},
  files: [],
}
