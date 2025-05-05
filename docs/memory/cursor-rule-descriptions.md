# Standardize Cursor Rule Description Patterns

## Overview
- **Task ID**: 2025-05-04-01
- **Type**: Documentation
- **Status**: Completed
- **Completion Date**: 2025-05-04
- **Components Affected**: All Cursor rules in `.cursor/rules/` directory, rules index

## Problem Description
Cursor rule descriptions in frontmatter lacked standardization, with inconsistent patterns and verbs that reduced the effectiveness of conditional rule application by AI assistants. Some rules used verbs like "DOCUMENT" or "NAVIGATE" that didn't clearly indicate when and how the rule should be activated.

## Solution Implemented
Implemented a standardized format for all rule descriptions following the "VERB when CONTEXT to OUTCOME" pattern, and limited ACTION verbs to four approved options: FOLLOW, APPLY, USE, or ALWAYS USE. This ensures consistency and predictability in how AI assistants discover and apply rules.

## Implementation Details
1. Established the standardized format: "VERB when CONTEXT to OUTCOME"
2. Defined the four approved ACTION verbs:
   - **FOLLOW**: For rules providing procedural guidance or standards to adhere to
   - **APPLY**: For rules guiding direct implementation or standards application
   - **USE**: For rules providing syntax, tools, or guidance for specific tasks
   - **ALWAYS USE**: (Reserved for rules that should always be applied)

3. Created verb selection guidelines:
   - FOLLOW for process, workflow, and guideline rules
   - APPLY for implementation, quality standards, and code review rules
   - USE for tools, syntax, searching, and contextual enhancement rules

4. Updated all rule descriptions in their frontmatter (after opening `---`) without modifying the internal description field after the `<rule>` tag

5. Made the following specific changes:
   - Changed "UPDATE" to "USE" in auto-memory-manager.mdc
   - Changed "IMPLEMENT" to "FOLLOW" in testing-practices.mdc and prettier-config-usage.mdc
   - Changed "MAINTAIN" to "USE" in memory-management.mdc
   - Updated anthropic-chain-of-thought.mdc to use "USE" rather than "STRUCTURE" or "FOLLOW"

6. Important lesson: Only modify the description in the frontmatter immediately after the opening `---`, never modify the description field that follows the `<rule>` tag

## Caveats and Limitations
- Limited to only four approved ACTION verbs for consistency, which may occasionally sacrifice precision for standardization
- Required careful use of terminal commands (sed) for precise changes to avoid modifying the wrong description field
- Relied on grep searches to identify all non-conforming descriptions

## Related Tasks
- Create rule format template (Task ID: 2025-05-03-05)
- Update existing rules to match template (Task ID: 2025-05-03-06)

## References
- [cursor-rules-creation.mdc](/.cursor/rules/cursor-rules-creation.mdc) - Guidelines for creating cursor rules
- [00-rule-index.mdc](/.cursor/rules/00-rule-index.mdc) - Index of all cursor rules
- [Rule Standardization Guidelines](../tasks/done/2025-05-04-01.md) - Original task document
