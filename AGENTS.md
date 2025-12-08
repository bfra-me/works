# AGENTS.md

> Agent-focused context and instructions for working with the bfra.me/works monorepo.

## Project Overview

TypeScript-centric monorepo providing reusable tooling for modern JavaScript/TypeScript development:

- **@bfra.me/eslint-config** – Shared ESLint configuration with TypeScript/Prettier/Vitest support
- **@bfra.me/prettier-config** – Prettier configuration variants
- **@bfra.me/tsconfig** – Strict TypeScript configurations for libraries and apps
- **@bfra.me/es** – ES utilities: Result type, async helpers, functional utilities, type guards, validation
- **@bfra.me/create** – CLI for project scaffolding from customizable templates (supports AI enhancement)
- **@bfra.me/badge-config** – Badge URL generation for Shields.io
- **@bfra.me/semantic-release** – Semantic-release presets
- **@bfra.me/doc-sync** – Documentation synchronization utilities
- **@bfra.me/workspace-analyzer** – Comprehensive monorepo static analysis with CLI and API

All packages target ES2022+/Node.js 20+. Uses pnpm 10+ workspaces with ESM throughout.

## Setup Commands

```bash
pnpm bootstrap          # Install dependencies (prefer-offline mode)
pnpm install            # Standard install
pnpm prepare            # Sync docs, setup husky hooks
```

## Development Workflow

```bash
pnpm validate           # Full validation: type-check → build → lint → test → type-coverage
pnpm build              # Build all packages (streams per package) + publint
pnpm dev                # Parallel watch across packages
pnpm watch              # Build with --watch
pnpm lint               # manypkg check + eslint
pnpm fix                # manypkg fix + eslint --fix
pnpm type-check         # TypeScript noEmit check
pnpm type-coverage      # Type coverage analysis
pnpm analyze            # Run workspace static analysis
```

## Package Navigation

Use the `name` field in each package's `package.json` to identify packages:

| Package                        | Location                        | Description                       |
| ------------------------------ | ------------------------------- | --------------------------------- |
| `@bfra.me/eslint-config`       | `packages/eslint-config/`       | Shared ESLint config              |
| `@bfra.me/prettier-config`     | `packages/prettier-config/`     | Prettier config                   |
| `@bfra.me/tsconfig`            | `packages/tsconfig/`            | TypeScript configs                |
| `@bfra.me/es`                  | `packages/es/`                  | ES utilities with subpath exports |
| `@bfra.me/create`              | `packages/create/`              | Project creation CLI              |
| `@bfra.me/badge-config`        | `packages/badge-config/`        | Badge URL generation              |
| `@bfra.me/semantic-release`    | `packages/semantic-release/`    | Release presets                   |
| `@bfra.me/doc-sync`            | `packages/doc-sync/`            | Documentation sync utilities      |
| `@bfra.me/workspace-analyzer`  | `packages/workspace-analyzer/`  | Monorepo static analysis CLI      |

## Testing Instructions

```bash
pnpm test                                           # Run all tests
pnpm --filter @bfra.me/es test                      # Test specific package
pnpm vitest run packages/es/test/result.test.ts    # Test specific file
pnpm vitest run -t "Result type"                    # Test matching pattern
pnpm vitest                                         # Watch mode
pnpm --filter @bfra.me/create test:coverage         # Coverage for specific package
```

**Test conventions:**

- Tests live in `packages/*/test/**/*.test.ts`
- Use `describe` for grouping, `it.concurrent` for independent async tests
- Use `expect.soft` for multiple assertions when available
- Fixture folders for integration scenarios
- File snapshots via `toMatchFileSnapshot`
- Vitest resolves workspace packages to TypeScript source via `conditions: ['source']`

## Code Style Guidelines

### TypeScript Patterns

- **Exports:** Explicit named exports only; avoid `export *` in application code
- **Result handling:** Use `Result<T, E>` from `@bfra.me/es/result`; never throw for expected errors
- **Naming:** Functions verb-noun (`createTemplateContext`), types PascalCase (`TemplateSource`), constants UPPER_SNAKE
- **Comments:** Explain WHY not WHAT; avoid redundant inline comments
- **Strict mode:** All packages use strict TypeScript with `noUncheckedIndexedAccess`

### File Organization

