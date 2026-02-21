---
'@bfra.me/eslint-config': minor
---

Updated dependency `eslint-plugin-toml` to `1.1.0`.

**Migration notes for `eslint-plugin-toml` v1:**

- The plugin now exports flat configs directly (e.g., `configs.standard`) instead of the legacy `flat/*` namespace. Updated config references from `pluginToml.configs['flat/standard']` to `pluginToml.configs.standard`.
- The package is now ESM-only (dropped CJS dual-publish).
- Requires ESLint v9.38.0+ and Node.js ^20.19.0, ^22.13.0, or >=24.
- Includes new ESLint language plugin support with `languages` object for TOML language implementation.
- Dependency `toml-eslint-parser` upgraded to v1.
