/**
 * HTML renderer for dependency graph visualization.
 *
 * This module generates self-contained HTML files with embedded D3.js
 * visualization of workspace dependencies. The output is a single HTML
 * file that works offline without any external network requests.
 *
 * Security: All embedded data is sanitized to prevent XSS attacks.
 */

import type {Result} from '../types/index'
import type {VisualizationData} from './types'

import {err, ok} from '@bfra.me/es/result'

import {getD3InlineScript} from './templates/d3-bundle'
import {generateControlPanelScript, generateGraphInitScript} from './templates/graph-template'
import {generateStyles, SEVERITY_COLORS} from './templates/styles'

/**
 * Error types for HTML rendering failures.
 */
export interface HtmlRenderError {
  /** Error code for programmatic handling */
  readonly code: 'RENDER_FAILED' | 'INVALID_DATA' | 'SANITIZATION_FAILED'
  /** Human-readable error message */
  readonly message: string
  /** Optional details about the error */
  readonly details?: Record<string, unknown>
}

/**
 * Options for HTML rendering.
 */
export interface HtmlRenderOptions {
  /** Title for the HTML document */
  readonly title: string
  /** Whether to include the D3.js library inline */
  readonly inlineD3: boolean
  /** Whether to minify the output */
  readonly minify: boolean
  /** Custom CSS to append */
  readonly customCss?: string
  /** Custom JavaScript to append */
  readonly customJs?: string
}

/**
 * Default HTML render options.
 */
export const DEFAULT_HTML_RENDER_OPTIONS: HtmlRenderOptions = {
  title: 'Workspace Dependency Graph',
  inlineD3: true,
  minify: false,
}

/**
 * Sanitizes a string for safe embedding in HTML.
 * Prevents XSS by escaping dangerous characters.
 *
 * @param str - The string to sanitize
 * @returns Sanitized string safe for HTML embedding
 */
export function sanitizeHtml(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('/', '&#x2F;')
    .replaceAll('`', '&#x60;')
    .replaceAll('=', '&#x3D;')
}

/**
 * Sanitizes a string for safe embedding in JavaScript string literals.
 * Escapes characters that could break out of string context.
 *
 * @param str - The string to sanitize
 * @returns Sanitized string safe for JavaScript embedding
 */
export function sanitizeJsString(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }
  return str
    .replaceAll('\\', '\\\\')
    .replaceAll("'", String.raw`\'`)
    .replaceAll('"', String.raw`\"`)
    .replaceAll('\n', String.raw`\n`)
    .replaceAll('\r', String.raw`\r`)
    .replaceAll('\t', String.raw`\t`)
    .replaceAll('\u2028', String.raw`\u2028`)
    .replaceAll('\u2029', String.raw`\u2029`)
    .replaceAll('</script>', String.raw`<\/script>`)
}

/**
 * Sanitizes a file path for safe embedding.
 * Removes potentially dangerous path traversal attempts.
 *
 * @param path - The file path to sanitize
 * @returns Sanitized file path
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') {
    return ''
  }
  // Remove null bytes and normalize path separators
  return path.replaceAll('\0', '').replaceAll('../', '').replaceAll(/\.\.$/g, '')
}

/**
 * Sanitizes visualization data for safe embedding in HTML/JavaScript.
 *
 * @param data - The visualization data to sanitize
 * @returns Sanitized visualization data
 */
export function sanitizeVisualizationData(data: VisualizationData): VisualizationData {
  return {
    nodes: data.nodes.map(node => ({
      ...node,
      id: sanitizeJsString(node.id),
      name: sanitizeJsString(node.name),
      filePath: sanitizeJsString(sanitizeFilePath(node.filePath)),
      packageName: node.packageName === undefined ? undefined : sanitizeJsString(node.packageName),
      layer: node.layer === undefined ? undefined : sanitizeJsString(node.layer),
      violations: node.violations.map(v => ({
        ...v,
        id: sanitizeJsString(v.id),
        message: sanitizeJsString(v.message),
        ruleId: sanitizeJsString(v.ruleId),
      })),
    })),
    edges: data.edges.map(edge => ({
      ...edge,
      source: sanitizeJsString(edge.source),
      target: sanitizeJsString(edge.target),
      cycleId: edge.cycleId === undefined ? undefined : sanitizeJsString(edge.cycleId),
    })),
    cycles: data.cycles.map(cycle => ({
      ...cycle,
      id: sanitizeJsString(cycle.id),
      nodes: cycle.nodes.map(n => sanitizeJsString(n)),
      edges: cycle.edges.map(e => ({
        from: sanitizeJsString(e.from),
        to: sanitizeJsString(e.to),
      })),
      description: sanitizeJsString(cycle.description),
    })),
    statistics: data.statistics,
    layers: data.layers.map(layer => ({
      ...layer,
      name: sanitizeJsString(layer.name),
      allowedDependencies: layer.allowedDependencies.map(d => sanitizeJsString(d)),
    })),
    metadata: {
      ...data.metadata,
      workspacePath: sanitizeJsString(sanitizeFilePath(data.metadata.workspacePath)),
      generatedAt: sanitizeJsString(data.metadata.generatedAt),
      analyzerVersion: sanitizeJsString(data.metadata.analyzerVersion),
    },
  }
}

