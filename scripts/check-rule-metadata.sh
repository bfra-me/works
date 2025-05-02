#!/bin/bash

# Script to inventory all cursor rules and check for metadata sections
# This script helps implement Phase 1.2: Add version control for rules

echo "==== Cursor Rules Metadata Check ===="
echo ""
echo "Checking all .mdc files in .cursor/rules/ for metadata sections..."
echo ""

# Directory containing cursor rules
RULES_DIR=".cursor/rules"

# Counter for stats
TOTAL_RULES=0
RULES_WITH_METADATA=0
RULES_WITHOUT_METADATA=0

# Arrays to store results
rules_with_metadata=()
rules_without_metadata=()

# Check if the rules directory exists
if [ ! -d "$RULES_DIR" ]; then
  echo "Error: $RULES_DIR directory not found!"
  exit 1
fi

# Function to check if a file contains a metadata section
check_metadata() {
  local file=$1
  local filename=$(basename "$file")

  TOTAL_RULES=$((TOTAL_RULES + 1))

  # Check if the file contains a metadata section
  if grep -q "metadata:" "$file"; then
    RULES_WITH_METADATA=$((RULES_WITH_METADATA + 1))
    rules_with_metadata+=("$filename")
    echo "✅ $filename"
  else
    RULES_WITHOUT_METADATA=$((RULES_WITHOUT_METADATA + 1))
    rules_without_metadata+=("$filename")
    echo "❌ $filename"
  fi
}

# Process all .mdc files in the rules directory
echo "Checking individual rules:"
echo "------------------------"
for file in $RULES_DIR/*.mdc; do
  check_metadata "$file"
done

# Check 00-rule-index.mdc separately
if [ -f "$RULES_DIR/00-rule-index.mdc" ]; then
  echo "Note: Found 00-rule-index.mdc (not checking for metadata as it's not a traditional rule)"
fi

# Print summary
echo ""
echo "==== Summary ===="
echo "Total rules: $TOTAL_RULES"
echo "Rules with metadata: $RULES_WITH_METADATA"
echo "Rules without metadata: $RULES_WITHOUT_METADATA"

# List rules without metadata
if [ $RULES_WITHOUT_METADATA -gt 0 ]; then
  echo ""
  echo "Rules missing metadata sections:"
  for rule in "${rules_without_metadata[@]}"; do
    echo "- $rule"
  done
  echo ""
  echo "To add metadata sections, follow the template in docs/templates/version-control-template.md"
fi

echo ""
echo "==== Done ===="
