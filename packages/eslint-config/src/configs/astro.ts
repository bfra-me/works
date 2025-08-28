import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_ASTRO} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Represents the options for configuring the Astro ESLint configuration.
 * This type is a flattened union of the {@link OptionsFiles} and {@link OptionsOverrides} types.
 */
export interface AstroOptions extends Flatten<OptionsFiles & OptionsOverrides> {}

/**
 * Configures the Astro ESLint plugin.
 * @param options - Options to configure the Astro ESLint plugin.
 * @returns A promise that resolves to an array of ESLint configurations.
 */
export async function astro(options: AstroOptions = {}): Promise<Config[]> {
  const {files = [GLOB_ASTRO], overrides = {}} = options

  return requireOf(
    ['eslint-plugin-astro', 'astro-eslint-parser'],
    async (): Promise<Config[]> => {
      const [pluginAstro, parserAstro, parserTs] = await Promise.all([
        interopDefault(import('eslint-plugin-astro')),
        interopDefault(import('astro-eslint-parser')),
        interopDefault(import('typescript-eslint')).then(({parser}) => parser),
      ] as const)

      return [
        {
          name: '@bfra.me/astro/setup',
          plugins: {astro: pluginAstro},
        },
        {
          name: '@bfra.me/astro/rules',
          files,
          languageOptions: {
            globals: pluginAstro.environments.astro.globals,
            parser: parserAstro,
            parserOptions: {
              extraFileExtensions: ['.astro'],
              parser: parserTs,
            },
            sourceType: 'module',
          },
          processor: 'astro/client-side-ts',
          rules: {
            'astro/missing-client-only-directive-value': 'error',
            'astro/no-conflict-set-directives': 'error',
            'astro/no-deprecated-astro-canonicalurl': 'error',
            'astro/no-deprecated-astro-fetchcontent': 'error',
            'astro/no-deprecated-astro-resolve': 'error',
            'astro/no-deprecated-getentrybyslug': 'error',
            'astro/no-set-html-directive': 'off',
            'astro/no-unused-define-vars-in-style': 'error',
            'astro/semi': 'off',
            'astro/valid-compile': 'error',

            ...overrides,
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
