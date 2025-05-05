# Domain Knowledge Memory

## Core Concepts

- **Cursor Rules**: Configuration files (.mdc) that guide AI assistant behavior within the Cursor IDE
  - Rules are stored in the `.cursor/rules` directory
  - Each rule has a frontmatter section with metadata and a content section with instructions
  - Rules can include multiple suggestion blocks that trigger based on filters
  - Rules use Markdown formatting with specialized syntax for AI instructions

- **Memory Management**: System for maintaining context across conversations
  - Memory files provide persistent storage of information in [docs/memory](/docs/memory/README.md)
  - The knowledge graph maintains entities and relationships
  - Memory update protocols ensure consistency and are automatically triggered upon task completion
  - Memory retrieval processes guide information access according to [memory-management](/.cursor/rules/memory-management.mdc)

- **Rule Prioritization**: System for determining which rules take precedence when multiple rules apply
  - A hierarchical approach prioritizes rules based on activation specificity and metadata
  - Explicit user invocation of a rule takes highest priority
  - Rules with `alwaysApply: true` provide foundational context in all situations
  - Filter specificity follows: file path > glob pattern > file extension > content > message
  - The metadata `priority` field (high/medium/low) acts as a tie-breaker
  - AI judgment synthesizes information from complementary rules
  - Comprehensive conflict resolution guidance is available in [rule-conflict-resolution.md](/docs/memory/rule-conflict-resolution.md)

- **Agile Workflow**: Methodology for managing development tasks
  - Features are broken down into plans
  - Plans are divided into phases and tasks
  - Tasks have specific acceptance criteria and implementation steps
  - Progress is tracked through task status and [workflow memory](/docs/memory/workflow-status.md)

- **Knowledge Graph**: Connected network of entities and relationships
  - Entities represent concepts, components, and artifacts
  - Relationships define how entities connect to each other
  - Observations store facts about entities
  - Graph queries retrieve contextual information

- **Cursor Rule Description Pattern**: Standardized format for rule descriptions
  - Follows the pattern "VERB when CONTEXT to OUTCOME"
  - Uses only approved ACTION verbs: FOLLOW, APPLY, USE, or ALWAYS USE
  - Ensures consistent discovery and application of rules by AI assistants
  - Description appears in frontmatter immediately after opening `---`
  - Never modifies the description field after the `<rule>` tag

- **Rule Location and Cross-Referencing**: Standards for rule placement and linking
  - All rules must be placed in the `.cursor/rules` directory
  - Rule files must use kebab-case and .mdc extension
  - Cross-references must use the `[text](/path/to/file)` syntax
  - These standards are defined in [cursor-rules-creation](/.cursor/rules/cursor-rules-creation.mdc)

## Memory System Structure

- **[Workflow Status](/docs/memory/workflow-status.md)**: Tracks current project state and task progress
- **[Architecture](/docs/memory/architecture.md)**: Documents system architecture and components
- **[User Preferences](/docs/memory/user-preferences.md)**: Records user preferences for code style, tools, and workflows
- **[Domain Knowledge](/docs/memory/domain-knowledge.md)**: Captures domain-specific concepts and terminology (this file)
- **[Technical Decisions](/docs/memory/decisions.md)**: Tracks key technical decisions and their rationale
- **Task-Specific Memory**: Individual files for specific tasks (e.g., [eslint-typescript-markdown-issue.md](/docs/memory/eslint-typescript-markdown-issue.md))

## Business Rules

- All cursor rules must follow the conventions defined in [cursor-rules-creation](/.cursor/rules/cursor-rules-creation.mdc)
- Memory files must be stored in the docs/memory directory
- Task IDs must follow the format YYYY-MM-DD-XX
- Cross-references between files must use the proper syntax for the file type
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
| Cross-Reference | A link between documents | Used to create navigable knowledge system |
| Hierarchical Structure | Organization of rules in parent-child relationships | Defined in relationship diagram |

## External Resources

