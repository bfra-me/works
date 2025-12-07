/**
 * Rules module exports for architectural analysis.
 *
 * Provides the rule engine infrastructure and built-in rules for detecting
 * architectural anti-patterns and enforcing best practices.
 */

export type {
  BarrelExportRuleOptions,
  LayerViolationRuleOptions,
  PackageBoundaryRuleOptions,
  PathAliasRuleOptions,
  PublicApiRuleOptions,
  SideEffectRuleOptions,
} from './builtin-rules'
export {
  barrelExportRuleMetadata,
  createBarrelExportRule,
  createLayerViolationRule,
  createPackageBoundaryRule,
  createPathAliasRule,
  createPublicApiRule,
  createSideEffectRule,
  layerViolationRuleMetadata,
  packageBoundaryRuleMetadata,
  pathAliasRuleMetadata,
  publicApiRuleMetadata,
  sideEffectRuleMetadata,
} from './builtin-rules'

export type {
  LayerConfiguration,
  LayerDefinition,
  LayerPattern,
  Rule,
  RuleContext,
  RuleEngine,
  RuleEngineError,
  RuleFactory,
  RuleMetadata,
  RuleOptions,
  RuleRegistration,
  RuleResult,
  RuleViolation,
} from './rule-engine'
export {
  BUILTIN_RULE_IDS,
  createRuleEngine,
  DEFAULT_LAYER_CONFIG,
  getFileLayer,
  isLayerImportAllowed,
} from './rule-engine'
