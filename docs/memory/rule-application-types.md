# Rule Application Types

## Overview

Cursor rules can be activated in different ways depending on their purpose and intended usage. This document outlines the four primary rule application types and provides guidelines for choosing the most appropriate type for your specific use case.

Each application type has distinct characteristics, configuration requirements, and ideal use cases. Understanding these differences will help you create more effective and contextually relevant rules that are activated at the right time and in the right context.

## Rule Application Types

### 1. Auto-Attached Rules

#### Definition
Auto-attached rules are automatically activated when files matching specific patterns (defined by glob patterns) are opened in the editor. These rules provide contextual guidance specifically relevant to certain file types or content patterns.

#### Configuration
```yaml
---
description: ACTION when TRIGGER to OUTCOME
globs: *.ts, *.tsx, **/components/*.jsx
alwaysApply: false
---
```

Key configuration points:
- `alwaysApply` must be set to `false`
- `globs` must contain specific patterns that match the target files
- Multiple patterns should be comma-separated

#### When to Use
- Language-specific coding standards or patterns
- File-type specific guidance (e.g., configuration files, tests)
- Component-specific best practices
- Framework-specific recommendations

#### Example Use Cases
- TypeScript patterns rule that activates for `.ts` and `.tsx` files
- ESLint configuration guidance for `.eslintrc.*` files
- Component structure guidelines for files in `components/` directories
- Test-writing patterns for files matching `*.test.*` patterns

#### Example Rule
```markdown
# TypeScript Patterns

---
description: APPLY when WRITING TypeScript to MAINTAIN code quality standards
globs: *.ts, *.tsx
alwaysApply: false
---

<rule>
name: typescript_patterns
description: Best practices for TypeScript code organization and patterns
...
</rule>
```

#### Best Practices
- Use specific glob patterns to target only relevant files
- Consider directory-specific patterns for contextual guidance
- Balance specificity with usefulness (too specific = rarely triggered)
- Test your glob patterns with various file paths to ensure proper activation

#### Potential Pitfalls
- Too broad glob patterns may cause the rule to be triggered inappropriately
- Too specific patterns may cause the rule to be missed when it would be helpful
- Multiple auto-attached rules for the same file types may create noise
- Forgetting to set `alwaysApply: false` will change the intended behavior

### 2. Agent-Requested Rules

#### Definition
Agent-requested rules are activated when the AI assistant determines they are relevant to the conversation, based on content and context matching. These rules are discovered by the AI through their descriptive names and descriptions.

#### Configuration
```yaml
---
description: ACTION when TRIGGER to OUTCOME
alwaysApply: false
---
```

Key configuration points:
- `alwaysApply` must be set to `false`
- `globs` may be omitted if the rule is only triggered by description content
- The rule description must be detailed and discoverable

#### When to Use
- General workflows or processes not tied to specific file types
- Conceptual guidance that applies across multiple contexts
- Specialized knowledge that may be needed in various situations
- Rules that are primarily triggered through conversational context

#### Example Use Cases
- Development workflow guidelines
- Repository structure explanations
- Debugging and troubleshooting guides
- API design standards across multiple languages

#### Example Rule
```markdown
# Repository Analysis

---
description: UTILIZE when ANALYZING repository structure to LOCATE specific code
alwaysApply: false
---

<rule>
name: repo_analyzer
description: Guidelines for effectively analyzing the repository structure
...
</rule>
```

#### Best Practices
- Use a highly descriptive rule name that clearly indicates purpose
- Create a clear and specific description with the ACTION-TRIGGER-OUTCOME pattern
- Include common keywords in your rule content to increase discovery
- Test with different conversational queries to ensure the rule is discoverable

#### Potential Pitfalls
- Vague descriptions may cause the rule to be missed when relevant
- Very similar descriptions across multiple rules may create confusion
- Lack of clear identification patterns in content may reduce discoverability
- Overreliance on specific phrasing in conversations may limit usefulness

### 3. Always-Applied Rules

#### Definition
Always-applied rules are active in all conversations, regardless of context or file types. These rules provide universal guidance that should be considered in all interactions.

#### Configuration
```yaml
---
description: ACTION when TRIGGER to OUTCOME
alwaysApply: true
---
```

