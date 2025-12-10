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
