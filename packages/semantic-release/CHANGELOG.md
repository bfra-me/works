# @bfra.me/semantic-release

## 0.3.2
### Patch Changes


- Updated dependency `semantic-release` to `24.2.9`. ([#1892](https://github.com/bfra-me/works/pull/1892))

## 0.3.1
### Patch Changes


- Updated dependency `zod` to `4.1.5`. ([#1834](https://github.com/bfra-me/works/pull/1834))


- Updated dependency `semantic-release` to `24.2.8`. ([#1860](https://github.com/bfra-me/works/pull/1860))

## 0.3.0
### Minor Changes


- Enhance preset discovery and versioning. ([#1783](https://github.com/bfra-me/works/pull/1783))
  
  - Introduce a new module for preset discovery and installation, enabling users to find and manage semantic-release presets from various sources (npm, local, git, inline).
  - Implement preset versioning utilities to manage preset versions, detect compatibility, and facilitate migrations between versions.
  - Enhance existing presets with new options for changesets integration and improved release notes generation.

## 0.2.0
### Minor Changes


- Enhance TypeScript support and configuration utilities. ([#1764](https://github.com/bfra-me/works/pull/1764))
  
  - Rewrite `defineConfig` to include enhanced validation and type inference.
  - Introduce `ConfigBuilder` and `PluginBuilder` for fluent API construction.
  - Add factory functions for JavaScript configuration files with TypeScript support.
  - Implement preset factory functions for common workflows like npm and GitHub releases.
  - Update tests to reflect changes in configuration structure and validation.
  - Implement configuration composition utilities for merging, extending, and overriding semantic-release configurations.
  - Introduced `helpers.ts` to provide type-safe configuration functions for popular semantic-release plugins including commit-analyzer, release-notes-generator, changelog, npm, github, and git.
  - Implemented presets for commonly used plugin configurations to enhance developer experience.
  - Added comprehensive testing utilities for semantic-release plugins, including a PluginTester class for testing lifecycle hooks.
  - Created mock context objects to simulate the runtime environment for plugins.
  - Introduced builders for creating test commits, releases, and scenarios to streamline testing.
  - Implement plugin template generator for scaffolding new plugins
  - Create templates for various plugin types including analyze, generate, prepare, publish, success, fail, and verify

## 0.1.23
### Patch Changes


- Simplify type parameter for Plugin<TLookup>. ([#1626](https://github.com/bfra-me/works/pull/1626))


- Apply linter fixes from increased type-aware checks. ([#1625](https://github.com/bfra-me/works/pull/1625))

## 0.1.22
### Patch Changes


- Updated dependency `semantic-release` to `24.2.6`. ([#1469](https://github.com/bfra-me/works/pull/1469))

## 0.1.21
### Patch Changes


- Updated dependency `semantic-release` to `24.2.5`. ([#1314](https://github.com/bfra-me/works/pull/1314))

## 0.1.20
### Patch Changes


- Updated dependency `tsup` to `8.5.0`. ([#1288](https://github.com/bfra-me/works/pull/1288))


- Updated dependency `semantic-release` to `24.2.4`. ([#1291](https://github.com/bfra-me/works/pull/1291))

## 0.1.19
### Patch Changes


- Updated dependency `tsup` to `8.4.0`. ([#1000](https://github.com/bfra-me/works/pull/1000))

## 0.1.18
### Patch Changes


- Updated dependency `semantic-release` to `24.2.3`. ([#962](https://github.com/bfra-me/works/pull/962))


- Updated dependency `semantic-release` to `24.2.2`. ([#946](https://github.com/bfra-me/works/pull/946))


- Updated dependency `tsup` to `8.3.6`. ([#915](https://github.com/bfra-me/works/pull/915))

## 0.1.17
### Patch Changes


- Updated dependency `semantic-release` to `24.2.1`. ([#837](https://github.com/bfra-me/works/pull/837))

## 0.1.16
### Patch Changes


- Apply linter fixes. ([#760](https://github.com/bfra-me/works/pull/760))

## 0.1.15
### Patch Changes


- Updated dependency `vitest` to `2.1.8`. ([#719](https://github.com/bfra-me/works/pull/719))
  Updated dependency `@vitest/coverage-v8` to `2.1.8`.

- Updated dependency `type-fest` to `4.30.0`. ([#722](https://github.com/bfra-me/works/pull/722))


- Updated dependency `vitest` to `2.1.7`. ([#717](https://github.com/bfra-me/works/pull/717))
  Updated dependency `@vitest/coverage-v8` to `2.1.7`.

- Updated dependency `type-fest` to `4.29.1`. ([#716](https://github.com/bfra-me/works/pull/716))

## 0.1.14
### Patch Changes


- Updated dependency `type-fest` to `4.29.0`. ([#697](https://github.com/bfra-me/works/pull/697))

## 0.1.13
### Patch Changes


- Fix linter errors. ([#691](https://github.com/bfra-me/works/pull/691))

## 0.1.12
### Patch Changes


- Updated dependency `vitest` to `2.1.6`. ([#686](https://github.com/bfra-me/works/pull/686))
  Updated dependency `@vitest/coverage-v8` to `2.1.6`.

## 0.1.11
### Patch Changes


- Updated dependency `type-fest` to `4.28.1`. ([#682](https://github.com/bfra-me/works/pull/682))

## 0.1.10
### Patch Changes


- Updated dependency `type-fest` to `4.28.0`. ([#656](https://github.com/bfra-me/works/pull/656))


- Updated dependency `type-fest` to `4.27.1`. ([#654](https://github.com/bfra-me/works/pull/654))

## 0.1.9
### Patch Changes


- Updated dependency `@swc/core` to `1.9.2`. ([#615](https://github.com/bfra-me/works/pull/615))


- Updated dependency `type-fest` to `4.27.0`. ([#629](https://github.com/bfra-me/works/pull/629))


- Updated dependency `vitest` to `2.1.5`. ([#626](https://github.com/bfra-me/works/pull/626))
  Updated dependency `@vitest/coverage-v8` to `2.1.5`.

- Updated dependency `@swc/core` to `1.9.1`. ([#609](https://github.com/bfra-me/works/pull/609))

## 0.1.8
### Patch Changes


- Updated dependency `@swc/core` to `1.8.0`. ([#600](https://github.com/bfra-me/works/pull/600))

## 0.1.7
### Patch Changes


- Add `prepack` scripts. ([#595](https://github.com/bfra-me/works/pull/595))

## 0.1.6
### Patch Changes


- Updated dependency `@swc/core` to `1.7.42`. ([#575](https://github.com/bfra-me/works/pull/575))

## 0.1.5
### Patch Changes



- Update bundling and packaging to be consistent with other packages. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#468](https://github.com/bfra-me/works/pull/468))

## 0.1.4
### Patch Changes



- Remove `checkJs`, `composite`, and `incremental` compiler options; use relative paths for `extends` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#394](https://github.com/bfra-me/works/pull/394))

## 0.1.3

### Patch Changes

- Format `package.json` with latest `@bfra.me/prettier-plugins` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#192](https://github.com/bfra-me/works/pull/192))

## 0.1.2

### Patch Changes

- Modify for new @bfra.me/tsconfig `compilerOptions` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#188](https://github.com/bfra-me/works/pull/188))

- Fix errors reported by `publint` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#186](https://github.com/bfra-me/works/pull/186))

## 0.1.1

### Patch Changes

- Format `package.json` using (unreleased) @bfra.me/prettier-config options (by [@marcusrbrown](https://github.com/marcusrbrown) with [#160](https://github.com/bfra-me/works/pull/160))

## 0.1.0

### Minor Changes

- Add the `@bfra.me/semantic-release` package. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#146](https://github.com/bfra-me/works/pull/146))
