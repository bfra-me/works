import type {Config} from '../config'
import {sortOrder} from 'sort-package-json'

/**
 * Creates an ESLint configuration for sorting package.json files.
 *
 * This function returns a configuration that enforces consistent ordering of:
 * - Array values in the `files` field (ascending order)
 * - Object keys at the root level using a custom sort order
 * - Dependencies sections (dependencies, devDependencies, etc.) in alphabetical order
 * - Package manager overrides (resolutions, overrides, pnpm.overrides) in alphabetical order
 * - Workspace catalog entries in alphabetical order
 * - Export conditions in a specific order (types, import, require, default)
 * - Git hooks in execution order for client-side hooks
 *
 * @returns An array containing a single ESLint configuration object for package.json files
 */
export function sortPackageJson(): Config[] {
  return [
    {
      name: '@bfra.me/sort/package-json',
      files: ['**/package.json'],
      rules: {
        'jsonc/sort-array-values': [
          'error',
          {
            order: {type: 'asc'},
            pathPattern: '^files$',
          },
        ],
        'jsonc/sort-keys': [
          'error',
          {
            order: sortOrder,
            pathPattern: '^$',
          },
          {
            order: {type: 'asc'},
            pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$',
          },
          {
            order: {type: 'asc'},
            pathPattern: '^(?:resolutions|overrides|pnpm.overrides)$',
          },
          {
            order: {type: 'asc'},
            pathPattern: String.raw`^workspaces\.catalog$`,
          },
          {
            order: {type: 'asc'},
            pathPattern: String.raw`^workspaces\.catalogs\.[^.]+$`,
          },
          {
            order: ['types', 'import', 'require', 'default'],
            pathPattern: '^exports.*$',
          },
          {
            order: [
              // client hooks only
              'pre-commit',
              'prepare-commit-msg',
              'commit-msg',
              'post-commit',
              'pre-rebase',
              'post-rewrite',
              'post-checkout',
              'post-merge',
              'pre-push',
              'pre-auto-gc',
            ],
            pathPattern: '^(?:gitHooks|husky|simple-git-hooks)$',
          },
        ],
      },
    },
  ]
}
