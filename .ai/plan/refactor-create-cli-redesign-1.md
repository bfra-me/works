---
goal: Redesign @bfra.me/create with Modern Template Architecture and AI-Powered Features
version: 1.0
date_created: 2025-08-12
last_updated: 2025-08-17
owner: bfra-me/works
status: 'In Progress'
tags: ['refactor', 'architecture', 'cli', 'ai', 'templates', 'typescript']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Completely redesign `@bfra.me/create` to transform it from a simple template-based package generator into a comprehensive CLI for TypeScript project scaffolding. This involves removing the `@sxzz/create` dependency, implementing modern template repository patterns using `giget`, integrating AI-powered features with LLM APIs, and extending functionality to support adding components to existing projects. The redesign includes interactive CLI experiences, flexible template architecture using Eta templating engine, and comprehensive fixture-based testing.

## 1. Requirements & Constraints

- **REQ-001**: Remove `@sxzz/create` dependency completely and replace with modern template architecture
- **REQ-002**: Implement template fetching using `giget` for GitHub repositories, local directories, and URLs
- **REQ-003**: Integrate `@clack/prompts` for multi-step interactive CLI experiences
- **REQ-004**: Add AI-powered features using LLM APIs for project analysis and code generation
- **REQ-005**: Extend functionality with `add` command for adding features to existing projects
- **REQ-006**: Implement comprehensive fixture-based testing with parallel execution and file snapshots
- **REQ-007**: Maintain backward compatibility for existing CLI usage patterns
- **REQ-008**: Reorganize template projects from `src/templates/` to root-level `templates/` directory for better maintainability and separation of concerns

- **SEC-001**: Validate and sanitize all template inputs to prevent code injection
- **SEC-002**: Secure API key management for AI features with environment variable configuration
- **SEC-003**: Safe execution environment for template processing and code generation

- **TYP-001**: Comprehensive TypeScript types for template configurations, AI responses, and CLI options
- **TYP-002**: Type-safe template variable substitution and validation
- **TYP-003**: Strict typing for AI-generated code and project analysis results

- **CON-001**: Must maintain ES module compatibility and existing package structure
- **CON-002**: AI features must be optional and fail gracefully without API keys
- **CON-003**: Template processing must be memory-efficient for large repositories
- **CON-004**: CLI commands must provide clear progress feedback for long-running operations

- **GUD-001**: Follow TypeScript patterns from monorepo instructions
- **GUD-002**: Implement comprehensive error handling and user feedback
- **GUD-003**: Use fixture-based testing patterns established in monorepo

- **PAT-001**: Implement modular architecture with clear separation of concerns
- **PAT-002**: Use dependency injection for AI services and template processors
- **PAT-003**: Create plugin-based system for extensible feature addition

## 2. Implementation Steps

### Implementation Phase 1: Core Infrastructure Redesign

- GOAL-001: Remove @sxzz/create dependency and establish new template architecture foundation

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-001 | Remove `@sxzz/create` dependency from package.json and update dependency list | ✅ | 2025-08-15 |
| TASK-002 | Add new dependencies: `giget`, `eta`, `glob`, `package-manager-detector'`, `semver` | ✅ | 2025-08-15 |
| TASK-003 | Redesign `src/types.ts` with comprehensive interfaces for templates, AI, and CLI options | ✅ | 2025-08-15 |
| TASK-004 | Create `src/templates/resolver.ts` for template source resolution (GitHub, local, URL) | ✅ | 2025-08-15 |
| TASK-005 | Implement `src/templates/fetcher.ts` using `giget` for template downloading and caching | ✅ | 2025-08-15 |
| TASK-006 | Create `src/templates/processor.ts` for template processing and variable substitution | ✅ | 2025-08-15 |
| TASK-007 | Update `src/cli.ts` with new command structure supporting create and add commands | ✅ | 2025-08-15 |
| TASK-008 | Refactor `src/index.ts` to remove @sxzz/create and implement new createPackage API | ✅ | 2025-08-15 |
| TASK-009 | Create `src/utils/` directory with file-system, validation, and project-detection utilities | ✅ | 2025-08-15 |
| TASK-010 | Update tsup configuration for new file structure and ensure proper builds | ✅ | 2025-08-15 |

