# @bfra.me/prettier-config

## 0.11.1
### Patch Changes


- Remove treeshaking and target build options ([#663](https://github.com/bfra-me/works/pull/663))

## 0.11.0
### Minor Changes


- Switch back to ESM output for the bundled config ([#661](https://github.com/bfra-me/works/pull/661))

## 0.10.1
### Patch Changes


- Output the bundled config as CJS in an attempt to resolve issues with the VS Code Prettier extension. ([#659](https://github.com/bfra-me/works/pull/659))

## 0.10.0
### Minor Changes


- Move `prettier.config.js` to `index.js` ([#658](https://github.com/bfra-me/works/pull/658))


### Patch Changes


- Add banner to improve CJS compatibility ([#658](https://github.com/bfra-me/works/pull/658))

- Updated dependencies [[`779d16d`](https://github.com/bfra-me/works/commit/779d16d80f0636f9284bbcd3afc82ec426688a47), [`dce024c`](https://github.com/bfra-me/works/commit/dce024c7488a7fa40cde749594e54f61a902435f), [`75750d3`](https://github.com/bfra-me/works/commit/75750d39c59665396e5c006585f4b1fa43054721)]:
  - @bfra.me/prettier-plugins@0.5.3

## 0.9.4
### Patch Changes


- Updated dependency `vitest` to `2.1.5`. ([#626](https://github.com/bfra-me/works/pull/626))
  Updated dependency `@vitest/coverage-v8` to `2.1.5`.
- Updated dependencies [[`983e826`](https://github.com/bfra-me/works/commit/983e826ec1a6068ce7edc4546eac8227aa29ed4d), [`a275611`](https://github.com/bfra-me/works/commit/a275611ad925767965f5974ba8296e0f2b0e4c40)]:
  - @bfra.me/prettier-plugins@0.5.2

## 0.9.3
### Patch Changes


- Update `prepack` scripts to build package dependencies. ([#607](https://github.com/bfra-me/works/pull/607))

## 0.9.2
### Patch Changes


- Add `index.json` to the package. ([#604](https://github.com/bfra-me/works/pull/604))

## 0.9.1
### Patch Changes


- Add `prepack` scripts. ([#595](https://github.com/bfra-me/works/pull/595))


- Remove the async plugin loader. ([#597](https://github.com/bfra-me/works/pull/597))


- Revert to the previous plugin resolver. ([#597](https://github.com/bfra-me/works/pull/597))

- Updated dependencies [[`1ce3903`](https://github.com/bfra-me/works/commit/1ce39032ce4c2597936897145896e71fde5fc09a)]:
  - @bfra.me/prettier-plugins@0.5.1

## 0.9.0
### Minor Changes


- Ship a bundled config as the default; simplify everything. ([#593](https://github.com/bfra-me/works/pull/593))

## 0.8.0
### Minor Changes


- Consolidate exports and types in `index.ts`; cleanup config. ([#537](https://github.com/bfra-me/works/pull/537))


### Patch Changes


- Clean up type definitions and package exports. ([#542](https://github.com/bfra-me/works/pull/542))

- Updated dependencies [[`e315626`](https://github.com/bfra-me/works/commit/e315626ce5073c6f03dc136209ef467f06ce073e)]:
  - @bfra.me/prettier-plugins@0.5.0

## 0.7.4
### Patch Changes



- Remove the `**/lib/**` from the list of files with `requirePragma` set to true (by [@marcusrbrown](https://github.com/marcusrbrown) with [#417](https://github.com/bfra-me/works/pull/417))

## 0.7.3
### Patch Changes



- Refactor and add `languages` to the `package-json` plugin; improve types (by [@marcusrbrown](https://github.com/marcusrbrown) with [#407](https://github.com/bfra-me/works/pull/407))
- Updated dependencies:
  - @bfra.me/prettier-plugins@0.4.0

## 0.7.2
### Patch Changes



- Remove `checkJs`, `composite`, and `incremental` compiler options; use relative paths for `extends` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#394](https://github.com/bfra-me/works/pull/394))
- Updated dependencies:
  - @bfra.me/prettier-plugins@0.3.1

## 0.7.1
### Patch Changes



- Remove unnecessary files from the published package (by [@marcusrbrown](https://github.com/marcusrbrown) with [#386](https://github.com/bfra-me/works/pull/386))
- Updated dependencies:
  - @bfra.me/prettier-plugins@0.3.0

## 0.7.0
### Minor Changes



- Add prefixed presets (e.g., `.../semi/120-proof` => `.../120-proof.js?semi=true`) (by [@marcusrbrown](https://github.com/marcusrbrown) with [#380](https://github.com/bfra-me/works/pull/380))


- Add prefixed presets (e.g. `import config from '@bfra.me/prettier-config/[preset]/semi'`) (by [@marcusrbrown](https://github.com/marcusrbrown) with [#380](https://github.com/bfra-me/works/pull/380))

## 0.6.0
### Minor Changes



- Add tests and use `tsup` to build (by [@marcusrbrown](https://github.com/marcusrbrown) with [#378](https://github.com/bfra-me/works/pull/378))

## 0.5.0
### Minor Changes



- Resolve installed Prettier plugins to `Plugin` objects; improve typings (by [@marcusrbrown](https://github.com/marcusrbrown) with [#365](https://github.com/bfra-me/works/pull/365))

### Patch Changes

- Updated dependencies:
  - @bfra.me/prettier-plugins@0.3.0

## 0.4.1
### Patch Changes



- Add override for Dev Container properties (devcontainer.json, devcontainer-*.json) (by [@marcusrbrown](https://github.com/marcusrbrown) with [#363](https://github.com/bfra-me/works/pull/363))

## 0.4.0
### Minor Changes



- Add `100-proof` (aliased to default) and `120-proof` Prettier config presets (by [@marcusrbrown](https://github.com/marcusrbrown) with [#334](https://github.com/bfra-me/works/pull/334))

## 0.3.3

### Patch Changes

- Updated dependencies:
  - @bfra.me/prettier-plugins@0.2.1

## 0.3.2

### Patch Changes

- Format `package.json` with latest `@bfra.me/prettier-plugins` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#192](https://github.com/bfra-me/works/pull/192))
- Updated dependencies:
  - @bfra.me/prettier-plugins@0.2.0

## 0.3.1

### Patch Changes

- Modify for new @bfra.me/tsconfig `compilerOptions` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#188](https://github.com/bfra-me/works/pull/188))

- Fix errors reported by `publint` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#186](https://github.com/bfra-me/works/pull/186))
- Updated dependencies:
  - @bfra.me/prettier-plugins@0.1.1

## 0.3.0

### Minor Changes

- Add `@bfra.me/prettier-plugins` and move inline `package.json` plugin from `@bfra.me/prettier-config` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#168](https://github.com/bfra-me/works/pull/168))

### Patch Changes

- Updated dependencies:
  - @bfra.me/prettier-plugins@0.1.0

## 0.2.2

### Patch Changes

- Call `preprocess()` on the `json-stringify` parser if it's defined (by [@marcusrbrown](https://github.com/marcusrbrown) with [#165](https://github.com/bfra-me/works/pull/165))

## 0.2.1

### Patch Changes

- Update `files` globs for `overrides1` that use `requirePragma` to ignore files (by [@marcusrbrown](https://github.com/marcusrbrown) with [#163](https://github.com/bfra-me/works/pull/163))

## 0.2.0

### Minor Changes

- Add an inline Prettier plugin to format `package.json` files using [prettier-package-json](https://github.com/cameronhunter/prettier-package-json) (by [@marcusrbrown](https://github.com/marcusrbrown) with [#159](https://github.com/bfra-me/works/pull/159))

### Patch Changes

- Format `package.json` using (unreleased) @bfra.me/prettier-config options (by [@marcusrbrown](https://github.com/marcusrbrown) with [#160](https://github.com/bfra-me/works/pull/160))

## 0.1.0

### Minor Changes

- Add the `prettier-config` shareable Prettier configuration. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#154](https://github.com/bfra-me/works/pull/154))
