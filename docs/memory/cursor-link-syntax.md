# Cursor Link Syntax Guidelines

## Overview
- **Task ID**: 2025-05-06-01
- **Type**: Technical Knowledge
- **Status**: Completed
- **Completion Date**: 2025-05-06
- **Components Affected**: All documentation, cursor rules

## Problem Description
Inconsistent use of the `mdc:` prefix in links has caused confusion and incorrect link formatting across documentation. It's important to establish clear guidelines on when and where to use this special prefix.

## Solution Implemented
Created clear documentation on when to use the `mdc:` prefix in links and corrected all existing files to follow these guidelines.

## Implementation Details

### Link Syntax Rules

1. **In .mdc files (Cursor Rules):**
   - **ALWAYS** use the `mdc:` prefix in links
   - Format: `[link text](mdc:path/to/file)`
   - Example: `[memory-management](mdc:.cursor/rules/memory-management.mdc)`

2. **In .md files (Regular Markdown):**
   - **NEVER** use the `mdc:` prefix in links
   - Format: `[link text](/path/to/file)`
   - Example: `[memory-management](/.cursor/rules/memory-management.mdc)`

### Rationale
- The `mdc:` prefix is a special syntax that works specifically within the Cursor IDE for .mdc files
- Regular markdown files should use standard markdown link syntax for compatibility with standard markdown renderers
- Mixing these syntaxes leads to broken links and incorrect documentation

### Examples

**Correct usage in .mdc files:**
```markdown
[memory-management](mdc:.cursor/rules/memory-management.mdc)
[domain-knowledge](mdc:docs/memory/domain-knowledge.md)
```

**Correct usage in .md files:**
```markdown
[memory-management](/.cursor/rules/memory-management.mdc)
[domain-knowledge](/docs/memory/domain-knowledge.md)
```

### Implementation Actions
1. Updated all memory files in `docs/memory/` to remove incorrect `mdc:` prefixes
2. Updated `architecture.md` and `decisions.md` to clarify the proper usage
3. Created this memory file to document the correct syntax for future reference
4. Ensured all cursor rules in `.cursor/rules/` continue to use the `mdc:` prefix
5. Completed task 2025-04-25-03 which systematically updated all Cursor rule (.mdc) files to use the proper `mdc:` linking syntax instead of custom or inconsistent formats
6. Replaced all instances of `{rule:rule-name}`, `@rule-name`, and vanilla Markdown links in cursor rules with the standardized `[rule-name](mdc:.cursor/rules/rule-name.mdc)` format

## Caveats and Limitations
- The `mdc:` prefix only works properly in the Cursor IDE within .mdc files
- GitHub and other markdown renderers will not correctly process the `mdc:` prefix
- Care must be taken when copying links between .mdc and .md files to adjust the syntax appropriately

## Related Tasks
- Fixed all incorrect links in memory files (Task ID: 2025-05-06-01)
- Updated all Cursor rule links to use proper mdc: syntax (Task ID: 2025-04-25-03)

## References
- [architecture.md](/docs/memory/architecture.md) - Contains link syntax decision
- [decisions.md](/docs/memory/decisions.md) - Documents ARCH-004 decision regarding link syntax

## Updated: 2025-05-16
