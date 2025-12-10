/**
 * Embedded CSS styles for the dependency graph visualization.
 *
 * These styles define the layout and appearance of the interactive graph,
 * including the main canvas, sidebar, controls, tooltips, and graph elements.
 * All styles are embedded inline to ensure the HTML is fully self-contained.
 */

/**
 * Color palette for severity levels, following accessibility guidelines.
 * Each severity has a primary color and a lighter background variant.
 */
export const SEVERITY_COLORS = {
  critical: {primary: '#dc2626', background: '#fef2f2', text: '#991b1b'},
  error: {primary: '#ea580c', background: '#fff7ed', text: '#9a3412'},
  warning: {primary: '#ca8a04', background: '#fefce8', text: '#854d0e'},
  info: {primary: '#2563eb', background: '#eff6ff', text: '#1e40af'},
} as const

/**
 * Color palette for architectural layers.
 */
export const LAYER_COLORS = {
  domain: '#8b5cf6',
  application: '#06b6d4',
  infrastructure: '#84cc16',
  presentation: '#f97316',
  shared: '#6b7280',
  unknown: '#9ca3af',
} as const

/**
 * Color for cycle highlighting.
 */
export const CYCLE_COLORS = {
  edge: '#ef4444',
  node: '#fca5a5',
  glow: 'rgba(239, 68, 68, 0.4)',
} as const

/**
 * CSS variables for theming.
 */
export const CSS_VARIABLES = `
  :root {
    /* Layout */
    --sidebar-width: 280px;
    --control-panel-height: 60px;
    --tooltip-max-width: 360px;

    /* Colors - Light theme */
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-tertiary: #f3f4f6;
    --text-primary: #111827;
    --text-secondary: #4b5563;
    --text-muted: #9ca3af;
    --border-color: #e5e7eb;
    --focus-ring: #3b82f6;

    /* Graph colors */
    --node-default: #6b7280;
    --node-hover: #374151;
    --edge-default: #d1d5db;
    --edge-hover: #9ca3af;

    /* Severity colors */
    --severity-critical: ${SEVERITY_COLORS.critical.primary};
    --severity-critical-bg: ${SEVERITY_COLORS.critical.background};
    --severity-error: ${SEVERITY_COLORS.error.primary};
    --severity-error-bg: ${SEVERITY_COLORS.error.background};
    --severity-warning: ${SEVERITY_COLORS.warning.primary};
    --severity-warning-bg: ${SEVERITY_COLORS.warning.background};
    --severity-info: ${SEVERITY_COLORS.info.primary};
    --severity-info-bg: ${SEVERITY_COLORS.info.background};

    /* Cycle colors */
    --cycle-edge: ${CYCLE_COLORS.edge};
    --cycle-node: ${CYCLE_COLORS.node};
    --cycle-glow: ${CYCLE_COLORS.glow};

    /* Layer colors */
    --layer-domain: ${LAYER_COLORS.domain};
    --layer-application: ${LAYER_COLORS.application};
    --layer-infrastructure: ${LAYER_COLORS.infrastructure};
    --layer-presentation: ${LAYER_COLORS.presentation};
    --layer-shared: ${LAYER_COLORS.shared};
    --layer-unknown: ${LAYER_COLORS.unknown};

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 200ms ease;
  }
`

/**
 * Base/reset styles.
 */
export const BASE_STYLES = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-primary);
    background-color: var(--bg-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button {
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }

  button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  input {
    font-family: inherit;
    font-size: inherit;
  }

  input:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }
