import prettierConfig from './prettier.config.js'
import type {Config} from 'prettier'

const {searchParams: params} = new URL(import.meta.url)
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
