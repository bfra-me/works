# User Preferences Memory

## Coding Style
- **Formatting**: Uses Prettier with @bfra.me/prettier-config for consistent formatting
  - No spaces after opening or before closing braces: `import {foo} from 'bar'`
  - No semicolons
- **Naming Conventions**:
  - TypeScript: camelCase for variables and functions, PascalCase for classes and interfaces
  - Files: kebab-case for file names, descriptive and concise
  - Cursor Rules: kebab-case for rule filenames, PascalCase for rule names in frontmatter
- **Architecture Patterns**:
  - Modular design with clear separation of concerns
  - Monorepo structure with focused packages
  - Functional and fluent programming styles
  - Prefer not to use classes
  - Prefer `function` at the top-level of a module with explicit exports
  - Prefer type inference if there are no aliases or existing types
  - Prefer explicit type annotation when using exported or utility types

## Tool Preferences
- **IDE**: VS Code with Cursor extension
- **CLI Tools**:
  - pnpm for package management
    - Use `--filter` to run commands in specific packages or subset
    - Use `--filter-prod` with filter "{.}..." in `prepack` script
    - Quick install using `bootstrap` script (`pnpm install --prefer-offline --log-level warn`)
  - Changesets for versioning and changelogs
  - ESLint for code quality
  - Utility scripts and internal CLIs written in TypeScript and run via `tsx`
  - **`vibe-tools` Note:** When passing multi-line text (like plans or code snippets) as arguments to `vibe-tools` commands in the shell, ensure newlines are properly escaped or the text is quoted to prevent shell errors and ensure the tool receives the complete input.
- **Frameworks**:
  - TypeScript for type safety
  - React for UI components (when applicable)
  - Vitest for testing
    - Prefer fixtures and snapshots for config packages
    - Use type testing features
    - Generate coverage reports
    - Extend expect matchers for intuitive assertions
    - Use caching for local dev and CI
    - Prefer `it` over `test`

## Workflow Preferences
- **Communication Style**:
  - Clear, concise explanations with practical examples
  - Task-oriented communication focused on current context
  - Structured recommendations with rationale
- **Explanation Level**:
  - Medium detail, focusing on practical implementation
  - More detail for complex concepts or architectural decisions
  - Less detail for routine operations
- **AI Autonomy**:
  - Medium - propose solutions but seek approval for implementation
  - High for repetitive tasks like formatting or simple refactoring
  - Low for architectural decisions requiring broader context
- **Development Process**:
  - Prefer smaller, incremental PRs
  - Create changesets for changes that impact consumers
  - Don't create changesets for updates to development tools or config
  - Use changesets/action which creates a PR to track the next release
  - Sometimes release packages by merging the PR manually
  - Pending releases are automatically merged once a week
- **AI Assistant Operating Principles**:
  - Use MCP servers when available
  - Always use Sequential Thinking for complex tasks, step by step reasoning, and for detailed planning
  - Read the knowledge graph and user preference memory file FIRST to collect context and to consider when problem solving
  - Use web search tools when 'best practices', 'modern patterns', or any up-to-date knowledge is required for the task
  - Follow the guidelines and recommendations set in the `mcp-tools-usage.mdc` rule for interacting with tools
  - Avoid recursive tool calls if progress has stalled
  - Do not append to documents. Find the logical place where the new content fits cohesively and seamlessly integrate with old content.

## Documentation Preferences
- **Format**:
  - Markdown with structured headings
  - Mermaid diagrams for visual representation
  - Tables for structured information
- **Code Examples**:
  - Include relevant, concise examples
  - Complete imports and context
  - Follow established patterns
- **Comments**:
  - TSDoc/JSDoc style for functions and interfaces
  - Public interfaces, functions, types, etc. must always use JSDoc
  - Use the `@internal` tag appropriately
  - Complex or critical paths of non-public code should be documented
  - Error conditions and security warnings must be provided where needed
  - Link to related concepts/code for cross-references
  - Provide examples to demonstrate usage
  - Minimal inline comments, focus on self-documenting code
  - Comments explaining "why" rather than "what"

## Cursor Rules Preferences
- **Rule Structure**:
  - Clear description in frontmatter
  - Specific glob patterns to minimize false positives
  - Comprehensive examples section
  - Cross-references to related rules
- **Rule Content**:
  - Actionable suggestions rather than general advice
  - Examples showing correct implementation
  - Clear explanation of rule purpose and benefits
  - Links to relevant documentation or resources
- **Rule Application**:
  - Use appropriate application modes depending on rule type
  - Focus rules on a single topic whenever possible
  - Value agent-requested mode (or auto-apply if constrained with globs)
  - Preferences should be used by rules when using terminal, writing files, and using tools
  - Preferences must take precedence over related/other project config
  - Rules should recognize useful patterns, insights, and ideas to capture as preferences

## Versioning Preferences
- **Semantic Versioning**
  - Follow Semantic Versioning conventions
  - Prefer 0.x.x versioning in new or experimental projects
  - Breaking changes can occur in minor updates for 0.x.x versions

## Updated: 2025-05-06