`

/**
 * Layout styles for the main application structure.
 */
export const LAYOUT_STYLES = `
  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .sidebar {
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    height: 100%;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-primary);
  }

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .sidebar-subtitle {
    font-size: 12px;
    color: var(--text-muted);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .control-panel {
    height: var(--control-panel-height);
    min-height: var(--control-panel-height);
    padding: 12px 16px;
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .graph-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background-color: var(--bg-tertiary);
  }

  .graph-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
`

/**
 * Control panel styles for filters and actions.
 */
export const CONTROL_STYLES = `
  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .control-select {
    padding: 6px 28px 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 13px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }

  .control-select:hover {
    border-color: var(--text-muted);
  }

  .control-input {
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 13px;
    width: 180px;
    transition: border-color var(--transition-fast);
  }

  .control-input::placeholder {
    color: var(--text-muted);
  }

  .control-input:hover {
    border-color: var(--text-muted);
  }

  .control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
    transition: all var(--transition-fast);
  }

  .control-btn:hover {
    background-color: var(--bg-secondary);
    border-color: var(--text-muted);
  }

  .control-btn.active {
    background-color: var(--focus-ring);
    border-color: var(--focus-ring);
    color: white;
  }

  .control-btn-group {
    display: flex;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
  }

  .control-btn-group .control-btn {
    border: none;
    border-radius: 0;
    border-right: 1px solid var(--border-color);
  }

  .control-btn-group .control-btn:last-child {
    border-right: none;
  }

  .control-spacer {
    flex: 1;
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .zoom-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 500;
    transition: all var(--transition-fast);
  }

  .zoom-btn:hover {
    background-color: var(--bg-secondary);
  }

  .zoom-level {
    font-size: 12px;
    color: var(--text-secondary);
    min-width: 48px;
    text-align: center;
  }
`

/**
 * Sidebar section styles for statistics and filters.
 */
export const SIDEBAR_SECTION_STYLES = `
  .sidebar-section {
    margin-bottom: 20px;
  }

  .sidebar-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 10px 12px;
    background-color: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .stat-card.span-full {
    grid-column: span 2;
  }

  .severity-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .severity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: var(--bg-primary);
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }

  .severity-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .severity-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .severity-dot.critical { background-color: var(--severity-critical); }
  .severity-dot.error { background-color: var(--severity-error); }
  .severity-dot.warning { background-color: var(--severity-warning); }
  .severity-dot.info { background-color: var(--severity-info); }

  .severity-name {
    font-size: 13px;
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .severity-count {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .severity-filter-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .severity-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    cursor: pointer;
  }

  .severity-filter-item:hover {
    opacity: 0.8;
  }

  .severity-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--focus-ring);
  }

  .layer-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
  }

  .layer-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--focus-ring);
  }

  .layer-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }

  .layer-color.domain { background-color: var(--layer-domain); }
  .layer-color.application { background-color: var(--layer-application); }
  .layer-color.infrastructure { background-color: var(--layer-infrastructure); }
  .layer-color.presentation { background-color: var(--layer-presentation); }
  .layer-color.shared { background-color: var(--layer-shared); }
  .layer-color.unknown { background-color: var(--layer-unknown); }

  .layer-name {
    font-size: 13px;
    color: var(--text-primary);
    text-transform: capitalize;
    flex: 1;
  }

  .layer-count {
    font-size: 12px;
    color: var(--text-muted);
  }

  .legend-section {
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    margin-top: 16px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .legend-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .legend-icon svg {
    width: 16px;
    height: 16px;
  }

  .legend-text {
    font-size: 12px;
    color: var(--text-secondary);
  }
`

/**
 * Tooltip styles for node/edge details.
 */
export const TOOLTIP_STYLES = `
  .tooltip {
    position: fixed;
    max-width: var(--tooltip-max-width);
    padding: 12px 14px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    pointer-events: none;
    z-index: 1000;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity var(--transition-fast), transform var(--transition-fast);
  }

  .tooltip.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .tooltip-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  .tooltip-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tooltip-icon.severity-critical { background-color: var(--severity-critical-bg); color: var(--severity-critical); }
  .tooltip-icon.severity-error { background-color: var(--severity-error-bg); color: var(--severity-error); }
  .tooltip-icon.severity-warning { background-color: var(--severity-warning-bg); color: var(--severity-warning); }
  .tooltip-icon.severity-info { background-color: var(--severity-info-bg); color: var(--severity-info); }
  .tooltip-icon.cycle { background-color: #fef2f2; color: var(--cycle-edge); }
  .tooltip-icon.default { background-color: var(--bg-tertiary); color: var(--text-secondary); }

  .tooltip-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-word;
  }

  .tooltip-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tooltip-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .tooltip-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .tooltip-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .tooltip-divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 6px 0;
  }

  .tooltip-violations {
    margin-top: 8px;
  }

  .tooltip-violations-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tooltip-violation {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 8px;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    margin-bottom: 4px;
  }

  .tooltip-violation:last-child {
    margin-bottom: 0;
  }

  .tooltip-violation-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }

  .tooltip-violation-text {
    font-size: 11px;
    color: var(--text-primary);
    line-height: 1.4;
  }
