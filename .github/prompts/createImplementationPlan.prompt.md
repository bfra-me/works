---
name: createImplementationPlan
description: Generate a comprehensive implementation plan for a new feature or package in the monorepo.
argument-hint: Feature description, package name, and scope (e.g., "Create @bfra.me/audit-logger package for comprehensive workspace event logging")
---

# Create Implementation Plan for Monorepo Extension

You are tasked with creating a comprehensive implementation plan for extending a TypeScript monorepo with new features or packages. Follow this structured approach:

## Analysis Phase

1. **Understand the existing ecosystem** by examining:
   - Current package structure and dependencies
   - Established architectural patterns (explicit barrel exports, Result<T, E> pattern, etc.)
   - Testing conventions (fixture-based, concurrent tests, file snapshots)
   - Build and configuration patterns (tsup, ESLint defineConfig, strict TypeScript)

2. **Define the scope** of the new feature/package:
   - Primary goal and user benefits
   - Integration points with existing packages
   - Reusable code from @bfra.me/es and related packages
   - CLI or programmatic API requirements

3. **Identify related implementations** already in the codebase that can serve as patterns or dependencies

## Planning Phase

Structure the implementation plan with these sections:

### Goals & Requirements

- State functional and non-functional requirements
- List security, type-safety, and performance constraints
- Define success criteria and completion markers

### Implementation Phases

Create 4-6 phases with clear progression:

- Phase 1: Core infrastructure and types
- Phase 2: Parser/scanner utilities (if applicable)
- Phase 3: Main analysis/processing logic
- Phase 4: Reporting and output formats
- Phase 5: Testing infrastructure
- Phase 6: Documentation and integration

For each phase, list specific tasks with:

- Clear, measurable descriptions
- Reference to existing patterns for consistency
- Dependencies on previous phases

### Architecture & Design

- Document the core types and interfaces
- Describe reusable patterns and how they apply
- Identify which existing packages to import from
- Plan the module organization and barrel exports

### Testing Strategy

- Describe fixture-based testing approach
- List integration test scenarios
- Plan snapshot testing for output validation
- Define coverage targets

### Documentation Requirements

- API reference needs
- Integration guide for other packages
- CLI usage examples (if applicable)
- Code style guidelines specific to the feature

## Output Format

Present the plan in a markdown file with frontmatter containing:

- Feature name and version
- Date created and owner
- Status (Planning, In Progress, Completed)
- Related issues and GitHub links

Then provide detailed sections for each phase with task checklists, file listings, and concrete examples where possible.

### Output File Specifications

- Save implementation plan files in `/.ai/plan/` directory
- Use naming convention: `[purpose]-[component]-[version].md`
- Use current date in YYYY-MM-DD format
- Purpose prefixes: `upgrade|refactor|feature|data|infrastructure|process|architecture|design`
- Example: `upgrade-system-command-4.md`, `feature-auth-module-1.md`
- File must be valid Markdown with proper frontmatter structure

### Status

The status of the implementation plan must be clearly defined in the frontmatter and must reflect the current state of the plan. The status can be one of the following (status_color in brackets): `Completed` (bright green badge), `In progress` (yellow badge), `Planned` (blue badge), `Deprecated` (red badge), or `On Hold` (orange badge). It should also be displayed as a badge in the introduction section.

### Frontmatter Template

```md
---
goal: [Concise Title Describing the Package Implementation Plan's Goal]
version: [Optional: e.g., 1.0, Date]
date_created: [YYYY-MM-DD]
last_updated: [Optional: YYYY-MM-DD]
owner: [Optional: Team/Individual responsible for this plan]
status: 'Completed'|'In progress'|'Planned'|'Deprecated'|'On Hold'
tags: [Optional: List of relevant tags or categories, e.g., `feature`, `upgrade`, `chore`, `architecture`, `migration`, `bug` etc]
---
```

```md
# Implementation Plan: [Feature/Package Name]
![Status: {{ status }}](https://img.shields.io/badge/status-{{ status | replace(' ', '%20') }}-brightgreen)
```
