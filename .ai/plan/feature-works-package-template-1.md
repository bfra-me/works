---
goal: Develop Works-Package Template for @bfra.me/create Monorepo Package Generation
version: 1.0
date_created: 2025-08-12
last_updated: 2025-08-12
owner: bfra-me/works
status: 'Planned'
tags: ['feature', 'template', 'monorepo', 'automation', 'documentation']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Develop a specialized template within the revamped `@bfra.me/create` system for generating new packages within the bfra.me Works monorepo. This template will provide comprehensive package scaffolding with variable substitution, automated documentation site integration, and full adherence to established monorepo patterns. The implementation includes templatable configuration files, fixture-based testing setup, and automated workflows for seamless package and documentation generation.

## 1. Requirements & Constraints

- **REQ-001**: Create specialized template structure in `templates/works-package/` with Mustache variable substitution
- **REQ-002**: Support package type variations (utility, config, tool, library) with appropriate configurations
- **REQ-003**: Generate comprehensive README.md following established documentation patterns across existing packages
- **REQ-004**: Implement automated documentation site integration with MDX file generation and navigation updates
- **REQ-005**: Include all standard configuration files (tsup.config.ts, eslint.config.ts, tsconfig.json, package.json)
- **REQ-006**: Ensure generated packages follow fixture-based testing setup and proper export structures
- **REQ-007**: Integrate with redesigned `@bfra.me/create` CLI for seamless user experience

- **SEC-001**: Validate all template variables to prevent injection attacks in generated files
- **SEC-002**: Ensure generated packages follow security best practices for dependencies and exports

- **TYP-001**: Comprehensive TypeScript types for template variables and package configurations
- **TYP-002**: Type-safe template processing with validation for required and optional variables
- **TYP-003**: Strict typing for package type variations and their specific requirements

- **CON-001**: Must work within redesigned `@bfra.me/create` architecture using giget and template processing
- **CON-002**: Generated packages must pass all existing monorepo validation (lint, build, test, publint)
- **CON-003**: Template processing must be efficient for multiple package generation scenarios
- **CON-004**: Documentation integration must not break existing site navigation or structure

- **GUD-001**: Follow established monorepo patterns from existing packages exactly
- **GUD-002**: Maintain consistency with TypeScript patterns and ESLint configuration usage
- **GUD-003**: Use fixture-based testing patterns established in monorepo

- **PAT-001**: Use Mustache templating for variable substitution in all template files
- **PAT-002**: Implement package type-specific template variations using conditional logic
- **PAT-003**: Create modular template structure for maintainability and extensibility

## 2. Implementation Steps

### Implementation Phase 1: Template Structure Foundation

- GOAL-001: Create comprehensive template directory structure and metadata system

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-001 | Create `templates/works-package/` directory structure within redesigned create system |  |  |
| TASK-002 | Design `template.json` metadata file with package type configurations and variable definitions |  |  |
| TASK-003 | Create template variable schema with validation rules for package name, description, and type |  |  |
| TASK-004 | Implement package type variations (utility, config, tool, library) with specific configurations |  |  |
| TASK-005 | Design conditional logic system for package type-specific template processing |  |  |
| TASK-006 | Create template validation system to ensure all required variables are provided |  |  |
| TASK-007 | Implement template preview functionality for user confirmation before generation |  |  |
| TASK-008 | Add template discovery integration with main create system template resolver |  |  |

### Implementation Phase 2: Core Configuration Templates

- GOAL-002: Create all standard configuration file templates following established monorepo patterns

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-009 | Create `package.json.mustache` template with proper exports, workspace dependencies, and scripts |  |  |
| TASK-010 | Design `tsconfig.json.mustache` template extending `@bfra.me/tsconfig` with package-specific paths |  |  |
| TASK-011 | Implement `eslint.config.ts.mustache` template using `defineConfig()` pattern with TypeScript support |  |  |
| TASK-012 | Create `tsup.config.ts.mustache` template for ES module builds with conditional CLI binary configuration |  |  |
| TASK-013 | Design package type-specific configuration variations (CLI tools vs libraries vs configs) |  |  |
| TASK-014 | Implement workspace dependency template logic for internal package references |  |  |
| TASK-015 | Create version and metadata template logic with proper semantic versioning |  |  |
| TASK-016 | Add template logic for optional features (React support, CLI binaries, type-only packages) |  |  |

### Implementation Phase 3: Source Code Templates

