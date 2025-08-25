---
goal: Develop `works` Package Template for @bfra.me/create Monorepo Package Generation
version: 2.0
date_created: 2025-08-12
last_updated: 2025-08-24
owner: bfra-me/works
status: 'In Progress'
tags: ['feature', 'template', 'monorepo', 'automation', 'documentation', 'eta']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Develop a specialized template within the fully redesigned `@bfra.me/create` system for generating new packages within the bfra.me Works monorepo. This template leverages the proven architecture from the completed CLI redesign, including Eta templating engine, giget-based template processing, and comprehensive fixture-based testing. The implementation provides intelligent package scaffolding with powerful variable substitution, automated documentation site integration, and full adherence to established monorepo patterns proven in the redesign effort.

## 1. Requirements & Constraints

- **REQ-001**: Create specialized template structure in `templates/works/` with Eta templating engine variable substitution
- **REQ-002**: Support package type variations (utility, config, tool, library) with appropriate configurations using proven template patterns
- **REQ-003**: Generate comprehensive README.md following established documentation patterns across existing packages
- **REQ-004**: Implement automated documentation site integration with MDX file generation and navigation updates
- **REQ-005**: Include all standard configuration files (tsup.config.ts, eslint.config.ts, tsconfig.json, package.json) using Eta templates
- **REQ-006**: Ensure generated packages follow fixture-based testing setup and proper export structures proven in redesign
- **REQ-007**: Integrate with completed redesigned `@bfra.me/create` CLI leveraging existing template processor infrastructure
- **REQ-008**: Utilize Eta's powerful templating features including helper functions, conditionals, and loops for advanced template logic

- **SEC-001**: Validate all template variables to prevent injection attacks in generated files
- **SEC-002**: Ensure generated packages follow security best practices for dependencies and exports

- **TYP-001**: Comprehensive TypeScript types for template variables and package configurations
- **TYP-002**: Type-safe template processing with validation for required and optional variables
- **TYP-003**: Strict typing for package type variations and their specific requirements

- **CON-001**: Must work within completed redesigned `@bfra.me/create` architecture using giget, Eta templating, and TemplateProcessor
- **CON-002**: Generated packages must pass all existing monorepo validation (lint, build, test, publint) as proven in redesign testing
- **CON-003**: Template processing must leverage existing TemplateProcessor for efficiency and consistency
- **CON-004**: Documentation integration must not break existing site navigation or structure
- **CON-005**: Must align with proven template directory structure (root-level templates/ directory)

- **GUD-001**: Follow established monorepo patterns from existing packages exactly
- **GUD-002**: Maintain consistency with TypeScript patterns and ESLint configuration usage
- **GUD-003**: Use fixture-based testing patterns established in monorepo

- **PAT-001**: Use Eta templating engine for powerful variable substitution with helper functions and conditional logic
- **PAT-002**: Implement package type-specific template variations using Eta's conditional and loop features
- **PAT-003**: Create modular template structure leveraging proven TemplateProcessor architecture for maintainability
- **PAT-004**: Follow established template.json metadata pattern for template configuration and validation

## 2. Implementation Steps

### Implementation Phase 1: Template Structure Foundation

- GOAL-001: Create comprehensive template directory structure leveraging proven TemplateProcessor architecture

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-001 | Create `templates/works/` directory structure following proven template organization patterns | ✅ | 2025-08-24 |
| TASK-002 | Design `template.json` metadata file with package type configurations and Eta variable definitions | ✅ | 2025-08-24 |
| TASK-003 | Create template variable schema leveraging TemplateProcessor validation patterns | ✅ | 2025-08-24 |
| TASK-004 | Implement package type variations (utility, config, tool, library) using Eta conditional templates | ✅ | 2025-08-24 |
| TASK-005 | Design Eta-based conditional logic system for package type-specific template processing | ✅ | 2025-08-24 |
| TASK-006 | Leverage existing TemplateProcessor validation for required variables and type checking | ✅ | 2025-08-24 |
| TASK-007 | Implement template preview using existing template processing infrastructure | ✅ | 2025-08-24 |
| TASK-008 | Integrate with proven template resolver and discovery mechanisms | ✅ | 2025-08-24 |

