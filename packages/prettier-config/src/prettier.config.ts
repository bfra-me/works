import {resolve} from './plugins.js'
import type {Config} from 'prettier'

import {createRequire} from 'module'

const require = createRequire(import.meta.url)
const resolvePlugin = resolve.bind(null, require.resolve)

const {searchParams: params} = new URL(import.meta.url)

/**
 * Shared Prettier configuration for bfra.me projects.
 */
const config: Config = {
  arrowParens: 'avoid',
  bracketSpacing: false,
  endOfLine: 'auto',
  printWidth: 100,
  semi: params.has('semi', 'true'),
  singleQuote: true,

  overrides: [
    // Adapted from https://github.com/sxzz/prettier-config/blob/1e5cc3021e5816aceebe0b90af1d530239442ecf/index.js.
    // Require a pragma for paths typically not under version control or written by build tools.
    {
      files: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/out/**',
        '**/temp/**',
        '**/.idea/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/.output/**',
        '**/.tsup/**',
        '**/.vercel/**',
        '**/.vitepress/cache/**',
        '**/.vite-inspect/**',
        '**/__snapshots__/**',
        '**/test/fixtures/**',

        '**/auto-import?(s).d.ts',
        '**/.changeset/*.md',
        '**/CHANGELOG*.md',
        '**/changelog*.md',
        '**/components.d.ts',
        '**/devcontainer-lock.json',
        '**/LICENSE*',
        '**/license*',
        '**/*.min.*',
        '**/package-lock.json',
        '**/pnpm-lock.yaml',
        '**/typed-router.d.ts',
        '**/yarn.lock',
      ],
      options: {
        requirePragma: true,
      },
    },

    // VS Code configuration files:
    // Use 4 spaces for indentation to match the default VS Code settings.
    {
      files: ['.vscode/*.json', '.devcontainer/**/devcontainer*.json'],
      options: {
        tabWidth: 4,
      },
    },

    // Markdown:
    // - Disable single quotes for Markdown files.
    // - Disable `proseWrap` to avoid wrapping prose.
    {
      files: ['*.md'],
      options: {
        proseWrap: 'never',
        singleQuote: false,
      },
    },
  ],

  plugins: ['@bfra.me/prettier-plugins/package-json'].map(resolvePlugin),
}

export default config
