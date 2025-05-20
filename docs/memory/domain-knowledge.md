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
  - Enhanced with vibe-tools commands at each workflow stage for improved context and automation

- **Knowledge Graph**: A connected network of entities and relationships, forming a core part of the AI assistant's persistent 'memory'. It is maintained by the Memory MCP server. Entities represent concepts, components, and artifacts. Relationships define how entities connect. Observations store facts. Interactions (creation, queries, updates) are performed using specific `mcp_memory_*` tools (see [mcp-tools-usage.mdc](/.cursor/rules/mcp-tools-usage.mdc) for details). The assistant loads relevant domain concepts from the KG for context and updates it as knowledge evolves.

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

- **Vibe-Tools Integration**: AI-powered command-line tools that enhance the agile workflow
  - Provides context-aware commands for planning, research, repository analysis, and automation
  - Integrates with each stage of the feature => plan => task workflow
  - Enhances memory file management through automation scripts
  - Guided by [vibe-tools](/.cursor/rules/vibe-tools.mdc) rule
  - Comprehensive documentation available in [vibe-tools-playbook](/docs/memory/vibe-tools-playbook.md), which serves as the primary user guide with detailed examples and usage scenarios

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
  - Changes are synchronized with the knowledge graph (using `mcp_memory_*` tools) when available.
  - Cross-references maintain connections between related concepts

- **Memory Access Pattern**:
  - AI assistants check relevant memory files at conversation start
  - The knowledge graph is queried for additional context (using tools like `mcp_memory_search_nodes` or `mcp_memory_open_nodes`).
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

- **Vibe-Tools Workflow Enhancement Pattern**: Integrating vibe-tools commands into each workflow stage
  - **Applied in**: Vibe-Tools Integration Plan (docs/plans/vibe-tools-integration-plan.md)
  - **Context**: Enhancing the ai-agile-workflow rule with AI-powered tools
  - **Benefits**: Provides external research capabilities, stronger repository context awareness, detailed planning, and memory file automation
  - **Implementation**:
    - Feature Capture: Uses `vibe-tools web` for research before defining features
    - Plan Creation: Uses `vibe-tools plan` to generate comprehensive implementation plans
    - Task Generation: Uses `vibe-tools repo` to break down plans with codebase awareness
    - Task Execution: Uses `vibe-tools repo` and `web` for context and research during implementation
    - Status Updates: Uses `vibe-tools repo` to generate summaries of completed work
  - **Limitations**: Requires API keys for some commands, outputs should be reviewed before updating memory files

- **Memory File Automation Pattern**: Using vibe-tools to automate memory file updates
  - **Applied in**: Vibe-Tools Integration Plan (docs/plans/vibe-tools-integration-plan.md)
  - **Context**: Reducing manual effort in maintaining memory files while ensuring compliance with memory-management rule
  - **Benefits**: Maintains consistent memory file structure, reduces repetitive work, improves context retention
  - **Implementation**:
    - Uses command chains like `vibe-tools repo "Command" | vibe-tools ask "Format as memory update"`
    - Employs shell scripts for common update patterns (workflow status, standup reports, domain knowledge)
    - Ensures all automated updates follow memory file structure and avoid duplications
  - **Limitations**: Requires human review to ensure quality, must be developed incrementally

- **Showcase Pattern**: Showcasing tool capabilities through project-specific problems
  - **Applied in**: Task 2025-05-07-03 ([Create Showcase File for Vibe-Tools Examples](/docs/tasks/done/2025-05-07-03.md))
  - **Context**: This pattern was central to the creation/formalization of `docs/memory/vibe-tools-showcase.md`. It involves demonstrating the utility of each `vibe-tools` command by applying it to solve concrete problems or answer specific questions directly relevant to the `bfra-me/works` monorepo. Examples include using `vibe-tools ask` to understand project tooling like ESLint Flat Config, or `vibe-tools repo` to analyze internal scripts and rule systems.
  - **Benefits**: Makes the tool's value immediately apparent to developers working on the project by providing relevant and reusable example prompts. Bridges the gap between general tool documentation and specific project application.
  - **Limitations**: The showcase examples are highly tailored to `bfra-me/works` and may require adaptation for use in other projects.

