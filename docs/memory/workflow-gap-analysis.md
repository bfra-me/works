# Workflow Gap Analysis

## Overview
This report documents the current state of workflow coverage in the repository, identifies gaps where critical development practices lack dedicated Cursor rules, and prioritizes the creation of new rules to address these gaps. The analysis is based on the [Develop Rules for Missing Critical Workflows](../plans/develop-missing-workflow-rules.md) plan, user preferences, and recent workflow history.

## Inventory of Existing Workflow-Related Cursor Rules

| Rule Name | Description | Category |
|-----------|-------------|----------|
| ai-agile-workflow | Task/plan management, agile workflow, task tracking | Workflow & Process |
| changeset-workflow | Versioning, changelogs, release process | Workflow & Process |
| development-workflow | Dev, test, release, CI/CD overview | Workflow & Process |
| eslint-config-usage | ESLint configuration and usage | Configuration Guide |
| prettier-config-usage | Prettier configuration and usage | Configuration Guide |
| typescript-patterns | TypeScript patterns and best practices | Coding Standards |
| anthropic-chain-of-thought | Prompt engineering, chain-of-thought | Coding Standards |
| date-consistency-enforcer | Date/timestamp consistency | Coding Standards |
| auto-memory-manager | Memory/knowledge graph update automation | AI & Memory Management |
| memory-management | Persistent memory file management | AI & Memory Management |
| user-preferences-awareness | User preference access and application | AI & Memory Management |
| repo-analyzer | Repository analysis and code context extraction | Repository Structure |
| monorepo-structure | Monorepo/package structure guidance | Repository Structure |

## Identification of Critical Workflow Gaps

The following critical workflows are not currently covered by dedicated Cursor rules:

- **Testing Best Practices** (Vitest setup, test organization, coverage, mocking, TDD)
- **CI/CD Troubleshooting and Interaction** (local/CI connection, failure handling, release automation, branch protection)
- **Dependency Management** (adding/updating dependencies, workspace management, Renovate, version pinning, security)
- **API Design Standards** (API patterns, type safety, deprecation/versioning, documentation)
- **Debugging and Troubleshooting** (error patterns, logging, debugging tools, performance, environment issues)
- **Code Review Standards** (review process, PR templates, feedback, self-review)

## Documentation of Pain Points and Common Issues

- **Testing**: Lack of guidance for Vitest, test structure, and coverage reporting. New contributors are unsure how to organize and write effective tests.
- **CI/CD**: Unclear troubleshooting steps for CI failures, branch protection, and release automation. Developers report confusion when CI fails or when releases are blocked.
- **Dependency Management**: No step-by-step guide for adding/updating dependencies, managing workspace dependencies, or handling Renovate bot updates.
- **API Design**: No standards for public API patterns, type safety, or deprecation/versioning policies.
- **Debugging**: No central resource for common error patterns, logging, or debugging tools.
- **Code Review**: No documented review process, criteria, or PR template usage guidance.
- **General**: Previous pain points (e.g., ESLint/TypeScript/Markdown integration) required ad hoc memory files; similar workflow issues are likely to recur without dedicated rules.

## Prioritized List of Needed Workflow Rules

| Priority | Rule Name | Rationale |
|----------|-----------|-----------|
| High | testing-practices.mdc | Most frequent pain point; critical for code quality and onboarding |
| High | ci-cd-workflow.mdc | Essential for smooth development and release; frequent confusion |
| High | dependency-management.mdc | Key for monorepo health and security; no current guidance |
| Medium | api-design-standards.mdc | Important for consistency and maintainability |
| Medium | debugging-guide.mdc | Needed for troubleshooting and reducing support burden |
| Medium | code-review-standards.mdc | Improves code quality and collaboration |

## Knowledge Graph Integration for Bridging Gaps

The Knowledge Graph (KG), maintained by the Memory MCP server, can play a vital role in addressing the workflow gaps identified above. The KG serves as the assistant's persistent memory across sessions, with "Knowledge Graph" and "memory" being effectively synonymous in this context.

For each workflow gap, specific KG operations and tools can help bridge the gaps by storing, retrieving, and relating critical information:

