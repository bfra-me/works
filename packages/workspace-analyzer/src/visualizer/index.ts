/**
 * Visualization module for generating interactive dependency graph visualizations.
 *
 * Provides utilities to transform dependency graphs into visualization-ready data
 * structures and render them as self-contained HTML files with D3.js.
 */

export type {BuildVisualizationOptions, GraphBuilderContext} from './graph-builder'
export {
  buildVisualizationData,
  DEFAULT_BUILD_OPTIONS,
  transformCycleToVisualization,
  transformEdgeToVisualization,
  transformNodeToVisualization,
} from './graph-builder'

export type {HtmlRenderError, HtmlRenderOptions} from './html-renderer'
export {
  DEFAULT_HTML_RENDER_OPTIONS,
  estimateHtmlSize,
  exportVisualizationJson,
  isWithinSizeLimit,
  renderMinimalHtml,
  renderVisualizationHtml,
  sanitizeFilePath,
  sanitizeHtml,
  sanitizeJsString,
  sanitizeVisualizationData,
} from './html-renderer'

export type {MermaidExportOptions} from './mermaid-exporter'
export {exportCycleMermaid, exportVisualizationMermaid} from './mermaid-exporter'

export {
  D3_CDN_URLS,
  D3_TYPE_DECLARATIONS,
  D3_VERSION,
  getD3CdnScriptTag,
  getD3InlineScript,
} from './templates/d3-bundle'
export type {GraphConfig} from './templates/graph-template'

export {
  calculateChargeStrength,
  calculateLinkDistance,
  calculateNodeRadius,
  DEFAULT_GRAPH_CONFIG,
  generateControlPanelScript,
  generateGraphInitScript,
  generateHtmlTemplate,
} from './templates/graph-template'

export {
  CYCLE_COLORS,
  generateStyles,
  getEdgeTypeClass,
  getLayerClass,
  getSeverityClass,
  LAYER_COLORS,
  SEVERITY_COLORS,
} from './templates/styles'

export type {
  VisualizationCycle,
  VisualizationData,
  VisualizationEdge,
  VisualizationError,
  VisualizationFilters,
  VisualizationLayerDefinition,
  VisualizationMetadata,
  VisualizationNode,
  VisualizationStatistics,
  VisualizationViolation,
  VisualizerOptions,
} from './types'
export {DEFAULT_VISUALIZER_OPTIONS, getHighestSeverity, SEVERITY_ORDER} from './types'

export type {ViolationCollectionContext, ViolationCollectionOptions} from './violation-collector'
export {
  collectVisualizationViolations,
  DEFAULT_VIOLATION_COLLECTION_OPTIONS,
  mapIssuesToNodes,
} from './violation-collector'
