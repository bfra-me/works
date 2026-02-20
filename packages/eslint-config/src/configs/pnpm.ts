import type {Config} from '../config'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Configures the ESLint rules for pnpm package management.
 * @see https://github.com/antfu/pnpm-workspace-utils#readme
 */
export async function pnpm(): Promise<Config[]> {
  return requireOf(
    ['eslint-plugin-pnpm'],
    async () => {
      const [pluginJsonc, pluginPnpm, pluginYaml] = await Promise.all([
        interopDefault(import('eslint-plugin-jsonc')),
        interopDefault(import('eslint-plugin-pnpm')),
        interopDefault(import('eslint-plugin-yml')),
      ])

      const jsoncBaseConfigs = (pluginJsonc.configs['flat/base'] ??
        pluginJsonc.configs.base) as unknown as Config[] | Config | undefined
      const yamlBaseConfigs = (pluginYaml.configs.standard ??
        pluginYaml.configs['flat/standard']) as unknown as Config[] | Config | undefined

      const jsoncConfigs = Array.isArray(jsoncBaseConfigs)
        ? jsoncBaseConfigs
        : jsoncBaseConfigs
          ? [jsoncBaseConfigs]
          : []
      const yamlConfigs = Array.isArray(yamlBaseConfigs)
        ? yamlBaseConfigs
        : yamlBaseConfigs
          ? [yamlBaseConfigs]
          : []

      const configs: Config[] = []

      const jsoncLanguageSetup = jsoncConfigs.find(
        (config): config is Config & {language: string} =>
          config != null && typeof config === 'object' && 'language' in config,
      )
      const jsoncParserSetup = jsoncConfigs.find(
        (config): config is Config & {languageOptions: Record<string, unknown>} =>
          config != null &&
          typeof config === 'object' &&
          'languageOptions' in config &&
          config.languageOptions != null,
      )
      const jsoncPluginSetup = jsoncConfigs.find(
        (config): config is Config & {plugins: Record<string, unknown>} =>
          config != null &&
          typeof config === 'object' &&
          'plugins' in config &&
          config.plugins != null,
      )

      if (jsoncLanguageSetup ?? jsoncParserSetup ?? jsoncPluginSetup) {
        configs.push({
          name: '@bfra.me/pnpm/package-json',
          files: ['package.json', '**/package.json'],
          ...(jsoncLanguageSetup ? {language: jsoncLanguageSetup.language} : {}),
          ...(jsoncParserSetup ? {languageOptions: jsoncParserSetup.languageOptions} : {}),
          plugins: {
            ...(jsoncPluginSetup?.plugins ?? {}),
            pnpm: pluginPnpm,
          },
          rules: {
            'pnpm/json-enforce-catalog': 'error',
            'pnpm/json-prefer-workspace-settings': 'error',
            'pnpm/json-valid-catalog': 'error',
          },
        })
      }

      const yamlLanguageSetup = yamlConfigs.find(
        (config): config is Config & {language: string} =>
          config != null && typeof config === 'object' && 'language' in config,
      )
      const yamlParserSetup = yamlConfigs.find(
        (config): config is Config & {languageOptions: Record<string, unknown>} =>
          config != null &&
          typeof config === 'object' &&
          'languageOptions' in config &&
          config.languageOptions != null,
      )
      const yamlPluginSetup = yamlConfigs.find(
        (config): config is Config & {plugins: Record<string, unknown>} =>
          config != null &&
          typeof config === 'object' &&
          'plugins' in config &&
          config.plugins != null,
      )

      if (yamlLanguageSetup ?? yamlParserSetup ?? yamlPluginSetup) {
        configs.push({
          name: '@bfra.me/pnpm/pnpm-workspace-yaml',
          files: ['pnpm-workspace.yaml'],
          ...(yamlLanguageSetup ? {language: yamlLanguageSetup.language} : {}),
          ...(yamlParserSetup ? {languageOptions: yamlParserSetup.languageOptions} : {}),
          plugins: {
            ...(yamlPluginSetup?.plugins ?? {}),
            pnpm: pluginPnpm,
          },
          rules: {
            'pnpm/yaml-no-duplicate-catalog-item': 'error',
            'pnpm/yaml-no-unused-catalog-item': 'error',
          },
        })
      }

      return configs
    },
    fallback,
  )
}
