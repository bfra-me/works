# Fro Bot workflow_dispatch Prompt Examples

Use these as inputs to the `workflow_dispatch` prompt. Each example includes the intent and expected outcome. Adjust scope and package names as needed.

## PR Failure Analysis

- **Prompt**: `Analyze failing CI in @bfra.me/create: diagnose logs, identify minimal fixes, run pnpm validate if non-mutating, and summarize.`
  - **Intent**: Diagnose failing checks on PRs related to a specific package.
  - **Expected outcome**: A report with the root cause, affected paths, proposed minimal fixes, and any safe validation results; PR branches remain unchanged.

- **Prompt**: `Find PRs failing due to tests in packages/es: diagnose the root cause, run pnpm validate if non-mutating, and report each finding concisely.`
  - **Intent**: Target failing tests in a specific package.
  - **Expected outcome**: A report with each test failure's diagnosis, affected paths, proposed minimal change, and safe validation results; PRs remain unchanged.

- **Prompt**: `Analyze the oldest PR with failing checks: identify the failure, propose a minimal fix, run pnpm validate if non-mutating, and report the diagnosis.`
  - **Intent**: Prioritize the oldest failing PR to reduce backlog.
  - **Expected outcome**: A report with the selected PR's failure diagnosis, proposed minimal change, and safe validation results; the PR remains unchanged.

## Security

- **Prompt**: `Audit security vulnerabilities across the repo: prioritize runtime deps, avoid unrelated bumps, and report clear remediation notes.`
  - **Intent**: Identify known security issues and propose minimal dependency updates.
  - **Expected outcome**: Vulnerable dependencies, evidence, and proposed remediations are reported; dependency files remain unchanged.

- **Prompt**: `Check for high/critical vulnerabilities: propose minimal upgrades, run pnpm validate if non-mutating, and report the findings.`
  - **Intent**: Focus only on the most severe vulnerabilities.
  - **Expected outcome**: A report with the affected dependencies, evidence, proposed upgrades, and safe validation results; the report is the only output.

- **Prompt**: `Audit dependencies for risky/abandoned packages: propose replacements and report whether a scoped change appears safe.`
  - **Intent**: Identify risky/abandoned dependencies.
  - **Expected outcome**: A report with evidence and recommended replacements; dependency files remain unchanged.

## Health Checks & Maintenance

- **Prompt**: `Assess major versions of dev tooling (eslint, vitest, tsup): identify compatibility risks, run pnpm validate if non-mutating, and document breakages.`
  - **Intent**: Evaluate whether dev tooling is current and compatible.
  - **Expected outcome**: A report with compatibility risks, affected paths, proposed upgrades, and any safe validation results; dependencies remain unchanged.

- **Prompt**: `Analyze deprecations and warnings across the repo: diagnose root causes, run pnpm validate if non-mutating, and summarize proposed changes.`
  - **Intent**: Identify the causes of deprecation warnings in build/test/lint.
  - **Expected outcome**: A report with warning evidence, root-cause diagnoses, proposed config or dependency changes, and safe validation results.

- **Prompt**: `Audit package metadata and version alignment across configs: identify mismatches and report proposed standardization of fields, scripts, and engines.`
  - **Intent**: Check package metadata for consistency.
  - **Expected outcome**: A report with metadata mismatches and proposed standardization; package files remain unchanged.

## DX (Developer Experience)

- **Prompt**: `Audit linting/formatting rules across packages: identify ESLint/Prettier drift and report proposed alignment.`
  - **Intent**: Diagnose inconsistencies in lint/format configs.
  - **Expected outcome**: A report with the affected configs, rule drift diagnosis, and proposed alignment; files remain unchanged.

- **Prompt**: `Analyze static analysis consistency (type coverage, lint-packages): diagnose failures and report corrective changes without weakening thresholds.`
  - **Intent**: Diagnose inconsistencies in static analysis signals.
  - **Expected outcome**: A report with failure evidence, affected paths, and proposed corrective changes; tooling and thresholds remain unchanged.

- **Prompt**: `Audit scripts in package.json (lint, test, build) across packages: identify drift from root conventions and report proposed alignment.`
  - **Intent**: Align developer workflows.
  - **Expected outcome**: A report with script mismatches and proposed alignment or documentation updates; package files remain unchanged.

## Targeted Scope

- **Prompt**: `Analyze only packages/workspace-analyzer for failing checks: diagnose, run pnpm validate if non-mutating, and report the minimal proposed patch.`
  - **Intent**: Contain diagnosis to one package.
  - **Expected outcome**: A report limited to that package with failure evidence, diagnosis, proposed change, and safe validation results; files remain unchanged.

- **Prompt**: `Focus on docs/ validation: run docs validation, diagnose failing docs tests, and summarize proposed changes.`
  - **Intent**: Limit scope to the documentation site.
  - **Expected outcome**: A report with failing docs tests, diagnosis, proposed fixes, and validation results; documentation files remain unchanged.

## Docs / Metadata

- **Prompt**: `Audit README badges and version references across docs: identify mismatches and validate docs without modifying files.`
  - **Intent**: Ensure documentation reflects current package versions.
  - **Expected outcome**: A report with mismatched badges or references, proposed updates, and validation results; docs remain unchanged.

- **Prompt**: `Audit contribution docs against current tooling and scripts: identify drift from pnpm workflows and report proposed updates.`
  - **Intent**: Keep contributor guidance current.
  - **Expected outcome**: A report with documentation drift and proposed updates; docs remain unchanged.

## Modernization / Beyond Maintenance

- **Prompt**: `Assess the workspace against latest stable Node 20+ tooling: identify tsup/vitest/tsconfig compatibility risks and report proposed changes.`
  - **Intent**: Evaluate the repo's tooling baselines.
  - **Expected outcome**: A report with compatibility risks, affected paths, proposed tooling changes, and any safe validation results; files remain unchanged.

- **Prompt**: `Assess the next major TypeScript upgrade: identify config and strictness risks, and report proposed per-package changes if needed.`
  - **Intent**: Reduce risk of future TypeScript upgrades by identifying issues early.
  - **Expected outcome**: A report with package-specific risks, affected paths, and proposed changes; no repository changes are made.

- **Prompt**: `Analyze developer feedback loops: identify safe ways to speed up pnpm validate through caching or script restructuring without changing behavior.`
  - **Intent**: Evaluate dev workflow performance without altering outputs.
  - **Expected outcome**: A report with measured or reasoned bottlenecks and proposed optimizations; scripts remain unchanged.

- **Prompt**: `Audit release readiness: inspect changeset setup and package exports, diagnose release blockers, and report proposed changes.`
  - **Intent**: Identify release regressions before they occur.
  - **Expected outcome**: A report with release-blocker evidence, affected paths, and proposed changes; no repository changes are made.
