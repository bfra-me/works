import {createRequire} from 'module'
import type {Config} from 'prettier'

const {resolve} = createRequire(import.meta.url)

/**
 * Shared Prettier configuration for bfra.me projects.
 */
const config: Config = {
  arrowParens: 'avoid',
  bracketSpacing: false,
  endOfLine: 'auto',
  printWidth: 100,
  semi: false,
  singleQuote: true,

  overrides: [
    // VS Code configuration files:
    // Use 4 spaces for indentation to match the default VS Code settings.
    {
      files: ['.vscode/*.json'],
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

    // Adapted from https://github.com/sxzz/prettier-config/blob/1e5cc3021e5816aceebe0b90af1d530239442ecf/index.js.
    // Require a pragma for paths typically not under version control or written by build tools.
    {
      files: [
        '**/node_modules/**',
        '**/dist/**',
        '**/lib/**',
        '**/coverage/**',
        '**/out/**',
        '**/.idea/**',
        '**/.nuxt/**',
        '**/.vercel/**',
        '**/.vitepress/cache/**',
        '**/.vite-inspect/**',
        '**/__snapshots__/**',

        '**/.changeset/*.md',
        '**/CHANGELOG*.md',
        '**/changelog*.md',
        '**/LICENSE*',
        '**/license*',
        '**/*.min.*',

        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
      ],
      options: {
        requirePragma: true,
      },
    },
  ],

  plugins: ['@bfra.me/prettier-plugins/package-json'].map(plugin => resolve(plugin)),
}

export default config
