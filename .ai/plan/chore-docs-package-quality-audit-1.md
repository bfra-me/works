---
goal: Add quality infrastructure and automated validation to the docs package
version: 1.0
date_created: 2025-12-08
last_updated: 2025-12-09
owner: marcusrbrown
status: 'In Progress'
tags: ['chore', 'documentation', 'quality', 'testing', 'infrastructure']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

The `docs` package is a comprehensive Astro Starlight documentation site with complete package coverage (8/8 packages documented across 17 MDX/MD files) but lacks quality assurance infrastructure. This plan establishes testing, linting, automated content validation, and version synchronization to prevent documentation drift and ensure reliability. The docs package currently has no `eslint.config.ts`, `vitest.config.ts`, or test directory, making it the only package in the monorepo without quality tooling.

## 1. Requirements & Constraints

- **REQ-001**: All 17 documentation files must have valid MDX syntax and required frontmatter fields (`title`, `description`)
- **REQ-002**: Package version badges in 8 package MDX files must be synchronized with actual `package.json` versions
- **REQ-003**: Quality scripts must follow monorepo patterns (`lint`, `test`, `type-check`, `validate`)
- **REQ-004**: Documentation tests must not require building the full Astro site
- **SEC-001**: No sensitive information should be exposed in documentation or tests
- **CON-001**: Must use existing `@bfra.me/eslint-config` and Vitest workspace configuration
- **CON-002**: Must work with Astro Starlight's content collection system (`content.config.ts`)
- **CON-003**: Tests must run in CI without external network dependencies (internal links only initially)
- **GUD-001**: Follow TypeScript strict mode patterns established in other packages
- **GUD-002**: Use `@bfra.me/es/result` for error handling in validation utilities
- **PAT-001**: Mirror test structure from `packages/doc-sync/test/` for content validation patterns

## 2. Implementation Steps

### Implementation Phase 1: Add Quality Infrastructure

- GOAL-001: Install development dependencies and create configuration files for ESLint, Vitest, and TypeScript

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add devDependencies to `docs/package.json`: `@bfra.me/eslint-config`, `vitest`, `@vitest/coverage-v8`, `typescript` | ✅ | 2025-12-09 |
| TASK-002 | Create `docs/eslint.config.ts` using `defineConfig` from `@bfra.me/eslint-config` with Astro/MDX support | ✅ | 2025-12-09 |
| TASK-003 | Create `docs/vitest.config.ts` extending workspace Vitest configuration | ✅ | 2025-12-09 |
| TASK-004 | Add scripts to `docs/package.json`: `lint`, `test`, `type-check`, `validate` following monorepo patterns | ✅ | 2025-12-09 |
| TASK-005 | Update `docs/tsconfig.json` to remove unused path mappings (`@bfra.me/create`, `@bfra.me/eslint-config`, `@bfra.me/prettier-config`, `@bfra.me/semantic-release`, `@bfra.me/tsconfig`) | ✅ | 2025-12-09 |

### Implementation Phase 2: Implement Content Validation Tests

- GOAL-002: Create automated tests for MDX syntax validation, frontmatter verification, and code example checking

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | Create `docs/test/` directory with `content-validation.test.ts` for MDX/MD file validation | ✅ | 2025-12-09 |
| TASK-007 | Implement frontmatter validation test to verify all 17 files have required `title` and `description` fields | ✅ | 2025-12-09 |
| TASK-008 | Implement MDX syntax validation using `@astrojs/language-server` or fallback to regex-based component import checking | ✅ | 2025-12-09 |
| TASK-009 | Implement code block extraction test to validate TypeScript/JavaScript examples are syntactically correct | ✅ | 2025-12-09 |
| TASK-010 | Create `docs/test/link-validation.test.ts` for internal link checking (verify slug references match existing files) | ✅ | 2025-12-09 |

### Implementation Phase 3: Automate Version Synchronization

- GOAL-003: Replace hardcoded version badges with dynamic values synchronized from package.json files

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Create `docs/scripts/sync-versions.ts` utility to read package versions and update MDX badge components | ✅ | 2025-12-09 |
| TASK-012 | Define version mapping for 8 package MDX files: `create.mdx`, `doc-sync.mdx`, `es.mdx`, `eslint-config.mdx`, `prettier-config.mdx`, `semantic-release.mdx`, `tsconfig.mdx`, `workspace-analyzer.mdx` | ✅ | 2025-12-09 |
| TASK-013 | Add `sync-versions` script to `docs/package.json` and integrate into `pnpm prepare` workflow | ✅ | 2025-12-09 |
| TASK-014 | Create test in `docs/test/version-sync.test.ts` to verify badge versions match package.json versions | ✅ | 2025-12-09 |

### Implementation Phase 4: CI/CD Integration

- GOAL-004: Integrate docs quality checks into monorepo CI workflow

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-015 | Update `.github/workflows/main.yaml` to include docs lint/test in existing jobs or add docs-specific job | | |
| TASK-016 | Add docs package to root `pnpm validate` script scope via workspace filter | | |
| TASK-017 | Configure lint-staged in root `package.json` to run docs lint on `*.mdx` file changes | | |

