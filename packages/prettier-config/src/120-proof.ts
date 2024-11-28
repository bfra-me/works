import defaultConfig, {type Writable} from './index.js'

const $120ProofConfig = {
  ...defaultConfig,
  printWidth: 120,
  semi: new URL(import.meta.url).searchParams.has('semi', 'true') || defaultConfig.semi,
} as const

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 120 characters.
 */
type $120ProofConfig = Writable<typeof $120ProofConfig>

export default $120ProofConfig as $120ProofConfig
