---
"@bfra.me/eslint-config": minor
---

Remove deprecated utility functions

Remove deprecated re-exported functions that were previously migrated to `@bfra.me/es`:

- `interopDefault` - Use `interopDefault` from `@bfra.me/es/module` instead
- `isInGitLifecycle` - Use `isInGitLifecycle` from `@bfra.me/es/env` instead
- `isInEditorEnv` - Use `isInEditorEnv` from `@bfra.me/es/env` instead

**Migration:**

```diff
- import { interopDefault, isInEditorEnv, isInGitLifecycle } from '@bfra.me/eslint-config'
+ import { interopDefault } from '@bfra.me/es/module'
+ import { isInEditorEnv, isInGitLifecycle } from '@bfra.me/es/env'
```
