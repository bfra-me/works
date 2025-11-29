---
"@bfra.me/eslint-config": patch
---

Improve Markdown and stylistic configuration handling:

- Disable additional JSDoc rules (`jsdoc/check-alignment`, `jsdoc/multiline-blocks`) in Markdown files to prevent false positives with code blocks that lack complete ESLint SourceCode API support
- Fix stylistic rules being incorrectly disabled when Prettier is present - stylistic options now respect user configuration independently of Prettier detection
