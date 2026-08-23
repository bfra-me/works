---
'@bfra.me/eslint-config': patch
---

Scoped Unicorn rules to JavaScript and TypeScript source files so they no longer apply to JSON or JSONC files. When TypeScript support is disabled, the rules now apply only to JavaScript and JSX files, avoiding unsupported-language errors in ESLint 10.
