---
'@bfra.me/eslint-config': minor
---

Updated dependency `eslint-plugin-jsonc` to `3.0.0`.

**Migration Notes:**

- Migrated to ESLint language plugin system: replaced parser-based configuration with `language: 'jsonc/x'` field
- Updated `jsonc.ts` to use new language plugin approach instead of parser extraction
- Simplified `pnpm.ts` configuration by removing complex config extraction logic
- Updated `markdown.ts` to leverage language plugin for JSON code block handling
- All configurations now use the cleaner language identifier approach (`jsonc/json`, `jsonc/jsonc`, `jsonc/json5`, `jsonc/x`)
- Removed unnecessary manual parser configuration extraction
