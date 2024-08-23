import prettierConfig from '@bfra.me/prettier-config'
import type {Config} from 'prettier'

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 120 characters.
 */
const config: Config = {
  ...prettierConfig,
  printWidth: 120,
}

export default config
