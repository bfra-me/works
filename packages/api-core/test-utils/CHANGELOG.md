# @api/test-utils

## 0.1.0
### Minor Changes



- Add a fork of [`@readme/api-core`](https://github.com/readmeio/api/tree/main/packages/core) as `@bfra.me/api-core`:  
  - Use `git subtree` to add `@readme/api-core` and `@api/test-utils` as forks
  - Patch `@bfra.me/api-core` with readmeio/api#820, to fix issues bundling `@readme/api-core` for the browser
  - Adjust forked packages to build, lint, and test within the `@bfra.me/works` monorepo (by [@marcusrbrown](https://github.com/marcusrbrown) with [#443](https://github.com/bfra-me/works/pull/443))