- [Cursor IDE Documentation](https://cursor.sh/docs): Official documentation for the Cursor IDE
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html): Reference for TypeScript patterns used in the codebase
- [Mermaid Syntax](https://mermaid.js.org/syntax/flowchart.html): Documentation for Mermaid diagram syntax used in architecture diagrams
- [Markdown Guide](https://www.markdownguide.org/): Reference for Markdown syntax used in documentation and memory files
- [Changesets Documentation](https://github.com/changesets/changesets): Guide for the versioning system used in the repository

## Key Relationships

- **Memory System Integration**:
  - [Domain Knowledge](/docs/memory/domain-knowledge.md) provides context for all other memory files
  - [Workflow Status](/docs/memory/workflow-status.md) tracks active tasks and project progress
  - [Architecture](/docs/memory/architecture.md) documents the system components referenced in tasks
  - [User Preferences](/docs/memory/user-preferences.md) guides implementation decisions
  - [Technical Decisions](/docs/memory/decisions.md) records rationales that inform future work

- **Rule and Document Relationships**:
  - Cursor Rules adhere to the standards in [cursor-rules-creation](/.cursor/rules/cursor-rules-creation.mdc)
  - Memory files follow the [memory-management](/.cursor/rules/memory-management.mdc) system
  - Tasks implement plans which implement features as defined in [ai-agile-workflow](/.cursor/rules/ai-agile-workflow.mdc)
  - Knowledge graph entities represent components documented in memory files
  - Cross-references connect related rules in a hierarchical structure

## Implementation Patterns

- **Memory Update Pattern**:
  - Memory files are updated automatically after task completion as defined in the memory-management rule
  - Each update includes a timestamp and clear description of changes
  - Changes are synchronized with the knowledge graph when available
  - Cross-references maintain connections between related concepts

- **Memory Access Pattern**:
  - AI assistants check relevant memory files at conversation start
  - The knowledge graph is queried for additional context
  - Information is combined from multiple sources for comprehensive understanding
  - Memory file references follow standardized formats

- **Rule Prioritization Pattern**: Process for resolving rule conflicts and applying the most relevant guidance
  - **Applied in**: Prioritize rule application task (Task ID: 2025-05-03-14)
  - **Context**: Managing behavior when multiple rules match the same context
  - **Benefits**: Provides clear hierarchy for rule application, reduces confusion, ensures most specific guidance is applied
  - **Limitations**: Complex contexts may still require AI judgment to synthesize information from multiple rules

- **Cursor Rule Frontmatter Pattern**: Standard structure for .mdc files
  - **Applied in**: CI/CD workflow rule fix
  - **Context**: Creating and editing cursor rules
  - **Benefits**: Ensures rules are properly applied and discovered
  - **Limitations**: Requires careful attention to YAML formatting

- **Rule Description Standardization Pattern**: Process for ensuring consistent rule descriptions
  - **Applied in**: Standardize Cursor Rule Description Patterns task
  - **Context**: Creating and maintaining effective cursor rules
  - **Benefits**: Improves AI's ability to discover and apply appropriate rules, ensures consistent rule activation
  - **Limitations**: Limited to four approved ACTION verbs (FOLLOW, APPLY, USE, ALWAYS USE) for consistency

- **Rule Interaction Documentation Pattern**:
  - **Applied in**: Document rule interaction patterns task (Task ID: 2025-05-03-15)
  - **Context**: Understanding how rules synergize, conflict, or depend on each other.
  - **Benefits**: Creates a cohesive rule system, aids in rule design, helps AI apply multiple rules effectively.
  - **Limitations**: Requires ongoing maintenance as rules are added or changed.

- **Rule Consolidation Pattern**: Process for merging related or overlapping rules to reduce redundancy
  - **Applied in**: Consolidate overlapping rules task (Task ID: 2025-05-03-07)
  - **Context**: Maintaining a lean, focused set of rules by combining related functionality
  - **Benefits**: Reduces maintenance overhead, improves rule coherence, simplifies rule discovery
  - **Limitations**: Must carefully preserve all functionality during consolidation, update cross-references

## Technical Decisions

| Decision | Rationale | Date | Alternatives Considered |
|----------|-----------|------|-------------------------|
| Consolidate location and cross-reference rules into cursor-rules-creation | Reduces redundancy and places related guidance in one place | 2025-05-05 | Maintaining separate rules, creating a new parent rule |
| Merge auto-memory-manager into memory-management | Keeps all memory management functionality in a single rule | 2025-05-05 | Maintaining separate rules, creating specialized memory rules |
| Implement rule prioritization hierarchy based on specificity and metadata | Ensures predictable and consistent rule application when multiple rules match | 2025-05-04 | Rule timestamp priority, rule name alphabetical order, random selection |
| Use terminal commands for .mdc file editing | Standard editing tools may not handle .mdc files correctly | 2025-05-02 | Using edit_file tool, manual creation in Cursor |
| Limit rule description verbs to FOLLOW, APPLY, USE, ALWAYS USE | Ensures consistent and predictable rule discovery and application | 2025-05-04 | Using a wider variety of action verbs, domain-specific verbs |
| Document Rule Interactions in a Dedicated Memory File (`docs/memory/rule-interactions.md`) | Provides a central, focused location for interaction patterns without cluttering individual rules or the index | 2025-05-05 | Adding sections to individual rules, updating the 00-rule-index |

## Updated: 2025-05-05
