# @bfra.me/badge-config

## 0.2.0
### Minor Changes


- Add `githubActions` preset generator for GitHub Actions workflow status badges ([#2276](https://github.com/bfra-me/works/pull/2276))
  
  - New `githubActions()` function generates dynamic Shields.io badge URLs for GitHub Actions workflows
  - Supports custom workflow names (with automatic URL encoding for spaces/special characters)
  - Configurable options: `repository`, `workflow`, `branch`, `event`, `label`, `style`, `logo`, `logoColor`, `cacheSeconds`
  - Defaults to the `githubactions` logo
  - Exports `GitHubActionsOptions` and `GitHubActionsResult` types

## 0.1.4
### Patch Changes


- Remove unnecessary workspace dependencies. ([#2179](https://github.com/bfra-me/works/pull/2179))

## 0.1.3
### Patch Changes


- Updated dependency `tsup` to `8.5.1`. ([#2149](https://github.com/bfra-me/works/pull/2149))

## 0.1.2
### Patch Changes


- Updated dependency `@vitest/coverage-v8` to `4.0.7`. ([#2107](https://github.com/bfra-me/works/pull/2107))
  Updated dependency `@vitest/ui` to `4.0.7`.
  Updated dependency `vitest` to `4.0.7`.

- Updated dependency `@vitest/coverage-v8` to `4.0.6`. ([#2091](https://github.com/bfra-me/works/pull/2091))
  Updated dependency `@vitest/ui` to `4.0.6`.
  Updated dependency `vitest` to `4.0.6`.

## 0.1.1
### Patch Changes


- Apply linter fixes for `@bfra.me/eslint-config` 0.28.3. ([#1830](https://github.com/bfra-me/works/pull/1830))

## 0.1.0
### Minor Changes


- Add the `@bfra.me/badge-config` library. ([#1645](https://github.com/bfra-me/works/pull/1645))
