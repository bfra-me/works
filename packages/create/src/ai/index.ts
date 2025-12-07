export type {
  AIAssistSession,
  AIConfig,
  CodeGenerationRequest,
  CodeGenerationResult,
  ConfigOptimizationSuggestion,
  DocumentationGenerationRequest,
  DocumentationGenerationResult,
  LLMOptions,
  LLMProvider,
  LLMResponse,
  ProjectAnalysis,
} from '../types.js'

// Legacy class-based exports (maintained for backward compatibility)
export {AIAssistant} from './assistant.js'
// Phase 3: Functional AI System (new functional architecture)
export {
  getAIAvailabilityMessage,
  getAIAvailabilityStatus,
  isAIAvailablePure,
  isProviderAvailablePure,
} from './availability.js'
export type {AIAvailabilityStatus, ProviderCheckResult} from './availability.js'
export {CodeAnalyzer} from './code-analyzer.js'
export {ConfigurationOptimizer} from './configuration-optimizer.js'
export {DocumentationGenerator} from './documentation-generator.js'
export {
  AIFallbackManager,
  createFallbackManager,
  getFallbackExplanation,
  isGracefulDegradationAvailable,
} from './fallback-manager.js'

export {
  createAIFeatureConfig,
  disableAI,
  enableAllFeatures,
  fromAIConfig,
  getEnabledFeatures,
  getFeatureConfigSummary,
  isFeatureEnabled,
  toAIConfig,
} from './feature-config.js'
export type {AIFeatureConfig, AIFeatureFlags} from './feature-config.js'

export {
  createLLMClient,
  createLLMClientWithProvider,
  getAvailableProviders,
  isAIAvailable,
} from './llm-client-factory.js'
export {LLMClient} from './llm-client.js'

export {
  analyzeExistingProjectFn,
  analyzeProjectRequirements,
  createProjectAnalyzerFn,
} from './project-analyzer-fn.js'

export type {
  ExistingProjectInput,
  ProjectAnalysisInput,
  ProjectAnalyzerInstance,
} from './project-analyzer-fn.js'
export {ProjectAnalyzer} from './project-analyzer.js'

export {
  buildPrompt,
  getAvailableTemplateTypes,
  getPromptTemplate,
  renderPrompt,
} from './prompt-templates.js'

export type {PromptTemplate, PromptTemplateType, TemplateVariables} from './prompt-templates.js'
export type {LLMClientInstance, LLMProviderAdapter, LLMProviderName} from './providers/types.js'

export {
  clampNumber,
  ensureArray,
  extractJsonFromResponse,
  isNonEmptyString,
  isValidArray,
  isValidProjectType,
  normalizeConfidence,
  normalizeProjectType,
  parseAndValidateResponse,
  parseJsonSafely,
  parseStringArray,
  validateResponseStructure,
} from './response-parser.js'
export type {JsonExtractionResult, ValidationOptions} from './response-parser.js'
