---
'@bfra.me/create': minor
---

Refactor @bfra.me/create to functional architecture with enhanced TypeScript typing and comprehensive documentation.

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
