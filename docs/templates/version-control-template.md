# Version Control Template for Cursor Rules

This template provides the standard format for versioning and metadata in Cursor rules.

## Metadata Block

Every Cursor rule should include a metadata block at the end of the `<rule>` element with the following structure:

```yaml
metadata:
  priority: [high|medium|low]
  version: [MAJOR.MINOR.PATCH]
  tags:
    - [tag1]
    - [tag2]
    - [tag3]
  changelog:
    - version: [MAJOR.MINOR.PATCH]
      changes:
        - [Change description 1]
        - [Change description 2]
    - version: [PREVIOUS_VERSION]
      changes:
        - [Change description 1]
        - [Change description 2]
```

## Field Guidelines

### Priority

Indicates the importance of the rule:

- `high`: Critical rules that impact core workflows or standards
- `medium`: Important rules but not critical to core workflows
- `low`: Nice-to-have rules or minor guidance

### Version

Follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to rule behavior or format
- **MINOR**: New functionality added in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes or minor content updates

### Tags

List of categories that describe the rule's purpose. Common tags include:

- `workflow`
- `formatting`
- `architecture`
- `testing`
- `cursor-rules`
- `documentation`
- `monorepo`
- `typescript`
- `configuration`
- `memory`

### Changelog

Documents the history of changes to the rule:

- Each entry includes a version number and a list of changes
- Most recent versions should appear first
- Initial versions should be listed as version 1.0

## Example Metadata Block

```yaml
metadata:
  priority: high
  version: 1.2
  tags:
    - formatting
    - cursor-rules
    - links
  changelog:
    - version: 1.2
      changes:
        - Added guidance for metadata sections
        - Updated examples with better formatting
    - version: 1.1
      changes:
        - Added support for cross-references
        - Fixed incorrect examples
    - version: 1.0
      changes:
        - Initial version
```

## Updating Versions

When updating a rule:

1. Increment the version number based on the nature of the change:
   - Breaking changes: Increment MAJOR version
   - New features: Increment MINOR version
   - Bug fixes/minor updates: Increment PATCH version

2. Add a new entry to the changelog with:
   - The new version number
   - A list of specific changes made

3. Move the changelog entry for the new version to the top of the list

4. Update the `version` field in the metadata to match the new version

## Implementation in Rules

The metadata block should be placed at the very end of the `<rule>` element, after examples and before the closing `</rule>` tag:

```markdown
# Rule Title

<rule>
name: rule_name
description: Rule description

filters:
  - type: file_extension
    pattern: "\\.ext$"

actions:
  - type: suggest
    message: |
      Rule content...

examples:
  - input: |
      Example input
    output: |
      Example output

metadata:
  priority: high
  version: 1.0
  tags:
    - example-tag
  changelog:
    - version: 1.0
      changes:
        - Initial version
</rule>
```
