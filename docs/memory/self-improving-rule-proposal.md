# Self-Improving Cursor Rule Proposal

## Concept: Automatic Memory Management

This proposal outlines a cursor rule that automatically updates memory files and the knowledge graph after any task completion, creating a self-improving repository that maintains comprehensive records of work performed.

## Rule Structure

```markdown
# Auto Memory Manager

<rule>
name: auto_memory_manager
description: Automatically updates memory files and knowledge graph after task completion
filters:
  - type: message
    pattern: "(?i)(task completed|finished implementing|done with|completed task|task is done|fixed issue)"
  - type: content
    pattern: "\\[Status: Completed\\]"

actions:
  - type: suggest
    message: |
      ## Task Completion Detected

      I'll automatically update our memory files and knowledge graph to reflect this completed task.

      ### Memory Update Process

      1. **Extracting Task Information**
         - Task type: ${task_type}
         - Core components affected: ${affected_components}
         - Problem solved: ${problem_description}
         - Solution implemented: ${solution_description}

      2. **Updating Memory Files**
         - docs/memory/workflow-status.md: Task marked complete and moved to history
         - docs/memory/domain-knowledge.md: Adding new insights from this task
         - docs/memory/${task_specific_memory_file}.md: Adding detailed implementation notes

      3. **Knowledge Graph Updates**
         - Creating entities for new components/concepts
         - Adding relationships between entities
         - Recording observations about implementation patterns

      ### Would you like me to update additional memory files or provide more detailed documentation on the implementation?
</rule>
```

## Implementation Strategy

1. **Task Detection Logic**
   - Maintain patterns in the rule to detect both explicit task completion messages and implicit completion indicators
   - Support structured task completion through status changes in markdown documents
   - Detect code commit intentions and task completion contexts

2. **Information Extraction**
   - Analyze the conversation and attached files to extract:
     - Task type (bug fix, feature implementation, configuration change, etc.)
     - Affected components of the codebase
     - Problem description and original context
     - Solution details and implementation approach
     - Related knowledge areas (frameworks, patterns, techniques)

3. **Memory File Updates**
   - Update workflow-status.md with task completion entry
   - Add relevant technical details to domain-knowledge.md
   - Create or update task-specific memory files for implementation patterns
   - Record decisions and caveats for future reference

4. **Knowledge Graph Integration**
   - Create or update entities based on task components
   - Establish relationships between entities reflecting system architecture
   - Add observations to entities with learned insights
   - Document workflows and processes through entity-relationship patterns

## Update Templates

### Workflow Status Update

```markdown
## Current State
- **Current Date**: ${current_date}
- **Completed Task**: ${task_name} (Task ID: ${task_id})
- **Next Task**: ${next_task_name} (Task ID: ${next_task_id})

## Task History
| Task ID | Task Name | Status | Completion Date |
|---------|-----------|--------|----------------|
| ${task_id} | ${task_name} | Completed | ${completion_date} |

## Recent Updates
- ${task_name} completed: ${task_summary} (${completion_date})
```

### Domain Knowledge Update

```markdown
## Implementation Patterns
- **${pattern_name}**: ${pattern_description}
  - **Applied in**: ${task_name}
  - **Context**: ${usage_context}
  - **Benefits**: ${observed_benefits}
  - **Limitations**: ${observed_limitations}

## Technical Decisions
| Decision | Rationale | Date | Alternatives Considered |
|----------|-----------|------|-------------------------|
| ${decision} | ${rationale} | ${decision_date} | ${alternatives} |
```

### Knowledge Graph Updates

```javascript
// Entity creation for components
await graph.createEntities([
  {
    name: "${component_name}",
    entityType: "component",
    observations: ["Implemented/updated in ${task_name}", "${component_description}"]
  }
]);

// Relationship creation
await graph.createRelations([
  {
    from: "${component_name}",
    to: "${related_component}",
    relationType: "${relationship_type}"
  }
]);

// Adding new observations
await graph.addObservations([
  {
    entityName: "${existing_entity}",
    contents: ["New insight from ${task_name}: ${observation}"]
  }
]);
```

## Example Interactions

### Example 1: ESLint Configuration Task

```
User: I've completed implementing the ESLint configuration for TypeScript in Markdown files.

AI: ## Task Completion Detected

I'll automatically update our memory files and knowledge graph to reflect this completed task.

### Memory Update Process

1. **Extracting Task Information**
   - Task type: Configuration enhancement
   - Core components affected: ESLint, TypeScript, Markdown processing
   - Problem solved: TypeScript ESLint parser errors on Markdown code blocks
   - Solution implemented: Disabled type-aware rules for Markdown files

2. **Updating Memory Files**
   - docs/memory/workflow-status.md: Task marked complete and moved to history
   - docs/memory/domain-knowledge.md: Adding insights about TypeScript ESLint limitations
   - docs/memory/eslint-typescript-markdown-issue.md: Added detailed implementation notes

3. **Knowledge Graph Updates**
   - Created entity "TypeScript_ESLint_Markdown_Integration"
   - Added relationship "ESLint_Config" depends_on "TypeScript_Parser"
   - Added observation to "Markdown_Linting" about processor limitations

### Would you like me to update additional memory files or provide more detailed documentation on the implementation?

User: No, that's sufficient. Thanks!

AI: Great! I've completed the following updates:

1. Updated workflow-status.md with task completion:
   - Added task to history with completion date
   - Updated current state with next task

2. Created eslint-typescript-markdown-issue.md with:
   - Detailed issue description
   - Error messages encountered
   - Root cause analysis
   - Solution implementation
   - Caveats and recommendations

3. Added to knowledge graph:
   - New entity for TypeScript ESLint Markdown integration
   - 3 new relationships between linting components
   - 5 observations about handling virtual files in linting
```

