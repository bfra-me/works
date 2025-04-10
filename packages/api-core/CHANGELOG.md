# @bfra.me/api-core

## 0.3.0
### Minor Changes


- Update `engines` to require at least Node 20. ([#1141](https://github.com/bfra-me/works/pull/1141))


### Patch Changes


- Updated dependency `@readme/oas-examples` to `5.20.1`. ([#1136](https://github.com/bfra-me/works/pull/1136))

## 0.2.6
### Patch Changes


- Updated dependency `typescript` to `5.8.3`. ([#1122](https://github.com/bfra-me/works/pull/1122))


- Updated dependency `@readme/oas-examples` to `5.20.0`. ([#1123](https://github.com/bfra-me/works/pull/1123))

## 0.2.5
### Patch Changes


- Updated dependency `typescript` to `5.8.2`. ([#1074](https://github.com/bfra-me/works/pull/1074))

## 0.2.4
### Patch Changes


- Updated dependency `@readme/oas-examples` to `5.19.1`. ([#1021](https://github.com/bfra-me/works/pull/1021))


- Updated dependency `@readme/oas-examples` to `5.19.0`. ([#1020](https://github.com/bfra-me/works/pull/1020))


- Updated dependency `@readme/oas-examples` to `5.19.2`. ([#1024](https://github.com/bfra-me/works/pull/1024))

## 0.2.3
### Patch Changes


- Updated dependency `@readme/oas-to-har` to `24.0.7`. ([#913](https://github.com/bfra-me/works/pull/913))
  Updated dependency `oas` to `25.3.0`.

- Updated dependency `@readme/oas-to-har` to `24.0.6`. ([#904](https://github.com/bfra-me/works/pull/904))
  Updated dependency `oas` to `25.2.2`.

## 0.2.2
### Patch Changes


- Updated dependency `remove-undefined-objects` to `6.0.0`. ([#880](https://github.com/bfra-me/works/pull/880))

## 0.2.1
### Patch Changes


- Updated dependency `typescript` to `5.7.3`. ([#851](https://github.com/bfra-me/works/pull/851))

## 0.2.0
### Minor Changes


- Increase engine version range for the `fetch-har` dependency. ([#812](https://github.com/bfra-me/works/pull/812))

## 0.1.11
### Patch Changes


- Updated dependency `@readme/oas-to-har` to `24.0.5`. ([#795](https://github.com/bfra-me/works/pull/795))
  Updated dependency `oas` to `25.2.1`.

## 0.1.10
### Patch Changes


- Updated dependency `@readme/oas-to-har` to `24.0.4`. ([#767](https://github.com/bfra-me/works/pull/767))
  Updated dependency `oas` to `25.2.0`.

## 0.1.9
### Patch Changes


- Fix linter errors. ([#758](https://github.com/bfra-me/works/pull/758))


- Apply linter fixes. ([#760](https://github.com/bfra-me/works/pull/760))

## 0.1.8
### Patch Changes


- Apply linter fixes. ([#753](https://github.com/bfra-me/works/pull/753))

## 0.1.7
### Patch Changes


- Updated dependency `@readme/oas-to-har` to `24.0.3`. ([#727](https://github.com/bfra-me/works/pull/727))
  Updated dependency `oas` to `25.1.0`.

## 0.1.6
### Patch Changes


- Updated dependency `vitest` to `2.1.8`. ([#719](https://github.com/bfra-me/works/pull/719))
  Updated dependency `@vitest/coverage-v8` to `2.1.8`.

- Updated dependency `vitest` to `2.1.7`. ([#717](https://github.com/bfra-me/works/pull/717))
  Updated dependency `@vitest/coverage-v8` to `2.1.7`.

## 0.1.5
### Patch Changes


- Fix linter errors. ([#691](https://github.com/bfra-me/works/pull/691))

## 0.1.4
### Patch Changes


- Fix linter errors. ([#690](https://github.com/bfra-me/works/pull/690))


- Updated dependency `vitest` to `2.1.6`. ([#686](https://github.com/bfra-me/works/pull/686))
  Updated dependency `@vitest/coverage-v8` to `2.1.6`.

## 0.1.3
### Patch Changes


- Updated dependency `vitest` to `2.1.5`. ([#626](https://github.com/bfra-me/works/pull/626))
  Updated dependency `@vitest/coverage-v8` to `2.1.5`.

- Updated dependency `@readme/oas-to-har` to `24.0.2`. ([#640](https://github.com/bfra-me/works/pull/640))
  Updated dependency `oas` to `25.0.4`.

## 0.1.2
### Patch Changes


- Update oas to v25 and @readme/oas-to-har to v4. ([#549](https://github.com/bfra-me/works/pull/549))


- Pin dependencies. ([#549](https://github.com/bfra-me/works/pull/549))

## 0.1.1
### Patch Changes



- Remove unnecessary files from the output package (by [@marcusrbrown](https://github.com/marcusrbrown) with [#454](https://github.com/bfra-me/works/pull/454))

## 0.1.0
### Minor Changes



- Add a fork of [`@readme/api-core`](https://github.com/readmeio/api/tree/main/packages/core) as `@bfra.me/api-core`:  
  - Use `git subtree` to add `@readme/api-core` and `@api/test-utils` as forks
  - Patch `@bfra.me/api-core` with readmeio/api#820, to fix issues bundling `@readme/api-core` for the browser
  - Adjust forked packages to build, lint, and test within the `@bfra.me/works` monorepo (by [@marcusrbrown](https://github.com/marcusrbrown) with [#443](https://github.com/bfra-me/works/pull/443))