### Implementation Phase 2: Core Configuration Templates with Eta

- GOAL-002: Create all standard configuration file templates using Eta templating and established patterns

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-009 | Create `package.json.eta` template with proper exports, workspace dependencies, and Eta helper functions |  |  |
| TASK-010 | Design `tsconfig.json.eta` template extending `@bfra.me/tsconfig` with Eta-based path logic |  |  |
| TASK-011 | Implement `eslint.config.ts.eta` template using `defineConfig()` pattern with Eta conditionals |  |  |
| TASK-012 | Create `tsup.config.ts.eta` template for ES module builds with Eta-based CLI binary configuration |  |  |
| TASK-013 | Design package type-specific configuration variations using Eta's conditional and loop features |  |  |
| TASK-014 | Implement workspace dependency template logic using Eta helper functions for package references |  |  |
| TASK-015 | Create version and metadata template logic using Eta's built-in date and helper functions |  |  |
| TASK-016 | Add Eta-based template logic for optional features (React support, CLI binaries, type-only packages) |  |  |

### Implementation Phase 3: Source Code Templates with Eta Power

- GOAL-003: Create comprehensive source code templates using Eta's advanced features for TypeScript patterns

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-017 | Create `src/index.ts.eta` template with explicit barrel exports using Eta helper functions |  |  |
| TASK-018 | Design `src/types.ts.eta` template with TypeScript interfaces using Eta's case conversion helpers |  |  |
| TASK-019 | Implement package type-specific source templates using Eta conditionals and loops |  |  |
| TASK-020 | Create Eta-based conditional template logic for CLI tools with proper bin configuration |  |  |
| TASK-021 | Design React-specific template variations using Eta's conditional features for JSX support |  |  |
| TASK-022 | Implement error handling and validation patterns using Eta template logic |  |  |
| TASK-023 | Create JSDoc comment templates using Eta's string manipulation and date helpers |  |  |
| TASK-024 | Add Eta-based template logic for package-specific utility functions and naming conventions |  |  |

### Implementation Phase 4: Testing Infrastructure Templates with Proven Patterns

- GOAL-004: Implement comprehensive fixture-based testing templates using proven redesign patterns

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-025 | Create `test/index.test.ts.eta` template with Vitest and proven test structure patterns |  |  |
| TASK-026 | Design `test/fixtures/input/` and `test/fixtures/output/` directory structure using existing patterns |  |  |
| TASK-027 | Implement fixture-based testing templates using proven `it.concurrent()` and `toMatchFileSnapshot()` patterns |  |  |
| TASK-028 | Create package type-specific test templates using Eta conditionals for test variations |  |  |
| TASK-029 | Design mock and fixture templates using established testing infrastructure |  |  |
| TASK-030 | Implement test coverage configuration templates leveraging proven Vitest setup |  |  |
| TASK-031 | Create performance testing templates using established benchmarking patterns |  |  |
| TASK-032 | Add error handling and edge case testing templates using proven testing patterns |  |  |

### Implementation Phase 5: Documentation Templates with Eta

- GOAL-005: Create comprehensive documentation templates using Eta's powerful features for site integration

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-033 | Create `README.md.eta` template using Eta helpers for consistent documentation formatting |  |  |
| TASK-034 | Design `docs/<%=packageName%>.mdx.eta` template with Eta variable substitution for site integration |  |  |
| TASK-035 | Implement frontmatter template using Eta's date and string helpers for metadata generation |  |  |
| TASK-036 | Create navigation integration logic using Eta conditionals for automatic menu updates |  |  |
| TASK-037 | Design cross-reference templates using Eta helpers for linking related packages |  |  |
| TASK-038 | Implement badge and card component templates using Eta's helper functions |  |  |
| TASK-039 | Create API reference template sections using Eta's string manipulation for TypeScript signatures |  |  |
| TASK-040 | Add example and usage template sections using Eta conditionals for code highlighting |  |  |

### Implementation Phase 6: Automation Workflows with TemplateProcessor

