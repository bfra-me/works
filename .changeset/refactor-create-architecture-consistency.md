---
'@bfra.me/create': minor
---

Refactor for architectural consistency and Result pattern compliance

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
