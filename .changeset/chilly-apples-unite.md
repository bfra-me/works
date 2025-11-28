---
'@bfra.me/eslint-config': minor
---

Refactor package utilities with improved type safety and remove `package-directory` dependency

- Replace `package-directory` with native package manager detection using `package-manager-detector`'s `LOCKS` and `AGENTS` utilities
- Improve package manager detection with proper traversal up the directory tree
