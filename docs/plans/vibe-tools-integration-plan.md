# Plan: Integrate Vibe-Tools into AI-Agile Workflow Rule

## Overview

This plan details the steps required to update the `ai-agile-workflow.mdc` Cursor rule to incorporate the capabilities of `vibe-tools`. The goal is to enhance the existing feature -> plan -> task workflow defined in the rule by integrating `vibe-tools plan`, `web`, `repo`, `mcp`, and `browser` commands at relevant stages. This includes adding specific command examples and incorporating guidance on memory file automation, as outlined in the `docs/memory/agile-workflow-enhancements.md` analysis. The updated rule must adhere to the structure and standards defined in `cursor-rules-creation.mdc`.

## Related Feature

[Feature 5: Cursor Rules Enhancement](/docs/features.md#feature-5-cursor-rules-enhancement) (This update falls under general rule enhancement and integration).

## Success Criteria

-   The `.cursor/rules/ai-agile-workflow.mdc` file is updated with integrated `vibe-tools` guidance.
-   `vibe-tools` commands (`plan`, `web`, `repo`, `mcp`, `browser`) are explicitly mentioned and integrated into the relevant stages of the feature -> plan -> task -> execution -> completion workflow within the rule.
-   Specific command examples derived from `docs/memory/agile-workflow-enhancements.md` are included for each stage.
-   A dedicated section on Memory File Automation using `vibe-tools` (including script examples) is added to the rule.
-   The updated rule structure conforms to the guidelines in [`cursor-rules-creation.mdc`](/.cursor/rules/cursor-rules-creation.mdc).
-   Appropriate cross-references to [`vibe-tools.mdc`](/.cursor/rules/vibe-tools.mdc), [`memory-management.mdc`](/.cursor/rules/memory-management.mdc), and relevant memory files (like `agile-workflow-enhancements.md`) are included.
-   Rule metadata (version) is updated appropriately.

## Implementation Phases

### Phase 1: Preparation and Review

**Objective**: Thoroughly understand the source analysis, the target rule's current structure, and relevant guidelines.

**Tasks**:

1.  **Review Source Analysis Document**
    - **Complexity**: Low
    - **Dependencies**: None
    - **Acceptance Criteria**: Complete understanding of the integration points, command examples, and automation strategies outlined in [`docs/memory/agile-workflow-enhancements.md`](/docs/memory/agile-workflow-enhancements.md). Key command templates and examples identified for each workflow stage. Memory automation script examples noted for inclusion.

2.  **Analyze Target Rule File**
    - **Complexity**: Low
    - **Dependencies**: None
    - **Acceptance Criteria**: Identify the specific sections within [`ai-agile-workflow.mdc`](/.cursor/rules/ai-agile-workflow.mdc) corresponding to feature definition, planning, task generation, execution, and completion. Understand the current flow and structure of the rule's guidance.

3.  **Review Formatting & Structure Guidelines**
    - **Complexity**: Low
    - **Dependencies**: None
    - **Acceptance Criteria**: Clear understanding of the required structure, metadata, and cross-referencing syntax defined in [`cursor-rules-creation.mdc`](/.cursor/rules/cursor-rules-creation.mdc).

4.  **Review Vibe-Tools Rule**
    - **Complexity**: Low
    - **Dependencies**: None
    - **Acceptance Criteria**: Familiarity with the commands and options documented in [`vibe-tools.mdc`](/.cursor/rules/vibe-tools.mdc) for accurate cross-referencing.

### Phase 2: Content Integration - Workflow Stages

**Objective**: Update the core workflow sections of the `ai-agile-workflow.mdc` rule to seamlessly integrate `vibe-tools` commands and examples.

**Tasks**:

1.  **Integrate `vibe-tools web` for Feature Definition/Research**
    - **Complexity**: Medium
    - **Dependencies**: Phase 1 Tasks
    - **Acceptance Criteria**: Update the "Capture Features" or equivalent section in `ai-agile-workflow.mdc`. Add guidance on using `vibe-tools web` for initial research and competitor analysis. Include specific command examples from `agile-workflow-enhancements.md`. Add guidance on using `--with-doc` when specific URLs are provided.

2.  **Integrate `vibe-tools plan` for Plan Creation**
    - **Complexity**: Medium
    - **Dependencies**: Phase 1 Tasks
    - **Acceptance Criteria**: Update the "Create Plan Documents" section. Add guidance on using `vibe-tools plan` to generate structured plans from feature descriptions. Include relevant command examples, including options like `--thinkingProvider`, `--thinkingModel`, and `--with-doc`.

3.  **Integrate `vibe-tools plan` / `repo` for Task Generation**
    - **Complexity**: Medium
    - **Dependencies**: Phase 1 Tasks
    - **Acceptance Criteria**: Update the "Generate Task Documents" section. Add guidance on using `vibe-tools plan` or `vibe-tools repo` to break down plan phases into discrete tasks. Include command examples, potentially showing how to save output directly to task files (as shown in the analysis doc).

4.  **Integrate `vibe-tools repo` / `web` / `browser` for Task Execution**
    - **Complexity**: Medium
    - **Dependencies**: Phase 1 Tasks
    - **Acceptance Criteria**: Update the "Execute Tasks" section. Add guidance on using `vibe-tools repo` for gathering codebase context before starting implementation. Add guidance on using `vibe-tools web` or `vibe-tools browser act/observe` for troubleshooting or researching solutions during implementation. Include specific command examples for context gathering and problem-solving.

5.  **Integrate `vibe-tools repo` for Status Updates/Reviews**
    - **Complexity**: Medium
    - **Dependencies**: Phase 1 Tasks
    - **Acceptance Criteria**: Update sections related to progress tracking or task completion summaries. Add guidance on using `vibe-tools repo` to generate summaries of completed work for status updates or sprint reviews. Include command examples for generating summaries.

### Phase 3: Content Integration - Memory Automation

**Objective**: Add a dedicated section to the rule explaining how `vibe-tools` can automate memory file updates, incorporating examples from the analysis document.

**Tasks**:

1.  **Draft Memory Automation Section**
    - **Complexity**: Medium
    - **Dependencies**: Phase 1 Tasks
    - **Acceptance Criteria**: Create a new section within `ai-agile-workflow.mdc` titled "Memory File Automation with Vibe-Tools" or similar. Explain the concept of using `vibe-tools` (primarily `repo` and `ask`/`mcp`) to automate updates to memory files like `workflow-status.md`, `domain-knowledge.md`, etc.

2.  **Incorporate Script Examples**
    - **Complexity**: Medium
    - **Dependencies**: Task 3.1
    - **Acceptance Criteria**: Add formatted script examples from `agile-workflow-enhancements.md` for: Automated Workflow Status Updates, Daily Standup Automation, Domain Knowledge Updates, Sprint Planning Integration, Retrospective Insights Processing. Ensure examples are clear and correctly formatted within the rule file.

3.  **Add Guidance on Automation Integration**
    - **Complexity**: Low
    - **Dependencies**: Task 3.1, 3.2
    - **Acceptance Criteria**: Briefly explain how these automation scripts fit into the overall agile workflow (e.g., run after task completion, during planning). Cross-reference the [`memory-management.mdc`](/.cursor/rules/memory-management.mdc) rule for underlying memory principles.

### Phase 4: Refinement and Validation

**Objective**: Ensure the updated rule is well-structured, correctly formatted, properly cross-referenced, and compliant with established guidelines.

**Tasks**:

1.  **Add/Update Cross-References**
    - **Complexity**: Low
    - **Dependencies**: Phase 2, Phase 3 Tasks
    - **Acceptance Criteria**: Add explicit links (`mdc:` syntax) to [`vibe-tools.mdc`](/.cursor/rules/vibe-tools.mdc) whenever `vibe-tools` commands are mentioned. Add/verify links to [`memory-management.mdc`](/.cursor/rules/memory-management.mdc) in the automation section. Add links to relevant memory files (e.g., [`agile-workflow-enhancements.md`](/docs/memory/agile-workflow-enhancements.md)). Update the "Related Rules" section to include `vibe-tools.mdc`.

2.  **Ensure Rule Structure Compliance**
    - **Complexity**: Low
    - **Dependencies**: Phase 2, Phase 3 Tasks
    - **Acceptance Criteria**: Verify the entire `.mdc` file structure (frontmatter, title, `<rule>` block, filters, actions, examples, metadata) conforms to [`cursor-rules-creation.mdc`](/.cursor/rules/cursor-rules-creation.mdc). Ensure formatting (headings, code blocks, lists) is consistent.

3.  **Update Rule Metadata**
    - **Complexity**: Low
    - **Dependencies**: Phase 2, Phase 3 Tasks
    - **Acceptance Criteria**: Increment the `version` number in the metadata (likely a MINOR bump).

4.  **Perform Final Review**
    - **Complexity**: Medium
    - **Dependencies**: Task 4.1, 4.2, 4.3
    - **Acceptance Criteria**: Read through the entire updated rule for clarity, correctness, and consistency. Verify that all integration points from the analysis document have been addressed. Ensure command examples are accurate and easy to understand.

## Timeline

-   Phase 1: 0.5 days
-   Phase 2: 1.5 days
-   Phase 3: 1 day
-   Phase 4: 0.5 days
-   **Total Estimated Effort**: 3.5 days

## Resources Required

-   Access to the `bfra-me/works` repository.
-   [`docs/memory/agile-workflow-enhancements.md`](/docs/memory/agile-workflow-enhancements.md) (Source Analysis)
-   [`ai-agile-workflow.mdc`](/.cursor/rules/ai-agile-workflow.mdc) (Target Rule File)
-   [`cursor-rules-creation.mdc`](/.cursor/rules/cursor-rules-creation.mdc) (Structure Guideline)
-   [`vibe-tools.mdc`](/.cursor/rules/vibe-tools.mdc) (Tool Reference)
-   [`memory-management.mdc`](/.cursor/rules/memory-management.mdc) (Memory Guideline)
-   AI Assistant (for content generation, review, and implementation assistance).

---

This plan provides a structured approach to integrating `vibe-tools` into the `ai-agile-workflow` rule, ensuring all requirements from the analysis document are met while adhering to repository standards.

---
**Relevant Files:**

*   `docs/plans/vibe-tools-integration-plan.md` (This generated plan)
*   `docs/memory/agile-workflow-enhancements.md`
*   `.cursor/rules/ai-agile-workflow.mdc`
*   `.cursor/rules/cursor-rules-creation.mdc`
*   `.cursor/rules/vibe-tools.mdc`
*   `.cursor/rules/memory-management.mdc`
*   `docs/features.md`
*   `docs/templates/plan-template.md`
