import prettierConfig from '@bfra.me/prettier-config'
import type {Config} from 'prettier'

const params = new URL(import.meta.url).searchParams
const preset = {
  semi: params.has('semi') || prettierConfig.semi || false,
  printWidth: 120,
} as const satisfies Pick<Config, 'printWidth' | 'semi'>

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 120 characters.
 */
const config: Config & typeof preset = {
  ...prettierConfig,
  ...preset,
}

export default config
