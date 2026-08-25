# Fro Bot workflow_dispatch Prompt Examples

Use these as inputs to the `workflow_dispatch` prompt. Each example includes the intent and expected outcome. Adjust scope and package names as needed.

The supported dispatch modes are `review` and `autoheal`. Autoheal may update eligible existing PR branches or open focused PRs; unsafe or non-minimal work is reported for human attention.

## PR Failure Analysis

- **Prompt**: `Analyze failing CI in @bfra.me/create: diagnose logs, identify the smallest safe fix, run pnpm validate, and deliver the fix if the PR is trusted.`
  - **Intent**: Diagnose failing checks on PRs related to a specific package.
  - **Expected outcome**: The eligible PR branch is updated with the minimal fix, validated, committed, and pushed, with a PR comment explaining the failure and fix; unsafe cases are reported with evidence.

- **Prompt**: `Find PRs failing due to tests in packages/es: diagnose each root cause, run pnpm validate, and repair trusted PRs with minimal fixes.`
  - **Intent**: Target failing tests in a specific package.
  - **Expected outcome**: Trusted PRs receive committed and pushed fixes with validation evidence and comments; skipped or unsafe PRs receive concise deferred notes.

- **Prompt**: `Analyze the oldest PR with failing checks: identify the failure, apply the smallest safe fix, run pnpm validate, and update the trusted PR.`
  - **Intent**: Prioritize the oldest failing PR to reduce backlog.
  - **Expected outcome**: The selected trusted PR is updated, validated, committed, and pushed, with the PR number and commit SHA recorded in the autohealing report.

## Security

- **Prompt**: `Audit security vulnerabilities across the repo: prioritize runtime deps, repair existing security PRs, open focused PRs for confirmed critical/high advisories, and avoid unrelated bumps.`
  - **Intent**: Identify known security issues and propose minimal dependency updates.
  - **Expected outcome**: Existing security PRs are repaired or focused PRs are opened for confirmed critical/high advisories, with validation, evidence, and PR/commit references; routine bumps remain owned by Renovate.

- **Prompt**: `Check for high/critical vulnerabilities: make the minimal security-only upgrade, run pnpm validate, and open or update the focused PR.`
  - **Intent**: Focus only on the most severe vulnerabilities.
  - **Expected outcome**: A focused security PR is opened or updated with the validated remediation, affected dependencies, evidence, and PR/commit references; unavailable data is reported without guessing.

- **Prompt**: `Audit dependencies for risky/abandoned packages: propose replacements and report whether a scoped change appears safe.`
  - **Intent**: Identify risky/abandoned dependencies.
  - **Expected outcome**: Evidence and replacement options are reported; only a clearly minimal, reversible non-routine remediation is delivered through a PR.

## Repository Health

- **Prompt**: `Assess major versions of dev tooling (eslint, vitest, tsup): identify compatibility risks, run pnpm validate if non-mutating, and document breakages.`
  - **Intent**: Evaluate whether dev tooling is current and compatible.
  - **Expected outcome**: Compatibility risks and validation results are reported, with a PR for any clearly minimal mechanical fix; routine dependency bumps remain with Renovate.

- **Prompt**: `Analyze deprecations and warnings across the repo: diagnose root causes, run pnpm validate if non-mutating, and summarize proposed changes.`
  - **Intent**: Identify the causes of deprecation warnings in build/test/lint.
  - **Expected outcome**: Warning evidence and root causes are reported, and clearly minimal code or documentation fixes are committed and pushed through a PR with validation.

- **Prompt**: `Audit package metadata and version alignment across configs: identify mismatches and report proposed standardization of fields, scripts, and engines.`
  - **Intent**: Check package metadata for consistency.
  - **Expected outcome**: Clearly mechanical metadata corrections are delivered through a validated PR; broad standardization is deferred with exact paths and verification steps.

## DX (Developer Experience)

- **Prompt**: `Audit linting/formatting rules across packages: identify ESLint/Prettier drift and report proposed alignment.`
  - **Intent**: Diagnose inconsistencies in lint/format configs.
  - **Expected outcome**: Minimal alignment fixes are committed and pushed through a PR when safe; otherwise the report includes affected paths and a cold-start deferred note.

- **Prompt**: `Analyze static analysis consistency (type coverage, lint-packages): diagnose failures and report corrective changes without weakening thresholds.`
  - **Intent**: Diagnose inconsistencies in static analysis signals.
  - **Expected outcome**: Corrective fixes that preserve thresholds are delivered through a validated PR; weakening thresholds is never attempted and is reported as skipped.

- **Prompt**: `Audit scripts in package.json (lint, test, build) across packages: identify drift from root conventions and report proposed alignment.`
  - **Intent**: Align developer workflows.
  - **Expected outcome**: Minimal script or documentation alignment is delivered through a PR with validation; broader workflow changes are deferred.

## Targeted Scope

- **Prompt**: `Analyze only packages/workspace-analyzer for failing checks: diagnose, run pnpm validate if non-mutating, and report the minimal proposed patch.`
  - **Intent**: Contain diagnosis to one package.
  - **Expected outcome**: A report limited to that package, with any safe minimal fix committed and pushed through a PR and recorded with its PR number and commit SHA.

- **Prompt**: `Focus on docs/ validation: run docs validation, diagnose failing docs tests, and summarize proposed changes.`
  - **Intent**: Limit scope to the documentation site.
  - **Expected outcome**: Documentation fixes that are minimal and reversible are committed and pushed through a PR; remaining failures include exact paths and verification instructions.

## Docs / Metadata

- **Prompt**: `Audit README badges and version references across docs: identify mismatches and validate docs without modifying files.`
  - **Intent**: Ensure documentation reflects current package versions.
  - **Expected outcome**: Mechanical documentation corrections are committed and pushed through a PR after validation, with mismatches and evidence recorded.

- **Prompt**: `Audit contribution docs against current tooling and scripts: identify drift from pnpm workflows and report proposed updates.`
  - **Intent**: Keep contributor guidance current.
  - **Expected outcome**: Clear documentation drift is corrected through a validated PR; ambiguous or broad changes are deferred with exact paths and constraints.

## Modernization / Beyond Maintenance

- **Prompt**: `Assess the workspace against Node.js 22+ tooling: identify tsup/vitest/tsconfig compatibility risks and report proposed changes.`
  - **Intent**: Evaluate the repo's tooling baselines.
  - **Expected outcome**: A report with compatibility risks and validation results, plus a PR for any clearly minimal and reversible fix.

- **Prompt**: `Assess the next major TypeScript upgrade: identify config and strictness risks, and report proposed per-package changes if needed.`
  - **Intent**: Reduce risk of future TypeScript upgrades by identifying issues early.
  - **Expected outcome**: Package-specific risks are reported; only clearly minimal, reversible compatibility fixes are delivered through a PR.

- **Prompt**: `Analyze developer feedback loops: identify safe ways to speed up pnpm validate through caching or script restructuring without changing behavior.`
  - **Intent**: Evaluate dev workflow performance without altering outputs.
  - **Expected outcome**: Measured or reasoned bottlenecks are reported, and a PR is opened only for a clearly safe mechanical optimization that preserves behavior.

- **Prompt**: `Audit release readiness: inspect changeset setup and package exports, diagnose release blockers, and report proposed changes.`
  - **Intent**: Identify release regressions before they occur.
  - **Expected outcome**: Release blockers receive minimal validated fixes through a PR when safe; broad or risky changes are deferred with exact verification steps.
