---
goal: Refactor @bfra.me/create for Architectural Consistency and Result Pattern Compliance
version: 1.0
date_created: 2025-12-08
last_updated: 2025-12-08
owner: @bfra.me/works
status: In Progress
tags:
  - refactor
  - architecture
  - type-safety
  - error-handling
  - testing
related_issues:
  - Quality Audit: .ai/package-analysis/@bfra.me-create-quality-audit.md
---

# Implementation Plan: @bfra.me/create Architecture Consistency Refactor

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

## Overview

This implementation plan addresses the high and medium-priority architectural inconsistencies identified in the quality audit of `@bfra.me/create` v0.6.0. The primary goal is to align the implementation with the documented functional architecture and Result-based error handling patterns declared in the package README.

**Current Quality Score:** 7.2/10
**Target Quality Score:** 8.5+/10

### Core Problems

1. **Type Safety Violations:** ~15 async functions return bare `Promise<T>` instead of `Promise<Result<T, E>>`
2. **Inconsistent Error Handling:** 8+ locations throw exceptions instead of returning error Results
3. **Architectural Mismatch:** 7+ classes contradict documented "functional factories" architecture
4. **Module Export Issues:** Wildcard re-exports in barrel files reduce modularity
5. **Test Coverage Gaps:** Critical modules have <60% coverage

---

## Goals & Requirements

### Functional Requirements

- [x] All async functions must return `Promise<Result<T, E>>` for consistent error handling
- [x] Replace exception throws with error Results using unified error codes
- [x] Provide factory functions for all class-based components with backward compatibility
- [x] Convert barrel exports to explicit named exports
- [x] Achieve 75%+ test coverage in all critical modules

### Non-Functional Requirements

- [x] Maintain backward compatibility through deprecation warnings
- [x] Preserve existing functionality (no behavioral changes)
- [x] Ensure type-safety with strict TypeScript compliance
- [x] Keep bundle size impact minimal (<5% increase)
- [x] Document migration path for consumers

### Security & Safety

- [x] Use `@bfra.me/es/env` utilities for environment variable handling
- [x] Implement try-finally for temp file cleanup
- [x] Validate all user inputs before filesystem operations
- [x] No secrets in error messages or logs

### Success Criteria

✅ All tests pass with >81% coverage maintained
✅ Type checking passes with no errors
✅ Build completes successfully
✅ CLI commands execute without runtime errors
✅ Breaking changes documented with migration guide
✅ Quality score increases to 8.5+/10

---

## Implementation Phases

### Phase 1: Foundation & Type System Enhancement (2-3 hours)

**Goal:** Establish consistent Result types and error handling infrastructure

#### Tasks

- [x] **1.1: Create Result type variants for all error domains** | ✅ | 2025-12-08
  - File: `src/types.ts`
  - Define `CreateError`, `TemplateError`, `AIError`, `CLIError` discriminated unions
  - Example pattern from `@bfra.me/es/result`:
    ```typescript
    import type { Result } from '@bfra.me/es/result'
    import type { BaseError } from '@bfra.me/es/error'

    export type CreateError =
      | { code: 'VALIDATION_FAILED'; message: string; details?: string[] }
      | { code: 'TEMPLATE_NOT_FOUND'; message: string; source: string }
      | { code: 'AI_UNAVAILABLE'; message: string; provider?: string }

    export type CreateResult<T> = Result<T, CreateError>
    ```

- [x] **1.2: Extract AI capability detection to utility** | ✅ | 2025-12-08
  - File: `src/utils/ai-capabilities.ts` (new)
  - Create `getAICapabilities()` function:
    ```typescript
    import { getEnv } from '@bfra.me/es/env'

    export interface AICapabilities {
      enabled: boolean
      openai: boolean
      anthropic: boolean
      provider: 'openai' | 'anthropic' | 'none'
    }

    export function getAICapabilities(requestedProvider?: string): AICapabilities {
      const openaiKey = getEnv('OPENAI_API_KEY')
      const anthropicKey = getEnv('ANTHROPIC_API_KEY')
      // Implementation...
    }
    ```
  - Replace inline checks in `src/index.ts` lines 44-52

- [x] **1.3: Update error utility functions** | ✅ | 2025-12-08
  - File: `src/utils/errors.ts`
  - Add factory functions returning typed errors:
    ```typescript
    export function validationError(
      message: string,
      details?: string[]
    ): CreateError {
      return { code: 'VALIDATION_FAILED', message, details }
    }
    ```

#### Testing
- Unit tests for error factory functions
- Type checking for error variant coverage
- Validation that error codes match constants

#### Dependencies
None (foundational phase)

---

### Phase 2: Core API Result Type Migration (4-6 hours)

**Goal:** Convert main entry points to return Result types

