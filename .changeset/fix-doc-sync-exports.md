---
'@bfra.me/doc-sync': patch
---

Fix package exports configuration to properly expose all public modules

**Added missing package.json exports:**
- `./orchestrator` - Package scanning and sync orchestration utilities
- `./watcher` - File watching and change detection utilities
- `./utils` - Security utilities for MDX generation and sanitization

**Added corresponding tsup build entry points** for orchestrator, watcher, and utils modules

**Added re-exports to main barrel export (src/index.ts):**
- All parsers exports (56 functions/types from ./parsers)
- All utils exports (9 functions from ./utils)

This ensures all subdirectory imports work correctly:
- `import {} from '@bfra.me/doc-sync/orchestrator'`
- `import {} from '@bfra.me/doc-sync/watcher'`
- `import {} from '@bfra.me/doc-sync/utils'`
- `import {} from '@bfra.me/doc-sync/parsers'`
