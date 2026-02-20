---
'@bfra.me/eslint-config': minor
---

Updated dependency `eslint-plugin-yml` to `3.1.2` with config structure migration.

### Breaking Changes in eslint-plugin-yml v3

eslint-plugin-yml v3 introduced a major architectural change from parser-based configuration to ESLint's language system:

- **Config shape**: Changed from CommonJS objects to ES module flat configs with array structure
- **Language system**: Now uses `language: 'yml/yaml'` instead of custom parser configuration
- **Config access**: Base configs now exported as arrays instead of direct objects

### Migration Updates

Updated three configuration files to support the new plugin API:

1. **prettier.ts**: Added `getConfigRules()` helper to handle polymorphic config shapes (both arrays and objects)
2. **markdown.ts**: Fixed YAML code block configuration to properly extract language setup and parser configuration from normalized arrays
3. **pnpm.ts**: Refactored to normalize plugin base configs to arrays and use language system for YAML file linting

All existing linting functionality is preserved while adapting to the new plugin structure.