`

/**
 * Graph element styles for SVG nodes and edges.
 */
export const GRAPH_ELEMENT_STYLES = `
  .graph-node {
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .graph-node:hover {
    opacity: 0.9;
  }

  .graph-node.dimmed {
    opacity: 0.2;
  }

  .graph-node.highlighted {
    opacity: 1;
  }

  .node-circle {
    stroke: var(--bg-primary);
    stroke-width: 2px;
    transition: all var(--transition-fast);
  }

  .node-circle.cycle {
    stroke: var(--cycle-edge);
    stroke-width: 3px;
    filter: drop-shadow(0 0 4px var(--cycle-glow));
  }

  .node-circle.severity-critical { fill: var(--severity-critical); }
  .node-circle.severity-error { fill: var(--severity-error); }
  .node-circle.severity-warning { fill: var(--severity-warning); }
  .node-circle.severity-info { fill: var(--severity-info); }

  .node-circle.layer-domain { fill: var(--layer-domain); }
  .node-circle.layer-application { fill: var(--layer-application); }
  .node-circle.layer-infrastructure { fill: var(--layer-infrastructure); }
  .node-circle.layer-presentation { fill: var(--layer-presentation); }
  .node-circle.layer-shared { fill: var(--layer-shared); }
  .node-circle.layer-unknown, .node-circle.default { fill: var(--node-default); }

  .node-label {
    font-size: 10px;
    fill: var(--text-primary);
    pointer-events: none;
    text-anchor: middle;
    dominant-baseline: central;
    font-weight: 500;
  }

  .graph-edge {
    transition: opacity var(--transition-fast);
  }

  .graph-edge.dimmed {
    opacity: 0.1;
  }

  .graph-edge.highlighted {
    opacity: 1;
  }

  .edge-line {
    fill: none;
    stroke: var(--edge-default);
    stroke-width: 1.5px;
    transition: stroke var(--transition-fast);
  }

  .edge-line.cycle {
    stroke: var(--cycle-edge);
    stroke-width: 2px;
    animation: pulse-edge 1.5s ease-in-out infinite;
  }

  .edge-line.type-static { stroke-dasharray: none; }
  .edge-line.type-dynamic { stroke-dasharray: 4, 4; }
  .edge-line.type-type-only { stroke-dasharray: 2, 2; opacity: 0.6; }
  .edge-line.type-require { stroke-dasharray: 6, 2; }

  .edge-arrow {
    fill: var(--edge-default);
    transition: fill var(--transition-fast);
  }

  .edge-arrow.cycle {
    fill: var(--cycle-edge);
  }

  @keyframes pulse-edge {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .cycle-glow {
    fill: none;
    stroke: var(--cycle-glow);
    stroke-width: 8px;
    opacity: 0.5;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
    }
  }
`

/**
 * Loading and empty state styles.
 */
export const STATE_STYLES = `
  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-tertiary);
    z-index: 100;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--focus-ring);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    padding: 24px;
    text-align: center;
  }

  .empty-state-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .empty-state-text {
    font-size: 14px;
    max-width: 300px;
  }
`

/**
 * Generates the complete CSS stylesheet as a string.
 *
 * @returns Complete CSS for the visualization HTML
 */
export function generateStyles(): string {
  return [
    CSS_VARIABLES,
    BASE_STYLES,
    LAYOUT_STYLES,
    CONTROL_STYLES,
    SIDEBAR_SECTION_STYLES,
    TOOLTIP_STYLES,
    GRAPH_ELEMENT_STYLES,
    STATE_STYLES,
  ].join('\n')
}

/**
 * Gets the CSS class for a severity level.
 *
 * @param severity - The severity level
 * @returns CSS class name for the severity
 */
export function getSeverityClass(severity: string | undefined): string {
  if (severity === undefined) {
    return 'default'
  }
  return `severity-${severity}`
}

/**
 * Gets the CSS class for an architectural layer.
 *
 * @param layer - The layer name
 * @returns CSS class name for the layer
 */
export function getLayerClass(layer: string | undefined): string {
  if (layer === undefined) {
    return 'layer-unknown'
  }
  const normalized = layer.toLowerCase()
  if (normalized in LAYER_COLORS) {
    return `layer-${normalized}`
  }
  return 'layer-unknown'
}

/**
 * Gets the CSS class for an edge type.
 *
 * @param type - The import type
 * @returns CSS class name for the type
 */
export function getEdgeTypeClass(type: string): string {
  return `type-${type}`
}
