# @bfra.me/eslint-config

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
