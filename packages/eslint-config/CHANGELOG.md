# @bfra.me/eslint-config

## 0.4.4
### Patch Changes


- Add `prepack` scripts. ([#595](https://github.com/bfra-me/works/pull/595))

## 0.4.3
### Patch Changes


- Updated dependency `eslint` to `9.14.0`. ([#591](https://github.com/bfra-me/works/pull/591))
  Updated dependency `@eslint/js` to `9.14.0`.

- Export missing type definitions. ([#593](https://github.com/bfra-me/works/pull/593))

## 0.4.2
### Patch Changes


- Export the types used to create the config types. ([#589](https://github.com/bfra-me/works/pull/589))

## 0.4.1
### Patch Changes


- Updated dependency `jiti` to `2.4.0`. ([#586](https://github.com/bfra-me/works/pull/586))

## 0.4.0
### Minor Changes


- Overhaul and refactor types and type generation. ([#578](https://github.com/bfra-me/works/pull/578))


### Patch Changes


- Updated dependency `@types/node` to `20.17.5`. ([#579](https://github.com/bfra-me/works/pull/579))


- Updated dependency `@types/node` to `20.17.4`. ([#577](https://github.com/bfra-me/works/pull/577))


- Updated dependency `@types/node` to `22.8.6`. ([#580](https://github.com/bfra-me/works/pull/580))


- Add epilogue override for sources of CLIs. ([#578](https://github.com/bfra-me/works/pull/578))


- Add missing config names for TypeScript typed linting. ([#578](https://github.com/bfra-me/works/pull/578))

## 0.3.2
### Patch Changes


- Updated dependency `@eslint/config-inspector` to `0.5.6`. ([#567](https://github.com/bfra-me/works/pull/567))

## 0.3.1
### Patch Changes



- Add a named export for the default config and move the ESLint config that pertains to `eslint-config` into the package, as the monorepo passes the `unstable_config_lookup_from_file` feature flag to ESLint. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#465](https://github.com/bfra-me/works/pull/465))


- Add the `composeConfig` function as an alias to `composer`. `composeConfig` is closed over the `Config` and `ConfigNames` type arguments supplied to `FlatConfigComposer`. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#463](https://github.com/bfra-me/works/pull/463))

## 0.3.0
### Minor Changes



- Add `@bfra.me/epilogue` configs to override rules for specific types of files (by [@marcusrbrown](https://github.com/marcusrbrown) with [#434](https://github.com/bfra-me/works/pull/434))


- Upgrade to jiti v2. (by [@marcusrbrown](https://github.com/marcusrbrown) with [#427](https://github.com/bfra-me/works/pull/427))

### Patch Changes



- Fix an issue that prevented `Config` values passed in `Options` to `defineConfig` from being merged to the `Config` array (by [@marcusrbrown](https://github.com/marcusrbrown) with [#432](https://github.com/bfra-me/works/pull/432))

## 0.2.0
### Minor Changes



- Move `types.d.ts` to `types.ts` and simplify types (by [@marcusrbrown](https://github.com/marcusrbrown) with [#419](https://github.com/bfra-me/works/pull/419))

### Patch Changes



- Add missing name to JSDoc config (by [@marcusrbrown](https://github.com/marcusrbrown) with [#419](https://github.com/bfra-me/works/pull/419))

## 0.1.0
### Minor Changes



- Add a shareable ESLint configuration (by [@marcusrbrown](https://github.com/marcusrbrown) with [#385](https://github.com/bfra-me/works/pull/385))
