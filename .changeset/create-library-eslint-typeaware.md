---
'@bfra.me/create': patch
---

Fix the `library` template's `eslint.config.ts`, which set `typescript.typeAware: true` even though `@bfra.me/eslint-config`'s `typeAware` option only accepts an overrides object, not a boolean. Providing `tsconfigPath` already enables type-aware linting, so the invalid option is removed.
