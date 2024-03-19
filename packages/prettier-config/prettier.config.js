/**
 * Shared Prettier configuration for bfra.me projects.
 */
const config = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldHRpZXIuY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJldHRpZXIuY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBOztHQUVHO0FBQ0gsTUFBTSxNQUFNLEdBQVc7SUFDckIsV0FBVyxFQUFFLE9BQU87SUFDcEIsY0FBYyxFQUFFLEtBQUs7SUFDckIsU0FBUyxFQUFFLE1BQU07SUFDakIsVUFBVSxFQUFFLEdBQUc7SUFDZixJQUFJLEVBQUUsS0FBSztJQUNYLFdBQVcsRUFBRSxJQUFJO0lBRWpCLFNBQVMsRUFBRTtRQUNULCtCQUErQjtRQUMvQixzRUFBc0U7UUFDdEU7WUFDRSxLQUFLLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN6QixPQUFPLEVBQUU7Z0JBQ1AsUUFBUSxFQUFFLENBQUM7YUFDWjtTQUNGO1FBRUQsWUFBWTtRQUNaLDhDQUE4QztRQUM5QyxpREFBaUQ7UUFDakQ7WUFDRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDZixPQUFPLEVBQUU7Z0JBQ1AsU0FBUyxFQUFFLE9BQU87Z0JBQ2xCLFdBQVcsRUFBRSxLQUFLO2FBQ25CO1NBQ0Y7UUFFRCwrR0FBK0c7UUFDL0csNEZBQTRGO1FBQzVGO1lBQ0UsS0FBSyxFQUFFO2dCQUNMLG9CQUFvQjtnQkFDcEIsWUFBWTtnQkFDWixXQUFXO2dCQUNYLGdCQUFnQjtnQkFDaEIsV0FBVztnQkFDWCxrQkFBa0I7Z0JBQ2xCLGFBQWE7Z0JBQ2IsYUFBYTtnQkFDYixlQUFlO2dCQUNmLHdCQUF3QjtnQkFDeEIscUJBQXFCO2dCQUNyQixxQkFBcUI7Z0JBRXJCLGtCQUFrQjtnQkFDbEIsa0JBQWtCO2dCQUNsQixhQUFhO2dCQUNiLGFBQWE7Z0JBQ2IsWUFBWTthQUNiO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLGFBQWEsRUFBRSxJQUFJO2FBQ3BCO1NBQ0Y7S0FDRjtDQUNGLENBQUE7QUFFRCxlQUFlLE1BQU0sQ0FBQSJ9
