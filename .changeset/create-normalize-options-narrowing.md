---
'@bfra.me/create': patch
---

Normalize CLI option types: numeric values are kept as strings, `--skip-prompts false` and `--dry-run false` are respected, `packageManager` is case-insensitive, and invalid `preset`/`packageManager` values report a validation error instead of being ignored.