Key configuration points:
- `alwaysApply` must be set to `true`
- `globs` can be omitted as the rule applies universally
- Keep the rule concise and focused on truly universal concerns

#### When to Use
- Critical standards that should always be followed
- Universal patterns applicable across all contexts
- Core stylistic or architectural guidance
- Cross-cutting concerns affecting all development activities

#### Example Use Cases
- Cross-reference syntax standards for all documentation
- Critical security guidelines that apply to all code
- Code of conduct guidelines for all interactions
- Universal accessibility standards

#### Example Rule
```markdown
# Cross-Reference Syntax

---
description: USE when LINKING between files to ENSURE proper navigation
alwaysApply: true
---

<rule>
name: cross_reference_syntax
description: Proper syntax for links and references in all documentation
...
</rule>
```

#### Best Practices
- Keep always-applied rules concise and focused on universal concerns
- Use sparingly to avoid overwhelming conversations with irrelevant guidance
- Ensure the guidance is generally applicable across all contexts
- Consider whether the rule truly needs to be applied in every conversation

#### Potential Pitfalls
- Too many always-applied rules creates noise and reduces utility
- Overly specific content in an always-applied rule may be irrelevant in many contexts
- Performance impact when many always-applied rules are active
- May override more specific contextual rules in some cases

### 4. Manual Rules

#### Definition
Manual rules are explicitly included in the conversation by the user or through direct referencing. These rules are not automatically applied but must be specifically requested when needed.

#### Configuration
No special configuration is required. Manual rules can have simple metadata:

```yaml
---
description: ACTION when TRIGGER to OUTCOME
---
```

Key configuration points:
- No special frontmatter requirements
- May omit both `alwaysApply` and `globs`
- Should still have a clear description for reference

#### When to Use
- Highly specialized guidance needed only in specific circumstances
- One-off or rarely used guidance
- Complex or lengthy rules that would create noise if auto-attached
- Rules that would be disruptive if triggered automatically

#### Example Use Cases
- Specialized debugging procedures for rare issues
- Detailed migration guides for specific versions
- Complex architectural patterns used only in certain components
- Compliance requirements for specific types of features

#### Example Rule
```markdown
# Database Migration Guide

---
description: FOLLOW when MIGRATING database schemas to PREVENT data loss
---

<rule>
name: database_migration_guide
description: Step-by-step guidance for safe database schema migrations
...
</rule>
```

#### Best Practices
- Create descriptive file names that clearly indicate the rule's purpose
- Include clear instructions in the rule about when it should be used
- Consider grouping related manual rules for easier discovery
- Document the existence of manual rules in appropriate contexts

#### Potential Pitfalls
- Manual rules may be forgotten if not well-documented
- Users may not know to request the rule when it would be helpful
- Without proper organization, manual rules may become difficult to discover
- Manual rules may become outdated if not regularly reviewed and updated

## Comparison: Rule Application Types

| Feature | Auto-Attached | Agent-Requested | Always-Applied | Manual |
|---------|---------------|-----------------|----------------|--------|
| **Activation** | When matching files are opened | When relevant to conversation | In all conversations | When explicitly requested |
| **`alwaysApply`** | `false` | `false` | `true` | Any |
| **`globs`** | Required | Optional | Optional | Optional |
| **Use Case** | File-specific guidance | Context-specific guidance | Universal guidance | Specialized guidance |
| **Discovery** | Automatic by file type | AI detection by context | Always present | User must know to ask |
| **Visibility** | High for matching files | Medium, depends on context | Highest (all contexts) | Lowest (manual only) |
| **Noise Potential** | Medium | Low-Medium | Highest | Lowest |
| **Priority** | Medium | Medium | High | Low |

## Decision Flow Chart

Use this flow chart to determine the most appropriate rule application type:

```
Is the rule essential for ALL conversations?
├── Yes → Always-Applied Rule
└── No → Is the rule specific to certain file types?
    ├── Yes → Auto-Attached Rule
    └── No → Is the rule applicable in predictable conversational contexts?
        ├── Yes → Agent-Requested Rule
        └── No → Manual Rule
```

