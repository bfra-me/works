---
'@bfra.me/workspace-analyzer': minor
---

feat(workspace-analyzer): add interactive dependency graph visualization

Add `workspace-analyzer visualize` command that generates interactive HTML visualizations of workspace dependencies with D3.js force-directed graphs.

**Features:**
- Generate self-contained HTML files with embedded D3.js visualization
- Visualize cross-package dependencies and module relationships
- Highlight circular import chains with clear visual differentiation
- Display architectural layer violations with severity-based coloring
- Interactive filtering by layer, severity, and package scope
- Multiple view modes: full graph, cycles-only, violations-only
- Export formats: HTML (interactive), JSON (data), Mermaid (diagram markup)
- Auto-open in default browser with `--no-open` flag to disable
- Offline support with no external network requests

**CLI Usage:**
```bash
# Generate interactive HTML visualization
workspace-analyzer visualize

# Generate JSON data for external tools
workspace-analyzer visualize --format json --output graph.json

# Generate Mermaid diagram
workspace-analyzer visualize --format mermaid --output graph.mmd

# Interactive mode with options
workspace-analyzer visualize --interactive
```

**CLI Options:**
- `--output <path>`: Output file path (default: `workspace-graph.html`)
- `--format <format>`: Output format - html, json, mermaid, both (default: `html`)
- `--no-open`: Disable auto-opening in browser
- `--title <title>`: Visualization title (default: `Workspace Dependency Graph`)
- `--max-nodes <number>`: Maximum nodes to render (default: `1000`)
- `--include-type-imports`: Include type-only imports in graph
- `--interactive`: Interactive mode for options selection

**Programmatic API:**
```typescript
import {buildVisualizationData, renderVisualizationHtml} from '@bfra.me/workspace-analyzer'

const vizData = buildVisualizationData(context)
const html = renderVisualizationHtml(vizData, {title: 'My Project'})
```

**Dependencies:**
- Added `open` ^10.2.0 for auto-opening HTML in default browser
- D3.js v7 embedded inline (no runtime dependency)
