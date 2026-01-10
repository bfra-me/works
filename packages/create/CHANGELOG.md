# @bfra.me/create

## 0.7.5
### Patch Changes


- Updated dependency `happy-dom` to `20.1.0`. ([#2572](https://github.com/bfra-me/works/pull/2572))

## 0.7.4
### Patch Changes


- Updated dependency `msw` to `2.12.5`. ([#2547](https://github.com/bfra-me/works/pull/2547))


- Updated dependency `msw` to `2.12.6`. ([#2549](https://github.com/bfra-me/works/pull/2549))


- Updated dependency `msw` to `2.12.7`. ([#2550](https://github.com/bfra-me/works/pull/2550))

## 0.7.3
### Patch Changes


- Updated dependency `openai` to `6.15.0`. ([#2533](https://github.com/bfra-me/works/pull/2533))

## 0.7.2
### Patch Changes


- Updated dependency `openai` to `6.14.0`. ([#2526](https://github.com/bfra-me/works/pull/2526))


- Updated dependency `eta` to `4.5.0`. ([#2510](https://github.com/bfra-me/works/pull/2510))


- Updated dependency `openai` to `6.13.0`. ([#2522](https://github.com/bfra-me/works/pull/2522))

## 0.7.1
### Patch Changes


- Updated dependency `@anthropic-ai/sdk` to `0.71.2`. ([#2449](https://github.com/bfra-me/works/pull/2449))

## 0.7.0
### Minor Changes


- Refactor for architectural consistency and Result pattern compliance ([#2447](https://github.com/bfra-me/works/pull/2447))
  
  ## Breaking Changes
  
  ### Result-Based Error Handling
  
  All async operations now return `Promise<Result<T, E>>` for explicit, type-safe error handling:
  
  - `createPackage()` returns `Promise<Result<{projectPath: string}, CreateError>>`
  - `addFeatureToProject()` returns `Promise<Result<void, CreateError>>`
  - `templateSelection()` returns `Promise<Result<TemplateSelection, TemplateError>>`
  
  **Migration Required:** Replace `try-catch` blocks with Result guards (`isOk`/`isErr`) from `@bfra.me/es/result`.
  
  ### Unified Error System
  
  Structured error codes replace string-based error matching:
  
  - **Template Errors**: `TEMPLATE_NOT_FOUND`, `TEMPLATE_INVALID`, `TEMPLATE_FETCH_FAILED`, etc.
  - **AI Errors**: `AI_PROVIDER_UNAVAILABLE`, `AI_API_KEY_MISSING`, `AI_REQUEST_FAILED`, etc.
  - **CLI Errors**: `INVALID_INPUT`, `PATH_TRAVERSAL_ATTEMPT`, `DIRECTORY_EXISTS`, etc.
  - **Project Errors**: `PROJECT_DETECTION_FAILED`, `PACKAGE_JSON_NOT_FOUND`, etc.
  
  ## New Features
  
  ### Factory Functions
  
  Factory functions now provided for all class-based components:
  
  - `createTemplateFetcher()` - Template fetching with caching
  - `createTemplateValidator()` - Template validation
  - `createLLMClient()` - Provider-agnostic AI client
  - `createProjectAnalyzer()` - Project type detection
  - `createCodeGenerator()` - Code generation utilities
  - `createAIAssistant()` - AI-powered assistance
  - `createConfigurationOptimizer()` - Configuration optimization
  
  **Note:** Classes remain available but are deprecated. They will be removed in v1.0.0.
  
  ### Enhanced Security
  
  - Environment variable access uses `@bfra.me/es/env` utilities
  - Path traversal detection in template resolution
  - Try-finally blocks ensure temp file cleanup
  - Sanitized error messages (no secrets or full paths)
  
  ## Improvements
  
  ### Documentation
  
  - Comprehensive JSDoc for all public APIs
  - Complete API Reference with examples
  - v0.7.0 Migration Guide with step-by-step instructions
  - Troubleshooting section with common issues
  
  ### Test Coverage
  
  Significantly improved test coverage in critical modules:
  
  - `prompts/customization.ts`: 39.56% → 95.60% (+56.04pp)
  - `utils/conflict-resolution.ts`: 47.22% → 100% (+52.78pp)
  - `features/registry.ts`: 50% → 100% (+50pp)
  - Overall coverage: 81.28% → 84.32% (+3.04pp)
  
  ### Code Quality
  
  - Explicit barrel exports replace wildcards for better tree-shaking
  - Consistent Result pattern throughout codebase
  - Enhanced type safety with no `any` types
  - Improved error context and debugging information
  
  ## Deprecations
  
  The following classes are deprecated in favor of factory functions:
  
  - `TemplateFetcher` → use `createTemplateFetcher()`
  - `TemplateValidator` → use `createTemplateValidator()`
  - `LLMClient` → use `createLLMClient()`
  - `ProjectAnalyzer` → use `createProjectAnalyzer()`
  - `CodeGenerator` → use `createCodeGenerator()`
  - `AIAssistant` → use `createAIAssistant()`
  - `ConfigurationOptimizer` → use `createConfigurationOptimizer()`
  
  Classes will be removed in v1.0.0. TypeScript will show deprecation warnings.
  
  ## Migration Guide
  
  See [MIGRATION.md](../packages/create/MIGRATION.md) for detailed migration instructions from v0.6.x to v0.7.0, including:
  
  - Result pattern usage examples
  - Error code handling patterns
  - Factory function migration
  - Step-by-step migration workflow
  - Common pitfalls and solutions
  
  ## Related Issues
  
  - Closes #2446 - Phase 7: Documentation & Migration Guide
  - Closes #2445 - Phase 6: Security & Safety Enhancements
  - Closes #2444 - Phase 5: Test Coverage Enhancement
  - Closes #2443 - Phase 4: Module Export Cleanup
  - Closes #2442 - Phase 3: Factory Pattern Implementation
  - Closes #2441 - Phase 2: Core API Result Type Migration
  - Closes #2440 - Phase 1: Foundation & Type System Enhancement

### Patch Changes


- Updated dependency `@anthropic-ai/sdk` to `0.71.1`. ([#2423](https://github.com/bfra-me/works/pull/2423))


- Updated dependency `openai` to `6.10.0`. ([#2422](https://github.com/bfra-me/works/pull/2422))

## 0.6.0
### Minor Changes


- Refactor @bfra.me/create to functional architecture with enhanced TypeScript typing and comprehensive documentation. ([#2362](https://github.com/bfra-me/works/pull/2362))
  
  ## Highlights
  
  ### Functional Factory Patterns
  - Replaced class-based components with functional factories (`createLLMClient()`, `createTemplateResolver()`, `createTemplateProcessingPipeline()`)
  - Implemented provider-agnostic LLM client supporting OpenAI and Anthropic via adapter pattern
  - Added canonical template processing pipeline encapsulating fetch → validate → parse → render sequence
  
  ### Enhanced Type Safety
  - Added branded types for compile-time validation (`BrandedTemplateSource`, `ProjectPath`, `PackageName`)
  - Implemented `Result<T, E>` pattern from `@bfra.me/es/result` for explicit error handling
  - Created comprehensive type guards for runtime validation
  
  ### Unified Error Handling
  - Established consistent error codes across template, AI, and CLI domains (`TemplateErrorCode`, `AIErrorCode`, `CLIErrorCode`)
  - Added unified error factory utilities using `@bfra.me/es/error`
  - Implemented graceful fallbacks for AI features with user-friendly feedback
  
  ### New Exports
  - `createLLMClient` - Provider-agnostic LLM client factory
  - `createTemplateResolver` - Template resolution factory
  - `createTemplateProcessingPipeline` - Unified template pipeline
  - `validateProjectName`, `validateProjectPath`, `validateTemplateId` - Validation utilities
  - `isPackageName`, `isProjectPath`, `createPackageName`, `createProjectPath` - Type guards and creators
  - Error codes and factory utilities for programmatic error handling
  
  ### Documentation
  - Updated README with Architecture section and Best Practices guide
  - Enhanced MIGRATION.md with Functional Architecture Guide appendix
  - Added deprecation warnings to legacy class-based APIs (`LLMClient`, `ProjectAnalyzer`, `AIError`)
  
  ### Testing
  - Achieved 80%+ test coverage with 1184 passing tests
  - Added comprehensive unit tests for all functional modules
  - Implemented integration tests for CLI workflows
  - Added performance regression tests for template processing

### Patch Changes


- Updated dependency `msw` to `2.12.4`. ([#2394](https://github.com/bfra-me/works/pull/2394))

## 0.5.26
### Patch Changes


- Updated dependency `memfs` to `4.51.1`. ([#2349](https://github.com/bfra-me/works/pull/2349))

## 0.5.25
### Patch Changes


- Updated dependency `happy-dom` to `20.0.11`. ([#2319](https://github.com/bfra-me/works/pull/2319))

## 0.5.24
### Patch Changes


- Updated dependency `package-manager-detector` to `1.6.0`. ([#2277](https://github.com/bfra-me/works/pull/2277))

## 0.5.23
### Patch Changes


- Updated dependency `msw` to `2.12.3`. ([#2240](https://github.com/bfra-me/works/pull/2240))


- Updated dependency `@anthropic-ai/sdk` to `0.71.0`. ([#2247](https://github.com/bfra-me/works/pull/2247))

## 0.5.22
### Patch Changes


- Updated dependency `glob` to `13.0.0`. ([#2228](https://github.com/bfra-me/works/pull/2228))

## 0.5.21
### Patch Changes


- Updated dependency `@anthropic-ai/sdk` to `0.70.1`. ([#2229](https://github.com/bfra-me/works/pull/2229))

## 0.5.20
### Patch Changes


- Updated dependency `openai` to `6.9.1`. ([#2205](https://github.com/bfra-me/works/pull/2205))


- Updated dependency `@anthropic-ai/sdk` to `0.70.0`. ([#2208](https://github.com/bfra-me/works/pull/2208))

## 0.5.19
### Patch Changes


- Remove unnecessary workspace dependencies. ([#2179](https://github.com/bfra-me/works/pull/2179))

## 0.5.18
### Patch Changes


- Updated dependency `eta` to `4.4.0`. ([#2152](https://github.com/bfra-me/works/pull/2152))


- Updated dependency `@anthropic-ai/sdk` to `0.69.0`. ([#2163](https://github.com/bfra-me/works/pull/2163))


- Updated dependency `glob` to `11.1.0`. ([#2164](https://github.com/bfra-me/works/pull/2164))


- Updated dependency `openai` to `6.9.0`. ([#2157](https://github.com/bfra-me/works/pull/2157))


- Updated dependency `eta` to `4.1.0`. ([#2150](https://github.com/bfra-me/works/pull/2150))


- Updated dependency `eta` to `4.4.1`. ([#2153](https://github.com/bfra-me/works/pull/2153))


- Updated dependency `tsup` to `8.5.1`. ([#2149](https://github.com/bfra-me/works/pull/2149))


- Updated dependency `memfs` to `4.51.0`. ([#2145](https://github.com/bfra-me/works/pull/2145))


- Updated dependency `eta` to `4.2.0`. ([#2151](https://github.com/bfra-me/works/pull/2151))


- Updated dependency `msw` to `2.12.2`. ([#2162](https://github.com/bfra-me/works/pull/2162))

## 0.5.17
### Patch Changes


- Updated dependency `@types/node` to `24.10.1`. ([#2138](https://github.com/bfra-me/works/pull/2138))

## 0.5.16
### Patch Changes


- Updated dependency `msw` to `2.12.1`. ([#2124](https://github.com/bfra-me/works/pull/2124))

## 0.5.15
### Patch Changes


- Updated dependency `zod` to `4.1.12`. ([#2103](https://github.com/bfra-me/works/pull/2103))


- Updated dependency `@vitest/coverage-v8` to `4.0.7`. ([#2107](https://github.com/bfra-me/works/pull/2107))
  Updated dependency `@vitest/ui` to `4.0.7`.
  Updated dependency `vitest` to `4.0.7`.

- Updated dependency `msw` to `2.12.0`. ([#2113](https://github.com/bfra-me/works/pull/2113))


- Updated dependency `openai` to `6.8.1`. ([#2105](https://github.com/bfra-me/works/pull/2105))


- Updated dependency `eta` to `4.0.1`. ([#2104](https://github.com/bfra-me/works/pull/2104))


- Updated dependency `@vitest/coverage-v8` to `4.0.6`. ([#2091](https://github.com/bfra-me/works/pull/2091))
  Updated dependency `@vitest/ui` to `4.0.6`.
  Updated dependency `vitest` to `4.0.6`.

## 0.5.14
### Patch Changes


- Updated dependency `happy-dom` to `20.0.10`. ([#2069](https://github.com/bfra-me/works/pull/2069))


- Updated dependency `@anthropic-ai/sdk` to `0.68.0`. ([#2066](https://github.com/bfra-me/works/pull/2066))


- Updated dependency `@types/node` to `22.18.13`. ([#2074](https://github.com/bfra-me/works/pull/2074))


- Updated dependency `@types/node` to `24.9.2`. ([#2071](https://github.com/bfra-me/works/pull/2071))


- Updated dependency `happy-dom` to `20.0.9`. ([#2068](https://github.com/bfra-me/works/pull/2068))


- Updated dependency `memfs` to `4.50.0`. ([#2062](https://github.com/bfra-me/works/pull/2062))

## 0.5.13
### Patch Changes


- Updated dependency `happy-dom` to `20.0.8`. ([#2034](https://github.com/bfra-me/works/pull/2034))


- Updated dependency `package-manager-detector` to `1.5.0`. ([#2016](https://github.com/bfra-me/works/pull/2016))


- Updated dependency `@anthropic-ai/sdk` to `0.67.0`. ([#2005](https://github.com/bfra-me/works/pull/2005))


- Updated dependency `msw` to `2.11.6`. ([#2021](https://github.com/bfra-me/works/pull/2021))


- Updated dependency `happy-dom` to `20.0.2`. ([#1981](https://github.com/bfra-me/works/pull/1981))

## 0.5.12
### Patch Changes


- Updated dependency `package-manager-detector` to `1.4.1`. ([#2002](https://github.com/bfra-me/works/pull/2002))


- Updated dependency `@types/node` to `22.18.10`. ([#1990](https://github.com/bfra-me/works/pull/1990))


- Updated dependency `@anthropic-ai/sdk` to `0.66.0`. ([#2004](https://github.com/bfra-me/works/pull/2004))

## 0.5.11
### Patch Changes


- Updated dependency `package-manager-detector` to `1.4.0`. ([#1971](https://github.com/bfra-me/works/pull/1971))


- Updated dependency `msw` to `2.11.4`. ([#1983](https://github.com/bfra-me/works/pull/1983))


- Updated dependency `msw` to `2.11.5`. ([#1985](https://github.com/bfra-me/works/pull/1985))


- Updated dependency `semver` to `7.7.3`. ([#1978](https://github.com/bfra-me/works/pull/1978))


- Updated dependency `memfs` to `4.49.0`. ([#1976](https://github.com/bfra-me/works/pull/1976))

## 0.5.10
### Patch Changes


- Updated dependency `memfs` to `4.48.0`. ([#1952](https://github.com/bfra-me/works/pull/1952))


- Updated dependency `openai` to `5.23.1`. ([#1935](https://github.com/bfra-me/works/pull/1935))


- Updated dependency `memfs` to `4.48.1`. ([#1953](https://github.com/bfra-me/works/pull/1953))


- Updated dependency `@anthropic-ai/sdk` to `0.65.0`. ([#1945](https://github.com/bfra-me/works/pull/1945))


- Updated dependency `memfs` to `4.47.0`. ([#1937](https://github.com/bfra-me/works/pull/1937))


- Updated dependency `dotenv` to `17.2.3`. ([#1946](https://github.com/bfra-me/works/pull/1946))


- Updated dependency `openai` to `5.23.2`. ([#1947](https://github.com/bfra-me/works/pull/1947))


- Updated dependency `@anthropic-ai/sdk` to `0.64.0`. ([#1936](https://github.com/bfra-me/works/pull/1936))


- Updated dependency `typescript` to `5.9.3`. ([#1949](https://github.com/bfra-me/works/pull/1949))


- Updated dependency `@types/node` to `22.18.6`. ([#1939](https://github.com/bfra-me/works/pull/1939))

## 0.5.9
### Patch Changes


- Updated dependency `memfs` to `4.42.0`. ([#1901](https://github.com/bfra-me/works/pull/1901))


- Updated dependency `msw` to `2.11.3`. ([#1906](https://github.com/bfra-me/works/pull/1906))


- Updated dependency `openai` to `5.22.1`. ([#1898](https://github.com/bfra-me/works/pull/1898))


- Updated dependency `memfs` to `4.45.0`. ([#1923](https://github.com/bfra-me/works/pull/1923))


- Updated dependency `openai` to `5.23.0`. ([#1918](https://github.com/bfra-me/works/pull/1918))


- Updated dependency `@anthropic-ai/sdk` to `0.63.1`. ([#1920](https://github.com/bfra-me/works/pull/1920))


- Updated dependency `memfs` to `4.43.0`. ([#1903](https://github.com/bfra-me/works/pull/1903))


- Updated dependency `memfs` to `4.46.1`. ([#1926](https://github.com/bfra-me/works/pull/1926))


- Updated dependency `@anthropic-ai/sdk` to `0.63.0`. ([#1905](https://github.com/bfra-me/works/pull/1905))


- Updated dependency `openai` to `5.22.1`. ([#1895](https://github.com/bfra-me/works/pull/1895))


- Updated dependency `memfs` to `4.44.0`. ([#1922](https://github.com/bfra-me/works/pull/1922))


- Updated dependency `openai` to `5.22.0`. ([#1879](https://github.com/bfra-me/works/pull/1879))


- Updated dependency `memfs` to `4.46.0`. ([#1924](https://github.com/bfra-me/works/pull/1924))

## 0.5.8
### Patch Changes


- Updated dependency `@types/node` to `22.18.1`. ([#1871](https://github.com/bfra-me/works/pull/1871))

## 0.5.7
### Patch Changes


- Updated dependency `@anthropic-ai/sdk` to `0.62.0`. ([#1864](https://github.com/bfra-me/works/pull/1864))

## 0.5.6
### Patch Changes


- Updated dependency `msw` to `2.11.2`. ([#1855](https://github.com/bfra-me/works/pull/1855))


- Updated dependency `memfs` to `4.39.0`. ([#1853](https://github.com/bfra-me/works/pull/1853))


- Updated dependency `zod` to `4.1.5`. ([#1834](https://github.com/bfra-me/works/pull/1834))


- Updated dependency `openai` to `5.20.1`. ([#1854](https://github.com/bfra-me/works/pull/1854))

## 0.5.5
### Patch Changes


- Updated dependency `@anthropic-ai/sdk` to `0.61.0`. ([#1833](https://github.com/bfra-me/works/pull/1833))


- Updated dependency `memfs` to `4.38.3`. ([#1838](https://github.com/bfra-me/works/pull/1838))

## 0.5.4
### Patch Changes


- Updated dependency `openai` to `5.20.0`. ([#1828](https://github.com/bfra-me/works/pull/1828))

## 0.5.3
### Patch Changes


- Updated dependency `@types/node` to `22.18.0`. ([#1773](https://github.com/bfra-me/works/pull/1773))


- Updated dependency `msw` to `2.11.0`. ([#1778](https://github.com/bfra-me/works/pull/1778))


- Updated dependency `msw` to `2.11.1`. ([#1780](https://github.com/bfra-me/works/pull/1780))


- Updated dependency `openai` to `5.19.1`. ([#1795](https://github.com/bfra-me/works/pull/1795))


- Updated dependency `dotenv` to `17.2.2`. ([#1796](https://github.com/bfra-me/works/pull/1796))


- Updated dependency `openai` to `5.17.0`. ([#1793](https://github.com/bfra-me/works/pull/1793))

## 0.5.2
### Patch Changes


- Updated dependency `openai` to `5.16.0`. ([#1753](https://github.com/bfra-me/works/pull/1753))


- Updated dependency `memfs` to `4.38.2`. ([#1752](https://github.com/bfra-me/works/pull/1752))

## 0.5.1
### Patch Changes


- Updated dependency `openai` to `5.15.0`. ([#1723](https://github.com/bfra-me/works/pull/1723))


- Updated dependency `memfs` to `4.38.0`. ([#1745](https://github.com/bfra-me/works/pull/1745))


- Updated dependency `memfs` to `4.37.1`. ([#1740](https://github.com/bfra-me/works/pull/1740))


- Updated dependency `memfs` to `4.38.1`. ([#1746](https://github.com/bfra-me/works/pull/1746))


- Updated dependency `memfs` to `4.37.0`. ([#1735](https://github.com/bfra-me/works/pull/1735))


- Updated dependency `zod` to `4.0.17`. ([#1709](https://github.com/bfra-me/works/pull/1709))

## 0.5.0
### Minor Changes


- Completely redesign `@bfra.me/create` to transform it from a simple template-based package generator into a comprehensive CLI for TypeScript project scaffolding. ([#1704](https://github.com/bfra-me/works/pull/1704))

## 0.4.13
### Patch Changes


- Updated dependency `memfs` to `4.36.2`. ([#1691](https://github.com/bfra-me/works/pull/1691))


- Updated dependency `memfs` to `4.36.3`. ([#1693](https://github.com/bfra-me/works/pull/1693))


- Updated dependency `openai` to `5.13.1`. ([#1699](https://github.com/bfra-me/works/pull/1699))

## 0.4.12
### Patch Changes


- Updated dependency `typescript` to `5.9.2`. ([#1627](https://github.com/bfra-me/works/pull/1627))

## 0.4.11
### Patch Changes


- Apply linter fixes from increased type-aware checks. ([#1625](https://github.com/bfra-me/works/pull/1625))


- Updated dependency `memfs` to `4.36.0`. ([#1603](https://github.com/bfra-me/works/pull/1603))

## 0.4.10
### Patch Changes


- Updated dependency `memfs` to `4.28.0`. ([#1592](https://github.com/bfra-me/works/pull/1592))


- Updated dependency `memfs` to `4.32.0`. ([#1600](https://github.com/bfra-me/works/pull/1600))


- Updated dependency `memfs` to `4.27.0`. ([#1589](https://github.com/bfra-me/works/pull/1589))


- Updated dependency `memfs` to `4.31.0`. ([#1599](https://github.com/bfra-me/works/pull/1599))


- Updated dependency `memfs` to `4.28.1`. ([#1595](https://github.com/bfra-me/works/pull/1595))


- Updated dependency `memfs` to `4.29.0`. ([#1596](https://github.com/bfra-me/works/pull/1596))


- Updated dependency `memfs` to `4.30.1`. ([#1598](https://github.com/bfra-me/works/pull/1598))


- Updated dependency `memfs` to `4.30.0`. ([#1597](https://github.com/bfra-me/works/pull/1597))


- Updated dependency `memfs` to `4.35.0`. ([#1602](https://github.com/bfra-me/works/pull/1602))


- Updated dependency `memfs` to `4.34.0`. ([#1601](https://github.com/bfra-me/works/pull/1601))

## 0.4.9
### Patch Changes


- Updated dependency `memfs` to `4.25.0`. ([#1584](https://github.com/bfra-me/works/pull/1584))


- Updated dependency `memfs` to `4.20.0`. ([#1568](https://github.com/bfra-me/works/pull/1568))


- Updated dependency `memfs` to `4.24.0`. ([#1582](https://github.com/bfra-me/works/pull/1582))


- Updated dependency `memfs` to `4.25.1`. ([#1586](https://github.com/bfra-me/works/pull/1586))


- Updated dependency `memfs` to `4.23.0`. ([#1572](https://github.com/bfra-me/works/pull/1572))

## 0.4.8
### Patch Changes


- Updated dependency `@sxzz/create` to `0.15.1`. ([#1337](https://github.com/bfra-me/works/pull/1337))


- Updated dependency `@clack/prompts` to `0.11.0`. ([#1320](https://github.com/bfra-me/works/pull/1320))

## 0.4.7
### Patch Changes


- Updated dependency `@sxzz/create` to `0.15.0`. ([#1300](https://github.com/bfra-me/works/pull/1300))

## 0.4.6
### Patch Changes


- Updated dependency `tsup` to `8.5.0`. ([#1288](https://github.com/bfra-me/works/pull/1288))


- Updated dependency `memfs` to `4.17.2`. ([#1285](https://github.com/bfra-me/works/pull/1285))

## 0.4.5
### Patch Changes


- Updated dependency `memfs` to `4.17.1`. ([#1240](https://github.com/bfra-me/works/pull/1240))

## 0.4.4
### Patch Changes


- Updated dependency `@sxzz/create` to `0.14.5`. ([#1169](https://github.com/bfra-me/works/pull/1169))


- Updated dependency `@sxzz/create` to `0.14.6`. ([#1190](https://github.com/bfra-me/works/pull/1190))

## 0.4.3
### Patch Changes


- Remove Jiti. ([#1142](https://github.com/bfra-me/works/pull/1142))

## 0.4.2
### Patch Changes


- Updated dependency `@clack/prompts` to `0.10.1`. ([#1137](https://github.com/bfra-me/works/pull/1137))

## 0.4.1
### Patch Changes


- Updated dependency `typescript` to `5.8.3`. ([#1122](https://github.com/bfra-me/works/pull/1122))

## 0.4.0
### Minor Changes


- Make `cli` executable and add shebang. ([#1079](https://github.com/bfra-me/works/pull/1079))


### Patch Changes


- Updated dependency `typescript` to `5.8.2`. ([#1074](https://github.com/bfra-me/works/pull/1074))

## 0.3.2
### Patch Changes


- Updated dependency `@sxzz/create` to `0.14.3`. ([#1019](https://github.com/bfra-me/works/pull/1019))


- Updated dependency `@sxzz/create` to `0.14.2`. ([#1011](https://github.com/bfra-me/works/pull/1011))


- Updated dependency `consola` to `3.4.1`. ([#1059](https://github.com/bfra-me/works/pull/1059))


- Updated dependency `tsup` to `8.4.0`. ([#1000](https://github.com/bfra-me/works/pull/1000))


- Updated dependency `@clack/prompts` to `0.10.0`. ([#966](https://github.com/bfra-me/works/pull/966))


- Updated dependency `@sxzz/create` to `0.14.1`. ([#967](https://github.com/bfra-me/works/pull/967))


- Updated dependency `@sxzz/create` to `0.14.4`. ([#1042](https://github.com/bfra-me/works/pull/1042))


- Updated dependency `consola` to `3.4.2`. ([#1062](https://github.com/bfra-me/works/pull/1062))

## 0.3.1
### Patch Changes


- Updated dependency `tsup` to `8.3.6`. ([#915](https://github.com/bfra-me/works/pull/915))

## 0.3.0
### Minor Changes


- Update types and call to `run`. ([#889](https://github.com/bfra-me/works/pull/889))


### Patch Changes


- Updated dependency `@sxzz/create` to `0.12.0`. ([#830](https://github.com/bfra-me/works/pull/830))

## 0.2.8
### Patch Changes


- Updated dependency `memfs` to `4.17.0`. ([#856](https://github.com/bfra-me/works/pull/856))


- Updated dependency `@clack/prompts` to `0.9.1`. ([#854](https://github.com/bfra-me/works/pull/854))


- Updated dependency `consola` to `3.4.0`. ([#865](https://github.com/bfra-me/works/pull/865))


- Updated dependency `memfs` to `4.16.0`. ([#855](https://github.com/bfra-me/works/pull/855))


- Updated dependency `typescript` to `5.7.3`. ([#851](https://github.com/bfra-me/works/pull/851))

## 0.2.7
### Patch Changes


- Updated dependency `memfs` to `4.15.2`. ([#831](https://github.com/bfra-me/works/pull/831))


- Updated dependency `consola` to `3.3.2`. ([#820](https://github.com/bfra-me/works/pull/820))


- Updated dependency `memfs` to `4.15.3`. ([#834](https://github.com/bfra-me/works/pull/834))


- Updated dependency `consola` to `3.3.3`. ([#823](https://github.com/bfra-me/works/pull/823))

## 0.2.6
### Patch Changes


- Updated dependency `consola` to `3.3.1`. ([#805](https://github.com/bfra-me/works/pull/805))

## 0.2.5
### Patch Changes


- Updated dependency `memfs` to `4.15.1`. ([#798](https://github.com/bfra-me/works/pull/798))

## 0.2.4
### Patch Changes


- Updated dependency `@clack/prompts` to `0.9.0`. ([#790](https://github.com/bfra-me/works/pull/790))


- Updated dependency `consola` to `3.3.0`. ([#792](https://github.com/bfra-me/works/pull/792))

## 0.2.3
### Patch Changes


- Fix linter errors. ([#758](https://github.com/bfra-me/works/pull/758))

## 0.2.2
### Patch Changes


- Fix tests. ([#736](https://github.com/bfra-me/works/pull/736))


- Apply linter fixes. ([#744](https://github.com/bfra-me/works/pull/744))


- Updated dependency `memfs` to `4.15.0`. ([#740](https://github.com/bfra-me/works/pull/740))

## 0.2.1
### Patch Changes


- Updated dependency `vitest` to `2.1.8`. ([#719](https://github.com/bfra-me/works/pull/719))
  Updated dependency `@vitest/coverage-v8` to `2.1.8`.

- Updated dependency `memfs` to `4.14.1`. ([#715](https://github.com/bfra-me/works/pull/715))


- Updated dependency `vitest` to `2.1.7`. ([#717](https://github.com/bfra-me/works/pull/717))
  Updated dependency `@vitest/coverage-v8` to `2.1.7`.

## 0.2.0
### Minor Changes


- Use @sxzz/create for downloading templates ([#657](https://github.com/bfra-me/works/pull/657))

## 0.1.9
### Patch Changes


- Updated dependency `@types/node` to `22.10.1`. ([#701](https://github.com/bfra-me/works/pull/701))

## 0.1.8
### Patch Changes


- Fix linter errors. ([#691](https://github.com/bfra-me/works/pull/691))

## 0.1.7
### Patch Changes


- Updated dependency `vitest` to `2.1.6`. ([#686](https://github.com/bfra-me/works/pull/686))
  Updated dependency `@vitest/coverage-v8` to `2.1.6`.

## 0.1.6
### Patch Changes


- Updated dependency `@types/node` to `22.9.4`. ([#674](https://github.com/bfra-me/works/pull/674))


- Updated dependency `@types/node` to `22.10.0`. ([#676](https://github.com/bfra-me/works/pull/676))

## 0.1.5
### Patch Changes


- Updated dependency `@types/node` to `22.9.2`. ([#650](https://github.com/bfra-me/works/pull/650))


- Updated dependency `@types/node` to `22.9.3`. ([#653](https://github.com/bfra-me/works/pull/653))

## 0.1.4
### Patch Changes


- Updated dependency `@types/node` to `22.9.1`. ([#635](https://github.com/bfra-me/works/pull/635))


- Updated dependency `vitest` to `2.1.5`. ([#626](https://github.com/bfra-me/works/pull/626))
  Updated dependency `@vitest/coverage-v8` to `2.1.5`.

## 0.1.3
### Patch Changes


- Updated dependency `@types/node` to `22.8.7`. ([#598](https://github.com/bfra-me/works/pull/598))


- Updated dependency `@types/node` to `22.9.0`. ([#603](https://github.com/bfra-me/works/pull/603))

## 0.1.2
### Patch Changes


- Add `prepack` scripts. ([#595](https://github.com/bfra-me/works/pull/595))

## 0.1.1
### Patch Changes


- Updated dependency `ts-essentials` to `10.0.3`. ([#588](https://github.com/bfra-me/works/pull/588))

## 0.1.0
### Minor Changes


- Add the @bfra.me/create utility. The `create` CLI is used to generate package sources from predefined templates. ([#564](https://github.com/bfra-me/works/pull/564))


### Patch Changes


- Updated dependency `yargs` to `17.7.2`. ([#583](https://github.com/bfra-me/works/pull/583))


- Updated dependency `@types/node` to `22.8.6`. ([#580](https://github.com/bfra-me/works/pull/580))