### Implementation Phase 5: Clean Up & Documentation

- GOAL-005: Remove template artifacts and create documentation maintenance guidelines

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-018 | Delete `docs/src/content/docs/reference/example.md` (Starlight template file, not project-specific content) | | |
| TASK-019 | Update `docs/astro.config.mjs` sidebar to remove reference to deleted example file if needed | | |
| TASK-020 | Create `docs/CONTRIBUTING.md` with guidelines for adding new package documentation | | |
| TASK-021 | Create `docs/CHANGELOG.md` for tracking documentation updates following changeset patterns | | |
| TASK-022 | Update root `AGENTS.md` to include docs package quality tooling documentation | | |

## 3. Alternatives

- **ALT-001**: Use `remark-lint` instead of custom MDX validation — Rejected because Astro Starlight uses its own MDX processing pipeline, custom validation provides better integration
- **ALT-002**: Use external link checker like `linkinator` — Deferred to future iteration; external link checking can be flaky and slow in CI, focusing on internal links first
- **ALT-003**: Execute code examples in tests using `tsx` — Rejected for initial implementation due to complexity; syntax validation provides sufficient coverage initially
- **ALT-004**: Use `@bfra.me/doc-sync` orchestrator for version syncing — Considered but doc-sync is designed for full MDX generation, a simpler script is more appropriate for badge updates

## 4. Dependencies

- **DEP-001**: `@bfra.me/eslint-config` — Already available in workspace, provides Astro/MDX linting rules
- **DEP-002**: `vitest` — Already available in workspace root, will extend configuration
- **DEP-003**: `@vitest/coverage-v8` — For test coverage reporting consistency with other packages
- **DEP-004**: `typescript` — Required for type-checking validation utilities
- **DEP-005**: `gray-matter` — For parsing MDX frontmatter in tests (already used by doc-sync)
- **DEP-006**: `fast-glob` — For file discovery in tests (already used throughout monorepo)

## 5. Files

- **FILE-001**: `docs/package.json` — Add devDependencies and scripts
- **FILE-002**: `docs/eslint.config.ts` — New ESLint configuration file
- **FILE-003**: `docs/vitest.config.ts` — New Vitest configuration file
- **FILE-004**: `docs/tsconfig.json` — Clean up unused path mappings
- **FILE-005**: `docs/test/content-validation.test.ts` — MDX/frontmatter validation tests
- **FILE-006**: `docs/test/link-validation.test.ts` — Internal link validation tests
- **FILE-007**: `docs/test/version-sync.test.ts` — Version badge synchronization tests
- **FILE-008**: `docs/scripts/sync-versions.ts` — Version synchronization utility
- **FILE-009**: `docs/src/content/docs/reference/example.md` — Delete (template artifact)
- **FILE-010**: `docs/CONTRIBUTING.md` — New documentation guidelines
- **FILE-011**: `docs/CHANGELOG.md` — New changelog for docs updates
- **FILE-012**: `.github/workflows/main.yaml` — Add docs quality checks
- **FILE-013**: Root `package.json` — Update lint-staged for MDX files

## 6. Testing

- **TEST-001**: Verify all 17 MDX/MD files pass frontmatter validation (required fields: `title`, `description`)
- **TEST-002**: Verify MDX component imports are valid (`Badge`, `Card`, `CardGrid`, `Tabs`, `TabItem`, etc.)
- **TEST-003**: Verify code blocks with `typescript` or `javascript` language tags are syntactically valid
- **TEST-004**: Verify internal links (slug references in sidebar and cross-document links) resolve to existing files
- **TEST-005**: Verify version badges in 8 package MDX files match corresponding `package.json` versions
- **TEST-006**: Verify ESLint passes with no errors on all MDX/TS files in docs package
- **TEST-007**: Verify docs build (`pnpm --filter docs build`) succeeds after quality infrastructure changes

## 7. Risks & Assumptions

- **RISK-001**: MDX syntax validation may have false positives due to Astro Starlight's custom component handling — Mitigation: Start with lenient validation rules and tighten over time
- **RISK-002**: Version synchronization script could break if package MDX structure changes — Mitigation: Use stable regex patterns and add snapshot tests
- **RISK-003**: Adding docs to CI could increase build times significantly — Mitigation: Run docs checks in parallel with existing jobs
- **ASSUMPTION-001**: Astro Starlight content collection (`content.config.ts`) schema is stable and won't change significantly
- **ASSUMPTION-002**: All workspace packages follow consistent `package.json` structure with `version` field
- **ASSUMPTION-003**: The 8 package documentation files will continue to use `<Badge text="vX.X.X" variant="note" />` pattern for versions

## 8. Related Specifications / Further Reading

- [Astro Starlight Documentation](https://starlight.astro.build/)
- [Vitest Configuration Guide](https://vitest.dev/config/)
- [@bfra.me/eslint-config README](../../packages/eslint-config/readme.md)
- [@bfra.me/doc-sync README](../../packages/doc-sync/README.md)
- [MDX Frontmatter Documentation](https://mdxjs.com/guides/frontmatter/)
- [plan-docsPackageQualityAudit.md](../notes/plan-docsPackageQualityAudit.md) — Original audit notes
