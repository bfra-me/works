---
'@bfra.me/create': patch
---

Narrow raw CLI options to their expected types when normalizing `CreateCommandOptions` instead of blindly casting them. Malformed values (e.g. a non-string `--template`, a non-boolean `--force`, or an unrecognized `packageManager`/`preset`) are now dropped to `undefined` rather than passed through with the wrong runtime type.