/**
 * Generates the sidebar HTML with statistics and filter controls.
 *
 * @param data - Visualization data
 * @param title - Document title
 * @returns Sidebar HTML string
 */
function generateSidebarHtml(data: VisualizationData, title: string): string {
  const stats = data.statistics
  const layers = data.layers

  // Generate layer filter checkboxes
  const layerFiltersHtml = layers
    .map(
      layer => `
    <label class="layer-item">
      <input type="checkbox" class="layer-checkbox" data-layer="${sanitizeHtml(layer.name)}" checked>
      <span class="layer-color ${sanitizeHtml(layer.name.toLowerCase())}"></span>
      <span class="layer-name">${sanitizeHtml(layer.name)}</span>
      <span class="layer-count">${stats.nodesByLayer[layer.name] ?? 0}</span>
    </label>
  `,
    )
    .join('')

  // Generate severity statistics
  const severityStatsHtml = ['critical', 'error', 'warning', 'info']
    .map(
      severity => `
    <div class="severity-item">
      <div class="severity-indicator">
        <div class="severity-dot ${severity}"></div>
        <span class="severity-name">${severity}</span>
      </div>
      <span class="severity-count" id="stat-${severity}">${stats.violationsBySeverity[severity as keyof typeof stats.violationsBySeverity] ?? 0}</span>
    </div>
  `,
    )
    .join('')

  return `
    <div class="sidebar-header">
      <h1 class="sidebar-title">${sanitizeHtml(title)}</h1>
      <p class="sidebar-subtitle">Generated ${sanitizeHtml(data.metadata.generatedAt)}</p>
    </div>
    <div class="sidebar-content">
      <section class="sidebar-section">
        <h2 class="section-title">Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="stat-nodes">${stats.totalNodes}</div>
            <div class="stat-label">Nodes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-edges">${stats.totalEdges}</div>
            <div class="stat-label">Edges</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-cycles">${stats.totalCycles}</div>
            <div class="stat-label">Cycles</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.packagesAnalyzed}</div>
            <div class="stat-label">Packages</div>
          </div>
        </div>
      </section>

      <section class="sidebar-section">
        <h2 class="section-title">Violations by Severity</h2>
        <div class="severity-list">
          ${severityStatsHtml}
        </div>
      </section>

      <section class="sidebar-section">
        <h2 class="section-title">Filter by Layer</h2>
        <div class="layer-list">
          ${layerFiltersHtml}
        </div>
      </section>

      <section class="sidebar-section legend-section">
        <h2 class="section-title">Legend</h2>
        <div class="legend-item">
          <div class="legend-icon">
            <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${SEVERITY_COLORS.critical.primary}" stroke="#fff" stroke-width="2"/></svg>
          </div>
          <span class="legend-text">Critical violation</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon">
            <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#ef4444" stroke="#ef4444" stroke-width="3"/></svg>
          </div>
          <span class="legend-text">Node in cycle</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon">
            <svg viewBox="0 0 16 16"><line x1="0" y1="8" x2="16" y2="8" stroke="#ef4444" stroke-width="2" stroke-dasharray="0"/></svg>
          </div>
          <span class="legend-text">Cycle edge (animated)</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon">
            <svg viewBox="0 0 16 16"><line x1="0" y1="8" x2="16" y2="8" stroke="#d1d5db" stroke-width="2" stroke-dasharray="4,4"/></svg>
          </div>
          <span class="legend-text">Dynamic import</span>
        </div>
      </section>
    </div>
  `
}

/**
 * Generates the control panel HTML.
 *
 * @returns Control panel HTML string
 */
function generateControlPanelHtml(): string {
  return `
    <div class="control-group">
      <label class="control-label">View:</label>
      <div class="control-btn-group">
        <button class="control-btn view-mode-btn active" data-mode="all">All</button>
        <button class="control-btn view-mode-btn" data-mode="cycles">Cycles</button>
        <button class="control-btn view-mode-btn" data-mode="violations">Violations</button>
      </div>
    </div>

    <div class="control-group">
      <label class="control-label" for="search-input">Search:</label>
      <input type="text" id="search-input" class="control-input" placeholder="Filter nodes...">
    </div>

    <div class="control-spacer"></div>

    <div class="zoom-controls">
      <button class="zoom-btn" id="zoom-out" title="Zoom out (-)">−</button>
      <span class="zoom-level">100%</span>
      <button class="zoom-btn" id="zoom-in" title="Zoom in (+)">+</button>
      <button class="control-btn" id="zoom-reset" title="Reset zoom (0)">Reset</button>
    </div>
  `
}

/**
 * Validates visualization data before rendering.
 *
 * @param data - The data to validate
 * @returns Result indicating validity
 */
