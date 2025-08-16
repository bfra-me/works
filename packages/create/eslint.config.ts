import {config as rootConfig} from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(rootConfig)
  .insertAfter('@bfra.me/ignores', {
    name: '@bfra.me/create/ignores',
    ignores: [
      'src/templates/**/package.json', // Legacy src templates
      'templates/**/package.json', // New root-level templates
      'templates/**/*.ts', // Template TypeScript files with Eta syntax
      'templates/**/*.tsx', // Template React files with Eta syntax
      'templates/**/*.json', // Template JSON files with Eta syntax
      'templates/**/*.html', // Template HTML files with Eta syntax
    ],
  })
  .append({
    name: '@bfra.me/create/overrides',
    files: ['src/templates/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
