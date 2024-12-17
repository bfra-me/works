import type {Config} from 'prettier'
import defaultConfig from './index.js'

const freeze = <C extends Config>(config: C): Readonly<C> => {
  return Object.freeze(config)
}

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 80 characters.
 */
const $80ProofConfig = freeze({
  ...defaultConfig,
  printWidth: 80,
  semi: new URL(import.meta.url).searchParams.has('semi', 'true') || defaultConfig.semi,
} as Config) as Config

export default $80ProofConfig
