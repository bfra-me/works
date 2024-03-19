import type {Config} from 'prettier'

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
        '**/.changeset/**',
        '**/.idea/**',
        '**/.nuxt/**',
        '**/.vercel/**',
        '**/.vitepress/cache/**',
        '**/.vite-inspect/**',
        '**/__snapshots__/**',

        '**/CHANGELOG*.md',
        '**/changelog*.md',
        '**/LICENSE*',
        '**/license*',
        '**/*.min.*',
      ],
      options: {
        requirePragma: true,
      },
    },
  ],
}

export default config
