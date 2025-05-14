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

## Example Metadata Block

```yaml
metadata:
  priority: high
  version: 1.2
  tags:
    - formatting
    - cursor-rules
    - links
```

## Updating Versions

When updating a rule:

1. Increment the version number based on the nature of the change:
   - Breaking changes: Increment MAJOR version
   - New features: Increment MINOR version
   - Bug fixes/minor updates: Increment PATCH version
2. Update the `version` field in the metadata to match the new version

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
</rule>
```