- GOAL-003: Create comprehensive source code templates with proper TypeScript patterns and export structures

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-017 | Create `src/index.ts.mustache` template with explicit barrel exports following monorepo patterns |  |  |
| TASK-018 | Design `src/types.ts.mustache` template with TypeScript interfaces and type definitions |  |  |
| TASK-019 | Implement package type-specific source templates (utility functions, config exports, CLI commands) |  |  |
| TASK-020 | Create conditional template logic for CLI tools with proper bin configuration |  |  |
| TASK-021 | Design React-specific template variations for packages requiring JSX support |  |  |
| TASK-022 | Implement error handling and validation template patterns |  |  |
| TASK-023 | Create JSDoc comment templates for comprehensive API documentation |  |  |
| TASK-024 | Add template logic for package-specific utility functions and helpers |  |  |

### Implementation Phase 4: Testing Infrastructure Templates

- GOAL-004: Implement comprehensive fixture-based testing templates following established patterns

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-025 | Create `test/index.test.ts.mustache` template with Vitest and proper test structure |  |  |
| TASK-026 | Design `test/fixtures/input/` and `test/fixtures/output/` directory structure templates |  |  |
| TASK-027 | Implement fixture-based testing templates using `it.concurrent()` and `toMatchFileSnapshot()` |  |  |
| TASK-028 | Create package type-specific test templates (unit tests, integration tests, CLI tests) |  |  |
| TASK-029 | Design mock and fixture templates for different package functionality |  |  |
| TASK-030 | Implement test coverage configuration templates with appropriate thresholds |  |  |
| TASK-031 | Create performance testing templates for packages requiring benchmarking |  |  |
| TASK-032 | Add error handling and edge case testing templates |  |  |

### Implementation Phase 5: Documentation Templates

- GOAL-005: Create comprehensive documentation templates for README and documentation site integration

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-033 | Create `README.md.mustache` template following established patterns with install, usage, and API sections |  |  |
| TASK-034 | Design `docs/{{packageName}}.mdx.mustache` template for documentation site integration |  |  |
| TASK-035 | Implement frontmatter template with proper title, description, and metadata |  |  |
| TASK-036 | Create navigation integration logic for automatic menu updates |  |  |
| TASK-037 | Design cross-reference templates linking to related packages and documentation |  |  |
| TASK-038 | Implement badge and card component templates for enhanced documentation presentation |  |  |
| TASK-039 | Create API reference template sections with TypeScript signature documentation |  |  |
| TASK-040 | Add example and usage template sections with proper code highlighting |  |  |

### Implementation Phase 6: Automation Workflows

- GOAL-006: Implement automated workflows for package generation and integration

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-041 | Create package generation workflow that processes templates and creates directory structure |  |  |
| TASK-042 | Implement documentation site integration workflow for MDX file generation and navigation updates |  |  |
| TASK-043 | Design workspace integration workflow for package.json updates and dependency installation |  |  |
| TASK-044 | Create validation workflow that runs lint, build, and test on generated packages |  |  |
| TASK-045 | Implement changeset generation workflow for new package releases |  |  |
| TASK-046 | Design git integration workflow for initial commit and branch creation |  |  |
| TASK-047 | Create post-generation instruction display with next steps and usage guidance |  |  |
| TASK-048 | Add rollback mechanism for failed package generation with cleanup procedures |  |  |

### Implementation Phase 7: CLI Integration and Testing

- GOAL-007: Integrate template with redesigned create CLI and implement comprehensive testing

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-049 | Integrate works-package template with main create CLI command structure |  |  |
| TASK-050 | Implement interactive prompts for package type selection and configuration |  |  |
| TASK-051 | Create template-specific validation and error handling for CLI interactions |  |  |
| TASK-052 | Design comprehensive test suite for template generation with different package types |  |  |
| TASK-053 | Implement fixture-based testing for generated package validation |  |  |
| TASK-054 | Create integration tests for documentation site updates and navigation |  |  |
| TASK-055 | Add performance tests for template processing and large-scale package generation |  |  |
| TASK-056 | Implement end-to-end tests for complete package creation and validation workflows |  |  |

## 3. Alternatives

- **ALT-001**: Use separate CLI tool for monorepo package generation - Rejected to maintain unified user experience within create system
- **ALT-002**: Use Handlebars instead of Mustache for templating - Rejected due to security considerations and established Mustache usage
- **ALT-003**: Manual documentation site updates instead of automation - Rejected due to error-prone nature and maintenance overhead
- **ALT-004**: Single template for all package types instead of variations - Rejected due to complexity and maintainability issues
- **ALT-005**: Generate packages outside workspace structure - Rejected as it breaks monorepo integration and workflow

## 4. Dependencies

- **DEP-001**: Redesigned `@bfra.me/create` system with giget and template processing capabilities
- **DEP-002**: `mustache` - Template variable substitution engine (from main create redesign)
- **DEP-003**: Existing monorepo packages as pattern references (`@bfra.me/eslint-config`, `@bfra.me/tsconfig`)
- **DEP-004**: Documentation site infrastructure in `docs/` directory
- **DEP-005**: Workspace validation tools (ESLint, TypeScript, publint, Vitest)
- **DEP-006**: Changeset workflow for new package releases
- **DEP-007**: Git integration for version control workflow
- **DEP-008**: Navigation configuration system for documentation site updates

