declare module '@eslint-community/eslint-plugin-eslint-comments' {
  import type {ConfigObject, Plugin, RulesConfig} from '@eslint/core'

  const plugin: Plugin & {
    configs: {
      recommended: ConfigObject & {
        rules: RulesConfig
      }
    }
  }

  export default plugin
}

declare module 'eslint-plugin-import-x' {
  import type {Plugin} from '@eslint/core'

  const plugin: Plugin

  export default plugin
}

declare module 'eslint-plugin-perfectionist' {
  import type {Plugin} from '@eslint/core'

  const plugin: Plugin

  export default plugin
}
