---
'@bfra.me/eslint-config': patch
---

Revert `@eslint-react/eslint-plugin` to v2.13.0. v3 breaks eslint-typegen compatibility (cannot generate rule types), which causes the build to fail. Will revisit v3 once eslint-typegen adds support.