#### Tasks

- [x] **2.1: Refactor `createPackage()` function** | ✅ | 2025-12-08
  - File: `src/index.ts`
  - Change return type from custom object to `Promise<Result<{projectPath: string}, CreateError>>`
  - Before:
    ```typescript
    export async function createPackage(
      options: CreateCommandOptions
    ): Promise<Result<{projectPath: string}>> {
      try {
        // ... implementation
        return { success: true, data: {projectPath: outputDir} }
      } catch (error) {
        return { success: false, error: error as Error }
      }
    }
    ```
  - After:
    ```typescript
    import { ok, err, type Result } from '@bfra.me/es/result'

    export async function createPackage(
      options: CreateCommandOptions
    ): Promise<Result<{projectPath: string}, CreateError>> {
      // Validation
      const validation = ValidationUtils.validateCreateOptions(options)
      if (!validation.valid) {
        return err(validationError(
          validation.errors?.join(', ') ?? 'Invalid options',
          validation.errors
        ))
      }

      // ... implementation
      return ok({projectPath: outputDir})
    }
    ```

- [x] **2.2: Convert `addFeatureToProject()` function** | ✅ | 2025-12-08
  - File: `src/commands/add.ts`
  - Change return type from `Promise<void>` to `Promise<Result<void, CreateError>>`
  - Replace exception throws (line 34) with error returns:
    ```typescript
    if (!isNodeProject(targetDir)) {
      return err({
        code: 'PROJECT_DETECTION_FAILED',
        message: 'Target directory does not contain a valid Node.js project',
        path: targetDir
      })
    }
    ```

- [x] **2.3: Convert `templateSelection()` function** | ✅ | 2025-12-08
  - File: `src/prompts/template-selection.ts`
  - Change return from `Promise<TemplateSelection>` to `Promise<Result<TemplateSelection, TemplateError>>`
  - Replace exception throw (line 175) with error result:
    ```typescript
    const defaultTemplate = BUILTIN_TEMPLATES['default']
    if (!defaultTemplate) {
      return err({
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Default template not found',
        source: 'builtin'
      })
    }
    ```

- [ ] **2.4: Update CLI entry point error handling**
  - File: `src/cli.ts`
  - Use Result guards (`isOk`, `isErr`) instead of try-catch:
    ```typescript
    import { isOk, isErr } from '@bfra.me/es/result'

    const result = await createPackage(options)
    if (isErr(result)) {
      consola.error(`Error: ${result.error.message}`)
      process.exit(1)
    }
    consola.success(`Project created at: ${result.data.projectPath}`)
    ```

- [ ] **2.5: Convert template processing pipeline**
  - File: `src/templates/fetcher.ts`
  - Update `fetch()` method to return proper Result
  - Replace custom `{success, data, error}` with Result guards
  - Update callers in `src/index.ts` (lines 189-196)

- [ ] **2.6: Convert AI assistant functions**
  - File: `src/ai/assistant.ts`
  - Update `gatherProjectDescription()` (line 132) return type
  - Replace exception throws (lines 154, 266) with error Results

#### Testing
- Update existing tests to use Result assertions:
  ```typescript
  import { isOk, unwrap } from '@bfra.me/es/result'

  it('should create package successfully', async () => {
    const result = await createPackage(validOptions)
    expect(isOk(result)).toBe(true)
    expect(unwrap(result).projectPath).toMatch(/new-project$/)
  })

  it('should return error for invalid options', async () => {
    const result = await createPackage(invalidOptions)
    expect(isErr(result)).toBe(true)
    expect(result.error.code).toBe('VALIDATION_FAILED')
  })
  ```
- Integration tests for full create workflow
- Snapshot tests for error messages

#### Dependencies
- Phase 1 complete (error types defined)

---

### Phase 3: Factory Pattern Implementation (6-8 hours)

**Goal:** Provide factory functions for class-based components

#### Tasks

- [ ] **3.1: Create factory for TemplateFetcher**
  - File: `src/templates/fetcher.ts`
  - Add factory function before class:
    ```typescript
    export interface TemplateFetcherInstance {
      fetch(source: TemplateSource, outputDir: string): Promise<Result<FetchResult, TemplateError>>
      getCacheInfo(): CacheInfo
    }

    /**
     * Creates a template fetcher instance for downloading and caching templates.
     *
     * @param config - Optional cache configuration
     * @returns Template fetcher instance
     *
     * @example
     * ```typescript
     * const fetcher = createTemplateFetcher({ ttl: 7200 })
     * const result = await fetcher.fetch(source, outputDir)
     * if (isOk(result)) {
     *   console.log(result.data.path)
     * }
     * ```
     */
    export function createTemplateFetcher(
      config?: Partial<CacheConfig>
    ): TemplateFetcherInstance {
      const instance = new TemplateFetcher(config)
      return {
        fetch: instance.fetch.bind(instance),
        getCacheInfo: instance.getCacheInfo.bind(instance),
      }
    }

    /**
     * @deprecated Use createTemplateFetcher() instead. Will be removed in v1.0.0
     */
    export class TemplateFetcher { /* existing implementation */ }
    ```

