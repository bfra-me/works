declare module '@eslint-community/eslint-plugin-eslint-comments' {
  import type {ESLint, Linter} from 'eslint'

  const plugin: ESLint.Plugin & {
    configs: {
      recommended: ESLint.ConfigData & {
        rules: Linter.RulesRecord
      }
    }
  }

  export default plugin
}

declare module 'eslint-plugin-import-x' {
  import type {ESLint} from 'eslint'

  const plugin: ESLint.Plugin

  export default plugin
}

declare module 'eslint-plugin-perfectionist' {
  import type {ESLint} from 'eslint'

  const plugin: ESLint.Plugin

  export default plugin
}
