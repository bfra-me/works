> **Note:** This directory and its files are intended for project-wide preferences and documentation. Do not add secrets, credentials, or personally identifiable information (PII). All contents are safe for source control.

# Memory Directory

This directory contains memory files that provide persistent context for AI assistants across conversations. These files help maintain a consistent understanding of the project state, architecture, preferences, and domain knowledge.

## Purpose

The memory files serve several key purposes:
- Maintain context between different conversations with AI assistants
- Provide a central source of truth for project information
- Document key decisions, preferences, and knowledge
- Support the AI-assisted agile workflow

## How AI Assistants Should Use Memory Files

### Discovery Process

AI assistants should be aware of memory files through multiple discovery mechanisms:

1. **Cursor Rules**: The primary rule governing memory files:
   - [memory-management](/.cursor/rules/memory-management.mdc): Provides guidelines for creating, maintaining, and automatically updating memory files

2. **Domain Knowledge**: The [domain-knowledge.md](/docs/memory/domain-knowledge.md) file contains links to all other memory files.

3. **Active Search**: When context is needed, assistants should proactively check the `docs/memory/` directory.

4. **Cross-References**: When a file mentions a concept, assistants should check for relevant memory files.

### Usage Guidelines

1. **Starting Conversations**: Begin by checking these key files:
   - [workflow-status.md](/docs/memory/workflow-status.md): For current project context
   - [domain-knowledge.md](/docs/memory/domain-knowledge.md): For terminology and concepts
   - [user-preferences.md](/docs/memory/user-preferences.md): For user's preferred approaches

2. **During Conversations**:
   - Reference relevant memory information
   - Link to memory files when providing context
   - Suggest updating memory files when new information emerges

3. **When Completing Tasks**:
   - Update workflow status
   - Add task-specific memory files when appropriate

4. **Referencing Format**: When referencing information from memory files, use:
   ```markdown
   As noted in the [architecture memory](/docs/memory/architecture.md), the system uses...
   ```

## Memory File Types

| File | Purpose | Update Frequency | Discovery Priority |
|------|---------|------------------|-------------------|
| [workflow-status.md](/docs/memory/workflow-status.md) | Track current project state and task progress | After each significant change | High - Check first |
| [architecture.md](/docs/memory/architecture.md) | Document system architecture and components | When architecture changes | Medium |
| [user-preferences.md](/docs/memory/user-preferences.md) | Record user preferences for code, tools, and workflows | When preferences change | High - Check early |
| [domain-knowledge.md](/docs/memory/domain-knowledge.md) | Capture domain-specific concepts and terminology | When new knowledge is gained | High - Contains links to other files |
| [decisions.md](/docs/memory/decisions.md) | Track key technical decisions and their rationale | When new decisions are made | Medium |
| [vibe-tools-playbook.md](/docs/memory/vibe-tools-playbook.md) | Comprehensive guide for vibe-tools commands, options, and usage scenarios | When vibe-tools capabilities change | High - Primary reference for vibe-tools usage |
| Task-specific files (e.g., [eslint-typescript-markdown-issue.md](/docs/memory/eslint-typescript-markdown-issue.md)) | Document specific task details | After task completion | Low - Reference as needed |

## Auto-Memory Management

The [memory-management](/.cursor/rules/memory-management.mdc) rule contains an automated update process that triggers upon task completion. This process includes:

1. **Extraction**: Identifying task information, affected components, problems solved, and solutions implemented
2. **Updating**: Modifying appropriate memory files with the new information
3. **Cross-Referencing**: Ensuring proper links between related files

Memory files are updated using specific templates defined in the memory-management rule:
- Workflow Status Update template
- Domain Knowledge Update template
- Task-Specific Memory File template

## Related Resources

- [Memory Management Rule](/.cursor/rules/memory-management.mdc): Defines the guidelines for memory file creation, maintenance, and automated updates
- [AI Agile Workflow Rule](/.cursor/rules/ai-agile-workflow.mdc): Describes how memory files integrate with the agile workflow
- [Vibe-Tools Playbook](/docs/memory/vibe-tools-playbook.md): Comprehensive documentation for vibe-tools commands and their integration with the workflow

## Key Concepts

- **Memory File**: A markdown document that stores persistent context
- **Context Retention**: The ability to maintain awareness of project state across conversations
- **Memory Update**: The process of adding new information to memory files

## Updated: 2025-05-23
