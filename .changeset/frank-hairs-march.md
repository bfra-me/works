---
'@bfra.me/eslint-config': patch
---

> [!TIP]
> Fix GFM admonition false positives in markdown linting

Configure `markdown/no-missing-label-refs` rule to allow GitHub Flavored Markdown admonitions (`!NOTE`, `!TIP`, `!WARNING`, `!IMPORTANT`, `!CAUTION`) when using GFM language mode. This prevents false positive warnings for valid GFM alert syntax that uses bracket notation for callouts.