### Implementation Phase 2: Enhanced Template System

- GOAL-002: Implement comprehensive template support for multiple sources and formats

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-011 | Implement GitHub repository template support with branch and subdirectory handling | ✅ | 2025-08-15 |
| TASK-012 | Add local directory template support with recursive copying and filtering | ✅ | 2025-08-15 |
| TASK-013 | Create URL-based template fetching for zip files and direct downloads | ✅ | 2025-08-15 |
| TASK-014 | Implement template variable substitution using Eta templating engine | ✅ | 2025-08-15 |
| TASK-015 | Create template metadata system with `template.json` configuration files | ✅ | 2025-08-15 |
| TASK-016 | Build template validation system for structure and metadata verification | ✅ | 2025-08-15 |
| TASK-017 | Expand built-in template library with library, CLI, React, and Node.js templates | ✅ | 2025-08-15 |
| TASK-018 | Implement template caching system for improved performance and offline usage | ✅ | 2025-08-15 |
| TASK-019 | Create template discovery mechanism for listing available templates | ✅ | 2025-08-15 |
| TASK-020 | Add template version management and compatibility checking | ✅ | 2025-08-15 |

### Implementation Phase 3: Template Structure Reorganization

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

- GOAL-003: Reorganize template projects from src/templates/ to root-level templates/ directory for better separation and maintainability

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-021 | Move `src/templates/default/` to `templates/default/` preserving all files and structure | ✅ | 2025-08-15 |
| TASK-022 | Move `src/templates/library/` to `templates/library/` preserving all files and structure | ✅ | 2025-08-15 |
| TASK-023 | Move `src/templates/node/` to `templates/node/` preserving all files and structure | ✅ | 2025-08-15 |
| TASK-024 | Move `src/templates/react/` to `templates/react/` preserving all files and structure | ✅ | 2025-08-15 |
| TASK-025 | Move `src/templates/cli/` to `templates/cli/` preserving all files and structure | ✅ | 2025-08-15 |
| TASK-026 | Update `tsup.config.ts` to handle new template directory structure and ensure proper bundling | ✅ | 2025-08-15 |
| TASK-027 | Update all code references in `src/templates/` modules to point to new template locations | ✅ | 2025-08-15 |
| TASK-028 | Update test files and fixtures to reference new template directory structure | ✅ | 2025-08-15 |
| TASK-029 | Run comprehensive verification: lint, type-check, test, and build to ensure no errors | ✅ | 2025-08-15 |
| TASK-030 | Update documentation and README to reflect new template directory structure | ✅ | 2025-08-15 |

### Implementation Phase 4: Interactive CLI Enhancement

- GOAL-004: Create sophisticated interactive CLI experience using @clack/prompts

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-031 | Design multi-step project setup workflow in `src/prompts/project-setup.ts` | ✅ | 2025-08-16 |
| TASK-032 | Implement template selection interface with preview and description support | ✅ | 2025-08-16 |
| TASK-033 | Create project customization prompts for name, description, author, and options | ✅ | 2025-08-16 |
| TASK-034 | Add progress indicators and status feedback for template processing operations | ✅ | 2025-08-16 |
| TASK-035 | Implement confirmation steps and summary display before project creation | ✅ | 2025-08-16 |
| TASK-036 | Create interactive mode flag handling and non-interactive fallback options | ✅ | 2025-08-16 |
| TASK-037 | Add command-line argument parsing for template and configuration overrides | ✅ | 2025-08-16 |
| TASK-038 | Implement error recovery and retry mechanisms for failed operations | ✅ | 2025-08-16 |
| TASK-039 | Create help system with contextual guidance and examples | ✅ | 2025-08-16 |
| TASK-040 | Add colored output and emoji support for enhanced user experience | ✅ | 2025-08-16 |