- Each package has `src/index.ts` as explicit barrel entry
- Build output goes to `lib/` (via tsup), except `@bfra.me/create` uses `dist/`
- Config files: `eslint.config.ts`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`

### Linting & Formatting

```bash
pnpm lint                    # Check lint issues
pnpm fix                     # Auto-fix lint issues
pnpm inspect-eslint-config   # Inspect ESLint config
pnpm lint-packages           # Lint packages for publishing issues
```

Prettier config at `packages/prettier-config/prettier.config.cjs` (referenced by root).

## Build Order

Config packages must build before dependents:

1. `@bfra.me/tsconfig` (no build step, just tsconfig.json)
2. `@bfra.me/prettier-config`
3. `@bfra.me/eslint-config`
4. All other packages

The `pnpm build` command handles this automatically via streaming.

## Package-Specific Commands

### @bfra.me/eslint-config

```bash
pnpm --filter @bfra.me/eslint-config run generate-types    # Generate rule types
pnpm --filter @bfra.me/eslint-config run dev               # Run config inspector
pnpm --filter @bfra.me/eslint-config run build-inspector   # Build inspector for deployment
```

### @bfra.me/create

```bash
pnpm --filter @bfra.me/create run dev     # Run CLI in dev mode with tsx
pnpm --filter @bfra.me/create run start   # Run built CLI
```

### @bfra.me/workspace-analyzer

```bash
pnpm analyze                              # Run workspace analysis
pnpm --filter @bfra.me/workspace-analyzer run dev     # Run CLI in dev mode
workspace-analyzer --interactive          # Interactive analyzer selection
workspace-analyzer --json > report.json   # JSON output for CI
```

### @bfra.me/es

Subpath exports for tree-shaking:

```typescript
import { debounce, retry, throttle } from '@bfra.me/es/async'
import { compose, curry, pipe } from '@bfra.me/es/functional'
import { err, isErr, isOk, ok } from '@bfra.me/es/result'
import { Brand, isNumber, isString } from '@bfra.me/es/types'
import { createValidator } from '@bfra.me/es/validation'
import { createWatcher } from '@bfra.me/es/watcher'
import { getEnv, requireEnv } from '@bfra.me/es/env'
import { createAppError, isAppError } from '@bfra.me/es/error'
```

## Release Workflow

```bash
pnpm changeset           # Create a changeset for your changes
pnpm version-changesets  # Version packages (used by CI)
pnpm publish-changesets  # Publish packages (used by CI)
pnpm clean-changesets    # Clean old changesets
```

**Changeset guidelines:**

- Every publishable change needs a changeset
- Patch: bug fixes
- Minor: new non-breaking features
- Major: breaking API changes (requires explicit rationale)

## CI Pipeline

The CI workflow (`.github/workflows/main.yaml`) runs:

1. **Prepare** – Install dependencies via `.github/actions/pnpm-install`
2. **Lint** – `pnpm lint` + type coverage check
3. **Test** – `pnpm test`
4. **Build** – `pnpm build`
5. **Analyze** – `pnpm analyze` workspace analysis (allows failures)

All checks must pass before merging to main.

The Release workflow (`.github/workflows/release.yaml`) handles:

- Automated changeset PR management
- Package publishing on merge to main
- Scheduled releases every Sunday at 6 PM UTC

## PR Guidelines

- **Title format:** `[package-name] Brief description` or `feat(scope): description`
- **Required checks:** lint, test, build must pass
- **Before committing:** Run `pnpm validate` locally
- **Changesets:** Include for publishable changes
- **Lint-staged:** Runs ESLint auto-fix on commit via husky

## Common Tasks

### Adding a New Package

Minimal files needed:

```text
packages/new-package/
├── package.json      # exports, scripts, dependencies
├── src/index.ts      # explicit barrel exports
├── tsconfig.json     # extends @bfra.me/tsconfig
├── eslint.config.ts  # uses defineConfig from @bfra.me/eslint-config
├── tsup.config.ts    # build configuration
├── vitest.config.ts  # test configuration
├── test/new-package.test.ts
└── README.md
```

Remember to add the package to root `tsconfig.json` references and path mappings.

### Working with Result Type

```typescript
import { err, isErr, isOk, ok, unwrap, unwrapOr } from '@bfra.me/es/result'

// Return structured results instead of throwing
function parseConfig(input: string): Result<Config, ParseError> {
  if (!input) return err({ message: 'Empty input' })
  return ok(JSON.parse(input))
}

// Handle results
const result = parseConfig(data)
if (isOk(result)) {
  console.log(result.value)
} else {
  console.error(result.error.message)
}
```

### Running Specific Tests

```bash
pnpm --filter @bfra.me/es test                       # Single package
pnpm vitest run packages/es/test/result.test.ts     # Single file
pnpm vitest run -t "should handle errors"            # Pattern match
pnpm --filter @bfra.me/create test:ui                # Interactive UI
```

## Troubleshooting

### Build Failures

```bash
pnpm clean       # Remove build artifacts and caches
pnpm bootstrap   # Reinstall dependencies
pnpm build       # Rebuild all packages
```

### Type Errors After Changes

```bash
pnpm type-check            # Check for type errors
pnpm type-coverage:detail  # See specific coverage issues
```

### Lint Errors

```bash
pnpm lint   # Check issues
pnpm fix    # Auto-fix where possible
```

### Workspace Package Resolution Issues

Vitest resolves workspace packages to TypeScript source via `conditions: ['source']`. Ensure packages export `source` field in package.json exports.

## Security Notes

- Never commit real API keys/secrets; use placeholders like `<API_KEY>`
- Validate/sanitize user-provided template paths before filesystem writes
- AI features (`@bfra.me/create`) require `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` environment variables
- Use `@bfra.me/es/env` for safe environment variable access

## Additional Resources

- **llms.txt** – Full documentation index for AI tools
- **CLAUDE.md** – Claude-specific instructions
- **docs/** – Astro Starlight documentation site
