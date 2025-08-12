---
"@bfra.me/eslint-config": minor
---

Improve type-aware checking.

- Moved interopDefault function from plugins to utils across multiple config files.
- Updated eslintComments function to return a static config instead of requiring plugins dynamically.
- Refactored fallback options interface to use `interface` instead of `type`.
- Adjusted various config files to improve type safety and consistency in handling optional properties.
- Removed dependency on eslint-plugin-no-only-tests from vitest config and adjusted related rules.
- Enhanced error handling and type checks in package utilities and config reading functions.
- Cleaned up unused imports and improved overall code readability.
