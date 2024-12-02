# @bfra.me/tsconfig

## 0.9.4
### Patch Changes


- Updated dependency `type-fest` to `4.29.0`. ([#697](https://github.com/bfra-me/works/pull/697))

## 0.9.3
### Patch Changes


- Updated dependency `type-fest` to `4.28.1`. ([#682](https://github.com/bfra-me/works/pull/682))

## 0.9.2
### Patch Changes


- Updated dependency `type-fest` to `4.28.0`. ([#656](https://github.com/bfra-me/works/pull/656))


- Updated dependency `type-fest` to `4.27.1`. ([#654](https://github.com/bfra-me/works/pull/654))

## 0.9.1
### Patch Changes


- Updated dependency `type-fest` to `4.27.0`. ([#629](https://github.com/bfra-me/works/pull/629))

## 0.9.0
### Minor Changes


- Enable [declaration maps](https://www.typescriptlang.org/tsconfig/#declarationMap). ([#535](https://github.com/bfra-me/works/pull/535))

## 0.8.1
### Patch Changes



- Add `allowJs` to `compilerOptions` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#401](https://github.com/bfra-me/works/pull/401))

## 0.8.0
### Minor Changes



- Merge @tsconfig/strictest/tsconfig.json into the base tsconfig.json (by [@marcusrbrown](https://github.com/marcusrbrown) with [#394](https://github.com/bfra-me/works/pull/394))


- Use explicit `target` and `lib`; set `module` to preserve (by [@marcusrbrown](https://github.com/marcusrbrown) with [#394](https://github.com/bfra-me/works/pull/394))


- Remove `checkJs`, `composite`, and `incremental` compiler options; use relative paths for `extends` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#394](https://github.com/bfra-me/works/pull/394))

## 0.7.0
### Minor Changes



- Set the `target` to 'ESNext"; set `skipLibChecks` to true (by [@marcusrbrown](https://github.com/marcusrbrown) with [#388](https://github.com/bfra-me/works/pull/388))

## 0.6.0
### Minor Changes



- Move `@tsconfig/strictest` from `peerDependencies` to `dependencies` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#358](https://github.com/bfra-me/works/pull/358))

## 0.5.0

### Minor Changes

- Set `module` to `ESNext` and `moduleResolution` to `Bundler` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#199](https://github.com/bfra-me/works/pull/199))

## 0.4.1

### Patch Changes

- Format `package.json` with latest `@bfra.me/prettier-plugins` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#192](https://github.com/bfra-me/works/pull/192))

## 0.4.0

### Minor Changes

- Use concrete module and target options instead of using "\*Next" (i.e., ESNext, NodeNext, etc.) (by [@marcusrbrown](https://github.com/marcusrbrown) with [#188](https://github.com/bfra-me/works/pull/188))

### Patch Changes

- Modify for new @bfra.me/tsconfig `compilerOptions` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#188](https://github.com/bfra-me/works/pull/188))

## 0.3.1

### Patch Changes

- Format `package.json` using (unreleased) @bfra.me/prettier-config options (by [@marcusrbrown](https://github.com/marcusrbrown) with [#160](https://github.com/bfra-me/works/pull/160))

## 0.3.0

### Minor Changes

- Enable `verbatimModuleSyntax`; remove `exclude` item. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#156](https://github.com/bfra-me/works/pull/156))

## 0.2.5

### Patch Changes

- `package.json`: Update `homepage`, add `keywords`, and extend `exports` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#148](https://github.com/bfra-me/works/pull/148))

## 0.2.4

### Patch Changes

- Build: Fix `clean` scripts (by [@marcusrbrown](https://github.com/marcusrbrown) with [#145](https://github.com/bfra-me/works/pull/145))

- Remove `tsBuildInfoFile`; add `lib` with "ESNext" (by [@marcusrbrown](https://github.com/marcusrbrown) with [#143](https://github.com/bfra-me/works/pull/143))

## 0.2.3

### Patch Changes

- Set `$schema` to raw GitHub URL to avoid issues if SchemaStore is unavailable. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#139](https://github.com/bfra-me/works/pull/139))

## 0.2.2

### Patch Changes

- Enable provenance for publishing to NPM (by [@marcusrbrown](https://github.com/marcusrbrown) with [#136](https://github.com/bfra-me/works/pull/136))

## 0.2.1

### Patch Changes

- Set `module` to **ESNext** and `moduleResolution` to **Node** to fix ESM-first default (by [@marcusrbrown](https://github.com/marcusrbrown) with [#134](https://github.com/bfra-me/works/pull/134))

## 0.2.0

### Minor Changes

- @bfra.me/tsconfig: Disable declaration maps (by [@marcusrbrown](https://github.com/marcusrbrown) with [#114](https://github.com/bfra-me/works/pull/114))

### Patch Changes

- @bfra.me/tsconfig: Use correct `module` option when `moduleResolution` is "NodeNext". (by [@marcusrbrown](https://github.com/marcusrbrown) with [#112](https://github.com/bfra-me/works/pull/112))

## 0.1.1

### Patch Changes

- @bfra.me/tsconfig: Add `@tsconfig/strictest` to peerDeps (by [@marcusrbrown](https://github.com/marcusrbrown) with [#109](https://github.com/bfra-me/works/pull/109))

## 0.1.0

### Minor Changes

- Add `@changesets/cli` and `changesets/action` (by [@marcusrbrown](https://github.com/marcusrbrown) with [#104](https://github.com/bfra-me/works/pull/104))
