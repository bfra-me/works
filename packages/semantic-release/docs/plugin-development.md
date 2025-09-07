# Plugin Development Tutorial

A comprehensive guide to developing semantic-release plugins with TypeScript support using the `@bfra.me/semantic-release` toolkit.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Understanding Plugin Lifecycle](#understanding-plugin-lifecycle)
- [Development Environment Setup](#development-environment-setup)
- [Your First Plugin](#your-first-plugin)
- [Using the Template Generator](#using-the-template-generator)
- [Plugin Testing](#plugin-testing)
- [Advanced Plugin Patterns](#advanced-plugin-patterns)
- [Configuration and Validation](#configuration-and-validation)
- [Plugin Registry Integration](#plugin-registry-integration)
- [Publishing and Distribution](#publishing-and-distribution)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The `@bfra.me/semantic-release` package provides a comprehensive toolkit for developing semantic-release plugins with full TypeScript support. This tutorial walks you through the entire plugin development process, from basic concepts to advanced patterns.

### What You'll Learn

- How to create type-safe semantic-release plugins
- Understanding the plugin lifecycle and context objects
- Using the built-in testing utilities and template generators
- Implementing configuration validation and error handling
- Publishing and distributing your plugins
- Advanced patterns for complex plugin scenarios

### Prerequisites

- Basic understanding of semantic-release concepts
- Familiarity with TypeScript and Node.js
- Knowledge of npm package development

## Getting Started

### Installation

First, install the toolkit in your plugin project:

```bash
npm install @bfra.me/semantic-release
# or
yarn add @bfra.me/semantic-release
# or
pnpm add @bfra.me/semantic-release
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes proper module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "node16",
    "module": "node16",
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Understanding Plugin Lifecycle

Semantic-release executes plugins through eight lifecycle hooks. Your plugin can implement any subset of these hooks:

### 1. verifyConditions

Validates plugin configuration and environment setup.

```typescript
import type { VerifyConditionsHook } from '@bfra.me/semantic-release/plugins'

const verifyConditions: VerifyConditionsHook = async (pluginConfig, context) => {
  // Validate environment variables, API keys, file permissions, etc.
  if (!process.env.MY_API_KEY) {
    throw new Error('MY_API_KEY environment variable is required')
  }
}
```

### 2. analyzeCommits

Determines the release type based on commit messages.

```typescript
import type { AnalyzeCommitsHook } from '@bfra.me/semantic-release/plugins'

const analyzeCommits: AnalyzeCommitsHook = async (pluginConfig, context) => {
  const { commits } = context

  // Analyze commits and return release type
  const hasBreaking = commits.some(commit => commit.message.includes('BREAKING:'))
  const hasFeatures = commits.some(commit => commit.message.startsWith('feat:'))

  if (hasBreaking) return 'major'
  if (hasFeatures) return 'minor'
  return 'patch'
}
```

### 3. verifyRelease

Validates the determined release before proceeding.

```typescript
import type { VerifyReleaseHook } from '@bfra.me/semantic-release/plugins'

const verifyRelease: VerifyReleaseHook = async (pluginConfig, context) => {
  const { nextRelease } = context

  // Perform pre-release validation
  if (nextRelease.type === 'major' && !context.branch.main) {
    throw new Error('Major releases can only be made from main branch')
  }
}
```

### 4. generateNotes

Creates release notes for the version.

```typescript
import type { GenerateNotesHook } from '@bfra.me/semantic-release/plugins'

const generateNotes: GenerateNotesHook = async (pluginConfig, context) => {
  const { commits, nextRelease } = context

  const features = commits.filter(c => c.message.startsWith('feat:'))
  const fixes = commits.filter(c => c.message.startsWith('fix:'))

  let notes = `# ${nextRelease.version}\n\n`

  if (features.length > 0) {
    notes += '## Features\n\n'
    features.forEach(commit => {
      notes += `- ${commit.message.replace(/^feat:\s*/, '')}\n`
    })
    notes += '\n'
  }

  if (fixes.length > 0) {
    notes += '## Bug Fixes\n\n'
    fixes.forEach(commit => {
      notes += `- ${commit.message.replace(/^fix:\s*/, '')}\n`
    })
  }

  return notes
}
```

### 5. prepare

Prepares files for the release (update version, create changelog, etc.).

```typescript
import type { PrepareHook } from '@bfra.me/semantic-release/plugins'
import { writeFile } from 'fs/promises'

const prepare: PrepareHook = async (pluginConfig, context) => {
  const { nextRelease, notes } = context

  // Update changelog
  const changelog = `# Changelog\n\n## ${nextRelease.version}\n\n${notes}\n`
  await writeFile('CHANGELOG.md', changelog)

  // Update version in custom files
  await updateVersionInFiles(nextRelease.version)

```javascript
}
```

### 6. publish

Publishes the release to registries, repositories, or other platforms.

```typescript
import type { PublishHook } from '@bfra.me/semantic-release/plugins'

const publish: PublishHook = async (pluginConfig, context) => {
  const { nextRelease, logger } = context

  // Publish to custom platform
  const result = await publishToCustomPlatform(nextRelease)

  logger.info(`Published ${nextRelease.version} to custom platform`)

  return {
    name: 'Custom Platform Release',
    url: result.url
  }
}
```

### 7. success

Called after successful release for notifications or cleanup.

```typescript
import type { SuccessHook } from '@bfra.me/semantic-release/plugins'

const success: SuccessHook = async (pluginConfig, context) => {
  const { releases, logger } = context

  // Send success notifications
  await sendSlackNotification(`✅ Release ${releases[0].version} published successfully!`)
  logger.info('Success notification sent')

```typescript
}
```

### 8. fail

Called when the release process fails.

```typescript
import type { FailHook } from '@bfra.me/semantic-release/plugins'

const fail: FailHook = async (pluginConfig, context) => {
  const { errors, logger } = context

  // Send failure notifications
  await sendSlackNotification(`❌ Release failed: ${errors[0].message}`)
  logger.error('Failure notification sent')

```bash
}
```

## Development Environment Setup

### Project Structure

Create a standard npm package structure for your plugin:

```text
my-semantic-release-plugin/
├── src/
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── test/
│   ├── index.test.ts
│   └── fixtures/
├── package.json
├── tsconfig.json
└── README.md
```

### Initial Package Configuration

Set up your `package.json` with proper semantic-release plugin conventions:

```json
{
  "name": "semantic-release-my-plugin",
  "version": "1.0.0",
  "description": "A semantic-release plugin for...",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "files": ["lib"],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "prepare": "npm run build"
  },
  "keywords": ["semantic-release", "plugin"],
  "dependencies": {
    "@bfra.me/semantic-release": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "semantic-release": ">=20.0.0"
  }
}
```

## Your First Plugin

Let's create a simple plugin that adds custom metadata to releases.

### Step 1: Define Plugin Interface

Create `src/types.ts`:

```typescript
export interface MyPluginConfig {
  /**
   * Custom metadata to add to releases.
   */
  metadata?: Record<string, unknown>

  /**
   * Whether to include build information.
   */
  includeBuildInfo?: boolean

  /**
   * Custom format for release notes.
   */
  notesFormat?: 'markdown' | 'plain' | 'html'
}
```

### Step 2: Implement Plugin Logic

Create `src/index.ts`:

```typescript
import type {
  VerifyConditionsHook,
  GenerateNotesHook,
  PrepareHook,
  PluginDefinition
} from '@bfra.me/semantic-release/plugins'
import type { MyPluginConfig } from './types.js'

const verifyConditions: VerifyConditionsHook<MyPluginConfig> = async (pluginConfig, context) => {
  const { logger } = context

  // Validate configuration
  if (pluginConfig.notesFormat && !['markdown', 'plain', 'html'].includes(pluginConfig.notesFormat)) {
    throw new Error('notesFormat must be one of: markdown, plain, html')
  }

  logger.info('My plugin configuration verified')
}

const generateNotes: GenerateNotesHook<MyPluginConfig> = async (pluginConfig, context) => {
  const { commits, nextRelease, logger } = context
  const format = pluginConfig.notesFormat || 'markdown'

  let notes = ''

  if (format === 'markdown') {
    notes = `## ${nextRelease.version}\n\n`
    notes += `Released on ${new Date().toISOString().split('T')[0]}\n\n`

    if (pluginConfig.includeBuildInfo) {
      notes += `**Build Info:**\n`
      notes += `- Node: ${process.version}\n`
      notes += `- Platform: ${process.platform}\n\n`
    }

    notes += `**Changes:**\n`
    commits.forEach(commit => {
      notes += `- ${commit.message}\n`
    })
  }

  logger.info(`Generated notes in ${format} format`)
  return notes
}

const prepare: PrepareHook<MyPluginConfig> = async (pluginConfig, context) => {
  const { nextRelease, logger } = context

  if (pluginConfig.metadata) {
    // Add custom metadata to package.json or other files
    logger.info('Added custom metadata to release')
  }
}

// Export the plugin with metadata
const plugin: PluginDefinition<MyPluginConfig> = {
  verifyConditions,
  generateNotes,
  prepare,
  metadata: {
    name: 'semantic-release-my-plugin',
    version: '1.0.0',
    description: 'Adds custom metadata and formatting to semantic-release',
    author: 'Your Name',
    keywords: ['semantic-release', 'plugin', 'metadata']
  }
}

export default plugin
export type { MyPluginConfig }
```

### Step 3: Add Type Declarations

Create type declarations for integration with `@bfra.me/semantic-release`. Create `src/index.d.ts`:

```typescript
declare module '@bfra.me/semantic-release' {
  export interface CustomPluginRegistry {
    'semantic-release-my-plugin': import('./types.js').MyPluginConfig
  }
}
```

## Using the Template Generator

The `@bfra.me/semantic-release` toolkit includes a plugin template generator to scaffold new plugins quickly.

### Generate a Plugin Template

```typescript
import { generatePlugin } from '@bfra.me/semantic-release/plugins/template'

await generatePlugin({
  name: 'semantic-release-custom-publisher',
  type: 'publish',
  description: 'Publishes releases to a custom platform',
  author: 'Your Name',
  outputDir: './my-new-plugin',
  hooks: ['verifyConditions', 'publish'],
  typescript: true,
  testing: true,
  includeExamples: true
})
```

### Template Types

The generator supports different plugin types with appropriate lifecycle hooks:

- **`analyze`** - Commit analysis plugins (`verifyConditions`, `analyzeCommits`)
- **`generate`** - Release notes generation (`verifyConditions`, `generateNotes`)
- **`prepare`** - Preparation plugins (`verifyConditions`, `prepare`)
- **`publish`** - Publishing plugins (`verifyConditions`, `publish`)
- **`success`** - Success notification (`success`)
- **`fail`** - Failure notification (`fail`)
- **`verify`** - Verification plugins (`verifyConditions`, `verifyRelease`)
- **`complete`** - Complete plugins with all lifecycle hooks

### Generated Structure

The template generator creates a complete plugin structure:

```text
my-new-plugin/
├── src/
│   ├── index.ts          # Main plugin implementation
│   ├── types.ts          # TypeScript interfaces
│   └── utils.ts          # Utility functions
├── test/
│   ├── index.test.ts     # Plugin tests
│   └── fixtures/         # Test fixtures
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
├── README.md             # Documentation
└── .gitignore            # Git ignore rules
```

## Plugin Testing

The toolkit provides comprehensive testing utilities for plugin development.

### Basic Plugin Testing

```typescript
import { describe, it, expect } from 'vitest'
import { testPlugin, createMockContext } from '@bfra.me/semantic-release/plugins/testing'
import myPlugin from '../src/index.js'

describe('My Plugin', () => {
  it('should verify conditions successfully', async () => {
    const config = { notesFormat: 'markdown' as const }
    const context = createMockContext('verifyConditions')

    // Should not throw
    await expect(myPlugin.verifyConditions!(config, context)).resolves.toBeUndefined()
  })

  it('should generate markdown notes', async () => {
    const config = { notesFormat: 'markdown' as const, includeBuildInfo: true }
    const context = createMockContext('generateNotes', {
      commits: [
        { message: 'feat: add new feature', hash: 'abc123' },
        { message: 'fix: resolve bug', hash: 'def456' }
      ]
    })

    const result = await myPlugin.generateNotes!(config, context)

    expect(result).toContain('## 1.0.0')
    expect(result).toContain('**Build Info:**')
    expect(result).toContain('feat: add new feature')
    expect(result).toContain('fix: resolve bug')
  })

  it('should validate configuration', async () => {
    const config = { notesFormat: 'invalid' as any }
    const context = createMockContext('verifyConditions')

    await expect(myPlugin.verifyConditions!(config, context))
      .rejects.toThrow('notesFormat must be one of: markdown, plain, html')
  })
})
```

### Advanced Testing with Plugin Tester

```typescript
import { PluginTester } from '@bfra.me/semantic-release/plugins/testing'
import myPlugin from '../src/index.js'

describe('Plugin Integration Tests', () => {
  it('should work end-to-end', async () => {
    const tester = new PluginTester(myPlugin)

    // Test complete workflow
    const result = await tester.testWorkflow({
      config: { notesFormat: 'markdown', includeBuildInfo: true },
      mockData: {
        commits: [
          { message: 'feat: new feature', hash: 'abc123' },
          { message: 'fix: bug fix', hash: 'def456' }
        ],
        branch: { name: 'main', main: true },
        env: { NODE_ENV: 'test' }
      }
    })

    expect(result.success).toBe(true)
    expect(result.results.generateNotes).toContain('## 1.0.0')
  })

  it('should handle lifecycle errors', async () => {
    const tester = new PluginTester(myPlugin)

    const result = await tester.testLifecycle('verifyConditions', {
      notesFormat: 'invalid'
    }, createMockContext('verifyConditions'))

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('notesFormat must be one of')
  })
})
```

### Mock Context Utilities

Create realistic test contexts for different lifecycle stages:

```typescript
import {
  createMockVerifyConditionsContext,
  createMockAnalyzeCommitsContext,
  createMockGenerateNotesContext,
  createMockPrepareContext,
  createMockPublishContext,
  createMockSuccessContext,
  createMockFailContext
} from '@bfra.me/semantic-release/plugins/testing'

// Verify conditions context
const verifyContext = createMockVerifyConditionsContext({
  env: { API_KEY: 'test-key' },
  branch: { name: 'main', main: true }
})

// Generate notes context with commits
const notesContext = createMockGenerateNotesContext({
  commits: [
    { message: 'feat: add feature', hash: 'abc123' },
    { message: 'fix: resolve issue', hash: 'def456' }
  ],
  nextRelease: { version: '1.1.0', type: 'minor' }
})

// Publish context with release info
const publishContext = createMockPublishContext({
  nextRelease: { version: '1.1.0', type: 'minor' },
  releases: []
})
```

## Advanced Plugin Patterns

### Configuration Schema Validation

Use runtime validation for plugin configuration:

```typescript
import { z } from 'zod'
import type { PluginDefinition } from '@bfra.me/semantic-release/plugins'

const configSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().min(1000).optional().default(5000),
  retries: z.number().min(0).max(5).optional().default(3),
  headers: z.record(z.string()).optional()
})

type AdvancedPluginConfig = z.infer<typeof configSchema>

const plugin: PluginDefinition<AdvancedPluginConfig> = {
  configSchema,

  verifyConditions: async (pluginConfig, context) => {
    // Configuration is already validated by this point
    const { apiUrl, timeout, retries } = pluginConfig

    try {
      await fetch(apiUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeout)
      })
    } catch (error) {
      throw new Error(`Cannot connect to API at ${apiUrl}: ${error.message}`)
    }
  },

  publish: async (pluginConfig, context) => {
    const { apiUrl, timeout, retries, headers } = pluginConfig
    const { nextRelease } = context

    // Implement retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${apiUrl}/releases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(nextRelease),
          signal: AbortSignal.timeout(timeout)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return {
          name: `Release ${nextRelease.version}`,
          url: result.url
        }
      } catch (error) {
        if (attempt === retries) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }
}

export default plugin
```

### Multi-Step Workflow Plugin

Create plugins that coordinate multiple steps:

```typescript
import type { PluginDefinition } from '@bfra.me/semantic-release/plugins'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

interface WorkflowPluginConfig {
  steps: Array<{
    name: string
    command: string
    workingDir?: string
    env?: Record<string, string>
  }>
  continueOnError?: boolean
  outputDir?: string
}

const plugin: PluginDefinition<WorkflowPluginConfig> = {
  verifyConditions: async (pluginConfig, context) => {
    const { steps } = pluginConfig
    const { logger } = context

    // Verify all commands exist
    for (const step of steps) {
      logger.info(`Verifying step: ${step.name}`)
      // Add command validation logic
    }
  },

  prepare: async (pluginConfig, context) => {
    const { steps, continueOnError, outputDir } = pluginConfig
    const { logger, nextRelease } = context

    const results = []

    for (const step of steps) {
      try {
        logger.info(`Executing step: ${step.name}`)

        const result = await executeCommand(step, {
          version: nextRelease.version,
          ...step.env
        })

        results.push({ step: step.name, success: true, output: result })

        if (outputDir) {
          await mkdir(outputDir, { recursive: true })
          await writeFile(
            join(outputDir, `${step.name}.log`),
            result
          )
        }
      } catch (error) {
        results.push({ step: step.name, success: false, error: error.message })

        if (!continueOnError) {
          throw new Error(`Step ${step.name} failed: ${error.message}`)
        }

        logger.warn(`Step ${step.name} failed but continuing: ${error.message}`)
      }
    }

    logger.info(`Workflow completed: ${results.filter(r => r.success).length}/${results.length} steps successful`)
  }
}

async function executeCommand(step: WorkflowPluginConfig['steps'][0], env: Record<string, string>) {
  // Implementation for command execution
  // This would use child_process or similar
}

export default plugin
```

### Conditional Plugin Logic

Implement plugins that adapt behavior based on context:

```typescript
import type { PluginDefinition } from '@bfra.me/semantic-release/plugins'

interface ConditionalPluginConfig {
  production?: {
    enabled: boolean
    settings: Record<string, unknown>
  }
  staging?: {
    enabled: boolean
    settings: Record<string, unknown>
  }
  development?: {
    enabled: boolean
    settings: Record<string, unknown>
  }
}

const plugin: PluginDefinition<ConditionalPluginConfig> = {
  verifyConditions: async (pluginConfig, context) => {
    const { env, branch, logger } = context
    const environment = getEnvironment(env, branch)
    const config = pluginConfig[environment]

    if (!config?.enabled) {
      logger.info(`Plugin disabled for ${environment} environment`)
      return
    }

    logger.info(`Plugin enabled for ${environment} with settings:`, config.settings)
  },

  publish: async (pluginConfig, context) => {
    const { env, branch, nextRelease, logger } = context
    const environment = getEnvironment(env, branch)
    const config = pluginConfig[environment]

    if (!config?.enabled) {
      logger.info(`Skipping publish for ${environment} environment`)
      return
    }

    // Environment-specific publishing logic
    if (environment === 'production') {
      return await publishToProduction(nextRelease, config.settings)
    } else if (environment === 'staging') {
      return await publishToStaging(nextRelease, config.settings)
    } else {
      return await publishToDevelopment(nextRelease, config.settings)
    }
  }
}

function getEnvironment(env: Record<string, string>, branch: any): keyof ConditionalPluginConfig {
  if (env.NODE_ENV === 'production' || branch.main) return 'production'
  if (env.NODE_ENV === 'staging' || branch.name?.includes('staging')) return 'staging'
  return 'development'
}

export default plugin
```

## Configuration and Validation

### Comprehensive Configuration Schema

```typescript
import { z } from 'zod'

const pluginConfigSchema = z.object({
  // Required fields
  apiUrl: z.string().url('Must be a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),

  // Optional with defaults
  timeout: z.number().min(1000).max(30000).default(5000),
  retries: z.number().min(0).max(10).default(3),

  // Conditional fields
  auth: z.object({
    type: z.enum(['bearer', 'basic', 'custom']),
    credentials: z.string().optional(),
    customHeaders: z.record(z.string()).optional()
  }).refine(
    data => data.type !== 'custom' || data.customHeaders,
    'customHeaders required when auth type is custom'
  ),

  // Complex nested configuration
  publishing: z.object({
    enabled: z.boolean().default(true),
    targets: z.array(z.object({
      name: z.string(),
      url: z.string().url(),
      format: z.enum(['json', 'xml', 'form']),
      headers: z.record(z.string()).optional()
    })).min(1, 'At least one publishing target required'),
    notifications: z.object({
      slack: z.object({
        webhook: z.string().url(),
        channel: z.string().optional()
      }).optional(),
      email: z.object({
        recipients: z.array(z.string().email()),
        template: z.string().optional()
      }).optional()
    }).optional()
  }),

  // Environment-specific overrides
  environments: z.record(z.object({
    apiUrl: z.string().url().optional(),
    timeout: z.number().optional(),
    publishing: z.object({
      enabled: z.boolean().optional(),
      targets: z.array(z.string()).optional() // Reference target names
    }).optional()
  })).optional()
})

type PluginConfig = z.infer<typeof pluginConfigSchema>
```

### Runtime Configuration Validation

```typescript
import type { PluginDefinition } from '@bfra.me/semantic-release/plugins'

const plugin: PluginDefinition<PluginConfig> = {
  configSchema: pluginConfigSchema,

  verifyConditions: async (pluginConfig, context) => {
    const { env, logger } = context

    // Additional runtime validation beyond schema
    const environment = env.NODE_ENV || 'development'
    const envConfig = pluginConfig.environments?.[environment]

    // Merge environment-specific config
    const resolvedConfig = {
      ...pluginConfig,
      ...envConfig,
      publishing: {
        ...pluginConfig.publishing,
        ...envConfig?.publishing
      }
    }

    // Validate API connectivity
    try {
      const response = await fetch(resolvedConfig.apiUrl, {
        method: 'HEAD',
        headers: getAuthHeaders(resolvedConfig.auth),
        signal: AbortSignal.timeout(resolvedConfig.timeout)
      })

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`)
      }
    } catch (error) {
      throw new Error(`Cannot connect to API: ${error.message}`)
    }

    // Validate publishing targets
    for (const target of resolvedConfig.publishing.targets) {
      try {
        await fetch(target.url, { method: 'HEAD' })
      } catch (error) {
        logger.warn(`Publishing target ${target.name} may be unreachable: ${error.message}`)
      }
    }

    logger.info(`Configuration validated for ${environment} environment`)
  }
}

function getAuthHeaders(auth: PluginConfig['auth']) {
  switch (auth.type) {
    case 'bearer':
      return { Authorization: `Bearer ${auth.credentials}` }
    case 'basic':
      return { Authorization: `Basic ${Buffer.from(auth.credentials!).toString('base64')}` }
    case 'custom':
      return auth.customHeaders || {}
    default:
      return {}
  }
}
```

## Plugin Registry Integration

### Registering Your Plugin Types

Create type declarations for seamless integration:

```typescript
// src/types.d.ts
declare module '@bfra.me/semantic-release' {
  export interface CustomPluginRegistry {
    'semantic-release-my-plugin': {
      apiUrl: string
      apiKey: string
      timeout?: number
      retries?: number
      auth: {
        type: 'bearer' | 'basic' | 'custom'
        credentials?: string
        customHeaders?: Record<string, string>
      }
      publishing: {
        enabled?: boolean
        targets: Array<{
          name: string
          url: string
          format: 'json' | 'xml' | 'form'
          headers?: Record<string, string>
        }>
        notifications?: {
          slack?: {
            webhook: string
            channel?: string
          }
          email?: {
            recipients: string[]
            template?: string
          }
        }
      }
      environments?: Record<string, Partial<{
        apiUrl: string
        timeout: number
        publishing: {
          enabled: boolean
          targets: string[]
        }
      }>>
    }
  }
}
```

### Plugin Discovery and Metadata

```typescript
import type { PluginDefinition } from '@bfra.me/semantic-release/plugins'

const plugin: PluginDefinition<MyPluginConfig> = {
  // Plugin implementation...

  metadata: {
    name: 'semantic-release-my-plugin',
    version: '2.1.0',
    description: 'Advanced semantic-release plugin with environment-aware publishing',
    author: 'Your Name <your.email@example.com>',
    homepage: 'https://github.com/yourusername/semantic-release-my-plugin',
    repository: 'https://github.com/yourusername/semantic-release-my-plugin.git',
    keywords: ['semantic-release', 'plugin', 'publishing', 'automation'],
    semanticReleaseCompatibility: '>=20.0.0'
  }
}

export default plugin
```

## Publishing and Distribution

### Package Configuration

Configure your `package.json` for optimal distribution:

```json
{
  "name": "semantic-release-my-plugin",
  "version": "2.1.0",
  "description": "Advanced semantic-release plugin with environment-aware publishing",
  "keywords": ["semantic-release", "plugin", "publishing", "automation"],
  "homepage": "https://github.com/yourusername/semantic-release-my-plugin#readme",
  "bugs": "https://github.com/yourusername/semantic-release-my-plugin/issues",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/semantic-release-my-plugin.git"
  },
  "license": "MIT",
  "author": "Your Name <your.email@example.com>",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "files": ["lib", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src test",
    "format": "prettier --write src test",
    "prepare": "npm run build",
    "semantic-release": "semantic-release"
  },
  "dependencies": {
    "@bfra.me/semantic-release": "^2.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "semantic-release": ">=20.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Documentation Best Practices

Create comprehensive README documentation:

```markdown
# semantic-release-my-plugin

Advanced semantic-release plugin with environment-aware publishing and comprehensive TypeScript support.

## Features

- 🔧 Full TypeScript support with runtime validation
- 🌍 Environment-aware configuration
- 🚀 Multiple publishing targets
- 📢 Built-in notification support
- ✅ Comprehensive testing utilities
- 🔄 Automatic retry logic

## Installation

\`\`\`bash
npm install semantic-release-my-plugin
\`\`\`

## Configuration

\`\`\`typescript
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  plugins: [
    ['semantic-release-my-plugin', {
      apiUrl: 'https://api.example.com',
      apiKey: process.env.API_KEY,
      publishing: {
        targets: [
          {
            name: 'primary',
            url: 'https://registry.example.com',
            format: 'json'
          }
        ]
      }
    }]
  ]
})
\`\`\`

## API Reference

### Configuration Options

#### `apiUrl` (required)
- Type: `string`
- Description: Base URL for the API endpoint

<!-- Continue with detailed API documentation -->
```

### Semantic Release Configuration

Set up automated releases for your plugin:

```typescript
// release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github'
  ]
})
```

## Real-World Examples

### Slack Notification Plugin

```typescript
import type { PluginDefinition, SuccessHook, FailHook } from '@bfra.me/semantic-release/plugins'

interface SlackPluginConfig {
  webhookUrl: string
  channel?: string
  username?: string
  iconEmoji?: string
  onSuccess?: boolean
  onFailure?: boolean
  customMessage?: {
    success?: string
    failure?: string
  }
}

const success: SuccessHook<SlackPluginConfig> = async (pluginConfig, context) => {
  if (!pluginConfig.onSuccess) return

  const { releases, nextRelease } = context
  const release = releases[0] || nextRelease

  const message = pluginConfig.customMessage?.success ||
    `🎉 Successfully released ${release.name} v${release.version}!`

  await sendSlackMessage(pluginConfig, message, 'good')
}

const fail: FailHook<SlackPluginConfig> = async (pluginConfig, context) => {
  if (!pluginConfig.onFailure) return

  const { errors } = context
  const message = pluginConfig.customMessage?.failure ||
    `❌ Release failed: ${errors[0]?.message || 'Unknown error'}`

  await sendSlackMessage(pluginConfig, message, 'danger')
}

async function sendSlackMessage(config: SlackPluginConfig, text: string, color: string) {
  await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: config.channel,
      username: config.username || 'Semantic Release',
      icon_emoji: config.iconEmoji || ':rocket:',
      attachments: [{ color, text }]
    })
  })
}

const slackPlugin: PluginDefinition<SlackPluginConfig> = {
  success,
  fail,
  metadata: {
    name: 'semantic-release-slack',
    version: '1.0.0',
    description: 'Send Slack notifications for semantic-release events'
  }
}

export default slackPlugin
```

### Docker Image Publisher

```typescript
import type { PluginDefinition, VerifyConditionsHook, PublishHook } from '@bfra.me/semantic-release/plugins'
import { execSync } from 'child_process'

interface DockerPluginConfig {
  registry: string
  repository: string
  tags?: string[]
  dockerfile?: string
  buildArgs?: Record<string, string>
  platforms?: string[]
  push?: boolean
}

const verifyConditions: VerifyConditionsHook<DockerPluginConfig> = async (pluginConfig, context) => {
  const { logger } = context

  // Verify Docker is available
  try {
    execSync('docker --version', { stdio: 'ignore' })
  } catch {
    throw new Error('Docker is not installed or not in PATH')
  }

  // Verify registry authentication
  try {
    execSync(`docker info | grep "${pluginConfig.registry}"`, { stdio: 'ignore' })
    logger.info(`Authenticated to ${pluginConfig.registry}`)
  } catch {
    logger.warn(`Not authenticated to ${pluginConfig.registry}`)
  }
}

const publish: PublishHook<DockerPluginConfig> = async (pluginConfig, context) => {
  const { nextRelease, logger } = context
  const { registry, repository, dockerfile = 'Dockerfile', buildArgs = {}, platforms = ['linux/amd64'], push = true } = pluginConfig

  const tags = pluginConfig.tags || ['latest', nextRelease.version]
  const fullRepository = `${registry}/${repository}`

  // Build arguments
  const buildArgsStr = Object.entries(buildArgs)
    .map(([key, value]) => `--build-arg ${key}=${value}`)
    .join(' ')

  // Platform support
  const platformStr = platforms.length > 1
    ? `--platform ${platforms.join(',')}`
    : `--platform ${platforms[0]}`

  // Build and tag image
  const tagArgs = tags.map(tag => `-t ${fullRepository}:${tag}`).join(' ')

  logger.info(`Building Docker image: ${fullRepository}`)
  execSync(
    `docker buildx build ${platformStr} ${buildArgsStr} ${tagArgs} -f ${dockerfile} .`,
    { stdio: 'inherit' }
  )

  if (push) {
    // Push all tags
    for (const tag of tags) {
      const imageTag = `${fullRepository}:${tag}`
      logger.info(`Pushing ${imageTag}`)
      execSync(`docker push ${imageTag}`, { stdio: 'inherit' })
    }
  }

  return {
    name: `Docker Image ${fullRepository}:${nextRelease.version}`,
    url: `https://${registry}/${repository}/tags`
  }
}

const dockerPlugin: PluginDefinition<DockerPluginConfig> = {
  verifyConditions,
  publish,
  metadata: {
    name: 'semantic-release-docker',
    version: '1.0.0',
    description: 'Build and publish Docker images with semantic-release'
  }
}

export default dockerPlugin
```

### AWS S3 Publisher

```typescript
import type { PluginDefinition, VerifyConditionsHook, PublishHook } from '@bfra.me/semantic-release/plugins'
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { glob } from 'glob'

interface S3PluginConfig {
  bucket: string
  region: string
  prefix?: string
  files: string | string[]
  contentType?: string
  metadata?: Record<string, string>
  acl?: 'private' | 'public-read' | 'public-read-write'
}

const verifyConditions: VerifyConditionsHook<S3PluginConfig> = async (pluginConfig, context) => {
  const { logger } = context
  const { bucket, region } = pluginConfig

  const s3 = new S3Client({ region })

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    logger.info(`Verified access to S3 bucket: ${bucket}`)
  } catch (error) {
    throw new Error(`Cannot access S3 bucket ${bucket}: ${error.message}`)
  }
}

const publish: PublishHook<S3PluginConfig> = async (pluginConfig, context) => {
  const { nextRelease, logger } = context
  const { bucket, region, prefix = '', files, contentType, metadata = {}, acl } = pluginConfig

  const s3 = new S3Client({ region })
  const filePatterns = Array.isArray(files) ? files : [files]
  const uploadedFiles = []

  for (const pattern of filePatterns) {
    const matchedFiles = await glob(pattern)

    for (const filePath of matchedFiles) {
      const fileStats = await stat(filePath)
      if (!fileStats.isFile()) continue

      const fileContent = await readFile(filePath)
      const key = join(prefix, nextRelease.version, filePath).replace(/\\/g, '/')

      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType || getContentType(filePath),
        Metadata: {
          version: nextRelease.version,
          'release-type': nextRelease.type,
          ...metadata
        },
        ACL: acl
      })

      await s3.send(putCommand)
      uploadedFiles.push(key)
      logger.info(`Uploaded: s3://${bucket}/${key}`)
    }
  }

  return {
    name: `S3 Release ${nextRelease.version}`,
    url: `https://s3.console.aws.amazon.com/s3/buckets/${bucket}?prefix=${prefix}${nextRelease.version}/`
  }
}

function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  }
  return types[ext || ''] || 'application/octet-stream'
}

const s3Plugin: PluginDefinition<S3PluginConfig> = {
  verifyConditions,
  publish,
  metadata: {
    name: 'semantic-release-s3',
    version: '1.0.0',
    description: 'Upload release artifacts to AWS S3'
  }
}

export default s3Plugin
```

## Best Practices

### Error Handling

Always provide clear, actionable error messages:

```typescript
const verifyConditions: VerifyConditionsHook = async (pluginConfig, context) => {
  try {
    // Validation logic
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${configPath}. Please create the file or check the path.`)
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied accessing: ${configPath}. Please check file permissions.`)
    } else {
      throw new Error(`Configuration validation failed: ${error.message}`)
    }
  }
}
```

### Logging Best Practices

Use structured logging for better debugging:

```typescript
const publish: PublishHook = async (pluginConfig, context) => {
  const { logger } = context

  logger.info('Starting publication process', {
    version: nextRelease.version,
    targets: pluginConfig.targets.length
  })

  for (const target of pluginConfig.targets) {
    logger.debug(`Publishing to target: ${target.name}`, { url: target.url })

    try {
      const result = await publishToTarget(target)
      logger.success(`Published to ${target.name}`, { url: result.url })
    } catch (error) {
      logger.error(`Failed to publish to ${target.name}`, { error: error.message })
      throw error
    }
  }
}
```

### Performance Optimization

Implement concurrent operations where possible:

```typescript
const publish: PublishHook = async (pluginConfig, context) => {
  const { targets } = pluginConfig
  const { logger } = context

  // Publish to all targets concurrently
  const results = await Promise.allSettled(
    targets.map(async target => {
      logger.info(`Publishing to ${target.name}`)
      return await publishToTarget(target)
    })
  )

  // Process results
  const successful = results.filter(r => r.status === 'fulfilled')
  const failed = results.filter(r => r.status === 'rejected')

  if (failed.length > 0) {
    logger.warn(`${failed.length} targets failed:`,
      failed.map(f => f.reason.message))
  }

  logger.info(`Published to ${successful.length}/${targets.length} targets`)

  return {
    name: `Multi-target Release`,
    url: `Published to ${successful.length} targets`
  }
}
```

### Configuration Validation

Provide comprehensive validation with helpful messages:

```typescript
const configSchema = z.object({
  apiUrl: z.string()
    .url('Must be a valid URL')
    .refine(url => url.startsWith('https://'), 'Must use HTTPS'),

  timeout: z.number()
    .min(1000, 'Timeout must be at least 1000ms')
    .max(300000, 'Timeout cannot exceed 5 minutes'),

  targets: z.array(z.object({
    name: z.string().min(1, 'Target name cannot be empty'),
    url: z.string().url('Target URL must be valid')
  })).min(1, 'At least one target is required')
}).refine(
  config => config.targets.every(target =>
    target.url.startsWith(config.apiUrl)
  ),
  'All target URLs must be under the base API URL'
)
```

## Troubleshooting

### Common Issues

#### Plugin Not Loading

**Problem**: Plugin is not being recognized by semantic-release.

**Solutions**:

1. Ensure plugin exports a default function or object with lifecycle hooks
2. Check that the plugin name follows the `semantic-release-*` convention
3. Verify the plugin is properly installed and in node_modules

```typescript
// ✅ Correct export
export default {
  verifyConditions: async (config, context) => { /* ... */ }
}

