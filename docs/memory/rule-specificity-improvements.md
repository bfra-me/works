# Rule Specificity Improvements

This document contains the planned improvements for rule specificity as part of Task 2025-05-03-08.

## Priority Rules for Improvement

Based on the 00-rule-index.mdc and examination of several rules, the following high-priority rules have been identified for specificity improvements:

1. **memory-management.mdc** - High priority, always-use rule
2. **user-preferences-awareness.mdc** - High priority, conditional rule
3. **typescript-patterns.mdc** - High priority, auto-attached rule
4. **date-consistency-enforcer.mdc** - Medium priority but critical for system consistency

## Current Issues Identified

### 1. Memory-Management Rule

**Current filters:**
```yaml
filters:
  - type: file_path
    pattern: "docs/memory/.*\\.md$"
  - type: message
    pattern: "(?i)(memory file|context retention|workflow status|project memory)"
  - type: content
    pattern: "(?i)(current state|task history|context|recent updates|command history|memory)"
```

**Issues:**
- `message` pattern is broad and might trigger in unrelated contexts
- `content` pattern includes the generic term "memory" which could cause false positives
- No differentiation between memory file creation, reading, or updating contexts

### 2. User-Preferences-Awareness Rule

**Current filters:**
```yaml
filters:
  - type: message
    pattern: "(?i)(user preferences|coding style|formatting|testing|workflow|documentation|tools)"
```

**Issues:**
- No file_path filter to target preference files
- Generic terms like "testing" and "tools" may cause over-triggering
- No content filter to help refine when the rule is truly relevant

### 3. TypeScript-Patterns Rule

**Current filters:**
```yaml
filters:
  - type: file_extension
    pattern: "\\.ts$|\\.tsx$"
  - type: file_path
    pattern: "tsconfig\\.json$"
  - type: content
    pattern: "import|export|interface|type|class|function|const|let|export\\s+default"
```

**Issues:**
- Content pattern is overly broad and may trigger on any TS file
- No distinction between different types of TypeScript files (tests, configs, implementation)
- May trigger unnecessarily on common syntax elements

### 4. Date-Consistency-Enforcer Rule

**Current filters:**
```yaml
filters:
  - type: file_path
    pattern: "docs/[memory|plans|tasks|templates]/.*\\.md$"
  - type: file_path
    pattern: "\\.mdc$"
  - type: message
    pattern: "(?i)(update date|timestamp|current date|completion date|task id)"
  - type: content
    pattern: "Updated: |Completion Date|Current Date|Task ID: "
```

**Issues:**
- First file_path pattern uses incorrect regex syntax ([memory|plans|tasks|templates] is a character class, not alternation)
- Overlapping filters may cause confusion
- Message pattern might trigger in unrelated date contexts

## Planned Improvements

### 1. Memory-Management Rule

```yaml
filters:
  - type: file_path
    pattern: "docs/memory/.*\\.md$"
  - type: message
    pattern: "(?i)(memory file|context retention|workflow status|project memory|remember across sessions)"
  - type: content
    pattern: "(?i)(\\b(current state|task history|context|recent updates|command history)\\b|\\bmemory\\b file)"
```

**Improvements:**
- Added word boundaries `\b` to content pattern to ensure whole words are matched
- Added "remember across sessions" to message pattern for better recall
- Changed "memory" to "memory file" with word boundaries to reduce false positives
- Maintain high priority status as this is a critical system rule

### 2. User-Preferences-Awareness Rule

```yaml
filters:
  - type: file_path
    pattern: "docs/memory/user-preferences\\.md$"
  - type: message
    pattern: "(?i)(user preferences|coding style preferences|code formatting|\\bhow (I|you|we) (like|prefer|want)\\b|user settings)"
  - type: content
    pattern: "(?i)(preferences|coding style|formatting standards|naming conventions)"
```

**Improvements:**
- Added file_path filter to target the user preferences memory file
- Refined message pattern with more specific matching including common preference questions
- Added content filter to better identify preference-related discussions
- Added semantic phrases that indicate preference questions

### 3. TypeScript-Patterns Rule

```yaml
filters:
  - type: file_extension
    pattern: "\\.tsx?$"
  - type: file_path
    pattern: "tsconfig(\\.\\w+)?\\.json$"
  - type: content
    pattern: "(?i)(interface\\s+\\w+|type\\s+\\w+\\s*=|class\\s+\\w+|export\\s+(default\\s+)?function|import\\s+\\{)"
```

**Improvements:**
- Simplified file_extension pattern using the `?` quantifier
- Improved file_path pattern to match all tsconfig variants (base, build, etc.)
- Made content pattern more specific to match actual TypeScript patterns, not just keywords
- Used word boundaries and structural elements to reduce false positives

### 4. Date-Consistency-Enforcer Rule

```yaml
filters:
  - type: file_path
    pattern: "docs/(memory|plans|tasks|templates)/.*\\.md$"
  - type: file_path
    pattern: "\\.mdc$"
  - type: message
    pattern: "(?i)(\\b(update|add|change|fix)\\s+(the\\s+)?(date|timestamp)\\b|\\bcurrent date\\b|\\bcompletion date\\b|\\btask id\\b)"
  - type: content
    pattern: "(?i)(Updated:\\s*\\d|Completion Date:\\s*\\d|Current Date:\\s*\\d|Task ID:\\s*\\d)"
```

**Improvements:**
- Fixed file_path pattern to use proper alternation syntax with parentheses
- Added word boundaries and structure to the message pattern
- Made content pattern more specific by requiring numeric characters after the key phrases
- Added specific action verbs combined with date-related terms

## Example Improvements

In addition to filter refinements, we'll enhance the examples section in each rule to include both triggering and non-triggering examples:

### Memory-Management Example Improvements:

```yaml
examples:
  - input: |
      How do I update the workflow status memory file?
    output: |
      [Example of rule triggering correctly]

  - input: |
      I need to memorize this API endpoint.
    output: |
      [Example where rule should NOT trigger - to demonstrate specificity]
```

## Implementation Plan

1. Create backup copies of all rules before modification
2. Implement changes to the four high-priority rules first
3. Test each rule with various scenarios to ensure proper activation
4. Document the improvements and their impact
5. Apply similar patterns to other rules based on these lessons
6. Update examples in all modified rules
7. Update the rule versions and metadata

## Expected Outcomes

1. More targeted rule activation
2. Reduced noise from irrelevant rule suggestions
3. Better user experience with contextually appropriate guidance
4. Clearer documentation of when and why rules should trigger
5. Improved maintainability of the rule system overall

## Updated: 2025-05-05
