import type {Config} from '../config'
import {interopDefault} from '../utils'

export async function command(): Promise<Config[]> {
  const config = await interopDefault(import('eslint-plugin-command/config'))

  return [
    {
      ...config(),
      name: '@bfra.me/command',
    },
  ]
}
