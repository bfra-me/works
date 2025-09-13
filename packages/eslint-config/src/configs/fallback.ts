import type {Config} from '../config'
import {interopDefault} from '../utils'

export interface FallbackOptions {
  files?: Config['files']
  languageOptions?: Config['languageOptions']
  name?: Config['name']
}

export async function fallback(
  missingList: string[] = [],
  options?: FallbackOptions,
): Promise<Config[]> {
  const rules = await interopDefault(import('../rules/missing-module-for-config'))
  // Create a unique ID using the short hash of the missing modules to ensure the plugin name is unique
  const pluginName = `@bfra.me${
    missingList.length > 0
      ? `/missing-modules-${missingList
          .map(m => m.replaceAll(/[^a-z0-9]/gi, '-').toLowerCase())
          .join('-')}`
      : ''
  }`

  return [
    {
      plugins: {
        [pluginName]: {
          rules: {
            'missing-module-for-config': rules,
          },
        },
      },
      rules: {
        [`${pluginName}/missing-module-for-config`]: ['error', missingList],
      },
      ...(options ?? {}),
    } as Config,
  ]
}
