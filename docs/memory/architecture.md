# Project Architecture Memory

## Current Architecture

```mermaid
graph TD
    A[Cursor Rules System] --> B[Rule Files]
    A --> C[Memory Management]
    A --> D[Repository Structure]

    B --> B1[Rule Definition]
    B --> B2[Cross-References]
    B --> B3[Rule Registry]
    B --> B4[Rule Filters]

    C --> C1[Memory Files]
    C --> C2[Knowledge Graph]
    C --> C3[Memory Update Process]

    D --> D1[Documentation]
    D --> D2[Templates]
    D --> D3[Tasks]
    D --> D4[Plans]

    C1 --> C1A[Workflow Status]
    C1 --> C1B[Architecture]
    C1 --> C1C[User Preferences]
    C1 --> C1D[Domain Knowledge]

    C2 --> C2A[Entities]
    C2 --> C2B[Relations]
    C2 --> C2C[Observations]

    B4 --> B4A[File Path]
    B4 --> B4B[Message Content]
    B4 --> B4C[File Content]
    B4 --> B4D[File Extension]
```

## Key Components

- **Cursor Rules System**: The core system for defining AI behavior rules and enforcing consistent practices
  - Based on .mdc files in the .cursor/rules directory
  - Includes rule triggering, filtering, and suggestion mechanisms
  - Supports patterns for file paths, message content, and contextual awareness

- **Memory Management**: System for maintaining context across conversations
  - Memory files for persistent storage in docs/memory directory
  - Knowledge graph integration for entity and relationship tracking
  - Memory update protocols for maintaining consistency

- **Repository Structure**: Organization of the monorepo
  - Documentation organized in docs/ directory
  - Plans, tasks, and templates for workflow management
  - Packages organized in packages/ directory with clear responsibilities

- **Rule Filters**: System for specific rule triggering based on context
  - File path patterns for document-specific rules
  - Message content patterns for conversational triggers
  - File content patterns for code-specific guidance
  - File extension patterns for language-specific rules
  - Word boundaries and specific phrases to reduce false positives

## Integration Points

- **Cursor Rules and Memory Management**: Rules reference memory files and memory files document rule relationships
  - memory-management.mdc rule provides guidance for memory file creation and maintenance
  - Memory files store information about rule relationships and hierarchy
  - Mermaid diagrams in both systems provide visual reference

- **Task Management and Memory**: Workflow status memory tracks task progress
  - Task files define implementation steps
  - Workflow status memory provides current state
  - Recent updates in memory files capture progress
  - Memory files maintain context for AI assistants working on tasks

- **Rule Filters and Content**: Specific patterns trigger rules in appropriate contexts
  - File path patterns activate document-specific rules
  - Message content patterns respond to specific user questions
  - File content patterns provide language-specific guidance
  - Rules combine multiple filter types for precise activation

## Technical Decisions

| Decision | Rationale | Date | Alternatives Considered |
|----------|-----------|------|-------------------------|
| All cursor rules in .cursor/rules | Consistent location, easy discovery | 2025-04-23 | Distributed across packages, centralized outside of .cursor |
| Memory files in docs/memory | Centralized location for context retention | 2025-04-24 | Per-package memory files, no explicit memory |
| mdc: prefix for rule file links only | Clear distinction of links in rule files, works with Cursor IDE | 2025-04-25 | Regular markdown links for all files, custom syntax for all files |
| Always update memory files after task completion | Ensure consistent and current context | 2025-04-26 | Manual updates only, separate automated system |
| Filter patterns with word boundaries | Reduce false positives in rule activation | 2025-05-06 | Simple keyword matching, complex NLP patterns |

## Implementation Guidelines

- All cursor rules must be placed in the `.cursor/rules` directory
- All memory files must be placed in the `docs/memory` directory
- Rule files must use the `.mdc` extension
- Memory files must use the `.md` extension
- Links in .mdc files must use the mdc: syntax (e.g., `[text](mdc:path/to/file)`)
- Links in regular markdown files (.md) must use standard markdown links (e.g., `[text](/path/to/file)`)
- Memory files must be updated after task completion
- Architecture decisions must be documented in this file
- Rule filters should use word boundaries (`\b`) around common terms to reduce false positives
- Rules should combine multiple filter types (file_path, message, content) for precise activation
- File extension patterns should be as specific as possible (e.g., `\.tsx?$` instead of `.ts`)
- Message patterns should include specific phrases and question formats users might ask

## Constraints

- Memory files must be in the docs/memory directory
- Memory files must follow standardized templates
- All cross-references must use the mdc: syntax
- Memory files should be updated after significant changes
- Knowledge graph should be kept in sync with memory files
- Rule filters must be specific enough to avoid false positives
- Filter patterns should use word boundaries when matching common terms
- Each rule should have at least two filter types for reliable activation

## Updated: 2025-05-06
