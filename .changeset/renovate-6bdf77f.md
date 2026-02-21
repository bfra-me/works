---
'@bfra.me/create': patch
'@bfra.me/doc-sync': patch
---

Updated dependency `@clack/prompts` to `1.0.1`.

**Migration notes for `@clack/prompts` v1:**

- The package is now ESM-only (dropped CJS dual-publish from v0).
- `validate` callbacks now receive `string | undefined` instead of `string`. All
  `validate` usages updated to guard against `undefined` using `value == null ||`
  rather than the falsy-check `!value` to satisfy `@typescript-eslint/strict-boolean-expressions`.
