---
'@bfra.me/workspace-analyzer': patch
---

Fixed JSON output corruption when using `--json` flag. The CLI now correctly suppresses UI elements (intro banner, spinner, outro) in JSON/Markdown/quiet modes, and fixes a double-stringification bug where JSON output was being encoded twice.
