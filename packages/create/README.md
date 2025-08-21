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
