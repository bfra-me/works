---
goal: Build Interactive HTML Dependency Graph Visualization CLI Tool for @bfra.me/workspace-analyzer
version: 1.0
date_created: 2025-12-09
last_updated: 2025-12-10
owner: marcusrbrown
status: 'Completed'
tags: ['feature', 'cli', 'visualization', 'dependency-graph', 'html', 'd3', 'typescript', 'architecture']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Extend `@bfra.me/workspace-analyzer` with a CLI command that generates interactive HTML visualizations of cross-package dependencies and circular import chains. The visualizations will highlight architectural violations from the existing rules engine, support graph filtering by layer, severity, and package scope, and leverage the already-implemented `buildDependencyGraph()` and `findCycles()` functions for dependency data collection.

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: Generate self-contained interactive HTML files with embedded D3.js visualization
- **REQ-002**: Visualize cross-package dependencies showing workspace package relationships
- **REQ-003**: Highlight circular import chains with clear visual differentiation (e.g., red edges, pulsing animations)
- **REQ-004**: Display architectural layer violations from the `RuleEngine` with severity-based coloring
- **REQ-005**: Implement client-side filtering by architectural layer (`domain`, `application`, `infrastructure`, `presentation`, `shared`)
- **REQ-006**: Implement client-side filtering by severity level (`info`, `warning`, `error`, `critical`)
- **REQ-007**: Implement client-side filtering by package scope (e.g., `@bfra.me/*`, specific package names)
- **REQ-008**: Support force-directed graph layout with interactive pan, zoom, and node dragging
- **REQ-009**: Provide node tooltips showing file path, imports count, importedBy count, and violations
- **REQ-010**: Generate graph statistics summary (total nodes, edges, cycles, violations by severity)
- **REQ-011**: Export visualization as both standalone HTML and JSON data for external tools
- **REQ-012**: Support multiple visualization modes: full dependency graph, cycles-only view, violations-only view

### User Experience Requirements

- **UX-001**: Provide `workspace-analyzer visualize` CLI command following existing `cac` patterns
- **UX-002**: Use `@clack/prompts` for interactive mode with visualization options selection
- **UX-003**: Show progress spinner during graph generation and HTML rendering
- **UX-004**: Auto-open generated HTML file in default browser (with `--no-open` flag to disable)
- **UX-005**: Support `--output` flag for custom output path (default: `./workspace-graph.html`)

### Integration Requirements

- **INT-001**: Leverage existing `buildDependencyGraph()` from `src/graph/dependency-graph.ts`
- **INT-002**: Leverage existing `findCycles()` from `src/graph/dependency-graph.ts`
- **INT-003**: Integrate with `RuleEngine` to collect architectural violations for visualization
- **INT-004**: Reuse `WorkspaceScanner` for package discovery
- **INT-005**: Reuse existing `generateCycleVisualization()` Mermaid output as fallback/export option

### Security Requirements

- **SEC-001**: Sanitize all file paths before embedding in HTML to prevent XSS
- **SEC-002**: HTML files must be fully self-contained (no external network requests)
- **SEC-003**: Validate workspace boundaries before file access

### Type Safety Requirements

- **TYP-001**: Define TypeScript interfaces for all visualization data structures
- **TYP-002**: Use `Result<T, E>` pattern for visualization generation operations
- **TYP-003**: Provide complete type definitions for HTML template data context

### Constraints

- **CON-001**: Must use ES modules with `"type": "module"`
- **CON-002**: No runtime dependencies on heavy visualization libraries (D3.js embedded inline)
- **CON-003**: Generated HTML must work offline without network access
- **CON-004**: HTML file size should remain under 5MB for typical monorepo visualizations
- **CON-005**: Memory usage during generation must not exceed existing analyzer limits (512MB)

## 2. Architecture & Design

### Module Structure

