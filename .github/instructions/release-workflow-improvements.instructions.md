---
applyTo: '.github/workflows/release.yaml'
description: Patterns, pitfalls, and improvement checklist derived from a real refactor of a Changesets-based Release workflow. Apply these when reviewing or improving a similar Release workflow that uses workflow_run chaining, GitHub App tokens, and manual release PR merging.
---

# Release Workflow Improvement Instructions

## Context

This document captures findings and patterns from improving a Release workflow in a TypeScript monorepo that uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing. The workflow:

- Creates and updates a release PR (`changeset-release/main`) via `changesets/action`
- Leaves release PR merging to manual review
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

After switching to `workflow_run`, the push-triggered path is gone, but `workflow_run` events and manual publish paths still need the app token. `workflow_run` uses it to commit changesets with a bot identity so branch protection doesn't block the commit and so CI re-triggers. `workflow_dispatch` uses it to configure a git identity before Changesets creates annotated tags and to retain the required repository write access. Update accordingly:

```yaml
# After
USE_APP_TOKEN: ${{ contains('["schedule", "workflow_run", "workflow_dispatch"]', github.event_name) }}
```

**Rule of thumb**: Use an App token whenever the job needs a git identity or elevated repository access, including commits, PRs, or annotated tags. Human initiation does not make `GITHUB_TOKEN` sufficient; manual publish paths may need the same App token as automated paths.

### Problem: Changesets can hide tag creation failures

Changesets logs `New tag:` before running `git tag <name> -m <name>` and does not surface a failed tag command. If no git identity is configured, annotated tag creation fails while the workflow can still report success, leaving packages published with no tags.

### Solution: Configure identity before publishing

Ensure every publish path that can create annotated tags runs `Setup Git user` before Changesets publishes.

---

## Skipping Expensive Steps When They Are Not Needed

### Problem: Checkout and dependency install run unconditionally

The `checkout` and `pnpm-install` steps were always executed, even when the `changesets` step would be skipped (because a mergeable release PR already exists). A full `pnpm install` in a large monorepo is expensive and provides no value in this code path.

### Solution: Run setup only for paths that need a working tree

The setup steps should cover every path that needs a checkout and dependencies, including an explicit force-publish path:

```yaml
if: |
  inputs.force-release == true ||
  steps.check-pr.outputs.pr-exists == 'false' ||
  steps.check-pr.outputs.mergeable == 'false' ||
  (github.event_name == 'workflow_run' && steps.check-pr.outputs.pr-exists == 'true')
```

Apply the condition to both `checkout` and `prepare`:

```yaml
- name: Checkout repository
  if: <setup condition>
  uses: actions/checkout@...

- name: Prepare job
  if: <setup condition>
  uses: ./.github/actions/pnpm-install
```

When the PR exists and is already mergeable, schedule and dispatch runs complete after the lightweight `check-pr` call; `workflow_run` also performs the lightweight changeset-file check before deciding whether to do nothing.

---

## Avoiding Unnecessary PR Updates on workflow_run

### Problem: PR closes and reopens on every CI completion

With `workflow_run` as a trigger, the Release workflow runs after every successful CI completion on main — which happens on every merged PR, even those that don't add any changesets. If the changesets action runs when there are no new changesets to process, it still performs a force push to the release branch, causing GitHub to close the PR automatically, and then the action reopens it.

This creates noisy PR activity:

```text
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
    inputs.force-release != true &&
    (
      steps.check-pr.outputs.pr-exists == 'false' ||
      steps.check-pr.outputs.mergeable == 'false' ||
      (github.event_name == 'workflow_run' && steps.check-pr.outputs.pr-exists == 'true' && steps.check-changesets.outputs.has-changesets == 'true')
    )
```

**Key insight**: The changesets action should only run on `workflow_run` when:

- **No PR exists** → Create the PR or publish (if PR was just merged; normal path)
- **PR is behind** → Update the PR to catch up with main
- **PR exists AND there are new changesets** → Update the PR with new versions

Importantly, when a PR exists, is mergeable, AND there are no new changesets, the workflow should do nothing — letting the existing PR proceed toward manual review and merge without interference.

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

## Manual Release PR Merging

Release PRs should be merged manually after review. A scheduled run with an open release PR must not merge it, and a force-publish dispatch must publish committed versions without using the release PR as an implicit merge mechanism.

Avoid adding an auto-merge step to the release workflow. A scheduled auto-merge gate can land a release without an explicit human decision, while a workflow-run path can make every successful CI completion a potential release trigger.

---

## Checklist for Reviewing a Similar Workflow

- [ ] Does the workflow trigger only after CI passes? Use `workflow_run` + success guard.
- [ ] Is `cancel-in-progress` disabled? Canceling a release mid-publish can corrupt state.
- [ ] Does App token selection cover every trigger that needs a git identity or elevated repository access, including manual publish dispatches?
- [ ] Are `checkout` and dependency install skipped when the publish step would be skipped?
- [ ] Does the changesets action check for uncommitted changesets before running on `workflow_run`?
- [ ] Does the workflow avoid making release decisions from transient PR check conclusions?
- [ ] Does the downstream Renovate (or equivalent) chain from Release, not directly from CI?
- [ ] Are release PRs left for deliberate manual review and merge rather than auto-merged on a schedule?
- [ ] Are all action references pinned to full commit SHAs?
