---
applyTo: '.github/workflows/release.yaml'
description: Patterns, pitfalls, and improvement checklist derived from a real refactor of a Changesets-based Release workflow. Apply these when reviewing or improving a similar Release workflow that uses workflow_run chaining, GitHub App tokens, and PR auto-merge.
---

# Release Workflow Improvement Instructions

## Context

This document captures findings and patterns from improving a Release workflow in a TypeScript monorepo that uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing. The workflow:

- Creates and updates a release PR (`changeset-release/main`) via `changesets/action`
- Merges it automatically when CI passes
- Triggers downstream Renovate runs after publishing

---

## Trigger Design

### Problem: `push` on main fires too broadly

Using `on: push: branches: [main]` triggers the Release workflow on every commit merged to main, including dependency updates, docs changes, and no-op commits. This creates unnecessary runs, competes with CI as a concurrency peer, and does not guarantee CI has passed before releasing.

### Solution: Chain from CI via `workflow_run`

Replace the `push` trigger with `workflow_run` pointing at the CI workflow:

```yaml
on:
  workflow_run:
    workflows: [Main]  # must match the CI workflow's `name:` exactly
    branches: [main]
    types: [completed]
```

**Critical**: `workflow_run` fires for both successful and failed runs. Always guard the entry job with a success check:

```yaml
jobs:
  manage-release:
    if: github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success'
```

Without this guard the Release workflow runs — and can create or update a release PR — even when CI has just failed.

### Downstream trigger chain

When Renovate (or any other post-release workflow) was previously triggered by `workflow_run` on the CI workflow, update it to trigger from the Release workflow instead. This ensures Renovate runs only after a publish has actually occurred, not after every CI run:

```yaml
# renovate.yaml
on:
  workflow_run:
    workflows: [Release]   # was: [Main]
    branches: [main]
    types: [completed]
```

Apply the same success guard in the Renovate job:

```yaml
jobs:
  renovate:
    if: github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success'
```

---

## Concurrency

### Problem: `cancel-in-progress: true` kills in-flight releases

With `workflow_run` as the trigger, a new Main run completing will enqueue a new Release run under the same concurrency group key. If a release is already in progress (e.g., running `pnpm publish`), it will be canceled mid-flight, leaving packages in a partially published state.

### Solution: Disable cancellation for the Release workflow

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false
```

New runs queue behind the current run instead of canceling it.

---

## GitHub App Token Scope

### Problem: App token requested on events that don't need it

When the workflow used `push` as a trigger alongside `schedule`, the `USE_APP_TOKEN` expression included `push`:

```yaml
# Before
USE_APP_TOKEN: ${{ contains('["push", "schedule"]', github.event_name) }}
```

After switching to `workflow_run`, the push-triggered path is gone, but `workflow_run` events do need the app token (to commit changesets with a bot identity so branch protection doesn't block the commit and so CI re-triggers). Update accordingly:

```yaml
# After
USE_APP_TOKEN: ${{ contains('["schedule", "workflow_run"]', github.event_name) }}
```

**Rule of thumb**: App tokens are needed when the workflow will be creating commits or PRs under a bot identity — typically all automated triggers. `workflow_dispatch` (human-initiated) can usually rely on the actor's `GITHUB_TOKEN`.

---

## Skipping Expensive Steps When They Are Not Needed

### Problem: Checkout and dependency install run unconditionally

The `checkout` and `pnpm-install` steps were always executed, even when the `changesets` step would be skipped (because a mergeable release PR already exists). A full `pnpm install` in a large monorepo is expensive and provides no value in this code path.

### Solution: Mirror the `changesets` step condition on the setup steps

The `changesets` step already had:

```yaml
if: steps.check-pr.outputs.pr-exists == 'false' || steps.check-pr.outputs.mergeable == 'false'
```

Apply the exact same condition to `checkout` and `prepare`:

```yaml
- name: Checkout repository
  if: steps.check-pr.outputs.pr-exists == 'false' || steps.check-pr.outputs.mergeable == 'false'
  uses: actions/checkout@...

- name: Prepare job
  if: steps.check-pr.outputs.pr-exists == 'false' || steps.check-pr.outputs.mergeable == 'false'
  uses: ./.github/actions/pnpm-install
```

When the PR exists and is already mergeable the job completes after `check-pr` with only the lightweight `gh` CLI calls.

---

## Avoiding Unnecessary PR Updates on workflow_run

### Problem: PR closes and reopens on every CI completion

With `workflow_run` as a trigger, the Release workflow runs after every successful CI completion on main — which happens on every merged PR, even those that don't add any changesets. If the changesets action runs when there are no new changesets to process, it still performs a force push to the release branch, causing GitHub to close the PR automatically, and then the action reopens it.

This creates noisy PR activity:

```
bfra-me[bot] closed this 4 hours ago
bfra-me[bot] force-pushed the changeset-release/main branch
bfra-me[bot] reopened this 4 minutes ago
```

This happens because:

1. The `changesets/action` with `commitMode: github-api` force-pushes to update the branch
2. GitHub automatically closes PRs when their branch is force-pushed
3. The action then calls `octokit.rest.pulls.update(..., state: "open")` to reopen it
4. This entire cycle happens even when there are no actual changes to make

### Why the naive workflow_run condition is wrong

A simple condition like:

```yaml
if: |
  steps.check-pr.outputs.pr-exists == 'false' ||
  steps.check-pr.outputs.mergeable == 'false' ||
  github.event_name == 'workflow_run'