Additional considerations:
1. **Frequency of use**: High frequency = Auto-Attached or Always-Applied
2. **Specificity**: Highly specific = Auto-Attached or Manual
3. **Complexity**: Very complex or lengthy = Manual or Agent-Requested
4. **Disruption potential**: High disruption = Manual only

## Guidelines for Combining Application Methods

In some cases, you may want to combine multiple application methods for a single rule:

### Auto-Attached + Agent-Requested

```yaml
---
description: IMPLEMENT when CONFIGURING TypeScript to OPTIMIZE type safety
globs: *.ts, *.tsx, tsconfig.json
alwaysApply: false
---
```

This approach:
- Automatically attaches for TypeScript files and configuration
- Can be discovered by the AI in TypeScript-related conversations
- Provides flexibility while maintaining specificity

**Best for**: Rules that are primarily file-type specific but may also be relevant in related discussions.

### Always-Applied + Enhanced Discoverability

```yaml
---
description: FOLLOW when WRITING documentation to ENSURE clarity and consistency
alwaysApply: true
---
```

With content designed for enhanced discovery in related contexts.

This approach:
- Ensures the rule is always available
- Adds content patterns that make it more likely to be referenced in relevant contexts
- Provides universal guidance with contextual emphasis

**Best for**: Critical rules that should always apply but may need special emphasis in certain contexts.

### Manual + Enhanced Discoverability

```yaml
---
description: APPLY when DEBUGGING performance issues to IDENTIFY bottlenecks
---
```

With descriptive content designed for AI discovery when relevant.

This approach:
- Keeps the rule manual to prevent unnecessary activation
- Makes the rule discoverable through AI suggestions in relevant conversations
- Provides specialized guidance with opt-in application

**Best for**: Complex or specialized rules that could be disruptive if automatically triggered.

## Common Mistakes to Avoid

1. **Over-triggering**: Setting too many rules as always-applied
   - **Solution**: Reserve always-applied for truly universal concerns

2. **Under-triggering**: Using manual rules for frequently needed guidance
   - **Solution**: Consider auto-attached or agent-requested for common needs

3. **Globe Pattern Issues**: Too broad or too narrow glob patterns
   - **Solution**: Test patterns against actual repository files, refine as needed

4. **Inconsistent Configuration**: Mixing application types incorrectly
   - **Solution**: Follow the configuration guidelines for each type

5. **Poor Discoverability**: Vague descriptions or names
   - **Solution**: Use clear, specific descriptions with the ACTION-TRIGGER-OUTCOME pattern

6. **Redundant Rules**: Multiple rules covering the same scenarios
   - **Solution**: Consolidate related guidance into fewer, more comprehensive rules

7. **Neglecting Updates**: Not updating application types as usage patterns change
   - **Solution**: Regularly review and adjust application methods based on actual usage

## Best Practices Summary

1. **Start Restrictive**: Begin with more restrictive application (manual) for new rules and expand as proven useful
2. **Monitor Usage**: Observe how rules are used and adjust application types accordingly
3. **Get Feedback**: Collect user feedback on rule triggering appropriateness
4. **Balance Coverage**: Ensure important areas have rules without overwhelming users
5. **Test Thoroughly**: Test rules in various contexts to verify appropriate activation
6. **Document Clearly**: Make manual rules discoverable through clear documentation
7. **Review Regularly**: Periodically review all rules for appropriate application types
8. **Be Intentional**: Choose application types deliberately, not arbitrarily

## Conclusion

Selecting the right application type is crucial for creating effective Cursor rules. By understanding the characteristics, use cases, and best practices for each type, you can ensure your rules provide valuable guidance at the right time and in the right context, enhancing the development experience without creating unnecessary noise.

Remember that rules are contextual documents for AI assistants, not software requiring complex activation logic. Focus on creating clear, helpful guidance and selecting the appropriate application method to deliver that guidance effectively.

## Related Resources

- [Cursor Rules Creation](mdc:.cursor/rules/cursor-rules-creation.mdc) - Comprehensive guide for creating Cursor rules
- [Cursor Rules Location](mdc:.cursor/rules/cursor-rules-location.mdc) - Standards for placing rule files correctly
- [Rule Index](mdc:.cursor/rules/00-rule-index.mdc) - Complete overview of all Cursor rules by category

## Updated: 2025-05-04
