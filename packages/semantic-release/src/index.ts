import type {SemanticReleaseConfig} from './config'

/**
 * Define semantic-release global config.
 *
 * @param config Semantic Release configuration
 * @returns Semantic Release configuration
 */
export function defineConfig(config: SemanticReleaseConfig): SemanticReleaseConfig {
  return config
}

export type * from './config'
