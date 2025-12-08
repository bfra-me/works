# @bfra.me/create

[![npm version](https://img.shields.io/npm/v/@bfra.me/create.svg)](https://www.npmjs.com/package/@bfra.me/create)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, modern command-line utility for creating new projects from customizable templates with AI-powered features and interactive workflows.

## Features

🚀 **Modern Template System** - Support for GitHub repositories, local directories, and URLs
🤖 **AI-Powered Assistance** - Intelligent project setup and dependency recommendations
📋 **Interactive CLI** - Beautiful prompts and progress indicators with @clack/prompts
🔧 **Feature Addition** - Add components, configurations, and tools to existing projects
⚡ **Fast & Reliable** - Template caching, concurrent operations, and error recovery
🎯 **TypeScript First** - Comprehensive type safety and modern development practices
🏗️ **Functional Architecture** - Modern functional factory patterns for maintainability
🛡️ **Robust Error Handling** - Consistent Result<T, E> patterns and unified error codes

## Architecture

This package uses a modern **functional architecture** with Result-based error handling, providing better testability, maintainability, and type safety compared to traditional exception-based approaches.

### Core Design Principles

- **Result Pattern** - All async operations return `Promise<Result<T, E>>` discriminated unions from `@bfra.me/es/result` for explicit, type-safe error handling
- **Factory Functions** - Core components provide factory functions (`createTemplateResolver()`, `createLLMClient()`, `createProjectAnalyzer()`) alongside classes for flexibility
- **Unified Error System** - Consistent error codes across template, AI, CLI, and project domains with structured error types
- **Branded Types** - Compile-time validation using branded types (`BrandedTemplateSource`, `ProjectPath`, `PackageName`)
- **Functional Composition** - Leverages composition patterns with utilities from `@bfra.me/es/functional` and `@bfra.me/es/async`
- **Type Safety First** - Strict TypeScript with no `any` types, comprehensive type guards, and runtime validation

### Key Components

```text
src/
├── index.ts                # Main API: createPackage() with Result returns
├── types.ts                # Comprehensive type definitions and error types
├── cli.ts                  # CLI entry point with Result-based error handling
├── commands/
│   ├── add.ts              # addFeatureToProject() - returns Result<void, CreateError>
│   └── progress-indicators.ts  # Interactive UI utilities
├── ai/                     # AI integration (provider-agnostic LLM client)
│   ├── llm-client-factory.ts   # createLLMClient() factory
│   ├── llm-client.ts           # LLMClient class (deprecated, use factory)
│   ├── project-analyzer.ts     # createProjectAnalyzer() factory
│   ├── assistant.ts            # AI assistant with Result returns
│   ├── code-generator.ts       # Code generation utilities
│   └── providers/              # OpenAI/Anthropic adapters
├── templates/              # Template processing system
│   ├── fetcher.ts              # createTemplateFetcher() factory + TemplateFetcher class
│   ├── processor.ts            # Template processing with Result returns
│   ├── resolver.ts             # Template resolution (returns Result)
│   └── validator.ts            # createTemplateValidator() factory + TemplateValidator class
├── prompts/                # Interactive prompts (return Result types)
│   ├── template-selection.ts   # templateSelection() - returns Result<TemplateSelection>
│   ├── customization.ts        # customize() - returns Result<ProjectCustomization>
│   └── project-setup.ts        # Full interactive setup workflow
├── features/               # Feature addition system
│   ├── registry.ts             # Feature registration and management
│   ├── eslint.ts               # ESLint feature implementation
│   └── typescript.ts           # TypeScript feature implementation
└── utils/                  # Shared utilities
    ├── errors.ts               # Unified error factory (TemplateError, AIError, CLIError)
    ├── ai-capabilities.ts      # getAICapabilities() - AI provider detection
    ├── validation.ts           # Input validation with Result returns
    ├── conflict-resolution.ts  # Configuration merge strategies
    └── project-detection.ts    # Project type detection
```

### Error Handling

All async operations use the Result pattern for consistent, type-safe error handling. Each error includes a specific error code for programmatic handling:

```typescript
import { createPackage, TemplateErrorCode, AIErrorCode, CLIErrorCode } from '@bfra.me/create'
import { isOk, isErr } from '@bfra.me/es/result'

const result = await createPackage({ name: 'my-project', template: 'library' })

if (isErr(result)) {
  // Type-safe error handling
  switch (result.error.code) {
    case TemplateErrorCode.TEMPLATE_NOT_FOUND:
      console.error('Template not found:', result.error.message)
      break
    case AIErrorCode.AI_API_KEY_MISSING:
      console.error('AI features require API key:', result.error.message)
      break
    case CLIErrorCode.DIRECTORY_EXISTS:
      console.error('Directory exists:', result.error.message)
      break
    default:
      console.error('Error:', result.error.message)
  }
  process.exit(1)
}

console.log('Project created at:', result.value.projectPath)
```

**Error Code Categories:**

- **Template Errors**: `TEMPLATE_NOT_FOUND`, `TEMPLATE_INVALID`, `TEMPLATE_FETCH_FAILED`, `TEMPLATE_PARSE_ERROR`, `TEMPLATE_RENDER_ERROR`, etc.
- **AI Errors**: `AI_PROVIDER_UNAVAILABLE`, `AI_API_KEY_MISSING`, `AI_REQUEST_FAILED`, `AI_RESPONSE_INVALID`, etc.
- **CLI Errors**: `INVALID_INPUT`, `INVALID_PROJECT_NAME`, `PATH_TRAVERSAL_ATTEMPT`, `DIRECTORY_EXISTS`, `FILE_SYSTEM_ERROR`, etc.
- **Project Errors**: `PROJECT_DETECTION_FAILED`, `PACKAGE_JSON_NOT_FOUND`, `PACKAGE_MANAGER_NOT_DETECTED`, etc.

### Result Pattern Usage

All async operations return `Promise<Result<T, E>>` for explicit error handling:

```typescript
import { createPackage, addFeatureToProject } from '@bfra.me/create'
import { isOk, isErr, unwrap, unwrapOr } from '@bfra.me/es/result'

// Basic Result handling
const result = await createPackage({ name: 'my-app', template: 'react' })

if (isOk(result)) {
  console.log('Success:', result.value.projectPath)
} else {
  console.error('Error:', result.error.message)
}

// Using unwrap utilities
const projectPath = isOk(result) ? unwrap(result) : unwrapOr(result, { projectPath: './default' })

// Chaining operations
const createResult = await createPackage(options)
if (isOk(createResult)) {
  const addResult = await addFeatureToProject({
    feature: 'eslint',
    targetDir: createResult.value.projectPath
  })

  if (isErr(addResult)) {
    console.error('Failed to add feature:', addResult.error.message)
  }
}
```

## Installation

### Global Installation

```bash
# npm
npm install -g @bfra.me/create

# Yarn
yarn global add @bfra.me/create

# pnpm
pnpm add -g @bfra.me/create

# Bun
bun add -g @bfra.me/create
```

### One-time Usage

```bash
# Use without installing
npx @bfra.me/create my-project

# Or with specific package manager
pnpx @bfra.me/create my-project
bunx @bfra.me/create my-project
```

## Quick Start

### Create a New Project

```bash
# Interactive mode (recommended)
create my-project

# With specific template
create my-library --template library

# Non-interactive with all options
create my-cli \
  --template cli \
  --description "My awesome CLI tool" \
  --author "Your Name <email@example.com>" \
  --no-git \
  --no-install
```

### Add Features to Existing Project

```bash
# List available features
create add --list

# Add ESLint configuration
create add eslint

# Add Vitest testing setup
create add vitest

# Add React component
create add component --name MyComponent
```

## Commands

### `create [projectName]`

Create a new project from a template.

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--template <template>` | `-t` | Template to use (builtin, GitHub repo, URL, or local path) | `default` |
| `--description <desc>` | `-d` | Project description | - |
| `--author <author>` | `-a` | Project author | - |
| `--version <version>` | `-v` | Project version | `1.0.0` |
| `--output-dir <dir>` | `-o` | Output directory for the project | `./[projectName]` |
| `--package-manager <pm>` | - | Package manager to use (npm, yarn, pnpm, bun) | auto-detected |
| `--skip-prompts` | - | Skip interactive prompts and use defaults | `false` |
| `--force` | - | Force overwrite existing files | `false` |
| `--no-interactive` | - | Disable interactive mode completely | `false` |
| `--template-ref <ref>` | - | Git branch or tag for GitHub templates | `main` |
| `--template-subdir <subdir>` | - | Subdirectory within template repository | - |
| `--features <features>` | - | Comma-separated list of features to include | - |
| `--no-git` | - | Skip git repository initialization | `false` |
| `--no-install` | - | Skip dependency installation | `false` |
| `--preset <preset>` | - | Use configuration preset (minimal, standard, full) | - |
| `--dry-run` | - | Show what would be done without making changes | `false` |
| `--verbose` | - | Enable verbose output | `false` |

#### Create Command Examples

```bash
# Basic project creation
create my-project

# Library with full configuration
create my-library \
  --template library \
  --description "A TypeScript library" \
  --author "Your Name <email@example.com>" \
  --version "0.1.0"

# CLI tool from GitHub template
create my-cli \
  --template user/cli-template \
  --template-ref main \
  --features "testing,linting"

# Local template with custom output directory
create my-app \
  --template ./templates/react-app \
  --output-dir ~/projects/my-app

# Minimal setup (no git, no install)
create quick-project \
  --preset minimal

# Dry run to preview changes
create my-project \
  --template library \
  --dry-run
```

### `create add [feature]`

Add features to an existing project.

#### Add Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--skip-confirm` | Skip confirmation prompts | `false` |
| `--list` | List available features | `false` |
| `--verbose` | Enable verbose output | `false` |
| `--dry-run` | Show what would be done without making changes | `false` |

#### Available Features

| Feature | Description |
|---------|-------------|
| `eslint` | Add ESLint configuration with TypeScript support |
| `prettier` | Add Prettier code formatting |
| `vitest` | Add Vitest testing framework |
| `component` | Generate React/Vue/Angular components |
| `husky` | Add Git hooks with Husky |
| `commitlint` | Add conventional commit linting |
| `github-actions` | Add GitHub Actions workflows |
| `dockerfile` | Add Docker configuration |

#### Add Command Examples

```bash
# List all available features
create add --list

# Add ESLint with confirmation
create add eslint

# Add multiple features non-interactively
create add vitest --skip-confirm
create add prettier --skip-confirm

# Generate a React component
create add component --name Header --type functional

# Preview what would be added
create add github-actions --dry-run
```

## Templates

### Built-in Templates

| Template | Description | Technologies |
|----------|-------------|--------------|
| `default` | Basic TypeScript project | TypeScript, ESLint, Prettier |
| `library` | NPM library template | TypeScript, Vitest, tsup, GitHub Actions |
| `cli` | Command-line application | TypeScript, CAC, Consola, testing |
| `react` | React application | React, Vite, TypeScript, testing |
| `node` | Node.js server application | Fastify, TypeScript, Docker |

### Template Sources

#### GitHub Repositories

```bash
# Public repository
create my-project --template user/repo-name

# Specific branch or tag
create my-project --template user/repo-name --template-ref v2.0

# Subdirectory within repository
create my-project --template user/monorepo --template-subdir packages/template
```

#### Local Templates

```bash
# Relative path
create my-project --template ./templates/my-template

# Absolute path
create my-project --template /home/user/templates/my-template
```

#### URL Templates

```bash
# Direct download URL
create my-project --template https://github.com/user/repo/archive/main.zip

# Template registry URL
create my-project --template https://registry.example.com/template.tar.gz
```

### Template Structure

Templates use the [Eta](https://eta.js.org/) templating engine for variable substitution:

```text
my-template/
├── template.json          # Template metadata and variables
├── package.json.eta       # Package.json with variables
├── README.md.eta          # Documentation with variables
├── src/
│   ├── index.ts.eta      # Source files with variables
│   └── types.ts          # Static files (no .eta extension)
├── test/
│   └── index.test.ts.eta
└── .gitignore            # Configuration files
```

#### Template Variables

Available variables in `.eta` files:

| Variable | Description | Example |
|----------|-------------|---------|
| `it.name` | Project name | `my-project` |
| `it.description` | Project description | `My awesome project` |
| `it.author` | Project author | `Your Name <email@example.com>` |
| `it.version` | Project version | `1.0.0` |
| `it.packageManager` | Package manager | `pnpm` |
| `it.year` | Current year | `2024` |
| `it.date` | Current date | `2024-01-15` |

#### template.json Example

```json
{
  "name": "TypeScript Library",
  "description": "A modern TypeScript library template",
  "version": "1.0.0",
  "author": "bfra.me",
  "tags": ["typescript", "library", "npm"],
  "variables": [
    {
      "name": "packageName",
      "description": "NPM package name",
      "type": "string",
      "required": true,
      "pattern": "^[@a-z0-9-/]+$"
    },
    {
      "name": "license",
      "description": "License type",
      "type": "select",
      "default": "MIT",
      "options": ["MIT", "Apache-2.0", "BSD-3-Clause", "GPL-3.0"]
    }
  ],
  "nodeVersion": ">=18.0.0"
}
```

## Configuration Presets

### Minimal Preset

```bash
create my-project --preset minimal
```

- Template: `default`
- Git: disabled
- Install: disabled
- Interactive: disabled

### Standard Preset

```bash
create my-project --preset standard
```

- Template: `library`
- Git: enabled
- Install: enabled
- Interactive: enabled

### Full Preset

```bash
create my-project --preset full
```

- Template: `library`
- Git: enabled
- Install: enabled
- Interactive: enabled
- Verbose: enabled

## AI-Powered Features

> **Note**: AI features require OpenAI or Anthropic API keys

### Configuration

Set up AI features by providing API keys:

```bash
# OpenAI
export OPENAI_API_KEY="your-openai-api-key"

# Anthropic Claude
export ANTHROPIC_API_KEY="your-anthropic-api-key"

# Optional: Create .env file
echo "OPENAI_API_KEY=your-key" > .env
```

### AI Assistance

When API keys are configured, the CLI provides:

- **Smart Template Selection** - AI analyzes your project description to suggest optimal templates
- **Dependency Recommendations** - Intelligent suggestions for packages based on project requirements
- **Code Generation** - AI-generated boilerplate code and configuration files
- **Project Analysis** - Automated analysis of existing projects for feature addition

### Example with AI

```bash
# AI will analyze the description and suggest appropriate template
create "A React component library for design systems" --ai-assist

# AI-powered feature recommendations
create add --ai-suggest

# Smart dependency analysis
create my-api --template node --ai-deps
```

## Programmatic API

### Basic Usage

```typescript
import {createPackage} from '@bfra.me/create'

// Create a project programmatically
await createPackage({
  name: 'my-project',
  template: 'library',
  description: 'My TypeScript library',
  author: 'Your Name <email@example.com>',
  outputDir: './my-project',
  git: true,
  install: true,
  interactive: false
})
```

### Advanced Usage

```typescript
import {createPackage, addFeatureToProject} from '@bfra.me/create'

// Create project with custom options
const result = await createPackage({
  name: 'my-cli',
  template: 'github:user/cli-template',
  templateRef: 'v2.0',
  templateSubdir: 'templates/basic',
  variables: {
    packageName: '@company/my-cli',
    license: 'MIT'
  },
  features: ['eslint', 'vitest'],
  verbose: true,
  dryRun: false
})

if (result.success) {
  console.log('Project created successfully!')

  // Add additional features
  await addFeatureToProject({
    feature: 'github-actions',
    targetDir: './my-cli',
    skipConfirm: true
  })
} else {
  console.error('Failed to create project:', result.error)
}
```

### TypeScript Types

```typescript
import type {
  CreateCommandOptions,
  AddCommandOptions,
  TemplateSource,
  TemplateMetadata,
  ProjectInfo
} from '@bfra.me/create'

// Full type safety for all options
const options: CreateCommandOptions = {
  name: 'my-project',
  template: 'library',
  description: 'A TypeScript library',
  author: 'Your Name',
  version: '1.0.0',
  outputDir: './projects/my-project',
  packageManager: 'pnpm',
  skipPrompts: false,
  force: false,
  interactive: true,
  templateRef: 'main',
  templateSubdir: undefined,
  features: 'eslint,vitest',
  git: true,
  install: true,
  preset: undefined,
  dryRun: false,
  verbose: true
}
```

## Package Manager Detection

The CLI automatically detects and uses the appropriate package manager:

1. **pnpm** - if `pnpm-lock.yaml` exists
2. **yarn** - if `yarn.lock` exists
3. **bun** - if `bun.lockb` exists
4. **npm** - fallback default

Override detection with `--package-manager`:

```bash
create my-project --package-manager yarn
```

## Error Handling & Recovery

### Automatic Retry

Failed operations are automatically retried with exponential backoff:

```bash
# Retries template fetching, file operations, and network requests
create my-project --template github:user/template
```

### Interactive Recovery

In interactive mode, the CLI provides recovery options:

- **Retry** - Attempt the operation again
- **Skip** - Continue without the failed operation
- **Abort** - Exit the process

### Backup & Rollback

Feature addition operations create automatic backups:

```bash
# If feature addition fails, restore from backup
create add eslint
# Backup created at .bfra-create-backup-[timestamp]
```

## Performance & Caching

### Template Caching

Templates are cached locally for improved performance:

```bash
# Cache location: ~/.cache/@bfra.me/create/templates/
# Clear cache with:
rm -rf ~/.cache/@bfra.me/create
```

### Concurrent Operations

The CLI supports concurrent template processing and parallel file operations for faster project creation.

### Memory Optimization

Streaming file operations and efficient memory usage ensure smooth handling of large templates and repositories.

## Troubleshooting

### Common Issues

#### Template not found

```bash
# Verify template exists and is accessible
create my-project --template user/repo --verbose
```

#### Permission errors

```bash
# Check directory permissions
create my-project --output-dir ./projects --verbose
```

#### Network issues

```bash
# Use local template or check connectivity
create my-project --template ./local-template
```

#### Git not initialized

```bash
# Force git initialization
create my-project --force-git
```

### Debug Mode

Enable verbose output for detailed debugging:

```bash
create my-project --verbose --dry-run
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CREATE_CACHE_DIR` | Template cache directory | `~/.cache/@bfra.me/create` |
| `CREATE_TIMEOUT` | Network request timeout (ms) | `30000` |
| `CREATE_CONCURRENCY` | Max concurrent operations | `5` |
| `NODE_ENV` | Environment mode | `production` |
| `DEBUG` | Debug mode | `false` |

## Best Practices

### Error Handling with Result Pattern

Always use the Result pattern for explicit error handling:

```typescript
import { createPackage } from '@bfra.me/create'
import { isOk, isErr } from '@bfra.me/es/result'

async function createMyProject() {
  const result = await createPackage({
    name: 'my-project',
    template: 'library',
    outputDir: './my-project',
    interactive: false
  })

  if (isErr(result)) {
    // Handle error explicitly
    console.error('Failed to create project:', result.error.message)
    process.exit(1)
  }

  console.log('Project created at:', result.data.projectPath)
}
```

### Validation Before Operations

Always validate user input before performing operations:

```typescript
import {
  validateProjectName,
  validateProjectPath,
  createPackage
} from '@bfra.me/create'
import { isOk, isErr } from '@bfra.me/es/result'

async function safeCreateProject(name: string, outputDir: string) {
  // Validate inputs first
  const nameResult = validateProjectName(name, { allowScoped: true })
  if (isErr(nameResult)) {
    throw new Error(`Invalid project name: ${nameResult.error.message}`)
  }

  const pathResult = validateProjectPath(outputDir)
  if (isErr(pathResult)) {
    throw new Error(`Invalid output path: ${pathResult.error.message}`)
  }

  // Now safe to use validated, branded types
  return createPackage({
    name: nameResult.data,
    outputDir: pathResult.data,
    template: 'library',
    interactive: false
  })
}
```

### Using Functional Factories

Prefer functional factories over class instantiation:

```typescript
import { createLLMClient, createTemplateResolver } from '@bfra.me/create'
import { isOk } from '@bfra.me/es/result'

// Create LLM client with auto provider detection
const llm = createLLMClient({ provider: 'auto' })

// Create template resolver with custom config
const resolver = createTemplateResolver({
  builtinTemplatesDir: './custom-templates',
  strictMode: true
})

// Use Result-based methods for safety
const resolveResult = resolver.resolveWithResult('library')
if (isOk(resolveResult)) {
  const validationResult = await resolver.validateWithResult(resolveResult.data)
  if (isOk(validationResult)) {
    console.log('Template is valid!')
  }
}
```

### Handling AI Feature Availability

Check AI availability before using AI-powered features:

```typescript
import { createLLMClient } from '@bfra.me/create'
import { isOk } from '@bfra.me/es/result'

const client = createLLMClient({ provider: 'auto' })

// Check if any AI provider is available
if (client.isAvailable()) {
  const result = await client.complete('Analyze this project')
  if (isOk(result) && result.data.success) {
    console.log('AI Response:', result.data.content)
  }
} else {
  console.log('AI features not available. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.')
}
```

### Template Processing Pipeline

Use the canonical pipeline for complex template operations:

```typescript
import { createTemplateProcessingPipeline } from '@bfra.me/create'
import { isOk } from '@bfra.me/es/result'

const pipeline = createTemplateProcessingPipeline({
  cacheEnabled: true,
  verbose: true,
  dryRun: false,
  ignorePatterns: ['**/node_modules/**', '**/.git/**']
})

const result = await pipeline.execute(
  { type: 'builtin', location: 'library' },
  './output',
  {
    projectName: 'my-library',
    author: 'Your Name',
    description: 'A great library'
  }
)

if (isOk(result)) {
  console.log('Files processed:', result.data.operations.length)
  console.log('Stage timings:', result.data.stats.stageTimings)
}
```

### Error Code Handling

Handle specific error codes for appropriate user feedback:

```typescript
import {
  createPackage,
  TemplateErrorCode,
  AIErrorCode,
  CLIErrorCode,
  isBaseError
} from '@bfra.me/create'
import { isErr } from '@bfra.me/es/result'

const result = await createPackage(options)

if (isErr(result) && isBaseError(result.error)) {
  switch (result.error.code) {
    case TemplateErrorCode.TEMPLATE_NOT_FOUND:
      console.log('Template not found. Try: create --template library')
      break
    case TemplateErrorCode.TEMPLATE_FETCH_FAILED:
      console.log('Network error. Check your internet connection.')
      break
    case CLIErrorCode.DIRECTORY_EXISTS:
      console.log('Directory exists. Use --force to overwrite.')
      break
    case CLIErrorCode.PATH_TRAVERSAL_ATTEMPT:
      console.log('Security: Invalid path detected.')
      break
    case AIErrorCode.AI_API_KEY_MISSING:
      console.log('AI requires OPENAI_API_KEY or ANTHROPIC_API_KEY')
      break
    default:
      console.log('Error:', result.error.message)
  }
}
```

## API Reference

### Core Functions

#### `createPackage(options)`

Creates a new project from a template with Result-based error handling.

```typescript
function createPackage(
  options: CreateCommandOptions
): Promise<Result<{projectPath: string}, CreateError>>
```

**Parameters:**
- `options.name` - Project name (required unless interactive)
- `options.template` - Template identifier (builtin name, GitHub repo, URL, or local path)
- `options.outputDir` - Output directory path
- `options.interactive` - Enable interactive prompts (default: true for CLI, false for API)
- `options.description` - Project description
- `options.author` - Project author
- `options.version` - Initial version (default: "1.0.0")
- `options.packageManager` - Package manager to use (npm, yarn, pnpm, bun)
- `options.git` - Initialize git repository (default: true)
- `options.install` - Install dependencies (default: true)
- `options.force` - Overwrite existing files (default: false)
- `options.dryRun` - Preview changes without modification (default: false)
- `options.verbose` - Enable detailed logging (default: false)

**Returns:** `Promise<Result<{projectPath: string}, CreateError>>`

**Error Codes:** `VALIDATION_FAILED`, `TEMPLATE_NOT_FOUND`, `TEMPLATE_FETCH_FAILED`, `DIRECTORY_EXISTS`, `FILE_SYSTEM_ERROR`, `AI_API_KEY_MISSING` (if AI requested)

#### `addFeatureToProject(options)`

Adds a feature to an existing project with automatic conflict detection and backup.

```typescript
function addFeatureToProject(
  options: AddFeatureOptions
): Promise<Result<void, CreateError>>
```

**Parameters:**
- `options.feature` - Feature identifier (e.g., 'eslint', 'vitest', 'component')
- `options.targetDir` - Target directory (default: current directory)
- `options.skipConfirm` - Skip confirmation prompts (default: false)
- `options.verbose` - Enable detailed logging (default: false)
- `options.dryRun` - Preview changes without modification (default: false)
- `options.options` - Feature-specific configuration

**Returns:** `Promise<Result<void, CreateError>>`

**Error Codes:** `PROJECT_DETECTION_FAILED`, `FEATURE_NOT_FOUND`, `FILE_SYSTEM_ERROR`

### Factory Functions

#### `createLLMClient(config)`

Creates an AI LLM client with auto provider detection.

```typescript
function createLLMClient(config?: {
  provider?: 'openai' | 'anthropic' | 'auto'
  apiKey?: string
  options?: Record<string, unknown>
}): LLMClientInstance
```

#### `createTemplateFetcher(options)`

Creates a template fetcher with caching support.

```typescript
function createTemplateFetcher(options?: {
  cacheDir?: string
  cacheEnabled?: boolean
  verbose?: boolean
}): TemplateFetcherInstance
```

#### `createTemplateValidator()`

Creates a template validator for metadata and structure validation.

```typescript
function createTemplateValidator(): TemplateValidatorInstance
```

#### `createProjectAnalyzer()`

Creates a project analyzer for detecting project type and configuration.

```typescript
function createProjectAnalyzer(): ProjectAnalyzerInstance
```

### Prompt Functions

#### `templateSelection(initialTemplate?)`

Interactive template selection with preview.

```typescript
function templateSelection(
  initialTemplate?: string
): Promise<Result<TemplateSelection, TemplateError>>
```

#### `projectCustomization(input)`

Collects project customization details through interactive prompts.

```typescript
function projectCustomization(input: {
  projectName: string
  template: TemplateSelection
  initialOptions: CreateCommandOptions
  aiRecommendations?: DependencyRecommendation[]
}): Promise<ProjectCustomization>
```

### Utility Functions

#### `getAICapabilities(provider?)`

Detects available AI providers from environment variables.

```typescript
function getAICapabilities(provider?: string): {
  enabled: boolean
  openai: boolean
  anthropic: boolean
  provider: 'openai' | 'anthropic' | 'none'
}
```

#### `validateProjectName(name, options?)`

Validates project name against npm naming rules.

```typescript
function validateProjectName(
  name: string,
  options?: { allowScoped?: boolean }
): Result<PackageName, ValidationError>
```

#### `validateProjectPath(path, options?)`

Validates and sanitizes project path.

```typescript
function validateProjectPath(
  path: string,
  options?: { allowRelative?: boolean }
): Result<ProjectPath, ValidationError>
```

### Error Codes

#### Template Errors

- `TEMPLATE_NOT_FOUND` - Template source not found
- `TEMPLATE_INVALID` - Template structure or metadata invalid
- `TEMPLATE_FETCH_FAILED` - Network error fetching template
- `TEMPLATE_PARSE_ERROR` - Template file parsing error
- `TEMPLATE_RENDER_ERROR` - Template rendering error
- `TEMPLATE_METADATA_INVALID` - Invalid template.json
- `TEMPLATE_VARIABLE_MISSING` - Required variable not provided
- `TEMPLATE_CACHE_ERROR` - Template cache operation failed

#### AI Errors

- `AI_PROVIDER_UNAVAILABLE` - No AI provider configured
- `AI_API_KEY_MISSING` - Required API key not found
- `AI_API_KEY_INVALID` - API key authentication failed
- `AI_REQUEST_FAILED` - AI API request failed
- `AI_RESPONSE_INVALID` - AI response parsing error
- `AI_RATE_LIMIT` - AI provider rate limit exceeded
- `AI_TIMEOUT` - AI request timeout
- `AI_ANALYSIS_FAILED` - AI analysis processing error

#### CLI Errors

- `INVALID_INPUT` - User input validation failed
- `INVALID_PROJECT_NAME` - Project name invalid
- `INVALID_PATH` - File path invalid
- `PATH_TRAVERSAL_ATTEMPT` - Security: path traversal detected
- `DIRECTORY_EXISTS` - Target directory already exists
- `DIRECTORY_NOT_EMPTY` - Directory not empty
- `FILE_SYSTEM_ERROR` - File system operation failed
- `PERMISSION_DENIED` - Insufficient permissions
- `COMMAND_FAILED` - Command execution failed
- `VALIDATION_FAILED` - Input validation failed

#### Project Errors

- `PROJECT_DETECTION_FAILED` - Cannot detect project type
- `PACKAGE_JSON_NOT_FOUND` - No package.json found
- `PACKAGE_JSON_INVALID` - Invalid package.json format
- `PACKAGE_MANAGER_NOT_DETECTED` - Cannot detect package manager

### Type Exports

```typescript
import type {
  // Main types
  CreateCommandOptions,
  CreateError,
  TemplateSource,
  TemplateMetadata,
  TemplateSelection,
  ProjectCustomization,

  // Error types
  TemplateError,
  AIError,
  CLIError,
  ProjectError,

  // Branded types
  BrandedTemplateSource,
  ProjectPath,
  PackageName,

  // Result types
  Result
} from '@bfra.me/create'
```

## Troubleshooting

### Common Issues and Solutions

#### Template Not Found

**Problem:** `TEMPLATE_NOT_FOUND` error when trying to use a template.

**Solutions:**
```bash
# Verify builtin template name
create my-project --template library  # Use: default, library, cli, node, react

# Check GitHub repository format
create my-project --template user/repo  # Or: github:user/repo

# Test local path exists
create my-project --template ./path/to/template

# Enable verbose mode for debugging
create my-project --template mytemplate --verbose
```

#### Directory Already Exists

**Problem:** `DIRECTORY_EXISTS` error when target directory exists.

**Solutions:**
```bash
# Use --force to overwrite
create my-project --force

# Choose different output directory
create my-project --output-dir ./my-project-v2

# Clean up existing directory first
rm -rf ./my-project && create my-project
```

#### AI Features Not Working

**Problem:** `AI_API_KEY_MISSING` or `AI_PROVIDER_UNAVAILABLE` errors.

**Solutions:**
```bash
# Set OpenAI API key
export OPENAI_API_KEY="your-key-here"

# Or set Anthropic API key
export ANTHROPIC_API_KEY="your-key-here"

# Verify environment variable is set
echo $OPENAI_API_KEY

# Check AI capabilities programmatically
```

```typescript
import { getAICapabilities } from '@bfra.me/create'

const capabilities = getAICapabilities()
console.log('OpenAI available:', capabilities.openai)
console.log('Anthropic available:', capabilities.anthropic)
```

#### Network/Fetch Errors

**Problem:** `TEMPLATE_FETCH_FAILED` when downloading templates.

**Solutions:**
```bash
# Check internet connectivity
ping github.com

# Try with local template instead
create my-project --template ./local-template

# Clear template cache
rm -rf ~/.cache/@bfra.me/create/templates

# Use verbose mode to see detailed error
create my-project --template user/repo --verbose
```

#### Permission Denied Errors

**Problem:** `PERMISSION_DENIED` when creating files.

**Solutions:**
```bash
# Check directory permissions
ls -la ./target-directory

# Use directory you have write access to
create my-project --output-dir ~/projects/my-project

# Run with appropriate permissions (avoid sudo if possible)
```

#### Package Manager Detection Issues

**Problem:** Wrong package manager detected or `PACKAGE_MANAGER_NOT_DETECTED`.

**Solutions:**
```bash
# Explicitly specify package manager
create my-project --package-manager pnpm

# Install preferred package manager first
npm install -g pnpm

# Check what's detected
```

```typescript
import { detect } from 'package-manager-detector'

const pm = await detect({ cwd: process.cwd() })
console.log('Detected:', pm?.name)
```

#### Test Coverage Validation

**Problem:** Tests failing after integrating Result pattern.

**Solutions:**
```typescript
// Update assertions from:
expect(result.success).toBe(true)

// To Result guards:
import { isOk, isErr } from '@bfra.me/es/result'
expect(isOk(result)).toBe(true)

// Check error codes explicitly:
if (isErr(result)) {
  expect(result.error.code).toBe('EXPECTED_ERROR_CODE')
}
```

### Debug Mode

Enable maximum debugging information:

```bash
# CLI with all debug flags
create my-project \
  --template library \
  --verbose \
  --dry-run

# Programmatic with error details
```

```typescript
import { createPackage, CLIErrorCode } from '@bfra.me/create'
import { isErr } from '@bfra.me/es/result'

const result = await createPackage({
  name: 'my-project',
  template: 'library',
  verbose: true,
  dryRun: true  // Preview without changes
})

if (isErr(result)) {
  console.error('Error code:', result.error.code)
  console.error('Message:', result.error.message)
  console.error('Full error:', JSON.stringify(result.error, null, 2))
}
```

### Getting Additional Help

Still stuck? Here are more resources:

1. **Check GitHub Issues**: Search for similar problems at [github.com/bfra-me/works/issues](https://github.com/bfra-me/works/issues)
2. **Ask in Discussions**: Post questions at [github.com/bfra-me/works/discussions](https://github.com/bfra-me/works/discussions)
3. **Review Migration Guide**: See [MIGRATION.md](./MIGRATION.md) for v0.6.x → v0.7.0 changes
4. **Check Examples**: Browse [test/](./test/) directory for usage examples
5. **Enable Verbose Logging**: Always use `--verbose` when reporting issues

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/bfra-me/works/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/bfra-me/works.git
cd works/packages/create

# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Test CLI locally
pnpm dev create test-project
```

### Creating Templates

1. Create template directory structure
2. Add `template.json` with metadata
3. Use `.eta` extension for files with variables
4. Test with local path: `create test --template ./path/to/template`

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/bfra-me/works/tree/main/packages/create)
- 🐛 [Report Issues](https://github.com/bfra-me/works/issues)
- 💬 [Discussions](https://github.com/bfra-me/works/discussions)
- 📧 [Email Support](mailto:contact@bfra.me)

---

Made with ❤️ by the [bfra.me](https://bfra.me) team