### Implementation Phase 5: AI-Powered Features Integration

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

- GOAL-005: Integrate LLM APIs for intelligent project setup and code generation

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-041 | Create `src/ai/llm-client.ts` with support for OpenAI and Anthropic APIs | ✅ | 2025-08-16 |
| TASK-042 | Implement `src/ai/project-analyzer.ts` for analyzing project requirements from user input | ✅ | 2025-08-16 |
| TASK-043 | Build `src/ai/dependency-recommender.ts` for intelligent package suggestions | ✅ | 2025-08-16 |
| TASK-044 | Create `src/ai/code-generator.ts` for generating boilerplate code and configurations | ✅ | 2025-08-16 |
| TASK-045 | Implement AI-powered CLI integration for enhanced package creation | ✅ | 2025-08-16 |
| TASK-046 | Add configuration optimization suggestions using AI analysis | ✅ | 2025-08-16 |
| TASK-047 | Create AI assist mode with conversational project setup | ✅ | 2025-08-16 |
| TASK-048 | Implement code quality analysis and improvement suggestions | ✅ | 2025-08-16 |
| TASK-049 | Add AI-powered documentation generation for created projects | ✅ | 2025-08-16 |
| TASK-050 | Create fallback mechanisms and graceful degradation without AI API access | ✅ | 2025-08-16 |

### Implementation Phase 6: Extended Functionality - Add Command

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

- GOAL-006: Implement feature addition capabilities for existing projects

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-051 | Create `src/commands/add.ts` for adding features to existing projects | ✅ | 2025-08-16 |
| TASK-052 | Implement project detection and analysis in `src/utils/project-detection.ts` | ✅ | 2025-08-16 |
| TASK-053 | Build feature registry system for available addable components and configurations | ✅ | 2025-08-16 |
| TASK-054 | Create ESLint configuration addition workflow with proper integration | ✅ | 2025-08-16 |
| TASK-055 | Implement Vitest setup addition with test file generation | ✅ | 2025-08-16 |
| TASK-056 | Add component generation for React/Vue/Angular projects | ✅ | 2025-08-16 |
| TASK-057 | Create configuration file addition (Prettier, TypeScript, etc.) | ✅ | 2025-08-16 |
| TASK-058 | Implement package.json modification for new dependencies and scripts | ✅ | 2025-08-16 |
| TASK-059 | Add conflict detection and resolution for existing configurations | ✅ | 2025-08-16 |
| TASK-060 | Create backup and rollback mechanisms for failed feature additions | ✅ | 2025-08-16 |

### Implementation Phase 7: Comprehensive Testing and Documentation

- GOAL-007: Implement fixture-based testing and complete documentation

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-061 | Create comprehensive test fixture structure in `test/fixtures/input/` and `test/fixtures/output/` | ✅ | 2025-08-17 |
| TASK-062 | Implement template resolution tests with mock GitHub and URL responses | ✅ | 2025-08-17 |
| TASK-063 | Create project generation tests using `it.concurrent()` and `toMatchFileSnapshot()` | ✅ | 2025-08-17 |
| TASK-064 | Build CLI interaction tests with mocked prompts and user inputs | ✅ | 2025-08-17 |
| TASK-065 | Implement AI feature tests with mocked LLM API responses | ✅ | 2025-08-17 |
| TASK-066 | Create add command tests for feature addition to existing projects |  |  |
| TASK-067 | Add performance tests for template processing and large repository handling |  |  |
| TASK-068 | Implement integration tests for end-to-end CLI workflows |  |  |
| TASK-069 | Write comprehensive README.md with usage examples and API documentation |  |  |
| TASK-070 | Create migration guide for users upgrading from previous versions |  |  |