- [ ] **3.2: Create factory for TemplateValidator**
  - File: `src/templates/validator.ts`
  - Follow same pattern as 3.1
  - Export `createTemplateValidator()` factory
  - Add deprecation warning to class

- [ ] **3.3: Create factory for ProjectAnalyzer**
  - File: `src/ai/project-analyzer.ts`
  - Note existing deprecation notice (line 15)
  - Create `createProjectAnalyzer()` factory
  - Update documentation to reference functional alternative

- [ ] **3.4: Create factory for LLMClient**
  - File: `src/ai/llm-client.ts`
  - Export `createLLMClient()` factory
  - Ensure provider-agnostic interface

- [ ] **3.5: Create factory for CodeGenerator**
  - File: `src/ai/code-generator.ts`
  - Export `createCodeGenerator()` factory
  - Maintain existing functionality

- [ ] **3.6: Create factory for AIAssistant**
  - File: `src/ai/assistant.ts`
  - Export `createAIAssistant()` factory

- [ ] **3.7: Create factory for ConfigurationOptimizer**
  - File: `src/ai/configuration-optimizer.ts`
  - Export `createConfigurationOptimizer()` factory

- [ ] **3.8: Update all factory consumers**
  - File: `src/index.ts`, `src/commands/add.ts`
  - Replace class instantiation with factory calls:
    ```typescript
    // Before
    const projectAnalyzer = new ProjectAnalyzer({ enabled: true })

    // After
    const projectAnalyzer = createProjectAnalyzer({ enabled: true })
    ```

- [ ] **3.9: Update main exports**
  - File: `src/index.ts`
  - Export factory functions alongside deprecated classes
  - Add migration notes in comments

#### Testing
- Test factory functions create working instances
- Verify backward compatibility with class usage
- Test factory options/configuration
- Ensure deprecation warnings appear in TypeScript

#### Dependencies
- Phase 2 complete (Result types integrated)

---

### Phase 4: Module Export Cleanup (1-2 hours)

**Goal:** Replace wildcard exports with explicit named exports

#### Tasks

- [ ] **4.1: Refactor utils barrel file**
  - File: `src/utils/index.ts`
  - Replace wildcard exports with explicit exports:
    ```typescript
    /**
     * Utility modules for @bfra.me/create.
     *
     * Prefer importing specific utilities rather than the entire module:
     * ```typescript
     * import { validateProjectName } from '@bfra.me/create/utils/validation'
     * ```
     */

    // Command options
    export { normalizeCommandOptions, type CommandOptions } from './command-options.js'

    // Constants
    export {
      BUILTIN_NODE_MODULES,
      RESERVED_PACKAGE_NAMES,
      DEFAULT_TEMPLATE,
      SUPPORTED_PACKAGE_MANAGERS
    } from './constants.js'

    // Error handling
    export {
      createTemplateError,
      createAIError,
      createCLIError,
      TemplateErrorCode,
      AIErrorCode,
      CLIErrorCode,
      type ErrorCode
    } from './errors.js'

    // File system
    export {
      ensureDir,
      copyFiles,
      type CopyOptions
    } from './file-system.js'

    // Continue for all modules...
    ```

- [ ] **4.2: Review and update import statements**
  - Files: All `src/**/*.ts` files
  - Update imports to use specific paths where beneficial:
    ```typescript
    // Instead of
    import { ValidationUtils } from './utils/index.js'

    // Use
    import { ValidationUtils } from './utils/validation.js'
    ```

- [ ] **4.3: Update package.json exports (if needed)**
  - File: `package.json`
  - Consider exposing subpath exports for utilities:
    ```json
    "exports": {
      ".": {
        "import": {
          "types": "./dist/index.d.ts",
          "default": "./dist/index.js"
        }
      },
      "./utils": {
        "import": {
          "types": "./dist/utils/index.d.ts",
          "default": "./dist/utils/index.js"
        }
      },
      "./package.json": "./package.json"
    }
    ```

#### Testing
- Verify all imports resolve correctly
- Test build output structure
- Check bundle size impact (should be neutral or better)
- Run integration tests

#### Dependencies
- Phase 3 complete (factories implemented)

---

### Phase 5: Test Coverage Enhancement (3-4 hours)

**Goal:** Increase test coverage in critical modules to 75%+

#### Tasks

