# @api/test-utils

## 0.1.4
### Patch Changes


- Updated dependency `vitest` to `2.1.8`. ([#719](https://github.com/bfra-me/works/pull/719))
  Updated dependency `@vitest/coverage-v8` to `2.1.8`.

- Updated dependency `vitest` to `2.1.7`. ([#717](https://github.com/bfra-me/works/pull/717))
  Updated dependency `@vitest/coverage-v8` to `2.1.7`.

## 0.1.3
### Patch Changes


- Updated dependency `vitest` to `2.1.6`. ([#686](https://github.com/bfra-me/works/pull/686))
  Updated dependency `@vitest/coverage-v8` to `2.1.6`.

## 0.1.2
### Patch Changes


- Updated dependency `vitest` to `2.1.5`. ([#626](https://github.com/bfra-me/works/pull/626))
  Updated dependency `@vitest/coverage-v8` to `2.1.5`.

- Updated dependency `@readme/oas-to-har` to `24.0.2`. ([#640](https://github.com/bfra-me/works/pull/640))
  Updated dependency `oas` to `25.0.4`.

## 0.1.1
### Patch Changes


- Update oas to v25 and @readme/oas-to-har to v4. ([#549](https://github.com/bfra-me/works/pull/549))


- Pin dependencies. ([#549](https://github.com/bfra-me/works/pull/549))

## 0.1.0
### Minor Changes



- Add a fork of [`@readme/api-core`](https://github.com/readmeio/api/tree/main/packages/core) as `@bfra.me/api-core`:  
  - Use `git subtree` to add `@readme/api-core` and `@api/test-utils` as forks
  - Patch `@bfra.me/api-core` with readmeio/api#820, to fix issues bundling `@readme/api-core` for the browser
  - Adjust forked packages to build, lint, and test within the `@bfra.me/works` monorepo (by [@marcusrbrown](https://github.com/marcusrbrown) with [#443](https://github.com/bfra-me/works/pull/443))
