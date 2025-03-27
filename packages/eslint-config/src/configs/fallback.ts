import type {ESLint} from 'eslint'
import type {Config} from '../config'
import {interopDefault} from '../plugins'

export type FallbackOptions = {
  files?: Config['files']
  languageOptions?: Config['languageOptions']
  name?: Config['name']
}

export async function fallback(
  missingList: string[],
  options?: FallbackOptions,
): Promise<Config[]> {
  const rules = await interopDefault(import('../rules/missing-module-for-config'))
  return [
    {
      plugins: {
        get '@bfra.me'() {
          return {
            rules: {
              'missing-module-for-config': rules,
            },
          } as ESLint.Plugin
        },
      },
      rules: {
        '@bfra.me/missing-module-for-config': ['error', missingList],
      },
      ...(options ?? {}),
    } as Config,
  ]
}
