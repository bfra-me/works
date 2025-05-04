# Cursor Rule Frontmatter Guidelines

## Overview
- **Task ID**: 2025-05-02-03
- **Type**: Technical Knowledge
- **Status**: Completed
- **Completion Date**: 2025-05-02
- **Components Affected**: .cursor/rules files, rule creation process

## Problem Description
When creating Cursor rules (.mdc files), the frontmatter must be properly formatted for the rules to be correctly applied. Incorrect or missing frontmatter can cause rules to be ignored or improperly triggered. Standard code editing tools may not properly handle .mdc files due to their specialized nature in Cursor.

## Solution Implemented
Established clear guidelines for creating and editing .mdc files with proper frontmatter structure and identified reliable methods for manipulating these files.

## Implementation Details

### Proper Frontmatter Structure
```yaml
---
description: Clear description of what the rule provides guidance on
globs: pattern1, pattern2, pattern3  # Patterns for auto-attachment
alwaysApply: false  # Typically false for auto-attachment via globs
---
```

### Rule Types and Their Frontmatter Requirements
1. **Auto-Attached Rules** (Most common)
   - `alwaysApply: false`
   - `globs` must contain specific file patterns that trigger the rule
   - `description` must be clear and descriptive
   - Example: Testing rules that apply to test files

2. **Always Applied Rules**
   - `alwaysApply: true`
   - `globs` can be empty
   - Applied to all conversations regardless of context
   - Used sparingly for critical guidance only

3. **Agent Requested Rules**
   - `alwaysApply: false`
   - May omit specific `globs` patterns
   - Discovered via description content
   - Example: Process workflows, general guidance

### Editing .mdc Files Reliably
Since standard code editing tools may not work correctly with .mdc files:

1. Use terminal commands to view and edit:
   ```bash
   # View content
   cat .cursor/rules/example-rule.mdc

   # Create new file with proper frontmatter
   echo '---' > .cursor/rules/new-rule.mdc
   echo 'description: Clear rule description' >> .cursor/rules/new-rule.mdc
   echo 'globs: *.ts, *.tsx' >> .cursor/rules/new-rule.mdc
   echo 'alwaysApply: false' >> .cursor/rules/new-rule.mdc
   echo '---' >> .cursor/rules/new-rule.mdc
   ```

2. Always verify changes:
   ```bash
   head -10 .cursor/rules/modified-rule.mdc
   ```

3. Compare with working examples:
   ```bash
   cat .cursor/rules/working-rule.mdc | head -10
   ```

### Using Sed for Precision Editing of Frontmatter

When the `edit_file` tool fails to properly update frontmatter, use `sed` for precision line-by-line editing:

1. First check the current state of the frontmatter:
   ```bash
   cat .cursor/rules/rule-name.mdc | head -5
   ```

2. Update specific frontmatter fields using sed (MacOS/BSD syntax):
   ```bash
   # Update description field
   sed -i '' '2s/description:/description: Your detailed description here/' .cursor/rules/rule-name.mdc

   # Update globs field
   sed -i '' '3s/globs:/globs: *.ts, *.tsx, package.json/' .cursor/rules/rule-name.mdc

   # Update alwaysApply field
   sed -i '' '4s/alwaysApply: true/alwaysApply: false/' .cursor/rules/rule-name.mdc
   ```

3. For Linux/GNU sed, omit the empty quotes:
   ```bash
   sed -i '2s/description:/description: Your detailed description here/' .cursor/rules/rule-name.mdc
   ```

4. Verify changes with:
   ```bash
   cat .cursor/rules/rule-name.mdc | head -5
   ```

### Troubleshooting Edit_File Issues with Frontmatter

If you encounter issues when using the edit_file tool to update frontmatter:

1. **Identify the issue**:
   - Check if the frontmatter is being completely removed or not updated
   - Verify if there are incomplete fields in the frontmatter
   - Check for YAML formatting issues

2. **Fallback procedure**:
   - First try using direct file access with terminal commands
   - Use cat to inspect current state
   - Use sed for targeted field updates
   - Avoid using edit_file for frontmatter changes until the issues are resolved

3. **Example from API design standards rule**:
   When implementing the API design standards rule, the edit_file tool failed to properly update the frontmatter. The solution was:
   ```bash
   # Check current state
   cat .cursor/rules/api-design-standards.mdc | head -5

   # Output showed:
   # ---
   # description:
   # globs:
   # alwaysApply: false
   # ---

   # Update with sed
   sed -i '' '2s/description:/description: Guidelines for designing consistent, type-safe, and well-documented APIs across packages in the bfra.me\/works monorepo/' .cursor/rules/api-design-standards.mdc
   sed -i '' '3s/globs:/globs: *.ts, *.tsx, *.d.ts, package.json/' .cursor/rules/api-design-standards.mdc

   # Verify changes
   cat .cursor/rules/api-design-standards.mdc | head -5
   ```

## Caveats and Limitations
- The `edit_file` tool may not correctly handle .mdc files in Cursor
- Line breaks in frontmatter may cause issues with rule application
- YAML formatting in frontmatter must be precise
- Creating rules without proper frontmatter can lead to "manual only" rules that never trigger automatically
- Escaped slashes (\\/) may be needed in sed commands when paths include forward slashes

## Related Tasks
- Creation of CI/CD workflow rule (Task ID: 2025-05-02-02)
- Testing practices rule creation
- API design standards rule creation (Task ID: 2025-05-03-01)

## References
- [cursor-rules-creation](mdc:.cursor/rules/cursor-rules-creation.mdc)
- [cursor-rules-location](mdc:.cursor/rules/cursor-rules-location.mdc)

## Updated: 2025-05-03
