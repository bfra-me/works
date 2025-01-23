import type {Config} from 'prettier'

const freeze = <C extends Config = Config>(config: C): Readonly<C> => {
  return Object.freeze(config)
}

const baseConfig = {
  printWidth: 100,
  semi: false,
} as const

// Allow the base config to be overridden by using URL search params.
//
// Example:
//
// import prettierConfig from "@bfra.me/prettier-config/?printWidth=120&semi=true";
//
// This will override the `printWidth` option to `120` and the `semi` option to `true`.
const {searchParams} = new URL(import.meta.url)

const importConfig = freeze<Config>(
  Object.fromEntries(
    Object.entries(baseConfig).map(([key, defaultValue]) => {
      const param = searchParams.get(key)
      if (param === null) return [key, defaultValue]

      // Parse the param string to the appropriate type based on the default value
      switch (typeof defaultValue) {
        case 'boolean':
          return [key, param === 'true']
        case 'number':
          return [key, Number(param)]
        default:
          return [key, param]
      }
    }),
  ),
)

/**
 * Shared Prettier configuration for bfra.me projects.
 */
const config = {
  arrowParens: 'avoid',
  bracketSpacing: false,
  endOfLine: 'auto',
  singleQuote: true,

  ...importConfig,

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
} as Config

export {config as default}