```

runs the changesets action on **every** `workflow_run` trigger, regardless of whether there are new changesets. This is the root cause of the close/reopen cycle.

### Solution: Check for uncommitted changesets before running the action

Add a conditional check that inspects whether there are uncommitted changesets on main before running the changesets action on `workflow_run` events:

```yaml
- id: check-changesets
  name: Check for uncommitted changesets
  if: github.event_name == 'workflow_run' && steps.check-pr.outputs.pr-exists == 'true'
  run: |
    # Check if there are any uncommitted changesets
    if pnpm changeset status --output=json 2>/dev/null | jq -e '.releases | length > 0' >/dev/null; then
      echo "has-changesets=true" >> $GITHUB_OUTPUT
      echo "Found uncommitted changesets"
    else
      echo "has-changesets=false" >> $GITHUB_OUTPUT
      echo "No uncommitted changesets"
    fi
  shell: 'bash -Eeux {0}'

- id: changesets
  name: Create Release Pull Request or Publish to npm
  if: |
    steps.check-pr.outputs.pr-exists == 'false' ||
    steps.check-pr.outputs.mergeable == 'false' ||
    (github.event_name == 'workflow_run' && steps.check-pr.outputs.pr-exists == 'true' && steps.check-changesets.outputs.has-changesets == 'true')
```

**Key insight**: The changesets action should only run on `workflow_run` when:

- **No PR exists** → Create the PR or publish (if PR was just merged)
- **PR is behind** → Update the PR to catch up with main
- **PR exists AND there are new changesets** → Update the PR with new versions

Importantly, when a PR exists, is mergeable, AND there are no new changesets, the workflow should do nothing — letting the existing PR proceed toward auto-merge without interference.

### Alternative: Use changeset status exit code

The `changeset status` command exits with code 1 when there are uncommitted changesets, and 0 when clean. You can use this directly:

```yaml
- id: check-changesets
  name: Check for uncommitted changesets
  if: github.event_name == 'workflow_run' && steps.check-pr.outputs.pr-exists == 'true'
  run: |
    if pnpm changeset status >/dev/null 2>&1; then
      echo "has-changesets=false" >> $GITHUB_OUTPUT
    else
      echo "has-changesets=true" >> $GITHUB_OUTPUT
    fi
  shell: bash
```

Note the inverted logic: exit code 0 = no changesets, exit code 1 = has changesets.

---

## PR Status Check Logic

### Problem: `grep | string equality` misclassifies mixed conclusions

A common pattern for checking whether PR checks have passed:

```bash
STATUS=$(gh pr view $PR_NUMBER --json statusCheckRollup \
  --jq '.statusCheckRollup[].conclusion' | sort -u | grep 'SUCCESS' || echo 'PENDING')
if [ "$STATUS" = "SUCCESS" ]; then ...
```

This has two bugs:

1. **Multi-line match**: When there are multiple distinct conclusions (e.g., both `SUCCESS` and `FAILURE`), `grep 'SUCCESS'` outputs the matching line(s), not the string `"SUCCESS"`. The subsequent `[ "$STATUS" = "SUCCESS" ]` equality test fails because `STATUS` is multi-line, causing a falsely failed classification.

2. **Inverted priority**: The original code checked for success first, which means a PR with one successful check and one failing check could be misclassified as failed (by the fallthrough `else`) rather than explicitly detected as failed.

### Solution: Check for failures first, use `grep -q` for multiline-safe matching

```bash
CONCLUSIONS=$(gh pr view $PR_NUMBER --json statusCheckRollup \
  --jq '.statusCheckRollup[].conclusion' | sort -u)

if echo "$CONCLUSIONS" | grep -qE 'FAILURE|ERROR|TIMED_OUT|CANCELLED'; then
  echo "checks-status=failed" >> $GITHUB_OUTPUT
elif echo "$CONCLUSIONS" | grep -q 'SUCCESS'; then
  echo "checks-status=success" >> $GITHUB_OUTPUT
else
  echo "checks-status=pending" >> $GITHUB_OUTPUT
fi
```

Key points:

- `grep -q` exits non-zero without printing anything — safe for multiline input.
- Failure-class conclusions (`FAILURE`, `ERROR`, `TIMED_OUT`, `CANCELLED`) are checked first. A PR with mixed conclusions is correctly marked failed.
- The pending fallback handles all-`null` or all-empty conclusions (checks still in progress or not yet created).

---

## Auto-merge Gating

The `Enable Auto-merge` step intentionally excludes `workflow_run`:

```yaml
- name: Enable Auto-merge
  if: >-
    github.event_name != 'workflow_run' &&
    steps.check-pr.outputs.pr-exists == 'true' &&
    (
      steps.check-pr.outputs.checks-status == 'pending' ||
      steps.check-pr.outputs.checks-status == 'success' ||
      inputs.force-release == true
    )
```

This means:

- **`workflow_run`**: creates or updates the release PR but does not enable auto-merge.
- **`schedule`** (weekly): enables auto-merge, allowing the PR to land on the release cadence.
- **`workflow_dispatch`** with `force-release: true`: enables auto-merge immediately on demand.

This is deliberate. Do not add `workflow_run` to the auto-merge path unless you intend for every successful CI run on main to potentially ship a release.

---

## Checklist for Reviewing a Similar Workflow

- [ ] Does the workflow trigger only after CI passes? Use `workflow_run` + success guard.
- [ ] Is `cancel-in-progress` disabled? Canceling a release mid-publish can corrupt state.
- [ ] Does the app token scope match the triggering events that need bot commits?
- [ ] Are `checkout` and dependency install skipped when the publish step would be skipped?
- [ ] Does the changesets action check for uncommitted changesets before running on `workflow_run`?
- [ ] Does PR status checking handle mixed conclusions correctly (failures checked first)?
- [ ] Does the downstream Renovate (or equivalent) chain from Release, not directly from CI?
- [ ] Is the auto-merge gate intentionally restricted to manual or scheduled events?
- [ ] Are all action references pinned to full commit SHAs?
