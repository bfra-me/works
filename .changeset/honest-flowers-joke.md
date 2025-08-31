---
"@bfra.me/semantic-release": minor
---

Enhance TypeScript support and configuration utilities.

- Rewrite `defineConfig` to include enhanced validation and type inference.
- Introduce `ConfigBuilder` and `PluginBuilder` for fluent API construction.
- Add factory functions for JavaScript configuration files with TypeScript support.
- Implement preset factory functions for common workflows like npm and GitHub releases.
- Update tests to reflect changes in configuration structure and validation.
- Modify build configuration to include new entry points for TypeScript files.
