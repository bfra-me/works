# Cursor Rule Interaction Patterns

This document outlines common patterns of interaction between different Cursor rules within the `bfra-me/works` repository. Understanding these patterns helps in designing effective rules, avoiding conflicts, and enabling AI assistants to integrate guidance coherently.

## Interaction Categories

Rule interactions generally fall into these categories:

1.  **Synergy/Complementary:** Rules that work together to achieve a broader goal than any single rule could alone.
2.  **Foundation/Dependency:** Rules that provide the basis or structure upon which other rules rely.
3.  **Layering:** Rules that apply sequentially or add constraints on top of each other (e.g., general standards followed by specific implementations).
4.  **Potential Conflict/Overlap:** Rules whose activation conditions or guidance might clash or be redundant. (Requires careful management via priority or specificity).

## Common Interaction Patterns

### 1. Workflow Synergy

This pattern involves rules that combine to create a cohesive workflow for development, task management, and context persistence.

- **Core Rules:**
    - [`ai-agile-workflow`](/.cursor/rules/ai-agile-workflow.mdc): Defines the process for creating plans, generating tasks, and tracking progress.
    - [`memory-management`](/.cursor/rules/memory-management.mdc): Establishes the structure and guidelines for memory files (like `workflow-status.md`) and their synchronization with the Knowledge Graph.
    - [`date-consistency-enforcer`](/.cursor/rules/date-consistency-enforcer.mdc): Ensures accurate timestamps in tasks and memory files.
- **Interaction:** `ai-agile-workflow` triggers the process, `memory-management` defines *where* and *how* status is stored (in files and the KG), and `date-consistency-enforcer` ensures *accuracy* of time-based data throughout. The `memory-management` rule also covers automated updates to memory files and the KG upon task completion.

### 2. Coding Standards Stack

This pattern involves multiple rules layering to enforce comprehensive code quality standards.

- **Core Rules:**
    - [`eslint-config-usage`](/.cursor/rules/eslint-config-usage.mdc): Guides the setup and usage of the shared ESLint configuration for linting.
    - [`prettier-config-usage`](/.cursor/rules/prettier-config-usage.mdc): Guides the setup and usage of the shared Prettier configuration for formatting.
    - [`typescript-patterns`](/.cursor/rules/typescript-patterns.mdc): Provides specific patterns and best practices for writing TypeScript code.
    - [`testing-practices`](/.cursor/rules/testing-practices.mdc): Defines standards for writing tests (using Vitest).
- **Interaction:** Developers follow `eslint-config-usage` and `prettier-config-usage` for base setup. `typescript-patterns` provides language-specific best practices on top of linting/formatting. `testing-practices` ensures the code adheres to quality standards via tests.

### 3. Rule System Foundation

This pattern includes rules essential for defining, creating, and organizing the entire Cursor rule system itself.

- **Core Rules:**
    - [`cursor-rules-creation`](/.cursor/rules/cursor-rules-creation.mdc): Provides the template, metadata standards, and process for creating any new rule.
    - [`cursor-rules-location`](/.cursor/rules/cursor-rules-location.mdc): Mandates that all rule files (`.mdc`) reside in the `.cursor/rules/` directory.
    - [`cursor-rule-cross-references`](/.cursor/rules/cursor-rule-cross-references.mdc): Defines the `/` syntax for linking between rules and other files within rule documents.
    - [`00-rule-index`](/.cursor/rules/00-rule-index.mdc): Serves as the central, automatically updated registry for all rules.
- **Interaction:** A developer uses `cursor-rules-creation` to write a new rule, places it according to `cursor-rules-location`, uses `cursor-rule-cross-references` for any internal links, and the rule is then automatically listed in the `00-rule-index`.

### 4. Contextual Tool Integration

This pattern involves rules that manage the flow and application of contextual information using available tools (like MCP tools or memory files).

- **Core Rules:**
    - [`mcp-tools-usage`](/.cursor/rules/mcp-tools-usage.mdc): General guidelines for using available external tools (Search, Fetch, KG, Sequential Thinking).
    - [`memory-management`](/.cursor/rules/memory-management.mdc): Defines how persistent context is stored in `docs/memory/` files and synchronized with the Knowledge Graph.
    - [`user-preferences-awareness`](/.cursor/rules/user-preferences-awareness.mdc): Guides accessing and applying user-specific preferences (often stored via `memory-management` principles or directly in the KG).
