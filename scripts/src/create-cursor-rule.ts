#!/usr/bin/env tsx

/**
 * Create a new cursor rule file with proper frontmatter
 *
 * This script generates a new cursor rule with the correct structure and
 * frontmatter based on command line arguments. It creates the file in the correct location
 * and ensures it follows the standards defined in cursor-rules-creation.mdc.
 */

import {promises as fs} from 'node:fs'
import {join, resolve} from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

// Constants
const RULES_DIR = resolve(process.cwd(), '.cursor/rules')
const DEFAULT_PRIORITY = 'medium'
const DEFAULT_VERSION = '1.0.0'
const DEFAULT_ALWAYS_APPLY = 'false'
const VALID_PRIORITIES = ['high', 'medium', 'low']
const RULE_TEMPLATE = `---
description: {frontmatter_description}
globs: {globs}
alwaysApply: {always_apply}
---

# {title}

<rule>
name: {name}
description: {rule_description}
filters:
  - type: file_path
    pattern: "{file_path_pattern}"
  - type: message
    pattern: "(?i)({name})"

actions:
  - type: suggest
    message: |
      ## {title} Guide

      {rule_description}

      ### Guidelines

      - Guideline 1
      - Guideline 2
      - Guideline 3

      ### Examples

      \`\`\`typescript
      // Example code here
      \`\`\`

examples:
  - input: |
      How do I use {name}?
    output: |
      Here's how to use {name}:

      1. First step
      2. Second step
      3. Third step

metadata:
  priority: {priority}
  version: {version}
  tags:
{tags_yaml}
</rule>
`

interface RuleOptions {
  ruleName: string
  frontmatterDescription: string
  ruleDescription: string
  globPatterns: string
  alwaysApply: string
  priority: string
  version: string
  tags: string[]
  filePathPattern: string
}

/**
 * Convert a kebab-case string to snake_case
 */
function toSnakeCase(name: string): string {
  return name.replaceAll('-', '_')
}

/**
 * Convert a kebab-case string to Title Case
 */
function toTitleCase(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format tags as YAML list items
 */
function formatTagsAsYaml(tags: string[]): string {
  if (!tags.length) {
    return '  - general'
  }

  return tags.map(tag => `  - ${tag}`).join('\n')
}

/**
 * Parse command line arguments and return rule options
 */
function parseRuleOptions(): RuleOptions {
  const args = process.argv.slice(2)

  // Require the rule name as the first argument
  if (args.length === 0) {
    consola.error('Rule name is required as the first argument')
    process.exit(1)
  }

  const ruleName = args[0] ?? ''
  // Normalize the rule name
  const name = ruleName
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')

  // Log if the name was normalized
  if (name !== ruleName) {
    consola.info(`Normalized rule name to: ${name}`)
  }

  // Function to get the value of a flag
  const getOptionValue = (flag: string, defaultValue: string): string => {
    const index = args.indexOf(flag)
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1] || defaultValue
    }
    return defaultValue
  }

  // Get values for all options with defaults
  const frontmatterDescription = getOptionValue(
    '--description',
    `APPLY when WRITING ${toTitleCase(name)} to MAINTAIN consistency`,
  )

  const ruleDescription = getOptionValue(
    '--rule-desc',
    `Guidelines for ${name} to ensure consistency and maintainability`,
  )

  const globPatterns = getOptionValue('--globs', '')
  const alwaysApply = getOptionValue('--always-apply', DEFAULT_ALWAYS_APPLY)

  // Normalize priority
  let priority = getOptionValue('--priority', DEFAULT_PRIORITY).toLowerCase().trim()
  if (!VALID_PRIORITIES.includes(priority)) {
    priority = DEFAULT_PRIORITY
  }

  // Validate version format
  let version = getOptionValue('--version', DEFAULT_VERSION)
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    version = DEFAULT_VERSION
  }

  const tagsInput = getOptionValue('--tags', 'general')
  const tags = tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)

  const filePathPattern = getOptionValue('--file-pattern', '')

  return {
    ruleName: name,
    frontmatterDescription,
    ruleDescription,
    globPatterns,
    alwaysApply,
    priority,
    version,
    tags: tags.length > 0 ? tags : ['general'],
    filePathPattern,
  }
}

/**
 * Create a new cursor rule file
 */
async function createRuleFile(options: RuleOptions): Promise<void> {
  try {
    const {
      ruleName,
      frontmatterDescription,
      ruleDescription,
      globPatterns,
      alwaysApply,
      priority,
      version,
      tags,
      filePathPattern,
    } = options

    const ruleId = toSnakeCase(ruleName)
    const title = toTitleCase(ruleName)

    // Ensure the rules directory exists
    await fs.mkdir(RULES_DIR, {recursive: true})

    // Create file path
    const filePath = join(RULES_DIR, `${ruleName}.mdc`)

    // Check if file already exists
    try {
      await fs.access(filePath)
      consola.error(`Error: Rule file ${filePath} already exists.`)
      process.exit(1)
    } catch {
      // File does not exist, proceed with creation
    }

    // Create file content
    const content = RULE_TEMPLATE.replaceAll('{name}', ruleId)
      .replaceAll('{title}', title)
      .replaceAll('{frontmatter_description}', frontmatterDescription)
      .replaceAll('{rule_description}', ruleDescription)
      .replaceAll('{globs}', globPatterns)
      .replaceAll('{always_apply}', alwaysApply)
      .replaceAll('{priority}', priority)
      .replaceAll('{version}', version)
      .replaceAll('{file_path_pattern}', filePathPattern)
      .replaceAll('{tags_yaml}', formatTagsAsYaml(tags))

    // Create the file
    await fs.writeFile(filePath, content, 'utf8')

    consola.success(`Rule file created: ${filePath}`)
  } catch (error) {
    consola.error(
      'Failed to create cursor rule:',
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  }
}

/**
 * Main function that orchestrates the rule creation process
 */
async function main(): Promise<void> {
  try {
    const options = parseRuleOptions()
    await createRuleFile(options)
  } catch (error) {
    consola.error('Error creating rule:', error)
    process.exit(1)
  }
}

await main()
