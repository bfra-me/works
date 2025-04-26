#!/usr/bin/env bash
set -euo pipefail

# Function to display script usage
function display_usage {
  echo "Usage: $0 <rule-name> \"<rule-description>\" \"<glob-patterns>\""
  echo "Example: $0 typescript-testing \"Guidelines for writing TypeScript tests\" \"*.test.ts, *.spec.ts\""
  exit 1
}

# Check for required arguments
if [ $# -lt 2 ]; then
  display_usage
fi

# Parse arguments
RULE_NAME="$1"
RULE_DESCRIPTION="$2"
GLOB_PATTERNS="${3:-}"  # Optional glob patterns

# Convert kebab-case to snake_case for rule name
RULE_ID=$(echo "$RULE_NAME" | sed 's/-/_/g')

# Ensure .cursor/rules directory exists
mkdir -p .cursor/rules

# Create rule file path
RULE_FILE=".cursor/rules/${RULE_NAME}.mdc"

# Check if file already exists
if [ -f "$RULE_FILE" ]; then
  echo "Error: Rule file $RULE_FILE already exists."
  exit 1
fi

# Create rule file with template
cat > "$RULE_FILE" << EOF
---
description: ${RULE_DESCRIPTION}
globs: ${GLOB_PATTERNS}
alwaysApply: false
---

# ${RULE_NAME^}

<rule>
name: ${RULE_ID}
description: ${RULE_DESCRIPTION}
filters:
  - type: file_extension
    pattern: ""
  - type: file_path
    pattern: ""
  - type: content
    pattern: ""
  - type: message
    pattern: "(?i)(${RULE_NAME})"

actions:
  - type: suggest
    message: |
      ## ${RULE_NAME^} Guide

      Detailed guidance for ${RULE_NAME} goes here...

examples:
  - input: |
      How do I use ${RULE_NAME}?
    output: |
      Here's how to use ${RULE_NAME}:

      1. First step
      2. Second step
      3. Third step
</rule>
EOF

echo "Created cursor rule at $RULE_FILE"
echo "Now edit the file to complete your rule!"