- **Interaction:** `mcp-tools-usage` provides access to a suite of tools, including those for interacting with the Knowledge Graph (KG), which is the assistant's persistent 'memory' (powered by the Memory MCP server). `memory-management` defines how local memory files are structured and also how they synchronize with the KG. `user-preferences-awareness` guides the AI to retrieve user context, often from KG entities (using tools like `mcp_memory_search_nodes` or `mcp_memory_open_nodes`). The `memory-management` rule then ensures task outcomes and new insights are persisted back into both local memory files and the KG (using tools like `mcp_memory_create_entities`, `mcp_memory_add_observations`).

## Potential Conflict Areas & Resolution

While the current rule set aims for clarity, potential conflicts can arise, especially as new rules are added. Here's how to identify and manage them:

1.  **Activation Overlap (Specificity vs. Generality):**
    *   **Scenario:** A general rule (e.g., applying to all `.md` files) might overlap with a more specific rule (e.g., for `.mdc` files within `.cursor/rules/`).
    *   **Resolution:** Rule priority, as defined in the rule's metadata (`priority: High | Medium | Low`), should guide the AI. Higher priority rules take precedence. If priorities are equal, the rule with the more specific trigger condition (e.g., a more precise file path pattern or content regex) should generally be favored. If ambiguity remains, the AI should note the conflict and potentially ask the user for clarification.

2.  **Conflicting Guidance:**
    *   **Scenario:** Two rules activated by the same context provide contradictory instructions (e.g., one suggests using `let`, another `const`).
    *   **Resolution:** This indicates a flaw in rule design. The rules should be reviewed and potentially merged, or their activation conditions refined to be mutually exclusive for the conflicting advice. Rule reviews during creation are crucial to prevent this.

3.  **Redundant Triggers/Guidance:**
    *   **Scenario:** Multiple rules activate on the exact same narrow trigger condition, offering very similar advice.
    *   **Resolution:** Consider merging these rules into a single, more comprehensive rule to reduce noise and simplify maintenance. Alternatively, differentiate their triggers or guidance more clearly.

4.  **Workflow Conflicts:**
    *   **Scenario:** A rule attempts to define a workflow (e.g., for releases) that contradicts the established process in [`ai-agile-workflow`](/.cursor/rules/ai-agile-workflow.mdc) or [`changeset-workflow`](/.cursor/rules/changeset-workflow.mdc).
    *   **Resolution:** Core workflow rules (like agile, changesets) should take precedence. Other rules should provide guidance *within* these established workflows, not redefine them.

## Best Practices for Designing Interacting Rules

To create rules that function well together:

1.  **Define Clear Scope & Triggers:** Be precise about *when* a rule should activate. Use specific file paths, content patterns, or message triggers. Avoid overly broad conditions.
2.  **Leverage Existing Structures:** Don't reinvent the wheel. If a process exists (e.g., memory management, task tracking), provide guidance *within* that structure rather than creating a parallel one.
3.  **Utilize Rule Priority:** Assign a meaningful priority (`High`, `Medium`, `Low`) based on the guidance's importance. High priority is for critical standards, Medium for strong recommendations, and Low for helpful suggestions.
4.  **Embrace Cross-Referencing:** Use the proper syntax to explicitly link to related rules, plans, or memory files. This builds a navigable knowledge network.
5.  **Document Interactions:** If a rule strongly depends on or complements another, mention this in its "Related Rules" section.
6.  **Focus on Atomic Guidance:** Ideally, each rule should provide a focused piece of guidance. Complex processes are better handled by workflow rules (`ai-agile-workflow`) that other rules can plug into.
7.  **Review for Conflicts:** During rule creation or modification, actively consider potential interactions and conflicts with existing rules.
8.  **Follow Foundational Rules:** Adhere strictly to `cursor-rules-creation` for all rule creation, updates, and cross-referencing.

## Examples of Effective Combinations

Here are examples illustrating how multiple rules work together effectively:

