import prettierConfig from '@bfra.me/prettier-config'
import type {Config} from 'prettier'

const preset = {printWidth: 120} as const

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 120 characters.
 */
const config: Config & typeof preset = {
  ...prettierConfig,
  ...preset,
}

export default config