```
packages/workspace-analyzer/
├── src/
│   ├── cli/
│   │   └── commands/
│   │       └── visualize.ts         # CLI command implementation
│   ├── visualizer/
│   │   ├── index.ts                 # Barrel exports
│   │   ├── types.ts                 # Visualization data types
│   │   ├── graph-builder.ts         # Transform DependencyGraph to viz format
│   │   ├── html-renderer.ts         # Generate self-contained HTML
│   │   ├── templates/
│   │   │   ├── graph-template.ts    # D3.js visualization template
│   │   │   └── styles.ts            # Embedded CSS styles
│   │   └── filters.ts               # Filter configuration types
│   └── index.ts                     # Add visualizer exports
└── test/
    └── visualizer/
        ├── graph-builder.test.ts
        ├── html-renderer.test.ts
        └── fixtures/
```

### Core Types

```typescript
// src/visualizer/types.ts

import type {DependencyGraph, DependencyCycle} from '../graph/dependency-graph'
import type {Issue, Severity} from '../types/index'
import type {LayerDefinition} from '../rules/rule-engine'

/**
 * A node in the visualization graph.
 */
export interface VisualizationNode {
  readonly id: string
  readonly name: string
  readonly filePath: string
  readonly packageName: string | undefined
  readonly layer: string | undefined
  readonly importsCount: number
  readonly importedByCount: number
  readonly isInCycle: boolean
  readonly violations: readonly VisualizationViolation[]
  readonly highestViolationSeverity: Severity | undefined
}

/**
 * An edge in the visualization graph.
 */
export interface VisualizationEdge {
  readonly source: string
  readonly target: string
  readonly type: 'static' | 'dynamic' | 'type-only' | 'require'
  readonly isInCycle: boolean
  readonly cycleId: string | undefined
}

/**
 * A violation displayed on a node or edge.
 */
export interface VisualizationViolation {
  readonly id: string
  readonly message: string
  readonly severity: Severity
  readonly ruleId: string
}

/**
 * Cycle information for visualization.
 */
export interface VisualizationCycle {
  readonly id: string
  readonly nodes: readonly string[]
  readonly edges: readonly {from: string; to: string}[]
  readonly length: number
  readonly description: string
}

/**
 * Complete visualization data ready for rendering.
 */
export interface VisualizationData {
  readonly nodes: readonly VisualizationNode[]
  readonly edges: readonly VisualizationEdge[]
  readonly cycles: readonly VisualizationCycle[]
  readonly statistics: VisualizationStatistics
  readonly layers: readonly LayerDefinition[]
  readonly metadata: VisualizationMetadata
}

/**
 * Statistics about the visualization.
 */
export interface VisualizationStatistics {
  readonly totalNodes: number
  readonly totalEdges: number
  readonly totalCycles: number
  readonly nodesByLayer: Readonly<Record<string, number>>
  readonly violationsBySeverity: Readonly<Record<Severity, number>>
  readonly packagesAnalyzed: number
  readonly filesAnalyzed: number
}

/**
 * Metadata for the visualization.
 */
export interface VisualizationMetadata {
  readonly workspacePath: string
  readonly generatedAt: string
  readonly analyzerVersion: string
}

/**
 * Filter configuration for the visualization.
 */
export interface VisualizationFilters {
  readonly layers: readonly string[]
  readonly severities: readonly Severity[]
  readonly packages: readonly string[]
  readonly showCyclesOnly: boolean
  readonly showViolationsOnly: boolean
}

/**
 * Options for generating visualization.
 */
export interface VisualizerOptions {
  readonly outputPath: string
  readonly format: 'html' | 'json' | 'both'
  readonly autoOpen: boolean
  readonly title: string
  readonly filters: Partial<VisualizationFilters>
  readonly includeTypeImports: boolean
  readonly maxNodes: number
}
```

### HTML Template Structure

The HTML renderer will generate a self-contained file with:

1. **Embedded CSS**: Responsive styles for graph, sidebar, tooltips, and controls
2. **Embedded D3.js**: Minified D3.js v7 library for force-directed graph rendering
3. **Embedded JSON Data**: Visualization data as a JavaScript variable
4. **Interactive Controls**:
   - Layer filter checkboxes
   - Severity filter dropdown
   - Package search/filter input
   - Zoom controls (+/−/reset)
   - View mode buttons (All/Cycles/Violations)