## 5. Files

- **FILE-001**: `packages/create/src/templates/works-package/template.json` - Template metadata and configuration
- **FILE-002**: `packages/create/src/templates/works-package/package/package.json.mustache` - Package configuration template
- **FILE-003**: `packages/create/src/templates/works-package/package/README.md.mustache` - Comprehensive README template
- **FILE-004**: `packages/create/src/templates/works-package/package/tsconfig.json.mustache` - TypeScript configuration template
- **FILE-005**: `packages/create/src/templates/works-package/package/eslint.config.ts.mustache` - ESLint configuration template
- **FILE-006**: `packages/create/src/templates/works-package/package/tsup.config.ts.mustache` - Build configuration template
- **FILE-007**: `packages/create/src/templates/works-package/package/src/index.ts.mustache` - Main source file template
- **FILE-008**: `packages/create/src/templates/works-package/package/src/types.ts.mustache` - Type definitions template
- **FILE-009**: `packages/create/src/templates/works-package/package/test/index.test.ts.mustache` - Main test file template
- **FILE-010**: `packages/create/src/templates/works-package/package/test/fixtures/` - Fixture directory templates
- **FILE-011**: `packages/create/src/templates/works-package/docs/package.mdx.mustache` - Documentation site template
- **FILE-012**: `packages/create/src/templates/works-package/workflows/` - Automation workflow templates
- **FILE-013**: Template type-specific variations for utility, config, tool, and library packages
- **FILE-014**: CLI integration files for template selection and interactive configuration
- **FILE-015**: Validation and testing files for template generation quality assurance
- **FILE-016**: Documentation and example files demonstrating template usage and customization

## 6. Testing

- **TEST-001**: Template metadata validation tests ensuring proper configuration and variable definitions
- **TEST-002**: Package generation tests for all package types (utility, config, tool, library) with fixture validation
- **TEST-003**: Configuration file template tests validating generated tsup, eslint, and tsconfig files
- **TEST-004**: Source code template tests ensuring proper TypeScript patterns and export structures
- **TEST-005**: Testing infrastructure template tests validating fixture-based test setup
- **TEST-006**: Documentation template tests for README and MDX file generation with proper formatting
- **TEST-007**: Automation workflow tests for package generation, documentation integration, and workspace updates
- **TEST-008**: CLI integration tests for interactive prompts and template selection workflows
- **TEST-009**: End-to-end tests for complete package creation from template to functional package
- **TEST-010**: Validation tests ensuring generated packages pass all monorepo quality checks
- **TEST-011**: Performance tests for template processing speed and memory usage
- **TEST-012**: Error handling tests for invalid inputs, failed generation, and rollback scenarios

## 7. Risks & Assumptions

- **RISK-001**: Template complexity could make maintenance difficult - Mitigation: Modular template structure and comprehensive documentation
- **RISK-002**: Breaking changes in monorepo patterns could invalidate templates - Mitigation: Automated validation and pattern synchronization
- **RISK-003**: Documentation site integration could break with site structure changes - Mitigation: Flexible navigation integration and fallback mechanisms
- **RISK-004**: Generated packages might not follow all established patterns correctly - Mitigation: Comprehensive validation and testing at generation time

- **ASSUMPTION-001**: Redesigned `@bfra.me/create` system will be completed and stable before template implementation
- **ASSUMPTION-002**: Existing monorepo patterns will remain stable during template development
- **ASSUMPTION-003**: Documentation site structure will maintain current navigation and organization approach
- **ASSUMPTION-004**: Users will prefer automated documentation integration over manual updates
- **ASSUMPTION-005**: Package type variations (utility, config, tool, library) will cover most use cases
- **ASSUMPTION-006**: Mustache templating will provide sufficient flexibility for package generation needs

## 8. Related Specifications / Further Reading

- [Mustache Template Documentation](https://mustache.github.io/)
- [Redesigned @bfra.me/create Implementation Plan](./refactor-create-cli-redesign-1.md)
- [bfra.me Works Monorepo Copilot Instructions](../../.github/copilot-instructions.md)
- [TypeScript Patterns Instructions](../../.github/instructions/typescript-patterns.instructions.md)
- [Testing Practices Instructions](../../.github/instructions/testing-practices.instructions.md)
- [ESLint Config Usage Instructions](../../.github/instructions/eslint-config-usage.instructions.md)
- [API Design Standards Instructions](../../.github/instructions/api-design-standards.instructions.md)
- [Changeset Workflow Instructions](../../.github/instructions/changeset-workflow.instructions.md)