// ❌ Incorrect export
export const plugin = {
  verifyConditions: async (config, context) => { /* ... */ }
}
```

#### TypeScript Errors

**Problem**: TypeScript compilation fails with type errors.

**Solutions**:

1. Ensure proper imports from `@bfra.me/semantic-release/plugins`
2. Add type declarations for custom plugin configuration
3. Check that your `tsconfig.json` has proper module resolution

```typescript
// ✅ Correct imports
import type { VerifyConditionsHook } from '@bfra.me/semantic-release/plugins'

// ❌ Incorrect imports
import type { VerifyConditionsHook } from '@bfra.me/semantic-release'
```

#### Configuration Validation Errors

**Problem**: Plugin configuration is rejected at runtime.

**Solutions**:

1. Add proper configuration schema validation
2. Provide clear error messages with examples
3. Test configuration with the validation utilities

```typescript
const verifyConditions: VerifyConditionsHook = async (config, context) => {
  try {
    configSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      throw new Error(`Configuration validation failed: ${issues}`)
    }
    throw error
  }
}
```

### Testing Issues

#### Mock Context Problems

**Problem**: Tests fail because mock context is incomplete.

**Solutions**:

1. Use the provided mock context utilities
2. Customize mock data for your specific needs
3. Test with realistic data

```typescript
import { createMockContext } from '@bfra.me/semantic-release/plugins/testing'

