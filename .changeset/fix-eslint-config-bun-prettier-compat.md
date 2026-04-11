---
'@bfra.me/eslint-config': patch
---

Fix JSON5/YAML prettier compat rules failing silently under Bun workspaces

Replace `isPackageExists` guards for `eslint-plugin-jsonc` and `eslint-plugin-yml` in `prettier.ts` with direct dynamic imports using `.catch(() => undefined)`. Under Bun, transitive dependencies are not hoisted to a flat `node_modules/` layout, causing `isPackageExists` to return `false` for packages like `eslint-plugin-jsonc` even though Bun's module resolver can load them fine. This caused the jsonc/yaml prettier-compat rule overrides to never load, resulting in conflicting rule errors on `.json5` and `.yaml` files.
