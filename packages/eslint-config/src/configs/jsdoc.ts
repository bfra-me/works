import type {Config} from '../config'
import {jsdoc as _jsdoc} from '../plugins'

export async function jsdoc(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/jsdoc',
      plugins: {jsdoc: _jsdoc},
      rules: {
        'jsdoc/check-param-names': 'warn',
        'jsdoc/check-property-names': 'warn',
        'jsdoc/require-param-name': 'warn',
        'jsdoc/require-property-name': 'warn',
        'jsdoc/check-access': 'warn',
        'jsdoc/check-types': 'warn',
        'jsdoc/empty-tags': 'warn',
        'jsdoc/implements-on-classes': 'warn',
        'jsdoc/no-defaults': 'warn',
        'jsdoc/no-multi-asterisks': 'warn',
        'jsdoc/require-property': 'warn',
        'jsdoc/require-property-description': 'warn',
        'jsdoc/require-returns-check': 'warn',
        'jsdoc/require-returns-description': 'warn',
        'jsdoc/require-yields-check': 'warn',
      },
    },
  ]
}