// ✅ Use provided utilities
const context = createMockContext('publish', {
  nextRelease: { version: '1.0.0', type: 'major' },
  releases: []
})

// ❌ Manual mock (incomplete)
const context = { nextRelease: { version: '1.0.0' } }
```

#### Plugin Testing Failures

**Problem**: Plugin tests are unreliable or incomplete.

**Solutions**:

1. Test each lifecycle hook independently
2. Use the PluginTester for integration tests
3. Mock external dependencies properly

```typescript
import { PluginTester } from '@bfra.me/semantic-release/plugins/testing'

const tester = new PluginTester(myPlugin)

// Test individual lifecycle hooks
await tester.testLifecycle('verifyConditions', config, context)

// Test complete workflow
await tester.testWorkflow({ config, mockData })
```

### Debugging Tips

1. **Enable Debug Logging**: Set `DEBUG=semantic-release:*` to see detailed logs
2. **Use Dry Run Mode**: Test with `--dry-run` to avoid side effects
3. **Add Extensive Logging**: Use `context.logger` for debugging information
4. **Validate Configuration Early**: Use schema validation in `verifyConditions`
5. **Test Incrementally**: Start with simple implementations and add complexity

```bash
# Debug semantic-release execution
DEBUG=semantic-release:* npx semantic-release --dry-run

# Debug specific plugin
DEBUG=semantic-release:my-plugin npx semantic-release --dry-run
```

---

This comprehensive tutorial covers all aspects of plugin development with the `@bfra.me/semantic-release` toolkit. The examples show progressive complexity from basic plugins to advanced patterns, while the testing and validation sections ensure reliable plugin development practices.

For more information, see the [getting started guide](./getting-started.md) and the main package documentation.