- GOAL-006: Implement automated workflows leveraging proven TemplateProcessor infrastructure

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-041 | Leverage existing TemplateProcessor for package generation workflow integration |  |  |
| TASK-042 | Implement documentation site integration using proven template processing patterns |  |  |
| TASK-043 | Design workspace integration workflow using established dependency management patterns |  |  |
| TASK-044 | Create validation workflow using proven lint, build, and test patterns from redesign |  |  |
| TASK-045 | Implement changeset generation workflow following established release patterns |  |  |
| TASK-046 | Design git integration workflow using proven version control patterns |  |  |
| TASK-047 | Create post-generation instruction display using established user feedback patterns |  |  |
| TASK-048 | Add rollback mechanism using proven error handling and cleanup patterns |  |  |

### Implementation Phase 7: CLI Integration with Proven Architecture

- GOAL-007: Integrate template with completed redesigned create CLI leveraging proven patterns

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-049 | Integrate `works` package template with proven CLI command structure and routing |  |  |
| TASK-050 | Implement interactive prompts using established @clack/prompts patterns from redesign |  |  |
| TASK-051 | Create template-specific validation using proven error handling patterns |  |  |
| TASK-052 | Design comprehensive test suite using proven fixture-based testing patterns from redesign |  |  |
| TASK-053 | Implement fixture-based testing for generated package validation using established patterns |  |  |
| TASK-054 | Create integration tests using proven documentation site update patterns |  |  |
| TASK-055 | Add performance tests leveraging proven template processing efficiency patterns |  |  |
| TASK-056 | Implement end-to-end tests using proven complete workflow validation patterns |  |  |

## 3. Alternatives

- **ALT-001**: Use separate CLI tool for monorepo package generation - Rejected to maintain unified user experience within proven create system
- **ALT-002**: Continue using Mustache instead of Eta for templating - Rejected as Eta provides superior features and performance as proven in redesign
- **ALT-003**: Manual documentation site updates instead of automation - Rejected due to error-prone nature and maintenance overhead
- **ALT-004**: Single template for all package types instead of variations - Rejected due to complexity and maintainability issues
- **ALT-005**: Generate packages outside workspace structure - Rejected as it breaks monorepo integration and proven workflow patterns
- **ALT-006**: Create custom template processor instead of leveraging existing - Rejected to maintain consistency with proven redesign architecture

## 4. Dependencies

- **DEP-001**: Completed redesigned `@bfra.me/create` system with giget, Eta, and TemplateProcessor capabilities
- **DEP-002**: `eta` - Advanced template engine with helper functions (proven in redesign)
- **DEP-003**: Existing monorepo packages as pattern references (`@bfra.me/eslint-config`, `@bfra.me/tsconfig`)
- **DEP-004**: Documentation site infrastructure in `docs/` directory with Astro framework
- **DEP-005**: Workspace validation tools (ESLint, TypeScript, publint, Vitest) as proven in redesign testing
- **DEP-006**: Changeset workflow for new package releases (established pattern)
- **DEP-007**: Git integration for version control workflow (proven patterns)
- **DEP-008**: Navigation configuration system for documentation site updates
- **DEP-009**: Proven TemplateProcessor class for template processing and validation
- **DEP-010**: Established @clack/prompts integration for interactive CLI experiences
- **DEP-006**: Changeset workflow for new package releases
- **DEP-007**: Git integration for version control workflow
- **DEP-008**: Navigation configuration system for documentation site updates

## 5. Files