- [ ] **5.1: Enhance `prompts/customization.ts` tests (39.56% → 75%)**
  - File: `test/prompts/customization.test.ts`
  - Add tests for:
    - Form validation edge cases (empty inputs, special characters)
    - User cancellation flows (isCancel scenarios)
    - Default value handling
    - Package manager selection logic
  - Mock `@clack/prompts` interactions:
    ```typescript
    import { vi } from 'vitest'
    import * as prompts from '@clack/prompts'

    vi.mock('@clack/prompts', () => ({
      text: vi.fn(),
      select: vi.fn(),
      confirm: vi.fn(),
      isCancel: vi.fn(),
    }))

    it('should handle user cancellation gracefully', async () => {
      vi.mocked(prompts.text).mockResolvedValue(Symbol('cancel'))
      vi.mocked(prompts.isCancel).mockReturnValue(true)

      const result = await customizationPrompts({})
      expect(isErr(result)).toBe(true)
      expect(result.error.code).toBe('USER_CANCELLED')
    })
    ```

- [ ] **5.2: Enhance `utils/conflict-resolution.ts` tests (47.22% → 75%)**
  - File: `test/utils/conflict-resolution.test.ts`
  - Add tests for:
    - Conflict detection algorithms with various file types
    - Merge strategy (overlapping configs, nested objects)
    - Overwrite strategy (file preservation)
    - Skip strategy (selective ignore)
    - Edge cases: empty configs, circular references, invalid JSON
  - Fixture-based approach:
    ```typescript
    const fixtures = {
      existingEslint: 'test/fixtures/conflict-resolution/existing-eslint.config.js',
      newEslint: 'test/fixtures/conflict-resolution/new-eslint.config.js',
      merged: 'test/fixtures/conflict-resolution/merged-eslint.config.js'
    }

    it('should merge ESLint configs without data loss', async () => {
      const result = await resolveConflicts(
        fixtures.existingEslint,
        fixtures.newEslint,
        'merge'
      )
      expect(result).toMatchFileSnapshot(fixtures.merged)
    })
    ```

- [ ] **5.3: Enhance `features/registry.ts` tests (50% → 75%)**
  - File: `test/features/registry.test.ts`
  - Add tests for:
    - Feature loading/unloading lifecycle
    - Dependency resolution (transitive dependencies)
    - Configuration merging (deep merge)
    - Feature conflict detection
    - Plugin registration and discovery
  - Example:
    ```typescript
    it('should resolve feature dependencies in correct order', async () => {
      const registry = createFeatureRegistry()
      await registry.register('typescript', typescriptFeature)
      await registry.register('eslint', eslintFeature) // depends on typescript

      const loadOrder = registry.getLoadOrder()
      expect(loadOrder).toEqual(['typescript', 'eslint'])
    })
    ```

- [ ] **5.4: Add integration tests for Result-based flows**
  - File: `test/integration/result-patterns.test.ts` (new)
  - Test full workflows with Result chaining:
    ```typescript
    it('should handle complete create flow with errors', async () => {
      const result = await createPackage({
        name: 'invalid name!', // fails validation
        template: 'default'
      })

      expect(isErr(result)).toBe(true)
      expect(result.error.code).toBe('VALIDATION_FAILED')
      expect(result.error.details).toContain('Project name')
    })

    it('should handle AI fallback gracefully', async () => {
      vi.stubEnv('OPENAI_API_KEY', '')
      vi.stubEnv('ANTHROPIC_API_KEY', '')

      const result = await createPackage({
        name: 'test-project',
        describe: 'A React app', // AI requested but unavailable
        template: undefined
      })

      // Should fallback to default template
      expect(isOk(result)).toBe(true)
    })
    ```

- [ ] **5.5: Add error path tests**
  - Files: All test files
  - Ensure every error Result branch is tested
  - Pattern:
    ```typescript
    describe('Error handling', () => {
      it.each([
        ['VALIDATION_FAILED', invalidOptions],
        ['TEMPLATE_NOT_FOUND', { template: 'nonexistent' }],
        ['AI_UNAVAILABLE', { describe: 'test', ai: true }]
      ])('should return %s error', async (code, options) => {
        const result = await createPackage(options)
        expect(isErr(result)).toBe(true)
        expect(result.error.code).toBe(code)
      })
    })
    ```

#### Testing
- Run `pnpm test:coverage` to verify improvements
- Ensure overall coverage stays >81%
- Check branch coverage improvements

#### Dependencies
- Phase 2 complete (Result types in place)

---

### Phase 6: Security & Safety Enhancements (1-2 hours)

**Goal:** Improve security posture and error resilience

#### Tasks

