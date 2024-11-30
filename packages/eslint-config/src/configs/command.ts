import type {Config} from '../config'
import config from 'eslint-plugin-command/config'

export async function command(): Promise<Config[]> {
  return [
    {
      ...config(),
      name: '@bfra.me/command',
    },
  ]
}