## 3. Alternatives

- **ALT-001**: Keep `@sxzz/create` and extend it - Rejected due to architectural limitations and lack of control over template processing
- **ALT-002**: Use `degit` instead of `giget` - Rejected as `giget` provides better caching, error handling, and broader source support
- **ALT-003**: Build custom LLM integration instead of using existing APIs - Rejected due to complexity and maintenance overhead
- **ALT-004**: Create separate CLI for add functionality - Rejected to maintain unified user experience and code reuse
- **ALT-005**: Use Handlebars or Mustache instead of Eta for templating - Rejected as Eta provides smaller size, better TypeScript support, greater extensibility, and more flexibility

## 4. Dependencies

- **DEP-001**: `giget` - Modern template fetching library supporting GitHub, URLs, and caching
- **DEP-002**: `@clack/prompts` - Already present, enhanced usage for interactive CLI
- **DEP-003**: `eta` - Fast, lightweight, and configurable templating engine with TypeScript support
- **DEP-004**: `glob` - File pattern matching for template processing
- **DEP-005**: `package-manager-detector'` - Package manager detection for proper installation commands
- **DEP-006**: `semver` - Semantic version parsing and comparison
- **DEP-007**: `openai` or `@anthropic-ai/sdk` - LLM API integration for AI features
- **DEP-008**: `consola` - Enhanced logging and progress indicators
- **DEP-009**: `cac` - Command-line argument parsing (already present)
- **DEP-010**: Vitest and related testing dependencies for comprehensive test suite

## 5. Files

- **FILE-001**: `packages/create/package.json` - Updated dependencies and scripts
- **FILE-002**: `packages/create/src/types.ts` - Comprehensive type definitions for new architecture
- **FILE-003**: `packages/create/src/cli.ts` - Redesigned CLI entry point with new command structure
- **FILE-004**: `packages/create/src/index.ts` - Refactored main API without @sxzz/create dependency
- **FILE-005**: `packages/create/src/commands/create.ts` - Project creation command implementation
- **FILE-006**: `packages/create/src/commands/add.ts` - Feature addition command implementation
- **FILE-007**: `packages/create/src/templates/resolver.ts` - Template source resolution logic
- **FILE-008**: `packages/create/src/templates/fetcher.ts` - Template downloading using giget
- **FILE-009**: `packages/create/src/templates/processor.ts` - Template processing and variable substitution
- **FILE-010**: `packages/create/src/templates/metadata.ts` - Template metadata management system
- **FILE-011**: `packages/create/src/templates/validator.ts` - Template validation and verification system
- **FILE-012**: `packages/create/templates/default/` - Moved from src/templates/default/, basic TypeScript template
- **FILE-013**: `packages/create/templates/library/` - Moved from src/templates/library/, NPM library template
- **FILE-014**: `packages/create/templates/cli/` - Moved from src/templates/cli/, CLI application template
- **FILE-015**: `packages/create/templates/react/` - Moved from src/templates/react/, React application template
- **FILE-016**: `packages/create/templates/node/` - Moved from src/templates/node/, Node.js server template
- **FILE-017**: `packages/create/src/ai/llm-client.ts` - LLM API integration
- **FILE-018**: `packages/create/src/ai/project-analyzer.ts` - AI-powered project analysis
- **FILE-019**: `packages/create/src/ai/dependency-recommender.ts` - Intelligent dependency suggestions
- **FILE-020**: `packages/create/src/ai/code-generator.ts` - AI code generation capabilities
- **FILE-021**: `packages/create/src/prompts/project-setup.ts` - Interactive project setup prompts
- **FILE-022**: `packages/create/src/utils/file-system.ts` - File system utilities
- **FILE-023**: `packages/create/src/utils/validation.ts` - Input validation and sanitization
- **FILE-024**: `packages/create/src/utils/project-detection.ts` - Existing project analysis
- **FILE-025**: `packages/create/test/fixtures/input/` - Test input configurations and templates
- **FILE-026**: `packages/create/test/fixtures/output/` - Expected output structures
- **FILE-027**: `packages/create/test/commands/` - Command-specific test files
- **FILE-028**: `packages/create/test/templates/` - Template processing test files
- **FILE-029**: `packages/create/test/ai/` - AI feature test files with mocked responses
- **FILE-030**: `packages/create/README.md` - Comprehensive documentation and usage guide
- **FILE-031**: `packages/create/tsup.config.ts` - Updated build configuration for new template structure

