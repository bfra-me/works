---
"@bfra.me/eslint-config": patch
---

Refine type generation script for accurate DTS output

- Update `scripts/generate-types.ts` to correctly compose all configs and include ESLint builtin rules via `Object.fromEntries(builtinRules)`.
- Ensure JSX (`jsx({ a11y: true })`) and TypeScript (`typescript({ erasableSyntaxOnly: true, tsconfigPath: 'tsconfig.json' })`) configurations are represented during generation.

Tooling-only change; no runtime behavior affected.
