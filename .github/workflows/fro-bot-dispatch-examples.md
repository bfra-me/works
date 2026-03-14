# Fro Bot workflow_dispatch Prompt Examples

Use these as inputs to the `workflow_dispatch` prompt. Each example includes the intent and expected outcome. Adjust scope and package names as needed.

## Autoheal PRs

- **Prompt**: `Fix failing CI in @bfra.me/create: diagnose logs, apply minimal fixes, run pnpm validate, push updates, and summarize.`
  - **Intent**: Fix failing checks on PRs related to a specific package.
  - **Expected outcome**: One or more PR branches updated with minimal fixes and a clear summary of changes.

- **Prompt**: `Find PRs failing due to tests in packages/es: fix the root cause, run pnpm validate, and update each PR with a concise comment.`
  - **Intent**: Target failing tests in a specific package.
  - **Expected outcome**: Test failures addressed with minimal diffs and updated PRs.

- **Prompt**: `Repair the oldest PR with failing checks: identify the failure, fix it, run pnpm validate, and push a minimal update.`
  - **Intent**: Prioritize the oldest failing PR to reduce backlog.
  - **Expected outcome**: The selected PR is updated with fixes and a summary.

## Security

- **Prompt**: `Remediate security vulnerabilities across the repo: prioritize runtime deps, avoid unrelated bumps, and open PRs with clear remediation notes.`
  - **Intent**: Address known security issues with minimal dependency updates.
  - **Expected outcome**: Vulnerable dependencies updated; changes summarized.

- **Prompt**: `Check for high/critical vulnerabilities: fix via minimal upgrades, run pnpm validate, and open/refresh PRs.`
  - **Intent**: Focus only on the most severe vulnerabilities.
  - **Expected outcome**: PRs opened or updated with necessary fixes.

- **Prompt**: `Audit dependencies for risky/abandoned packages: propose replacements and open a scoped PR if the swap is safe.`
  - **Intent**: Identify risky/abandoned dependencies.
  - **Expected outcome**: Report or PR with recommended replacements.

## Health Checks & Maintenance

- **Prompt**: `Upgrade major versions of dev tooling (eslint, vitest, tsup): create one PR per major bump, run pnpm validate, and document breakages.`
  - **Intent**: Keep dev tooling current.
  - **Expected outcome**: Dependency upgrades with compatibility fixes.

- **Prompt**: `Resolve deprecations and warnings across the repo: address root causes, run pnpm validate, and summarize what changed.`
  - **Intent**: Eliminate deprecation warnings in build/test/lint.
  - **Expected outcome**: Updated configs or deps to remove warnings.

- **Prompt**: `Refresh package metadata and align versions across configs: standardize fields, scripts, and engines.`
  - **Intent**: Keep package metadata consistent.
  - **Expected outcome**: Standardized metadata and version alignment.

## DX (Developer Experience)

- **Prompt**: `Ensure linting/formatting rules are consistent across packages: align ESLint/Prettier configs and fix drift.`
  - **Intent**: Normalize lint/format configs.
  - **Expected outcome**: Config alignment and reduced rule drift.

- **Prompt**: `Improve static analysis consistency (type coverage, lint-packages): fix failures and align thresholds.`
  - **Intent**: Keep static analysis signals consistent.
  - **Expected outcome**: Adjusted tooling/configs to reduce inconsistency.

- **Prompt**: `Standardize scripts in package.json (lint, test, build) across packages: align with root conventions.`
  - **Intent**: Align developer workflows.
  - **Expected outcome**: Uniform scripts and documentation updates if needed.

## Targeted Scope

- **Prompt**: `Autoheal only packages/workspace-analyzer for failing checks: fix, run pnpm validate, and push the minimal patch.`
  - **Intent**: Contain scope to one package.
  - **Expected outcome**: Changes limited to that package.

- **Prompt**: `Focus on docs/ validation: run docs validation, fix failing docs tests, and summarize changes.`
  - **Intent**: Limit scope to the documentation site.
  - **Expected outcome**: Docs fixes with passing docs validation.

## Docs / Metadata

- **Prompt**: `Sync README badges and version references across docs: update mismatches and validate docs.`
  - **Intent**: Ensure documentation reflects current package versions.
  - **Expected outcome**: Updated badges/refs and a clear summary.

- **Prompt**: `Update contribution docs to reflect current tooling and scripts: keep instructions aligned with pnpm workflows.`
  - **Intent**: Keep contributor guidance current.
  - **Expected outcome**: Updated docs with consistent instructions.

## Modernization / Beyond Maintenance

- **Prompt**: `Modernize the workspace to latest stable Node 20+ tooling: upgrade tsup/vitest/tsconfig, update configs, and fix any breaking changes.`
  - **Intent**: Move the repo to modern tooling baselines.
  - **Expected outcome**: Updated tooling with compatibility fixes and clear summary of breaking changes.

- **Prompt**: `Preemptively tackle the next major TypeScript upgrade: update configs, resolve strictness issues, and open PRs per package if needed.`
  - **Intent**: Reduce risk of future TS upgrades by handling issues early.
  - **Expected outcome**: PRs that prepare packages for the next TS major with minimal diffs.

- **Prompt**: `Improve developer feedback loops: speed up pnpm validate by caching or restructuring scripts without changing behavior.`
  - **Intent**: Optimize dev workflow performance without altering outputs.
  - **Expected outcome**: Faster validation scripts with identical results.

- **Prompt**: `Harden release readiness: audit changeset setup, ensure package exports are accurate, and fix any release blockers.`
  - **Intent**: Prevent release regressions before they occur.
  - **Expected outcome**: PRs that resolve release-related issues and improve reliability.