## 6. Testing

- **TEST-001**: Template resolution tests for GitHub repositories, local directories, and URLs
- **TEST-002**: Template fetching tests with mocked network responses and caching validation
- **TEST-003**: Template processing tests with variable substitution and file generation
- **TEST-004**: Project creation tests using fixture-based approach with `toMatchFileSnapshot()`
- **TEST-005**: CLI interaction tests with mocked prompts and user input simulation
- **TEST-006**: AI integration tests with mocked LLM API responses and error handling
- **TEST-007**: Add command tests for feature addition to various project types
- **TEST-008**: Project detection tests for analyzing existing project structures
- **TEST-009**: Error handling tests for network failures, invalid templates, and user errors
- **TEST-010**: Performance tests for large template processing and concurrent operations
- **TEST-011**: Integration tests for complete CLI workflows from start to finish
- **TEST-012**: Backward compatibility tests ensuring existing workflows continue to work
- **TEST-013**: Template structure reorganization tests verifying new template/ directory paths work correctly
- **TEST-014**: Build configuration tests ensuring tsup.config.ts properly handles reorganized template structure
- **TEST-015**: Quality gate verification tests for lint, type-check, test, and build after template reorganization

## 7. Risks & Assumptions

- **RISK-001**: LLM API rate limits and costs could impact AI feature usage - Mitigation: Implement caching, rate limiting, and cost monitoring
- **RISK-002**: Template repository changes could break existing templates - Mitigation: Template versioning and validation
- **RISK-003**: Network dependencies for template fetching could cause failures - Mitigation: Comprehensive caching and offline fallback modes
- **RISK-004**: Large template repositories could cause memory issues - Mitigation: Streaming processing and memory optimization
- **RISK-005**: Breaking changes could disrupt existing user workflows - Mitigation: Comprehensive backward compatibility testing
- **RISK-006**: Template structure reorganization could break existing code references and build processes - Mitigation: Comprehensive testing and systematic path updates

- **ASSUMPTION-001**: Users will have internet access for template fetching in most use cases
- **ASSUMPTION-002**: AI API services will maintain stable interfaces and reasonable pricing
- **ASSUMPTION-003**: GitHub API will remain accessible for repository template fetching
- **ASSUMPTION-004**: Template authors will adopt new metadata format for enhanced features
- **ASSUMPTION-005**: Users will prefer interactive CLI experience over purely command-line driven workflows
- **ASSUMPTION-006**: TypeScript projects will remain the primary use case for the tool
- **ASSUMPTION-007**: Moving templates to root-level templates/ directory will improve maintainability and clarity without breaking existing functionality

## 8. Related Specifications / Further Reading

- [giget Documentation](https://github.com/unjs/giget)
- [@clack/prompts Documentation](https://github.com/natemoo-re/clack/tree/main/packages/prompts)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Eta Template Documentation](https://eta.js.org/)
- [bfra.me Works Monorepo Copilot Instructions](../../.github/copilot-instructions.md)
- [TypeScript Patterns Instructions](../../.github/instructions/typescript-patterns.instructions.md)
- [Testing Practices Instructions](../../.github/instructions/testing-practices.instructions.md)
- [ESLint Config Usage Instructions](../../.github/instructions/eslint-config-usage.instructions.md)
