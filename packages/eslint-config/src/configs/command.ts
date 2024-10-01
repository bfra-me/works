import config from 'eslint-plugin-command/config'
import type {Config} from '../types'

export async function command(): Promise<Config[]> {
  return [
    {
      ...config(),
      name: '@bfra.me/command',
    },
  ]
}
