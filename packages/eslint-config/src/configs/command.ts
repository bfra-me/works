import type {Config} from '../config'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

export async function command(): Promise<Config[]> {
  return requireOf(
    ['eslint-plugin-command'],
    async () => {
      const config = await interopDefault(import('eslint-plugin-command/config'))
      return [
        {
          ...config(),
          name: '@bfra.me/command',
        },
      ]
    },
    fallback,
  )
}