5. **Graph Canvas**: SVG element for D3.js rendering
6. **Sidebar Panel**: Statistics summary and legend
7. **Tooltip Component**: Node/edge details on hover

### Integration with Existing Code

```typescript
// Pseudocode showing integration points

import {buildDependencyGraph, findCycles} from '../graph/dependency-graph'
import {createRuleEngine} from '../rules/rule-engine'
import {createWorkspaceScanner} from '../scanner/workspace-scanner'
import {extractImports} from '../parser/import-extractor'

async function generateVisualization(workspacePath: string, options: VisualizerOptions) {
  // 1. Scan workspace packages (existing)
  const scanner = createWorkspaceScanner()
  const scanResult = await scanner.scan(workspacePath)

  // 2. Extract imports from all source files (existing)
  const importResults = await extractAllImports(scanResult.packages)

  // 3. Build dependency graph (existing)
  const graph = buildDependencyGraph(importResults, {rootPath: workspacePath})

  // 4. Find cycles (existing)
  const cycles = findCycles(graph)

  // 5. Collect violations from rule engine (existing)
  const engine = createRuleEngine()
  const violations = await collectArchitecturalViolations(engine, scanResult.packages)

  // 6. Transform to visualization format (new)
  const vizData = transformToVisualization(graph, cycles, violations, options)

  // 7. Render HTML (new)
  const html = renderVisualizationHtml(vizData, options)

  return html
}
```

## 3. Implementation Steps

### Implementation Phase 1: Core Visualization Types and Graph Builder

- GOAL-001: Define visualization data types and implement transformation from DependencyGraph

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `src/visualizer/` directory structure with `index.ts` barrel export | ✅ | 2025-12-09 |
| TASK-002 | Define all visualization types in `src/visualizer/types.ts` (VisualizationNode, Edge, Cycle, Data, Statistics, Metadata, Filters, Options) | ✅ | 2025-12-09 |
| TASK-003 | Implement `transformNodeToVisualization()` in `src/visualizer/graph-builder.ts` converting DependencyNode to VisualizationNode | ✅ | 2025-12-09 |
| TASK-004 | Implement `transformEdgeToVisualization()` converting DependencyEdge to VisualizationEdge with cycle detection | ✅ | 2025-12-09 |
| TASK-005 | Implement `transformCycleToVisualization()` converting DependencyCycle to VisualizationCycle with unique ID | ✅ | 2025-12-09 |
| TASK-006 | Implement `buildVisualizationData()` orchestrating full graph transformation with statistics computation | ✅ | 2025-12-09 |
| TASK-007 | Add layer detection integration using `getFileLayer()` from rules engine | ✅ | 2025-12-09 |
| TASK-008 | Write unit tests for graph-builder transformations in `test/visualizer/graph-builder.test.ts` | ✅ | 2025-12-09 |

### Implementation Phase 2: Violation Collection and Integration

- GOAL-002: Integrate rule engine violations into visualization nodes

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Implement `collectVisualizationViolations()` using RuleEngine to gather architectural issues | ✅ | 2025-12-09 |
| TASK-010 | Implement `mapIssuesToNodes()` associating Issue locations with VisualizationNodes | ✅ | 2025-12-09 |
| TASK-011 | Implement `computeVisualizationStatistics()` calculating all summary stats | ✅ | 2025-12-09 |
| TASK-012 | Add severity ranking logic for `highestViolationSeverity` on nodes | ✅ | 2025-12-09 |
| TASK-013 | Write unit tests for violation collection in `test/visualizer/violation-collector.test.ts` | ✅ | 2025-12-09 |

### Implementation Phase 3: HTML Template and D3.js Visualization