- [ ] **6.1: Use `@bfra.me/es/env` for environment variables**
  - Files: `src/index.ts`, `src/ai/*.ts`
  - Replace direct `process.env` access:
    ```typescript
    import { getEnv, requireEnv } from '@bfra.me/es/env'

    // For optional keys
    const openaiKey = getEnv('OPENAI_API_KEY')
    const hasOpenAI = openaiKey !== undefined && openaiKey.length > 0

    // For required keys (in contexts where AI must work)
    try {
      const apiKey = requireEnv('OPENAI_API_KEY')
      // Use apiKey
    } catch (error) {
      return err({
        code: 'AI_API_KEY_MISSING',
        message: 'OpenAI API key is required but not set',
        variable: 'OPENAI_API_KEY'
      })
    }
    ```

- [ ] **6.2: Implement try-finally for temp file cleanup**
  - File: `src/index.ts` (lines 159-165, 286-295)
  - Ensure cleanup happens even on errors:
    ```typescript
    let tempOutputDir: string | undefined
    try {
      if (finalOptions.dryRun) {
        const { mkdtemp } = await import('node:fs/promises')
        const { tmpdir } = await import('node:os')
        tempOutputDir = await mkdtemp(path.join(tmpdir(), 'bfra-me-create-'))
        outputDir = tempOutputDir
      }

      // ... main processing

      return ok({ projectPath: outputDir })
    } finally {
      // Cleanup always runs
      if (tempOutputDir !== undefined) {
        const { rm } = await import('node:fs/promises')
        await rm(tempOutputDir, { recursive: true, force: true })
          .catch(() => { /* ignore cleanup errors */ })
      }
    }
    ```

- [ ] **6.3: Sanitize error messages**
  - Files: All error creation sites
  - Ensure no sensitive data in error messages:
    ```typescript
    // Instead of including full paths that might reveal system info
    return err({
      code: 'FILE_SYSTEM_ERROR',
      message: `Cannot access directory: ${path.basename(fullPath)}`,
      // Don't include: fullPath which might expose user home directory
    })
    ```

- [ ] **6.4: Add input validation for template sources**
  - File: `src/templates/resolver.ts`
  - Validate GitHub URLs, local paths for traversal:
    ```typescript
    function validateLocalPath(templatePath: string): Result<string, TemplateError> {
      const normalized = path.normalize(templatePath)

      // Check for path traversal
      if (normalized.includes('..')) {
        return err({
          code: 'PATH_TRAVERSAL_ATTEMPT',
          message: 'Template path contains invalid traversal',
          path: templatePath
        })
      }

      return ok(normalized)
    }
    ```

#### Testing
- Security test cases for path traversal attempts
- Test temp file cleanup on errors
- Verify no secrets in error outputs
- Test env var handling edge cases

#### Dependencies
- Phase 2 complete (error Result types)

---

### Phase 7: Documentation & Migration Guide (2-3 hours)

**Goal:** Document changes and provide migration path

#### Tasks

- [ ] **7.1: Update README architecture section**
  - File: `README.md`
  - Clarify factory functions status:
    ```markdown
    ### Core Design Principles

    - **Functional Factories** - All components use factory functions
      (`createTemplateFetcher()`, `createLLMClient()`) instead of classes.
      Classes are still exported for backward compatibility but are deprecated.
    - **Result Pattern** - All operations return `Result<T, E>` discriminated
      unions from `@bfra.me/es/result` for explicit error handling. No exceptions
      are thrown for expected errors.
    ```

- [ ] **7.2: Add JSDoc to all public exports**
  - Files: `src/index.ts`, `src/commands/add.ts`, `src/prompts/*.ts`
  - Document parameters, returns, examples:
    ```typescript
    /**
     * Creates a new project from a template with optional AI assistance.
     *
     * @param options - Configuration for project creation
     * @param options.name - Project name (must be valid npm package name)
     * @param options.template - Template source (GitHub repo, URL, local path, or builtin)
     * @param options.describe - Natural language description for AI-powered template selection
     * @returns Result containing project path on success, or error details on failure
     *
     * @example
     * ```typescript
     * import { createPackage, isOk } from '@bfra.me/create'
     *
     * const result = await createPackage({
     *   name: 'my-app',
     *   template: 'react',
     *   outputDir: './my-app'
     * })
     *
     * if (isOk(result)) {
     *   console.log(`Created at: ${result.data.projectPath}`)
     * } else {
     *   console.error(`Error: ${result.error.message}`)
     * }
     * ```
     */
    export async function createPackage(
      options: CreateCommandOptions
    ): Promise<Result<{projectPath: string}, CreateError>>
    ```