### Example 2: UI Component Implementation

```
User: I've finished implementing the new dropdown component with accessibility features.

AI: ## Task Completion Detected

I'll automatically update our memory files and knowledge graph to reflect this completed task.

### Memory Update Process

1. **Extracting Task Information**
   - Task type: Feature implementation
   - Core components affected: UI, Accessibility, Component library
   - Problem solved: Need for accessible dropdown with keyboard navigation
   - Solution implemented: Custom dropdown with ARIA attributes and keyboard handlers

2. **Updating Memory Files**
   - docs/memory/workflow-status.md: Task marked complete and moved to history
   - docs/memory/domain-knowledge.md: Adding insights about accessibility patterns
   - docs/memory/ui-component-patterns.md: Created new file documenting the implementation

3. **Knowledge Graph Updates**
   - Created entity "Accessible_Dropdown_Component"
   - Added relationships to "UI_Component_Library" and "Accessibility_Standards"
   - Recorded implementation patterns as observations

### Would you like me to update additional memory files or provide more detailed documentation on the implementation?

User: Yes, please add details about the keyboard shortcuts implemented.

AI: I've added the following keyboard shortcut documentation to ui-component-patterns.md:

## Keyboard Navigation Patterns
- **Enter/Space**: Toggle dropdown open/close
- **Down Arrow**: Move to next item
- **Up Arrow**: Move to previous item
- **Home/End**: Move to first/last item
- **Escape**: Close dropdown
- **Tab**: Move focus out of component

I've also added these as observations to the "Accessible_Dropdown_Component" entity in the knowledge graph and updated the relationships to show implementation of WCAG 2.1 standards.
```

### Example 3: Database Schema Migration

```
User: I've completed the database schema migration task.

AI: ## Task Completion Detected

I'll automatically update our memory files and knowledge graph to reflect this completed task.

### Memory Update Process

1. **Extracting Task Information**
   - Task type: Infrastructure update
   - Core components affected: Database, ORM models, Data migration
   - Problem solved: Legacy schema incompatibility with new features
   - Solution implemented: Non-destructive schema migration with backward compatibility

2. **Updating Memory Files**
   - docs/memory/workflow-status.md: Task marked complete and moved to history
   - docs/memory/domain-knowledge.md: Adding insights about schema migration patterns
   - docs/memory/database-architecture.md: Updated with new schema details

3. **Knowledge Graph Updates**
   - Updated entity "Database_Schema" with new version
   - Added relationships between new and legacy models
   - Recorded migration patterns and rollback procedures

### Would you like me to update additional memory files or provide more detailed documentation on the implementation?

User: No, that looks good. But please make sure to note the performance considerations.

AI: I've added a new section to database-architecture.md:

## Performance Considerations
- **Index Updates**: New indices on frequently queried columns improve read performance by 30%
- **Query Complexity**: Some legacy queries need rewriting to avoid joins with new tables
- **Migration Duration**: Full migration takes approximately 3.5 minutes on production dataset
- **Cache Invalidation**: Requires manual cache clearing during non-peak hours

I've also added these performance considerations to the knowledge graph as observations on the "Database_Schema" entity and created a new relationship "impacts" with the "System_Performance" entity.
```

## Implementation Plan

To implement this self-improving memory management system:

1. **Phase 1: Rule Creation (Week 1)**
   - Create the auto_memory_manager.mdc rule file
   - Implement basic task detection patterns
   - Set up simple memory file templates
   - Test with common task completion scenarios

2. **Phase 2: Integration with Knowledge Graph (Week 2)**
   - Add Knowledge Graph MCP server integration
   - Implement entity and relationship creation
   - Test entity extraction from task descriptions
   - Validate knowledge persistence across conversations

3. **Phase 3: Smart Context Analysis (Week 3)**
   - Enhance information extraction with NLP techniques
   - Improve component and relationship detection
   - Add support for detecting implementation patterns
   - Implement technical decision capturing

4. **Phase 4: Learning and Improvement (Week 4+)**
   - Add mechanisms for the rule to self-improve
   - Implement pattern learning from successful interactions
   - Create feedback loops for continuous improvement
   - Add support for automated rule enhancement suggestions

## Benefits and Expected Outcomes

1. **Comprehensive Knowledge Retention**
   - No more lost context between tasks and conversations
   - Complete history of technical decisions and rationales
   - Structured knowledge of implementation patterns

2. **Improved Development Efficiency**
   - Faster onboarding for new team members
   - Reduced time spent explaining previous work
   - Easy access to past solutions for similar problems

3. **Self-Improving Documentation**
   - Documentation that grows organically with the project
   - Knowledge that becomes more structured and interconnected over time
   - Automatically maintained record of project evolution

4. **Enhanced AI Assistance**
   - More context-aware responses from AI assistants
   - Better recommendations based on project history
   - Deeper understanding of project architecture and patterns

This self-improving cursor rule will transform your repository into a living knowledge base that continuously refines itself with each completed task, creating a virtuous cycle of knowledge capture and reuse.