- GOAL-003: Create self-contained HTML renderer with embedded D3.js visualization

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Create `src/visualizer/templates/styles.ts` with embedded CSS for graph, controls, sidebar, tooltips | ✅ | 2025-12-09 |
| TASK-015 | Create `src/visualizer/templates/d3-bundle.ts` with minified D3.js v7 code (force, zoom, drag modules) | ✅ | 2025-12-09 |
| TASK-016 | Create `src/visualizer/templates/graph-template.ts` with D3.js force-directed graph initialization | ✅ | 2025-12-09 |
| TASK-017 | Implement node rendering with severity-based colors, cycle highlighting, and layer grouping | ✅ | 2025-12-09 |
| TASK-018 | Implement edge rendering with directional arrows, cycle highlighting (red/animated), and type styling | ✅ | 2025-12-09 |
| TASK-019 | Implement tooltip component showing node details on hover | ✅ | 2025-12-09 |
| TASK-020 | Implement zoom/pan controls with D3 zoom behavior | ✅ | 2025-12-09 |
| TASK-021 | Implement `renderVisualizationHtml()` in `src/visualizer/html-renderer.ts` combining all templates | ✅ | 2025-12-09 |
| TASK-022 | Add HTML sanitization for all embedded data to prevent XSS | ✅ | 2025-12-09 |
| TASK-023 | Write unit tests for HTML renderer in `test/visualizer/html-renderer.test.ts` | ✅ | 2025-12-09 |

### Implementation Phase 4: Client-Side Filtering and Interactivity

- GOAL-004: Implement interactive filtering controls in the generated HTML

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-024 | Implement layer filter checkboxes with D3 node/edge show/hide logic | ✅ | 2025-12-09 |
| TASK-025 | Implement severity filter dropdown with dynamic graph updates | ✅ | 2025-12-09 |
| TASK-026 | Implement package search input with fuzzy matching and highlight | ✅ | 2025-12-09 |
| TASK-027 | Implement view mode buttons (All/Cycles Only/Violations Only) | ✅ | 2025-12-09 |
| TASK-028 | Implement statistics sidebar with live counts during filtering | ✅ | 2025-12-09 |
| TASK-029 | Implement node click to center and highlight connected nodes | ✅ | 2025-12-09 |
| TASK-030 | Implement edge click to show import details in tooltip | ✅ | 2025-12-09 |
| TASK-031 | Add keyboard shortcuts (Escape to reset, +/- for zoom, F for fullscreen) | ✅ | 2025-12-09 |
| TASK-032 | Write E2E tests for filtering using Playwright in `test/visualizer/e2e/` | ✅ | 2025-12-09 |

### Implementation Phase 5: CLI Command Integration

- GOAL-005: Implement `visualize` CLI command with options and progress reporting

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-033 | Create `src/cli/commands/visualize.ts` with `cac` command registration | ✅ | 2025-12-09 |
| TASK-034 | Implement CLI options: `--output`, `--format`, `--no-open`, `--title`, `--max-nodes` | ✅ | 2025-12-09 |
| TASK-035 | Implement interactive mode using `@clack/prompts` for options selection | ✅ | 2025-12-09 |
| TASK-036 | Add progress spinner showing scanning, parsing, building, rendering phases | ✅ | 2025-12-09 |
| TASK-037 | Implement auto-open in default browser using `open` package | ✅ | 2025-12-09 |
| TASK-038 | Add `--json` flag for JSON-only output (no HTML) | ✅ | 2025-12-09 |
| TASK-039 | Update `src/cli/index.ts` to register `visualize` command | ✅ | 2025-12-09 |
| TASK-040 | Add help text and examples for `visualize` command | ✅ | 2025-12-09 |
| TASK-041 | Write CLI integration tests in `test/cli/visualize.test.ts` | ✅ | 2025-12-09 |

### Implementation Phase 6: JSON Export and Alternative Formats

- GOAL-006: Support JSON export for integration with external tools

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-042 | Implement `exportVisualizationJson()` writing structured JSON file | ✅ | 2025-12-10 |
| TASK-043 | Support Mermaid diagram export using existing `generateCycleVisualization()` | ✅ | 2025-12-10 |
| TASK-044 | Add `--format mermaid` option for Mermaid-only output | ✅ | 2025-12-10 |
| TASK-045 | Document JSON schema in README for external tool integration | ✅ | 2025-12-10 |
| TASK-046 | Write tests for JSON export format validation | ✅ | 2025-12-10 |

### Implementation Phase 7: Documentation and Polish

