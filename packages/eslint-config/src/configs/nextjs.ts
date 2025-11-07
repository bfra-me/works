import type {Plugin} from '@eslint/core'
import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_SRC} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Configuration options for Next.js ESLint rules.
 *
 * Extends the base configuration options with file pattern matching
 * and rule override capabilities specifically tailored for Next.js projects.
 *
 * @extends `Flatten<OptionsFiles & OptionsOverrides>`
 */
export interface NextjsOptions extends Flatten<OptionsFiles & OptionsOverrides> {}

function normalizeRules(rules: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(rules).map(([key, value]) => [key, typeof value === 'string' ? [value] : value]),
  )
}

/**
 * Creates ESLint configuration for Next.js projects.
 *
 * @param options - Configuration options for the Next.js ESLint setup
 * @param options.files - File patterns to apply the configuration to (defaults to GLOB_SRC)
 * @param options.overrides - Rule overrides to apply on top of the default Next.js rules
 * @returns Promise resolving to an array of ESLint configurations including plugin setup and rules
 */
export async function nextjs(options: NextjsOptions = {}): Promise<Config[]> {
  const {files = [GLOB_SRC], overrides = {}} = options

  return requireOf(
    ['@next/eslint-plugin-next'],
    async (): Promise<Config[]> => {
      const pluginNextJs = await interopDefault(import('@next/eslint-plugin-next'))

      function getRules(name: keyof typeof pluginNextJs.configs) {
        const rules = pluginNextJs.configs?.[name]?.rules
        if (!rules) {
          throw new Error(
            `[@bfra.me/eslint-config] No rules found for @next/eslint-plugin-next config: ${name}`,
          )
        }
        return normalizeRules(rules)
      }

      return [
        {
          name: '@bfra.me/nextjs/setup',
          plugins: {'@next/next': pluginNextJs as Record<string, Plugin>},
        },
        {
          name: '@bfra.me/nextjs/rules',
          files,
          languageOptions: {
            parserOptions: {
              ecmaFeatures: {jsx: true},
            },
            sourceType: 'module',
          },
          rules: {
            ...getRules('recommended'),
            ...getRules('core-web-vitals'),

            ...overrides,
          },
          settings: {
            react: {version: 'detect'},
          },
        },
      ]
    },
    async missingList =>
      fallback(missingList, {
        files,
        languageOptions: {
          parser: anyParser,
        },
      }),
  )
}