- **FILE-001**: `templates/works/template.json` - Template metadata and configuration using proven patterns
- **FILE-002**: `templates/works/package.json.eta` - Package configuration template with Eta helpers
- **FILE-003**: `templates/works/README.md.eta` - Comprehensive README template with Eta formatting
- **FILE-004**: `templates/works/tsconfig.json.eta` - TypeScript configuration template with Eta logic
- **FILE-005**: `templates/works/eslint.config.ts.eta` - ESLint configuration template with Eta conditionals
- **FILE-006**: `templates/works/tsup.config.ts.eta` - Build configuration template with Eta features
- **FILE-007**: `templates/works/src/index.ts.eta` - Main source file template with Eta helpers
- **FILE-008**: `templates/works/src/types.ts.eta` - Type definitions template with Eta case conversion
- **FILE-009**: `templates/works/test/index.test.ts.eta` - Main test file template using proven patterns
- **FILE-010**: `templates/works/test/fixtures/` - Fixture directory templates following established structure
- **FILE-011**: `templates/works/docs/<%=packageName%>.mdx.eta` - Documentation site template with Eta variables
- **FILE-012**: Integration with existing TemplateProcessor for processing workflow
- **FILE-013**: Template type-specific variations leveraging Eta conditionals for package types
- **FILE-014**: CLI integration using proven @clack/prompts patterns for template selection
- **FILE-015**: Validation integration with existing template validation infrastructure
- **FILE-016**: Documentation and examples demonstrating Eta template usage and helper functions

## 6. Testing

- **TEST-001**: Template metadata validation tests using proven TemplateProcessor validation patterns
- **TEST-002**: Package generation tests for all package types using established fixture-based testing
- **TEST-003**: Configuration file template tests validating Eta-generated tsup, eslint, and tsconfig files
- **TEST-004**: Source code template tests ensuring proper TypeScript patterns with Eta helper validation
- **TEST-005**: Testing infrastructure template tests using proven fixture-based test setup patterns
- **TEST-006**: Documentation template tests for README and MDX file generation with Eta formatting validation
- **TEST-007**: Automation workflow tests leveraging existing TemplateProcessor infrastructure
- **TEST-008**: CLI integration tests using proven @clack/prompts testing patterns
- **TEST-009**: End-to-end tests using established complete package creation validation workflows
- **TEST-010**: Validation tests ensuring generated packages pass proven monorepo quality checks
- **TEST-011**: Performance tests using established template processing benchmarks
- **TEST-012**: Error handling tests using proven error handling and rollback patterns

## 7. Risks & Assumptions

- **RISK-001**: Template complexity could make maintenance difficult - Mitigation: Leverage proven modular TemplateProcessor architecture
- **RISK-002**: Breaking changes in monorepo patterns could invalidate templates - Mitigation: Use established automated validation patterns
- **RISK-003**: Documentation site integration could break with site structure changes - Mitigation: Use proven flexible navigation integration patterns
- **RISK-004**: Generated packages might not follow all established patterns correctly - Mitigation: Leverage proven comprehensive validation infrastructure

- **ASSUMPTION-001**: Completed redesigned `@bfra.me/create` system provides stable TemplateProcessor infrastructure
- **ASSUMPTION-002**: Existing monorepo patterns will remain stable and proven patterns will continue to work
- **ASSUMPTION-003**: Documentation site structure will maintain current navigation approach proven in existing packages
- **ASSUMPTION-004**: Users will prefer automated documentation integration as proven in existing workflows
- **ASSUMPTION-005**: Package type variations (utility, config, tool, library) will cover most use cases as evidenced by existing packages
- **ASSUMPTION-006**: Eta templating will provide superior flexibility compared to Mustache as proven in redesign implementation

## 8. Related Specifications / Further Reading

- [Eta Template Documentation](https://eta.js.org/)
- [Completed @bfra.me/create Implementation Plan](./refactor-create-cli-redesign-1.md)
- [TemplateProcessor Implementation](../../packages/create/src/templates/processor.ts)
- [bfra.me Works Monorepo Copilot Instructions](../../.github/copilot-instructions.md)
- [Proven Template Patterns from Redesign](../../packages/create/templates/)
- [TypeScript Patterns Instructions](../../.github/instructions/typescript-patterns.instructions.md)
- [Testing Practices Instructions](../../.github/instructions/testing-practices.instructions.md)
- [ESLint Config Usage Instructions](../../.github/instructions/eslint-config-usage.instructions.md)
- [API Design Standards Instructions](../../.github/instructions/api-design-standards.instructions.md)
- [Changeset Workflow Instructions](../../.github/instructions/changeset-workflow.instructions.md)