### Testing Best Practices
- **KG Support**: Store and retrieve testing patterns, configurations, and examples.
- **Relevant Tools**:
  - `mcp_memory_create_entities`: Create entities for test patterns, fixtures, and best practices.
  - `mcp_memory_add_observations`: Add specific testing techniques or configurations for frameworks like Vitest.
  - `mcp_memory_search_nodes`: Find relevant test patterns for specific situations.
  - **Example**: `mcp_memory_search_nodes({query: "vitest mocking patterns"})` to retrieve stored mocking techniques when implementing tests.

### CI/CD Troubleshooting
- **KG Support**: Maintain a knowledge base of common CI failures and solutions.
- **Relevant Tools**:
  - `mcp_memory_create_entities`: Create entities for CI/CD workflows and common issues.
  - `mcp_memory_create_relations`: Connect CI errors with their solutions and related components.
  - `mcp_memory_open_nodes`: Access detailed information about specific CI/CD patterns.
  - **Example**: `mcp_memory_open_nodes({names: ["CI_Failure_Type_X"]})` to retrieve known solutions for a specific CI failure.

### Dependency Management
- **KG Support**: Track dependency relationships, version compatibility information, and update patterns.
- **Relevant Tools**:
  - `mcp_memory_create_entities`: Create entities for key dependencies and their usage patterns.
  - `mcp_memory_create_relations`: Establish relationships between packages and their dependencies.
  - `mcp_memory_add_observations`: Record versioning policies, update procedures, or security considerations.
  - **Example**: `mcp_memory_create_relations({relations: [{from: "PackageA", to: "PackageB", relationType: "depends_on"}]})` to maintain workspace dependency graph.

### API Design Standards
- **KG Support**: Store API design patterns, type definitions, and versioning approaches.
- **Relevant Tools**:
  - `mcp_memory_create_entities`: Create entities for API patterns and standards.
  - `mcp_memory_add_observations`: Add best practices for type safety, versioning, and documentation.
  - `mcp_memory_search_nodes`: Retrieve relevant API design patterns for specific use cases.
  - **Example**: `mcp_memory_add_observations({observations: [{entityName: "API_Design_Patterns", contents: ["Use discriminated unions for type-safe request/response handling"]}]})` to build a repository of best practices.

### Debugging and Troubleshooting
- **KG Support**: Catalog common errors, solutions, and debugging approaches.
- **Relevant Tools**:
  - `mcp_memory_create_entities`: Create entities for error types and debugging techniques.
  - `mcp_memory_create_relations`: Connect errors with their symptoms, causes, and solutions.
  - `mcp_memory_search_nodes`: Find relevant debugging approaches for specific errors.
  - **Example**: `mcp_memory_search_nodes({query: "typescript type error resolution"})` to find guidance when encountering specific type issues.

### Code Review Standards
- **KG Support**: Maintain review criteria, feedback patterns, and PR templates.
- **Relevant Tools**:
  - `mcp_memory_create_entities`: Create entities for review standards and templates.
  - `mcp_memory_add_observations`: Record specific feedback patterns and review criteria.
  - `mcp_memory_open_nodes`: Access detailed guidelines for specific review contexts.
  - **Example**: `mcp_memory_open_nodes({names: ["PR_Template_Standard"]})` to retrieve standard PR structure during reviews.

### Implementation Guidance

When implementing the future Cursor rules to address these gaps, the assistant MUST load relevant entities from the KG to provide contextually appropriate assistance. For example, when helping with test creation, the assistant should query the KG for testing patterns specific to Vitest and apply the project's established conventions.

Similarly, after providing assistance or guidance in these areas, the assistant MUST update the KG with new insights, patterns, or preferences to enhance future interactions. This creates a self-improving system where each interaction strengthens the assistant's knowledge base.

## Next Steps

1. Draft new Cursor rules for the highest priority gaps: testing-practices, ci-cd-workflow, and dependency-management.
2. Use the [cursor-rules-creation](../../.cursor/rules/cursor-rules-creation.mdc) process and reference user preferences for structure and content.
3. Coordinate with subject matter experts for best practices and examples.
4. After drafting, update the rule registry and cross-references.
5. Plan user testing and feedback for new rules.

## References
- [Develop Rules for Missing Critical Workflows](../plans/develop-missing-workflow-rules.md)
- [User Preferences](user-preferences.md)
- [Workflow Status](workflow-status.md)
- [Cursor Rules Index](../../.cursor/rules/00-rule-index.mdc)

## Updated: 2025-05-02