- GOAL-007: Complete documentation and final polish

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-047 | Update `packages/workspace-analyzer/README.md` with visualize command documentation | ✅ | 2025-12-10 |
| TASK-048 | Add usage examples for common visualization scenarios | ✅ | 2025-12-10 |
| TASK-049 | Add JSDoc comments to all exported functions and types | ✅ | 2025-12-10 |
| TASK-050 | Add `visualizer` exports to `src/index.ts` barrel | ✅ | 2025-12-10 |
| TASK-051 | Update `package.json` exports field if needed | ✅ | 2025-12-10 |
| TASK-052 | Create changeset for the new feature | ✅ | 2025-12-10 |
| TASK-053 | Run full test suite and ensure coverage targets met | ✅ | 2025-12-10 |
| TASK-054 | Manual testing of generated HTML in Chrome, Firefox, Safari | ✅ | 2025-12-10 |

## 4. Testing Strategy

### Unit Tests

- **Graph Builder Tests**: Verify transformation of DependencyGraph nodes/edges to visualization format
- **Violation Collector Tests**: Mock RuleEngine to test issue aggregation and mapping
- **HTML Renderer Tests**: Snapshot testing of generated HTML structure
- **Sanitization Tests**: Verify XSS prevention with malicious file paths

### Integration Tests

- **Full Pipeline Tests**: Generate visualization from fixture workspace, verify output structure
- **CLI Tests**: Test command-line argument parsing and output file creation
- **Filter Tests**: Verify correct filtering behavior in generated HTML (via DOM inspection)

### E2E Tests (Optional)

- **Browser Tests**: Use Playwright to verify interactive filtering works in generated HTML
- **Rendering Tests**: Screenshot comparison of rendered graph with known baseline

### Test Fixtures

```
test/visualizer/fixtures/
├── simple-workspace/          # 3 packages, no cycles
├── circular-workspace/        # Contains deliberate cycles
├── layered-workspace/         # Clean layer architecture
├── violated-workspace/        # Layer violations present
└── large-workspace/           # 50+ packages for performance testing
```

## 5. Dependencies

### New Dependencies (to be added)

| Package | Version | Purpose |
|---------|---------|---------|
| `open` | `^10.0.0` | Open generated HTML in default browser |

### Embedded Dependencies (no npm install)

| Library | Version | Purpose |
|---------|---------|---------|
| D3.js | v7.x | Force-directed graph visualization (bundled inline) |

### Existing Dependencies (already available)

| Package | Purpose |
|---------|---------|
| `@clack/prompts` | Interactive CLI prompts |
| `cac` | CLI argument parsing |
| `consola` | Logging |
| `@bfra.me/es` | Result type, utilities |
| `@bfra.me/doc-sync` | TypeScript parsing (ts-morph) |

## 6. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Large D3.js bundle size | Medium | Medium | Use tree-shaken D3 subset (force, zoom, selection only) |
| Memory issues with large graphs | High | Low | Implement `maxNodes` limit with intelligent sampling |
| Browser compatibility issues | Medium | Low | Test on Chrome, Firefox, Safari; use ES2020 features only |
| XSS vulnerabilities | High | Low | Comprehensive sanitization of all embedded data |
| Performance on 1000+ nodes | Medium | Medium | Virtual rendering or clustering for large graphs |

## 7. Success Criteria

1. `workspace-analyzer visualize` command generates valid HTML file
2. Generated HTML loads without network requests (fully self-contained)
3. D3.js graph renders correctly with nodes, edges, and cycles highlighted
4. All filter controls function correctly (layer, severity, package, view mode)
5. Tooltips display correct node/edge information
6. Zoom/pan works smoothly across browsers
7. JSON export produces valid, schema-compliant data
8. 90%+ test coverage for new visualization module
9. Documentation complete with usage examples
10. Performance: 500 node graph generates in under 5 seconds

## 8. Future Enhancements (Out of Scope)

- Real-time file watching with live graph updates
- Diff view comparing two analysis snapshots
- Integration with VS Code extension for in-editor visualization
- 3D graph rendering option (three.js)
- Export to SVG/PNG static images
- Collaborative annotation/commenting on graph nodes