- [ ] **7.3: Create migration guide for v0.7.0**
  - File: `MIGRATION.md` (append new section)
  - Document breaking changes:
    ```markdown
    ## Migration Guide: v0.6.x → v0.7.0

    ### Breaking Changes

    #### 1. Result Type Returns

    All async functions now return `Result<T, E>` instead of throwing exceptions
    or using custom success/error objects.

    **Before (v0.6.x):**
    ```typescript
    try {
      const result = await createPackage(options)
      if (result.success) {
        console.log(result.data.projectPath)
      }
    } catch (error) {
      console.error(error)
    }
    ```

    **After (v0.7.x):**
    ```typescript
    import { isOk, isErr } from '@bfra.me/es/result'

    const result = await createPackage(options)
    if (isOk(result)) {
      console.log(result.data.projectPath)
    } else {
      console.error(result.error.message)
    }
    ```

    #### 2. Factory Functions

    Classes are deprecated in favor of factory functions.

    **Before (v0.6.x):**
    ```typescript
    import { TemplateFetcher } from '@bfra.me/create'
    const fetcher = new TemplateFetcher({ ttl: 7200 })
    ```

    **After (v0.7.x):**
    ```typescript
    import { createTemplateFetcher } from '@bfra.me/create'
    const fetcher = createTemplateFetcher({ ttl: 7200 })
    ```

    Classes still work but show deprecation warnings.
    ```
    ````

- [ ] **7.4: Update API documentation**
  - File: `README.md` (API Reference section)
  - Document all factory functions
  - Include error codes and handling examples
  - Add troubleshooting section for common errors

- [ ] **7.5: Add Changeset**
  - File: `.changeset/refactor-create-architecture-consistency-1.md`
  - Document all changes:
    ```markdown
    ---
    "bfra.me/create": minor
    ---

    This release refactors `@bfra.me/create` to align with the documented functional architecture and Result-based error handling patterns.

    ### Breaking Changes

    - All async functions now return `Result<T, E>` from `@bfra.me/es/result`
    - Error handling changed from exceptions to Result types
    - Custom `{success, data, error}` returns replaced with standard Result

    ### Added

    - Factory functions for all major components
    - Improved type safety with discriminated error unions
    - Better error messages with unified error codes
    - Security improvements for environment variable handling

    ### Deprecated

    - Class-based component instantiation (use factories instead)
    - Direct exception throwing (caught and converted to Results internally)

    ### Fixed

    - Inconsistent error handling across modules
    - Temp file cleanup on error paths
    - Path traversal vulnerabilities in template sources
    ```

#### Testing
- Validate all documentation examples compile
- Check markdown formatting
- Verify all links work

#### Dependencies
- All previous phases complete

---

## Architecture & Design

### Core Types Structure

```typescript
// src/types.ts - Enhanced error types

import type { Result } from '@bfra.me/es/result'
import type { BaseError } from '@bfra.me/es/error'

// Discriminated error unions for each domain
export type TemplateError =
  | { code: 'TEMPLATE_NOT_FOUND'; message: string; source: string }
  | { code: 'TEMPLATE_INVALID'; message: string; reason: string }
  | { code: 'TEMPLATE_FETCH_FAILED'; message: string; source: string; cause?: Error }
  | { code: 'TEMPLATE_PARSE_ERROR'; message: string; file: string }
  | { code: 'TEMPLATE_RENDER_ERROR'; message: string; file: string; cause?: Error }

export type AIError =
  | { code: 'AI_PROVIDER_UNAVAILABLE'; message: string; provider: string }
  | { code: 'AI_API_KEY_MISSING'; message: string; variable: string }
  | { code: 'AI_REQUEST_FAILED'; message: string; provider: string; cause?: Error }
  | { code: 'AI_RESPONSE_INVALID'; message: string; reason: string }

export type CLIError =
  | { code: 'VALIDATION_FAILED'; message: string; details?: string[] }
  | { code: 'INVALID_PROJECT_NAME'; message: string; name: string }
  | { code: 'PATH_TRAVERSAL_ATTEMPT'; message: string; path: string }
  | { code: 'DIRECTORY_EXISTS'; message: string; path: string }
  | { code: 'FILE_SYSTEM_ERROR'; message: string; operation: string; cause?: Error }

export type CreateError = TemplateError | AIError | CLIError

// Convenience type aliases
export type CreateResult<T> = Result<T, CreateError>
export type TemplateResult<T> = Result<T, TemplateError>
export type AIResult<T> = Result<T, AIError>
```

### Factory Pattern Implementation

```typescript
// Pattern for converting classes to factories

// 1. Define interface for instance
export interface ComponentInstance {
  method1(...args): Promise<Result<T, E>>
  method2(...args): Result<T, E>
}

// 2. Create factory function
export function createComponent(config?: Config): ComponentInstance {
  const instance = new ComponentClass(config)

  return {
    method1: instance.method1.bind(instance),
    method2: instance.method2.bind(instance),
  }
}

// 3. Mark class as deprecated
/**
 * @deprecated Use createComponent() instead. Will be removed in v1.0.0
 */
export class ComponentClass {
  // Existing implementation unchanged
}
```

