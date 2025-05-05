# AI-Assisted Agile Workflow Guide

This guide explains how to use our AI-assisted agile workflow for implementing improvements to projects. The workflow leverages Cursor AI agents and a structured document system to track features, plans, and tasks.

## Overview of the Workflow

Our AI-assisted agile workflow combines traditional agile methodologies with AI automation to streamline development processes. The workflow consists of:

1. **Capturing Features** in a central reference document
2. **Creating Plan Documents** that outline comprehensive implementation approaches
3. **Generating Task Documents** from plans with AI assistance
4. **Tracking Progress** with AI-generated reports
5. **Updating Status** automatically as tasks are completed

This workflow is guided by a specialized Cursor rule (`ai-agile-workflow.mdc`) that provides contextual assistance when working with these documents.

## Document Structure

The workflow uses three primary document types:

### 1. Central Reference Document (`docs/features.md`)

This document tracks all features for improving the project, including:
- Description of each feature
- Current implementation status
- Links to related plan documents
- Priority levels
- Creation and update timestamps

### 2. Plan Documents (`docs/plans/*.md`)

Each plan document provides a comprehensive implementation approach for a specific feature, including:
- Overview and goals
- Success criteria
- Implementation phases
- Detailed tasks with complexity and dependencies
- Timeline estimates
- Required resources

### 3. Task Documents (`docs/tasks/*.md`)

Task documents provide detailed information about individual work items:
- Unique task ID
- Description and acceptance criteria
- Dependencies on other tasks
- Complexity and effort estimates
- Current status and assignee
- Implementation notes

## Workflow Process

### Step 1: Capture Features

1. Open `docs/features.md`
2. Add new features with the following structure:
   ```markdown
   ### Feature X: [Title]

   - **Description**: Brief description
   - **Status**: [Not Started]
   - **Plan Document**: Not created yet
   - **Priority**: [High | Medium | Low]
   - **Created**: YYYY-MM-DD
   - **Updated**: YYYY-MM-DD
   ```

### Step 2: Create Plan Documents

1. For high-priority features, create a plan document in `docs/plans/`
2. Use the following prompt with the AI:
   ```
   Create a plan document for implementing [feature title]
   ```
3. The AI will generate a structured plan based on the feature
4. Review and refine the plan as needed

### Step 3: Generate Task Documents

1. Open the plan document
2. Use the following prompt with the AI:
   ```
   Generate task documents from this plan
   ```
3. The AI will extract tasks from the plan and create individual task documents
4. Review the generated tasks and make adjustments as needed

### Step 4: Execute Tasks

1. Prioritize tasks based on dependencies and complexity
2. Assign tasks to team members
3. Update task status as work progresses:
   - [Not Started]
   - [In Progress]
   - [Completed]
4. When marking a task as completed:
   - Move the task file to `docs/tasks/done/` directory
   - The auto-memory-manager rule will automatically activate to:
     - Update memory files with implementation details
     - Create knowledge graph entries for new components
     - Document technical decisions and rationales
     - Maintain comprehensive records of completed work

### Step 5: Track Progress

1. Use the following prompt to generate progress reports:
   ```
   Generate progress report for [feature title]
   ```
2. The AI will analyze all related tasks and calculate completion percentage
3. Use progress reports in team meetings and status updates

### Step 6: Update Feature Status

1. When all tasks for a feature are completed, use:
   ```
   Update feature status based on completed tasks
   ```
2. The AI will update the status in the central reference document
3. Completed features will be moved to the "Completed Features" section

## AI Commands Reference

The following commands can be used with the AI assistant:

| Command | Description |
|---------|-------------|
| `Create a plan document for [feature]` | Generates a new plan document |
| `Generate task documents from this plan` | Creates task documents from the current plan |
| `Update feature status based on completed tasks` | Updates the central document |
| `Generate progress report for [feature]` | Creates a status report |
| `Suggest next tasks to work on` | Recommends priority tasks |
| `Show all blocked tasks` | Lists tasks with unmet dependencies |
| `Mark task [task-id] as completed` | Moves task to done directory and activates auto-memory-manager |
| `Update memory records for [task/component]` | Manually triggers memory and knowledge graph updates |

## Integration with Cursor Rules

This workflow is deeply integrated with the Cursor rules system:

1. The `ai-agile-workflow.mdc` rule provides contextual guidance
2. The workflow automatically recognizes relevant files
3. The AI assistant understands the document structure and relationships
4. Task generation is automated based on plan documents
5. Status updates propagate through the system
6. The `auto-memory-manager.mdc` rule automatically activates after task completion to:
   - Maintain comprehensive memory records
   - Document implementation details
   - Update knowledge graph with new components, relationships, and observations
   - Preserve critical decision context for future reference

## Example Workflow

1. We identified three features for improving Cursor rules
2. Created a plan document for the "Hierarchical Rule Structure" feature
3. Generated task documents for the first phase of implementation
4. As tasks are completed, we'll update their status
5. The AI will help us track progress and update the central document

## Getting Started

To start using this workflow:

1. Ensure you have the required directory structure:
   ```
   docs/
   ├── features.md
   ├── plans/
   └── tasks/
   ```

2. Open `docs/features.md` to view current features

3. For any feature without a plan, ask the AI to create one:
   ```
   Create a plan document for Feature 2: Consolidate Overlapping Rules
   ```

4. After reviewing the plan, generate tasks:
   ```
   Generate task documents from this plan
   ```

5. Begin working on the generated tasks