- **Formalize Pattern**: Formalizing existing example collections into standardized memory files
  - **Applied in**: Task 2025-05-07-03 ([Create Showcase File for Vibe-Tools Examples](/docs/tasks/done/2025-05-07-03.md))
  - **Context**: The task execution revealed that an extensive set of `vibe-tools` examples already existed. The primary action became formalizing this collection by ensuring it was structured as a proper memory file within `docs/memory/`, notably by adding the standard `## Updated: YYYY-MM-DD` timestamp and ensuring it met discoverability criteria.
  - **Benefits**: Ensures valuable, previously created knowledge is integrated into the formal memory system, making it discoverable, maintainable, and compliant with project standards. Increases the utility and longevity of existing documentation.
  - **Limitations**: May require reviewing and potentially refactoring existing content to align with memory file structural standards and consistency requirements.

- **Iterative Command Chaining Pattern**: Iteratively chaining `vibe-tools` commands for complex analysis or generation
  - **Applied in**: (Demonstrated within examples in `docs/memory/vibe-tools-showcase.md`, e.g., "Refactoring Legacy Code", "Comprehensive API Documentation Creation")
  - **Context**: Solving complex problems or generating comprehensive outputs by chaining multiple `vibe-tools` commands, where the output of one command informs the input or query for the next. For example, using `vibe-tools web` for initial research, followed by `vibe-tools repo` to analyze the codebase in light of that research, and then `vibe-tools plan` to generate an implementation strategy.
  - **Benefits**: Breaks down large, complex tasks into more manageable, AI-assisted steps. Allows leveraging the distinct strengths of different `vibe-tools` commands sequentially.
  - **Limitations**: Requires careful management of intermediate outputs and ensuring that context is effectively passed or referenced between command steps.

- **Custom Queries Pattern**: Custom queries for targeted video information extraction
  - **Applied in**: (Showcased in `docs/memory/vibe-tools-showcase.md` for `vibe-tools youtube --type=custom`)
  - **Context**: Utilizing `vibe-tools youtube` with a specific `--type=custom` and a detailed natural language query to extract highly targeted, actionable information from video content, going beyond generic summaries or full transcripts. An example is extracting "3-5 specific, actionable techniques...from a pnpm monorepo management talk" for `bfra-me/works`.
  - **Benefits**: Transforms passive video content into precise, project-relevant insights or data points. Saves significant time by delegating the task of watching and synthesizing specific information from videos to the AI.
  - **Limitations**: The effectiveness is highly dependent on the clarity and specificity of the custom query, the quality of the video's audio/transcript, and the AI model's ability to comprehend and extract the requested details from the video context. Requires `GEMINI_API_KEY`.

## Terminology

| Term | Definition | Context |
|------|------------|---------|
| MDC | Markdown Configuration file for Cursor rules | File extension for Cursor rules (.mdc) |
| Rule | A configuration file that guides AI behavior | Stored in .cursor/rules directory |
| Memory File | Markdown file storing persistent context | Stored in docs/memory directory |
| Knowledge Graph | Connected network of entities and relationships. Maintained by the Memory MCP server. Accessed via `mcp_memory_*` tools. | Used for context retention |
| Entity | A node in the knowledge graph representing a concept. Managed using `mcp_memory_*` tools. | Has a name, type, and observations |
| Relation | A connection between two entities. Managed using `mcp_memory_*` tools. | Has a from, to, and relationType |
| Observation | A fact about an entity. Managed using `mcp_memory_*` tools. | Stored as strings in entities |
| Task | A unit of work with specific acceptance criteria | Stored in docs/tasks directory |
| Plan | A strategy for implementing a feature | Stored in docs/plans directory |
| Cross-Reference | A link between documents | Used to create navigable knowledge system |
| Hierarchical Structure | Organization of rules in parent-child relationships | Defined in relationship diagram |
| mdc: Prefix | Special link syntax used exclusively in Cursor rule (.mdc) files | Format: `[text](mdc:path/to/file)` |

## External Resources

- [Cursor IDE Documentation](https://cursor.sh/docs): Official documentation for the Cursor IDE
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html): Reference for TypeScript patterns used in the codebase
- [Mermaid Syntax](https://mermaid.js.org/syntax/flowchart.html): Documentation for Mermaid diagram syntax used in architecture diagrams
- [Markdown Guide](https://www.markdownguide.org/): Reference for Markdown syntax used in documentation and memory files
- [Changesets Documentation](https://github.com/changesets/changesets): Guide for the versioning system used in the repository

## Updated: 2025-05-19