function validateVisualizationData(data: unknown): Result<VisualizationData, HtmlRenderError> {
  if (data === null || data === undefined || typeof data !== 'object') {
    return err({
      code: 'INVALID_DATA',
      message: 'Visualization data must be an object',
    })
  }

  const d = data as Record<string, unknown>

  if (!Array.isArray(d.nodes)) {
    return err({
      code: 'INVALID_DATA',
      message: 'Visualization data must have a nodes array',
    })
  }

  if (!Array.isArray(d.edges)) {
    return err({
      code: 'INVALID_DATA',
      message: 'Visualization data must have an edges array',
    })
  }

  if (d.statistics === null || d.statistics === undefined || typeof d.statistics !== 'object') {
    return err({
      code: 'INVALID_DATA',
      message: 'Visualization data must have statistics object',
    })
  }

  if (d.metadata === null || d.metadata === undefined || typeof d.metadata !== 'object') {
    return err({
      code: 'INVALID_DATA',
      message: 'Visualization data must have metadata object',
    })
  }

  return ok(data as VisualizationData)
}

/**
 * Renders visualization data as a self-contained HTML file.
 *
 * @param data - The visualization data to render
 * @param options - Render options
 * @returns Result containing the HTML string or an error
 */
export function renderVisualizationHtml(
  data: VisualizationData,
  options: Partial<HtmlRenderOptions> = {},
): Result<string, HtmlRenderError> {
  // Merge options with defaults
  const opts: HtmlRenderOptions = {
    ...DEFAULT_HTML_RENDER_OPTIONS,
    ...options,
  }

  // Validate data
  const validationResult = validateVisualizationData(data)
  if (validationResult.success === false) {
    return validationResult
  }

  // Sanitize data for safe embedding
  const sanitizedData = sanitizeVisualizationData(data)

  // Serialize data for embedding
  const dataJson = JSON.stringify(sanitizedData)

  // Generate CSS
  const styles = generateStyles()

  // Generate sidebar and control panel
  const sidebarHtml = generateSidebarHtml(sanitizedData, opts.title)
  const controlPanelHtml = generateControlPanelHtml()

  // Generate JavaScript
  const d3Script = opts.inlineD3 ? getD3InlineScript() : ''
  const graphScript = generateGraphInitScript()
  const controlScript = generateControlPanelScript()

  // Build the complete HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="@bfra.me/workspace-analyzer">
  <meta name="description" content="Interactive dependency graph visualization">
  <title>${sanitizeHtml(opts.title)}</title>
  <style>
${styles}
${opts.customCss ?? ''}
  </style>
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
${sidebarHtml}
    </aside>
    <main class="main-content">
      <div class="control-panel">
${controlPanelHtml}
      </div>
      <div class="graph-container">
        <svg class="graph-canvas"></svg>
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </main>
  </div>
  <div class="tooltip"></div>

  <script>
// Visualization data (sanitized)
window.VISUALIZATION_DATA = ${dataJson};
  </script>
  <script>
// D3.js Library
${d3Script}
  </script>
  <script>
// Graph Initialization
${graphScript}
  </script>
  <script>
// Control Panel
${controlScript}
  </script>
${opts.customJs === undefined ? '' : `  <script>\n${opts.customJs}\n  </script>`}
</body>
</html>`

  return ok(html)
}

/**
 * Generates a minimal HTML preview for testing.
 *
 * @param data - The visualization data
 * @param title - Document title
 * @returns A simplified HTML string for testing
 */
export function renderMinimalHtml(data: VisualizationData, title: string): string {
  const sanitizedData = sanitizeVisualizationData(data)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${sanitizeHtml(title)}</title>
</head>
<body>
  <h1>${sanitizeHtml(title)}</h1>
  <p>Nodes: ${sanitizedData.statistics.totalNodes}</p>
  <p>Edges: ${sanitizedData.statistics.totalEdges}</p>
  <p>Cycles: ${sanitizedData.statistics.totalCycles}</p>
  <script>window.VISUALIZATION_DATA = ${JSON.stringify(sanitizedData)};</script>
</body>
</html>`
}

/**
 * Exports visualization data as JSON.
 *
 * @param data - The visualization data to export
 * @returns JSON string representation
 */
export function exportVisualizationJson(data: VisualizationData): string {
  const sanitizedData = sanitizeVisualizationData(data)
  return JSON.stringify(sanitizedData, null, 2)
}

/**
 * Calculates the approximate size of the generated HTML in bytes.
 *
 * @param data - The visualization data
 * @returns Estimated size in bytes
 */
export function estimateHtmlSize(data: VisualizationData): number {
  // Base HTML structure + CSS + D3 library
  const baseSize = 50000 // ~50KB for D3 and styles

  // Data size (rough estimate)
  const dataJson = JSON.stringify(data)
  const dataSize = dataJson.length * 1.1 // Account for some expansion

  // Scripts
  const scriptsSize = 10000 // ~10KB for scripts

  return Math.ceil(baseSize + dataSize + scriptsSize)
}

/**
 * Checks if the data would produce an HTML file within size limits.
 *
 * @param data - The visualization data
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 5MB)
 * @returns True if within limits
 */
export function isWithinSizeLimit(
  data: VisualizationData,
  maxSizeBytes: number = 5 * 1024 * 1024,
): boolean {
  return estimateHtmlSize(data) < maxSizeBytes
}
