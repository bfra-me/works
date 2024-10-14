---
"@api/test-utils": minor
"@bfra.me/api-core": minor
---

Add a fork of [`@readme/api-core`](https://github.com/readmeio/api/tree/main/packages/core) as `@bfra.me/api-core`:

- Use `git subtree` to add `@readme/api-core` and `@api/test-utils` as forks
- Patch `@bfra.me/api-core` with these PRs:
  - readmeio/api#820, to fix issues bundling `@readme/api-core` for the browser
  - readmeio/api#935, to upgrade `@readme/httpsnippet` dependency
- Adjust forked packages to build, lint, and test within the `@bfra.me/works` monorepo
  