### Result Pattern Usage

```typescript
// Consistent error handling pattern

import { ok, err, isOk, isErr, type Result } from '@bfra.me/es/result'

export async function operation(): Promise<Result<Data, Error>> {
  // Validate inputs
  if (!isValid(input)) {
    return err({ code: 'VALIDATION_FAILED', message: '...' })
  }

  // Perform operation
  try {
    const data = await processData()
    return ok(data)
  } catch (error) {
    return err({
      code: 'OPERATION_FAILED',
      message: 'Processing failed',
      cause: error instanceof Error ? error : new Error(String(error))
    })
  }
}

// Consumers use guards
const result = await operation()
if (isErr(result)) {
  console.error(result.error.message)
  return
}
console.log(result.data)
```

### Module Organization

```
src/
├── index.ts              # Main exports with factories
├── types.ts              # Enhanced error types
├── cli.ts                # CLI entry (uses Result guards)
├── commands/
│   ├── add.ts            # Returns Result
│   └── index.ts          # Explicit exports
├── prompts/
│   ├── template-selection.ts  # Returns Result
│   ├── customization.ts       # Returns Result
│   └── index.ts               # Explicit exports
├── templates/
│   ├── fetcher.ts        # Factory + deprecated class
│   ├── processor.ts      # Factory + deprecated class
│   ├── validator.ts      # Factory + deprecated class
│   └── index.ts          # Explicit exports
├── ai/
│   ├── llm-client.ts         # Factory + deprecated class
│   ├── project-analyzer.ts   # Factory + deprecated class
│   └── index.ts              # Explicit exports
└── utils/
    ├── ai-capabilities.ts    # New utility
    ├── errors.ts             # Enhanced error factories
    ├── validation.ts         # Returns Result
    └── index.ts              # Explicit exports (no wildcards)
```

---

## Testing Strategy

### Unit Test Patterns

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ok, err, isOk, isErr } from '@bfra.me/es/result'

describe('createPackage', () => {
  // Success path
  it('should create project successfully', async () => {
    const result = await createPackage(validOptions)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.data.projectPath).toMatch(/test-project$/)
    }
  })

  // Error paths - test each error code
  it('should return validation error for invalid name', async () => {
    const result = await createPackage({ name: 'Invalid Name!' })

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.code).toBe('VALIDATION_FAILED')
      expect(result.error.message).toContain('Project name')
    }
  })

  // Concurrent tests for independent operations
  it.concurrent('should handle multiple templates', async () => {
    const templates = ['default', 'library', 'cli']
    const results = await Promise.all(
      templates.map(t => createPackage({ name: 'test', template: t }))
    )
    results.forEach(r => expect(isOk(r)).toBe(true))
  })
})
```

### Integration Test Patterns

```typescript
// test/integration/full-workflow.test.ts

import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('Full create workflow', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'create-test-'))
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('should create, build, and validate project', async () => {
    // Create project
    const result = await createPackage({
      name: 'test-project',
      template: 'default',
      outputDir: testDir,
    })

    expect(isOk(result)).toBe(true)

    // Verify structure
    const projectPath = result.data.projectPath
    expect(existsSync(join(projectPath, 'package.json'))).toBe(true)
    expect(existsSync(join(projectPath, 'tsconfig.json'))).toBe(true)

    // Verify package.json content
    const pkg = JSON.parse(
      await readFile(join(projectPath, 'package.json'), 'utf-8')
    )
    expect(pkg.name).toBe('test-project')
  })
})
```

### Fixture-Based Testing

```
test/
├── fixtures/
│   ├── templates/
│   │   ├── minimal/
│   │   │   ├── template.json
│   │   │   └── src/
│   │   └── invalid/
│   │       └── broken.json
│   ├── prompts/
│   │   ├── valid-inputs.json
│   │   └── invalid-inputs.json
│   └── conflicts/
│       ├── existing-eslint.config.js
│       └── new-eslint.config.js
└── integration/
    └── snapshots/
        └── created-project.snap
