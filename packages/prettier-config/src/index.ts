import type * as prettier from 'prettier'
import {createRequire} from 'node:module'
import {resolve} from './plugins.js'

export type Writable<T> = {
  -readonly [K in keyof T]: T[K] extends object ? {[J in keyof T[K]]: Writable<T[K][J]>} : T[K]
} & {}

const require = createRequire(import.meta.url)
const resolvePlugin = resolve.bind(null, require.resolve)
const {searchParams} = new URL(import.meta.url)

const config = {
  arrowParens: 'avoid',
  bracketSpacing: false,
  endOfLine: 'auto',
  printWidth: 100,
  semi: searchParams.has('semi', 'true'),
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
  ] as prettier.Config['overrides'],

  plugins: await Promise.all(['@bfra.me/prettier-plugins/package-json'].map(resolvePlugin)),
} as const

/**
 * Shared Prettier configuration for bfra.me projects.
 */
export type Config = Writable<typeof config>

export default config as Config
