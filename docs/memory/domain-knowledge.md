# Domain Knowledge Memory

## Core Concepts

- **Cursor Rules**: Configuration files (.mdc) that guide AI assistant behavior within the Cursor IDE
  - Rules are stored in the `.cursor/rules` directory
  - Each rule has a frontmatter section with metadata and a content section with instructions
  - Rules can include multiple suggestion blocks that trigger based on filters
  - Rules use Markdown formatting with specialized syntax for AI instructions

- **Memory Management**: System for maintaining context across conversations
  - Memory files provide persistent storage of information
  - The knowledge graph maintains entities and relationships
  - Memory update protocols ensure consistency
  - Memory retrieval processes guide information access

- **Agile Workflow**: Methodology for managing development tasks
  - Features are broken down into plans
  - Plans are divided into phases and tasks
  - Tasks have specific acceptance criteria and implementation steps
  - Progress is tracked through task status and workflow memory

- **Knowledge Graph**: Connected network of entities and relationships
  - Entities represent concepts, components, and artifacts
  - Relationships define how entities connect to each other
  - Observations store facts about entities
  - Graph queries retrieve contextual information

## Business Rules

- All cursor rules must follow the conventions defined in cursor-rules-location.mdc
- Memory files must be stored in the docs/memory directory
- Task IDs must follow the format YYYY-MM-DD-XX
- Cross-references between files must use the mdc: prefix syntax
- Memory files must be updated after significant changes
- Knowledge graph entities must have appropriate entity types
- Rule relationships must be documented in the relationship diagram

## Terminology

| Term | Definition | Context |
|------|------------|---------|
| MDC | Markdown Configuration file for Cursor rules | File extension for Cursor rules (.mdc) |
| Rule | A configuration file that guides AI behavior | Stored in .cursor/rules directory |
| Memory File | Markdown file storing persistent context | Stored in docs/memory directory |
| Knowledge Graph | Connected network of entities and relationships | Used for context retention |
| Entity | A node in the knowledge graph representing a concept | Has a name, type, and observations |
| Relation | A connection between two entities | Has a from, to, and relationType |
| Observation | A fact about an entity | Stored as strings in entities |
| Task | A unit of work with specific acceptance criteria | Stored in docs/tasks directory |
| Plan | A strategy for implementing a feature | Stored in docs/plans directory |
| Cross-Reference | A link between documents using mdc: syntax | Used to create navigable knowledge system |
| Hierarchical Structure | Organization of rules in parent-child relationships | Defined in relationship diagram |

## External Resources

- [Cursor IDE Documentation](https://cursor.sh/docs): Official documentation for the Cursor IDE
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html): Reference for TypeScript patterns used in the codebase
- [Mermaid Syntax](https://mermaid.js.org/syntax/flowchart.html): Documentation for Mermaid diagram syntax used in architecture diagrams
- [Markdown Guide](https://www.markdownguide.org/): Reference for Markdown syntax used in documentation and memory files
- [Changesets Documentation](https://github.com/changesets/changesets): Guide for the versioning system used in the repository

## Key Relationships

- Cursor Rules depend on the rule location configuration
- Memory files implement the memory management system
- Tasks implement plans which implement features
- Knowledge graph entities represent components documented in memory files
- Cross-references connect related rules in a hierarchical structure

## Updated: 2025-04-25
