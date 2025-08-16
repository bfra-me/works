/**
 * Confirmation steps and summary display before project creation
 */

import type {ConfirmationSummary, ProjectCustomization, TemplateSelection} from '../types.js'
import process from 'node:process'
import {cancel, confirm, isCancel, note} from '@clack/prompts'

interface ConfirmationInput {
  projectName: string
  template: TemplateSelection
  customization: ProjectCustomization
}

/**
 * Display project summary and confirm creation
 */
export async function confirmationStep(input: ConfirmationInput): Promise<boolean> {
  const {projectName, template, customization} = input

  // Build summary
  const summary = buildProjectSummary({
    projectName,
    template,
    customization,
  })

  // Display summary
  note(summary, '📋 Project Summary')

  // Confirm creation
  const confirmResult = await confirm({
    message: '🚀 Create this project?',
    initialValue: true,
  })

  if (isCancel(confirmResult)) {
    cancel('Project creation cancelled')
    process.exit(0)
  }

  return confirmResult
}

/**
 * Build formatted project summary
 */
function buildProjectSummary(summary: ConfirmationSummary): string {
  const {projectName, template, customization} = summary

  let output = `📦 Project: ${projectName}\n`
  output += `📋 Template: ${template.metadata.name} (${template.type})\n`

  if (template.metadata.description) {
    output += `📝 Description: ${template.metadata.description}\n`
  }

  if (customization.description != null && customization.description.trim().length > 0) {
    output += `📄 Project Description: ${customization.description}\n`
  }

  if (customization.author != null && customization.author.trim().length > 0) {
    output += `👤 Author: ${customization.author}\n`
  }

  if (customization.version != null && customization.version.trim().length > 0) {
    output += `🏷️  Version: ${customization.version}\n`
  }

  if (customization.packageManager) {
    output += `📦 Package Manager: ${customization.packageManager}\n`
  }

  if (customization.outputDir != null && customization.outputDir.trim().length > 0) {
    output += `📁 Output Directory: ${customization.outputDir}\n`
  }

  if (customization.features.length > 0) {
    output += `🔧 Features: ${customization.features.join(', ')}\n`
  }

  // Template source details
  if (template.type === 'github') {
    output += `🔗 Source: GitHub (${template.location})`
    if (template.ref != null && template.ref.trim().length > 0) {
      output += ` @ ${template.ref}`
    }
    output += '\n'
  } else if (template.type === 'url') {
    output += `🔗 Source: URL (${template.location})\n`
  } else if (template.type === 'local') {
    output += `🔗 Source: Local (${template.location})\n`
  } else {
    output += `🔗 Source: Built-in template\n`
  }

  return output.trim()
}

/**
 * Show modification confirmation for existing projects
 */
export async function confirmModification(
  projectPath: string,
  modifications: string[],
): Promise<boolean> {
  let summary = `📁 Project: ${projectPath}\n`
  summary += `🔧 Modifications:\n`

  for (const modification of modifications) {
    summary += `  • ${modification}\n`
  }

  note(summary.trim(), '⚠️ Project Modification')

  const confirmResult = await confirm({
    message: '⚠️ Modify existing project?',
    initialValue: false,
  })

  if (isCancel(confirmResult)) {
    cancel('Project modification cancelled')
    process.exit(0)
  }

  return confirmResult
}

/**
 * Show feature addition confirmation
 */
export async function confirmFeatureAddition(
  projectPath: string,
  feature: string,
  dependencies: string[],
  files: string[],
): Promise<boolean> {
  let summary = `📁 Project: ${projectPath}\n`
  summary += `🔧 Feature: ${feature}\n`

  if (dependencies.length > 0) {
    summary += `📦 Dependencies to add:\n`
    for (const dep of dependencies) {
      summary += `  • ${dep}\n`
    }
  }

  if (files.length > 0) {
    summary += `📄 Files to create/modify:\n`
    for (const file of files) {
      summary += `  • ${file}\n`
    }
  }

  note(summary.trim(), '➕ Add Feature')

  const confirmResult = await confirm({
    message: `➕ Add ${feature} to your project?`,
    initialValue: true,
  })

  if (isCancel(confirmResult)) {
    cancel('Feature addition cancelled')
    process.exit(0)
  }

  return confirmResult
}