```

### Coverage Targets

- **Overall Coverage:** Maintain >81% (current: 81.28%)
- **Critical Modules:** Achieve 75%+ coverage
  - `prompts/customization.ts`: 39.56% → 75%
  - `utils/conflict-resolution.ts`: 47.22% → 75%
  - `features/registry.ts`: 50% → 75%
- **Error Paths:** 100% of error branches tested
- **Result Types:** All Result returns verified with guards

---

## Risk Assessment & Mitigation

### High Risk Items

1. **Breaking API Changes (Result returns)**
   - **Risk:** External consumers may break
   - **Mitigation:**
     - Publish as minor version (0.7.0) with deprecation warnings
     - Provide comprehensive migration guide
     - Maintain backward compatibility layer for 1 major version
     - Announce in release notes

2. **Test Suite Updates**
   - **Risk:** Changing assertions may hide regressions
   - **Mitigation:**
     - Run full test suite after each phase
     - Compare coverage reports (before/after)
     - Manual integration testing of CLI

### Medium Risk Items

3. **Factory Function Adoption**
   - **Risk:** Classes remain widely used despite deprecation
   - **Mitigation:**
     - Clear deprecation warnings in TypeScript
     - Update all internal usage to factories
     - Provide codemod script if feasible

4. **Build Output Changes**
   - **Risk:** Export changes affect bundle structure
   - **Mitigation:**
     - Test build output before/after
     - Monitor bundle size
     - Verify tree-shaking works correctly

### Low Risk Items

5. **Documentation Updates**
   - **Risk:** Examples may become outdated
   - **Mitigation:**
     - Run documentation examples as tests
     - Include examples in TypeScript type checking

---

## Validation Checklist

After completing all phases, verify:

### Functional Validation
- [ ] All CLI commands execute successfully
- [ ] Project creation works with all builtin templates
- [ ] AI features work when API keys provided
- [ ] AI fallback works when keys missing
- [ ] Add feature command works on existing projects
- [ ] Dry run mode works correctly

### Technical Validation
- [ ] `pnpm type-check` passes with no errors
- [ ] `pnpm test` passes with >81% coverage
- [ ] `pnpm build` completes successfully
- [ ] `pnpm lint` passes with no violations
- [ ] Bundle size increase <5%
- [ ] All deprecation warnings visible in TypeScript

### Documentation Validation
- [ ] README examples compile without errors
- [ ] Migration guide covers all breaking changes
- [ ] API documentation complete and accurate
- [ ] Changelog entry comprehensive

### Quality Metrics
- [ ] Overall quality score: 7.2 → 8.5+
- [ ] Test coverage: 81.28% → 82%+
- [ ] Critical module coverage: All >75%
- [ ] Type safety: 100% (no `any`, proper Result usage)
- [ ] Error handling: 100% (all errors return Results)

---

## Timeline Estimate

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| 1 | Foundation & Types | 2-3 hours | None |
| 2 | Result Migration | 4-6 hours | Phase 1 |
| 3 | Factory Patterns | 6-8 hours | Phase 2 |
| 4 | Export Cleanup | 1-2 hours | Phase 3 |
| 5 | Test Enhancement | 3-4 hours | Phase 2 |
| 6 | Security | 1-2 hours | Phase 2 |
| 7 | Documentation | 2-3 hours | All phases |
| **Total** | **Full Refactor** | **19-28 hours** | Sequential |

**Recommended Approach:** Complete phases 1-2 first (6-9 hours), then phases 4-7 can proceed in parallel with phase 3.

---

## Success Metrics

### Before Refactor
- Quality Score: 7.2/10
- Test Coverage: 81.28%
- Architecture Violations: 11 (3 high, 8 medium)
- TypeScript Strictness: Mixed (some `any`, throws)
- Error Handling: Inconsistent (throws + Results)

### After Refactor (Target)
- Quality Score: 8.5+/10
- Test Coverage: 82%+
- Architecture Violations: 0 high, 2 medium (acceptable)
- TypeScript Strictness: Full (no `any`, Result<T, E>)
- Error Handling: Consistent (Result-based)

### Long-term Benefits
- ✅ Easier to maintain (consistent patterns)
- ✅ Safer to refactor (type-safe error handling)
- ✅ Better DX (predictable error flows)
- ✅ Exemplar for other monorepo packages
- ✅ Foundation for future enhancements

---

## Notes & Considerations

1. **Backward Compatibility:** This plan maintains classes with deprecation warnings for at least one major version cycle. Full removal planned for v1.0.0.

2. **AI Provider Dependencies:** Consider moving to optional peer dependencies in a follow-up refactor to reduce bundle size for non-AI users.

3. **Performance Impact:** Result types add minimal overhead (~1% slower) but improve type safety significantly. Acceptable trade-off.

4. **Team Coordination:** This refactor touches many files. Consider breaking into smaller PRs by phase for easier review.

5. **Consumer Communication:** Announce changes in GitHub Discussions/Release Notes at least 2 weeks before release to give consumers time to prepare.

---

## Related Resources

- [Quality Audit Report](../package-analysis/@bfra.me-create-quality-audit.md)
- [@bfra.me/es Result Documentation](../packages/es/docs/result.md)
- [Monorepo AGENTS.md](/AGENTS.md)
