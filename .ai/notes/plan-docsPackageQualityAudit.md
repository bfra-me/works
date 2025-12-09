# Docs Package Quality Audit & Enhancement Plan

The `docs` package is a comprehensive Astro Starlight documentation site with 100% package coverage (8/8 packages documented) but **zero quality assurance infrastructure**. It needs testing, linting, automated validation, and version synchronization to prevent content drift and ensure reliability.

## Steps

1. **Add Quality Infrastructure** — Install and configure `eslint.config.ts`, `vitest.config.ts`, add test/lint/type-check scripts to `package.json`, integrate `@bfra.me/eslint-config` and Vitest for content validation.

2. **Implement Automated Content Validation** — Create tests in `docs/test/` to validate MDX syntax, check for broken links (internal/external), verify code examples are syntactically valid, ensure all 16 MDX files have required frontmatter fields.

3. **Automate Version Synchronization** — Integrate `@bfra.me/doc-sync` to pull package versions from `package.json` files, replace hardcoded version badges in 8 package MDX files with dynamic values, add sync script to `package.json`.

4. **Add CI/CD Integration** — Create quality gate scripts (`pnpm validate` pattern), add to root monorepo CI workflow to run on docs changes, enable broken link detection and spell-checking in CI pipeline.

5. **Clean Up & Document** — Remove Starlight template file `reference/example.md`, remove unused TypeScript path mappings from `tsconfig.json`, create `CONTRIBUTING.md` for documentation guidelines, add `CHANGELOG.md` for tracking docs updates.

## Further Considerations

1. **Testing Scope** — Should content validation include executing code examples (extract/compile), or just syntax checking? Running examples requires setting up test fixtures and may be complex.

2. **Link Checking Strategy** — Check external links (may be flaky/slow) or internal links only? Consider implementing caching for external link validation to avoid rate limits during development.

3. **Automated Version Updates** — Trigger version sync via pre-commit hook, manual script, or CI workflow? Pre-commit ensures versions never drift but adds overhead to every commit.
