> **Note:** This directory and its files are intended for project-wide preferences and documentation. Do not add secrets, credentials, or personally identifiable information (PII). All contents are safe for source control.
>
> If you need AI assistants to access more sensitive PII (such as your name, contact details, or professional information), store it in the local knowledge graph using the provided tools. The knowledge graph is not checked into source control and is only accessible to AI assistants as instructed.
>
> **Never** store secrets or credentials in either the memory files or the knowledge graph.

# Memory Directory

This directory contains memory files that provide persistent context for AI assistants across conversations. These files help maintain a consistent understanding of the project state, architecture, preferences, and domain knowledge.

## Purpose

The memory files serve several key purposes:
- Maintain context between different conversations with AI assistants
- Provide a central source of truth for project information
- Document key decisions, preferences, and knowledge
- Support the AI-assisted agile workflow
- Integrate with the knowledge graph when available

## Memory File Types

| File | Purpose | Update Frequency |
|------|---------|------------------|
| [workflow-status.md](./workflow-status.md) | Track current project state and task progress | After each significant change |
| [architecture.md](./architecture.md) | Document system architecture and components | When architecture changes |
| [user-preferences.md](./user-preferences.md) | Record user preferences for code, tools, and workflows | When preferences change |
| [domain-knowledge.md](./domain-knowledge.md) | Capture domain-specific concepts and terminology | When new knowledge is gained |
| [decisions.md](./decisions.md) | Track key technical decisions and their rationale | When new decisions are made |

## Usage Guidelines

1. **Reading Memory**: AI assistants should check relevant memory files at the start of conversations to establish context.

2. **Updating Memory**: After significant changes to the project, the corresponding memory files should be updated with:
   - New information or changes
   - A timestamp for the update
   - Clear, concise descriptions

3. **Referencing Memory**: When referencing information from memory files, use the format:
   ```
   As noted in the [architecture memory](/docs/memory/architecture.md), the system uses...
   ```

4. **Knowledge Graph Integration**: When using the knowledge graph MCP server, memory file updates should be synchronized with corresponding entities and relationships in the graph.

## Related Resources

- [Memory Management Rule](/.cursor/rules/memory-management.mdc): Defines the guidelines for memory file creation and maintenance
- [AI Agile Workflow Rule](/.cursor/rules/ai-agile-workflow.mdc): Describes how memory files integrate with the agile workflow
- [Memory Management Plan](/docs/plans/memory-management.md): Outlines the implementation plan for the memory management system

## Key Concepts

- **Memory File**: A markdown document that stores persistent context
- **Knowledge Graph**: A connected network of entities and relationships
- **Context Retention**: The ability to maintain awareness of project state across conversations
- **Memory Update**: The process of adding new information to memory files
- **Memory Synchronization**: Keeping memory files and knowledge graph in sync
