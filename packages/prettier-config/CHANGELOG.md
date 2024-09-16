# @bfra.me/prettier-config

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
