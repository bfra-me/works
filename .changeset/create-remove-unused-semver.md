---
'@bfra.me/create': patch
---

Remove unused `semver` dependency. No source or test file imports the `semver` package; all matches are unrelated regex/message-text using the word "semver".
