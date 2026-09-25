---
'@bfra.me/workspace-analyzer': patch
---

Drop malformed `package.json` and `tsconfig.json` fields instead of passing them through with the wrong type. Previously, fields like `main`, `type`, `dependencies` entries, `compilerOptions`, and project `references` were cast directly from parsed JSON without validating their runtime shape, so a malformed value (e.g. a number where a string was expected) would silently flow through mislabeled with the wrong TypeScript type. These fields are now validated at parse time: individual malformed entries in dependency/script records and project references are filtered out, and malformed scalar/array/object fields are dropped (become `undefined`) rather than propagated.
