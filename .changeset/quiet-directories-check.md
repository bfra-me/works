---
'@bfra.me/eslint-config': patch
---

Restored `unicorn/filename-case` behavior from before Unicorn 73 by no longer reporting on directory names, including common conventions such as `__tests__` and `__snapshots__`. Filename checking remains unchanged.
