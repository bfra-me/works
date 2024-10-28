import defaultConfig, {type DefaultConfig} from './prettier.config.js'

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 120 characters.
 */
export interface $120ProofConfig extends DefaultConfig {
  /** @default 120 */
  printWidth: 120 | DefaultConfig['printWidth']
}

const $120ProofConfig = {
  ...defaultConfig,
  printWidth: 120,
  semi: new URL(import.meta.url).searchParams.has('semi', 'true') || defaultConfig.semi,
} as $120ProofConfig

export default $120ProofConfig
