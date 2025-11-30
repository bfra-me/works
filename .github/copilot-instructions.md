# bfra.me/works – Copilot Instructions

## 1. Overview
Monorepo providing reusable TypeScript-centric tooling: shared ESLint/Prettier/TS configs, AI‑assisted project generator (`@bfra.me/create`), badge URL generation (`@bfra.me/badge-config`), semantic-release presets, and strict tsconfig packages. All packages target ES2022+/Node.js 20+. See `llms.txt` for full doc index.

## 2. Architecture & Key Relationships
- Packages live under `packages/*`; each is an independent publishable unit with explicit barrel `src/index.ts` (prefer explicit named exports, avoid `export *` in application code—config packages may use re-exports).
- Build toolchain: `tsup` per package (`tsup.config.ts`); outputs to `lib/` (or `dist/` for CLI). Shared types & lint rules consumed via workspace `@bfra.me/tsconfig` and `@bfra.me/eslint-config`.
- Ordering: Config packages (`eslint-config`, `prettier-config`, `tsconfig`) must build before dependents; orchestrated by root scripts: `pnpm validate` runs type-check → build → lint → test → type-coverage.
- CLI (`packages/create/src/`) layers: input parsing → template resolution (GitHub/local/builtin via giget) → Eta rendering → filesystem write → optional AI analysis (OpenAI/Anthropic) → post‑creation helpers.
- Badge system (`packages/badge-config/src/generators/`) composes small pure functions returning Shields.io URL strings; pattern: generator + options type + test fixture (JSON input/output).
- Release flow: Changesets in `.changeset/` → version PR via `pnpm version-changesets` → publish via `pnpm publish-changesets`.

## 3. Core Workflows (Commands)
```bash
pnpm bootstrap             # Install (prefer-offline) root + all packages
pnpm validate              # type-check → build → lint → test → type-coverage
pnpm build                 # Build all (streams per package) + publint
pnpm dev                   # Parallel watch across packages
pnpm watch                 # Alias: build with --watch
pnpm lint                  # manypkg check + eslint (workspace)
pnpm fix                   # manypkg fix + eslint --fix (no templates/fixtures)
pnpm lint-packages         # publint across packages
pnpm inspect-eslint-config # opens inspector for root config
pnpm changeset             # Create changeset entry
pnpm version-changesets    # Clean changesets → version → bootstrap → build
pnpm publish-changesets    # Publish tagged versions
```
Testing: `vitest` per package (`vitest.config.ts` or shared). Use `it.concurrent` for independent cases; prefer fixture folders for integration scenarios.

## 4. Conventions & Patterns
- Exports: Explicit named exports only; keep public API surface minimal.
- Result Handling: Use discriminated union `Result<T>`; do not throw for expected errors—return `{success:false}`.
- Naming: Functions verb-noun (`createTemplateContext`), types PascalCase (`TemplateSource`), constants UPPER_SNAKE (`DEFAULT_TEMPLATE_NAME`).
- Config Files: `eslint.config.ts` uses `defineConfig({...})`; `tsconfig.json` extends `@bfra.me/tsconfig`.
- Comments: Explain WHY (business/algorithm) not WHAT; avoid redundant inline comments; follow self‑explanatory code guideline.
- Formatting: Prettier via shared config at root (`packages/prettier-config/prettier.config.cjs` referenced by root `prettier` field).
- No `export *`; avoid leaking internal utilities (keep helpers non-exported unless tested externally).

## 5. Integration & Dependencies
- External libs: `Eta` (templating), `giget` (remote template retrieval), `@clack/prompts` (CLI UX), `changesets`, `semantic-release`, `vitest`, `tsup`.
- AI usage (optional): Requires `<OPENAI_API_KEY>` or `<ANTHROPIC_API_KEY>` in environment; fallback path must remain deterministic when absent/failing.
- Side Effects: Generators and CLI operations should minimize mutation; prefer pure helpers + orchestrator pattern.

## 6. Testing Strategy
- Location: `packages/*/test/**/*.test.ts`; avoid placing tests in `src/`.
- Patterns: Group with `describe`; multiple assertions use `expect.soft` when available; snapshot externalized via file snapshots (`toMatchFileSnapshot`).
- For new feature: add unit test + (if templating) fixture comparison; ensure build passes before snapshot creation.

## 7. Release & Versioning
- Every publishable change needs a changeset; upgrade level: patch (fix), minor (new non-breaking feature), major (breaking public API—explicit rationale required).
- Do not hand-edit `CHANGELOG.md`; auto-generated.
- Keep backward compatibility during minor/patch—deprecate before removal using JSDoc `@deprecated` tag.

## 8. Security & Privacy Safeguards
- NEVER commit or echo real API keys/secrets; use placeholders `<API_KEY>`.
- Do not document internal endpoints—use `<INTERNAL_ENDPOINT>` if needed.
- Avoid exposing unpublished template internals unless already public in repo.
- Validate and sanitize user-provided template paths before filesystem writes.
- Log minimally; prefer structured debug utilities over `console.log` (set to warn for production-like flows).

## 9. High-Impact Anti-Patterns (Avoid)
- Adding wildcard exports (`export *`) in barrels.
- Throwing generic `Error` for controllable states (use union result pattern instead).
- Coupling tests to implementation details (test public behavior / outputs only).
- Silent catch blocks—return structured failure with context.
- Mixing ESM/CommonJS (all packages declare `"type": "module"`).

## 10. When Modifying
- Preserve existing public API signatures unless change justified + changeset updated.
- Keep patches focused; do not refactor unrelated modules in same PR.
- Update or add tests alongside feature/fix.
- Re-run `pnpm validate` locally before proposing changes.

## 11. Quick Template for New Package
Minimal files: `package.json`, `src/index.ts`, `tsconfig.json`, `eslint.config.ts`, `tsup.config.ts`, `test/<name>.test.ts`, `README.md`. Exports field must map types + import to `lib/` after build.

## 12. AI Agent Guidance
- Prefer reading `package.json` scripts + existing patterns over inventing new flows.
- If uncertain about dependency order: build configs first (`eslint-config`, `prettier-config`, `tsconfig`).
- Fall back gracefully: if AI template selection fails, pick deterministic built-in template based on flags.
