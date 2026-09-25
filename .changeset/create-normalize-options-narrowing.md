---
'@bfra.me/create': patch
---

Normalize CLI option types: numeric values are kept as strings, `packageManager` is trimmed/lowercased, and invalid `preset`/`packageManager` values still fail validation instead of being silently dropped.
