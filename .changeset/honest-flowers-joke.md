---
"@bfra.me/semantic-release": minor
---

Enhance TypeScript support and configuration utilities.

- Rewrite `defineConfig` to include enhanced validation and type inference.
- Introduce `ConfigBuilder` and `PluginBuilder` for fluent API construction.
- Add factory functions for JavaScript configuration files with TypeScript support.
- Implement preset factory functions for common workflows like npm and GitHub releases.
- Update tests to reflect changes in configuration structure and validation.
- Implement configuration composition utilities for merging, extending, and overriding semantic-release configurations.
- Introduced `helpers.ts` to provide type-safe configuration functions for popular semantic-release plugins including commit-analyzer, release-notes-generator, changelog, npm, github, and git.
- Implemented presets for commonly used plugin configurations to enhance developer experience.
