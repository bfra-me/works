---
"@bfra.me/eslint-config": minor
---

Improve automatic package installation behavior to skip ESLint errors on success

**Breaking Change:** The `tryInstall()` function now returns a discriminated union type `{success: true} | {success: false; output: string} | null` instead of `string | null`.

**Key Changes:**

- **Conditional error reporting**: The `missing-module-for-config` ESLint rule no longer reports errors when packages are successfully installed via `--fix` mode
- **Better error messages**: Failed installations now include detailed error output in the ESLint error message
