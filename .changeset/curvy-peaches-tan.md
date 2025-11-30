---
'@bfra.me/eslint-config': minor
---

Add support for custom global ignore patterns with function transforms

Introduces new `ignores` option to `defineConfig()` that allows users to extend or transform global ESLint ignore patterns. The option accepts either:
- An array of glob patterns to append to the default exclusions
- A function that receives the original exclusions and returns a transformed array

This provides flexibility to customize which files are ignored by ESLint while maintaining the default exclusions.

Example usage:
```typescript
// Append additional patterns
defineConfig({
  ignores: ['dist/**', 'coverage/**']
})

// Transform the defaults
defineConfig({
  ignores: (originals) => originals.filter((p) => !p.includes('node_modules'))
})