1.  **Developing a New Feature:**
    *   [`development-workflow`](/.cursor/rules/development-workflow.mdc): Outlines the high-level steps (branching, coding, PR).
    *   [`ai-agile-workflow`](/.cursor/rules/ai-agile-workflow.mdc): Used to break the feature into tasks and track progress.
    *   [`typescript-patterns`](/.cursor/rules/typescript-patterns.mdc): Guides the actual code implementation.
    *   [`testing-practices`](/.cursor/rules/testing-practices.mdc): Ensures proper test coverage.
    *   [`code-review-standards`](/.cursor/rules/code-review-standards.mdc): Guides the PR review process.
    *   [`changeset-workflow`](/.cursor/rules/changeset-workflow.mdc): Used to document the changes for release notes.

2.  **Creating a New Cursor Rule:**
    *   [`cursor-rules-creation`](/.cursor/rules/cursor-rules-creation.mdc): Provides the core template and standards.
    *   [`cursor-rules-location`](/.cursor/rules/cursor-rules-location.mdc): Ensures the file is placed correctly.
    *   [`cursor-rule-cross-references`](/.cursor/rules/cursor-rule-cross-references.mdc): Used for linking within the rule content.
    *   [`00-rule-index`](/.cursor/rules/00-rule-index.mdc): The new rule must be added here (often automated via `ai-agile-workflow` task completion for rules).
    *   [`anthropic-chain-of-thought`](/.cursor/rules/anthropic-chain-of-thought.mdc): May guide the structure of examples or reasoning within the rule if applicable.

3.  **Refactoring Code:**
    *   [`debugging-guide`](/.cursor/rules/debugging-guide.mdc): Potentially used to understand the existing code before refactoring.
    *   [`typescript-patterns`](/.cursor/rules/typescript-patterns.mdc): Guides the implementation of the refactored code.
    *   [`eslint-config-usage`](/.cursor/rules/eslint-config-usage.mdc) & [`prettier-config-usage`](/.cursor/rules/prettier-config-usage.mdc): Ensure the refactored code meets linting and formatting standards.
    *   [`testing-practices`](/.cursor/rules/testing-practices.mdc): Existing tests should pass, or new tests added/updated.

## Anti-Patterns to Avoid

When designing rules, avoid these common pitfalls:

-   **Overly Broad Triggers:** Creating rules that activate too frequently and provide irrelevant guidance (e.g., a rule triggering on every single `.ts` file without specific content checks).
-   **Guidance Duplication:** Repeating advice already clearly covered in another, more focused rule. Instead, cross-reference the existing rule.
-   **Workflow Re-Implementation:** Defining complex workflows within a rule that should defer to established processes like [`ai-agile-workflow`](/.cursor/rules/ai-agile-workflow.mdc) or [`changeset-workflow`](/.cursor/rules/changeset-workflow.mdc).
-   **Ignoring Foundational Rules:** Not adhering to `cursor-rules-creation`, `location`, or `cross-references` standards.
-   **Lack of Specificity:** Providing vague guidance that isn't actionable or doesn't account for context.
-   **Missing Cross-References:** Failing to link to related rules, making the knowledge system less connected.
-   **Incorrect Priority:** Assigning `High` priority to minor suggestions or `Low` priority to critical standards.

## Guidelines for Cross-Referencing

Effective cross-referencing is crucial for a cohesive rule system:

-   **Syntax:** Use the proper link format based on file type. For .mdc files in the Cursor IDE, use the `mdc:` prefix. For regular markdown files, use standard markdown links.
-   **Purpose:** Link to other rules when:
    *   Building upon their guidance.
    *   Referencing a prerequisite standard or process.
    *   Pointing to more detailed information on a related topic.
    *   Indicating a dependency.
-   **Context:** Link to relevant documentation files (plans, memory files, feature descriptions) when providing context or referencing project state.
-   **Clarity:** Use descriptive link text that clearly indicates the target of the link.

## Suggestions for Rule Grouping

The categories in [`00-rule-index`](/.cursor/rules/00-rule-index.mdc) already provide logical grouping. Maintain consistency with that index.

## Updated: 2025-05-05
