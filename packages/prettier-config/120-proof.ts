import prettierConfig from '@bfra.me/prettier-config'

/**
 * Shared Prettier configuration for bfra.me projects with `printWidth` set to 120 characters.
 */
const config = {
  ...prettierConfig,
  printWidth: 120,
}

export default config
