# bfra-me/works Repository Analysis

## Overview

This repository, `bfra-me/works`, is a monorepo for various development tools and configurations related to the bfra.me ecosystem. It contains multiple packages that provide standardized configurations and utilities for JavaScript/TypeScript projects.

## Repository Structure

The repository is organized as a monorepo using pnpm workspaces with the following key directories:

- `packages/`: The main directory containing individual packages
  - `create/`: A package generator/scaffolding tool
  - `eslint-config/`: ESLint configuration presets
  - `prettier-config/`: Prettier configuration presets
  - `prettier-plugins/`: Custom Prettier plugins
  - `semantic-release/`: Tools related to semantic versioning
  - `tsconfig/`: TypeScript configuration presets
- `.github/`: GitHub-related configurations, including workflows for CI/CD
- `scripts/`: Utility scripts for repository management

## Technologies & Tools

### Core Technologies

- **Language**: TypeScript/JavaScript (Node.js)
- **Node.js Version**: 22.14.0 (specified in `.node-version`)
- **Module System**: ES Modules (specified as `"type": "module"` in package.json)

### Package Management

- **Package Manager**: pnpm (v10.8.0)
- **Workspace Management**: pnpm workspaces (configured in `pnpm-workspace.yaml`)
- **Dependency Resolution**: Custom overrides defined in package.json

### Build & Development Tools

- **TypeScript Configuration**: Custom configurations in the `tsconfig` package
- **Build Tools**: Likely using tsup based on configuration files
- **Runtime Configuration**: mise.toml for runtime settings

### Linting & Formatting

- **ESLint**: Custom configurations in the `eslint-config` package
- **Prettier**: Custom configurations in the `prettier-config` package
- **Markdown Linting**: markdownlint-cli2 (configured in `.markdownlint-cli2.yaml`)
- **EditorConfig**: Basic editor settings in `.editorconfig`

### Testing & Quality Assurance

- **Testing Framework**: Vitest (based on dependencies and ESLint configuration)
- **Code Coverage**: @vitest/coverage-v8
- **Pre-commit Hooks**: Husky with lint-staged
- **Type Checking**: TypeScript

### Continuous Integration & Deployment

- **GitHub Actions Workflows**:
  - Main CI/CD pipeline (`main.yaml`)
  - Automated releases with Changesets (`auto-release.yaml`)
  - Dependency updates with Renovate (`renovate.yaml`)
  - Security scanning with CodeQL and Scorecard

### Versioning & Publishing

- **Versioning Strategy**: Changesets for versioning (`.changeset/` directory)
- **Package Publication**: Automated npm publishing via GitHub Actions
- **Semantic Versioning**: Enforced through tooling and processes

### AI Development Assistance

The repository includes a comprehensive set of Cursor rules in the `.cursor/rules` directory that provide guidance to AI assistants working with the codebase. These rules serve as specialized documentation that is automatically provided to the AI when relevant files or topics are discussed.

#### Rule Structure and Organization

The repository contains 12 distinct Cursor rule files:

1. **cursor-rules-location.mdc**: Enforces standards for placing and organizing Cursor rule files themselves
2. **repo-rule-recommender.mdc**: Workflow for recommending and creating cursor rules based on repo analysis
3. **rule-automation-script.mdc**: Provides automation scripts for rule management
4. **typescript-patterns.mdc**: Guidelines for writing efficient TypeScript code
5. **prettier-config-usage.mdc**: Guide for implementing Prettier formatting
6. **changeset-workflow.mdc**: Guide for using Changesets for versioning
7. **eslint-config-usage.mdc**: Guidelines for implementing ESLint configurations
8. **monorepo-structure.mdc**: Guide to the pnpm workspace structure
9. **development-workflow.mdc**: Step-by-step guide for development processes
10. **cursor-rules-creation.mdc**: Standards for creating new Cursor rules
11. **mcp-tools-usage.mdc**: Guidelines for using Model Context Protocol tools
12. **repo-analyzer.mdc**: Generic tool for analyzing repository structure

Each rule file follows a consistent structure with a Markdown header title, a brief description, and a `<rule>` tag containing name and description attributes, filters that determine when the rule is applied, actions (typically suggestions) with detailed messages, example scenarios, and metadata.

#### Rule Activation and Categories

The rules use various triggers including file extension filters, file path filters, content filters, message filters, and context filters to determine when they should be activated. They can be categorized into several functional groups:

1. **Meta-Rules** (rules about rules): cursor-rules-location.mdc, cursor-rules-creation.mdc, repo-rule-recommender.mdc, rule-automation-script.mdc
2. **Code Style and Standards**: typescript-patterns.mdc, eslint-config-usage.mdc, prettier-config-usage.mdc
3. **Repository and Workflow Guidance**: monorepo-structure.mdc, development-workflow.mdc, changeset-workflow.mdc
4. **Utility and Analysis Tools**: repo-analyzer.mdc, mcp-tools-usage.mdc

The rules support different application modes (Always, Auto Attached, Agent Requested, and Manual) and provide various types of assistance including documentation, guidance, code patterns, tooling, and analysis.

This "AI-first documentation system" integrates into the AI workflow by providing context-specific information at the right time, enforcing consistent standards, reducing repetitive explanations, enabling automated analysis, and documenting best practices in a format directly accessible to the AI.

## Packages Overview

### create (@bfra.me/create)

The `create` package is a command-line utility designed to generate new packages or projects from customizable templates. It provides both a CLI interface and a programmatic API for creating standardized project structures.

#### Key Features

- **Template-Based Generation**: Creates new packages based on predefined or custom templates
- **Command-Line Interface**: Offers a simple CLI for quick project scaffolding
- **Programmatic API**: Can be integrated into other tools or scripts
- **Customizable Templates**: Supports different project templates with variable substitution

#### Implementation Details

1. **Core Components**:
   - CLI wrapper using `cac` for command-line parsing
   - Template engine using `@sxzz/create` for scaffolding
   - Filesystem operations for directory and file manipulation

2. **Template Structure**:
   - Default template includes basic package.json and index.ts
   - Supports template variables (e.g., `{{packageName}}`, `{{description}}`, `{{author}}`)
   - Templates are stored in the `src/templates` directory

3. **Usage Patterns**:
   - Command-line: `create <package-name> [options]`
   - Programmatic: `createPackage(options)`

4. **Options**:
   - `template`: Specifies which template to use (default: "default")
   - `outputDir`: Target directory for the new package
   - `version`: Package version
   - `description`: Package description
   - `author`: Package author

#### Dependencies

The package relies on several key dependencies:
- `@sxzz/create`: Core template generation engine
- `cac`: Command-line argument parsing
- `consola`: Console logging utilities
- `@clack/prompts`: Interactive CLI prompts

#### Testing

The package includes unit tests using Vitest, with mocking of the filesystem and external dependencies to ensure proper functionality across different scenarios.

#### Example Usage

From the command line:
```bash
npx @bfra.me/create my-package --description "My new package" --author "John Doe"
```

Programmatically:
```javascript
import {createPackage} from "@bfra.me/create";

await createPackage({
  outputDir: "./my-package",
  description: "My new package",
  author: "John Doe"
});
```

### eslint-config (@bfra.me/eslint-config)

The `eslint-config` package provides a comprehensive, modular, and highly configurable ESLint setup for JavaScript and TypeScript projects. It uses ESLint's Flat Config API and offers a wide range of presets and rules for various file types and frameworks.

#### Key Features

- **Modern Architecture**: Uses ESLint's Flat Config format (introduced in ESLint v9)
- **Type Safety**: Fully typed configuration with TypeScript
- **Modular Design**: Provides separate configs for different file types and use cases
- **Smart Defaults**: Automatically detects and configures based on project dependencies
- **Editor Integration**: Special settings for improved editor-based linting experience

#### Configuration Structure

The package organizes its configurations into distinct modules:

1. **Core Configurations**:
   - `javascript`: Strict JavaScript rules with best practices
   - `typescript`: TypeScript-specific rules with optional type-aware linting
   - `node`: Node.js specific rules
   - `imports`: Rules for import/export statements
   - `eslint-comments`: Rules for ESLint directive comments

2. **File Type Configurations**:
   - `jsonc`: Rules for JSON, JSON5, and JSONC files
   - `yaml`: Rules for YAML files
   - `toml`: Rules for TOML files
   - `markdown`: Rules for Markdown files

3. **Framework & Tool Specific**:
   - `vitest`: Rules for Vitest test files
   - `prettier`: Integration with Prettier

4. **Code Quality Tools**:
   - `perfectionist`: Code organization and sorting rules
   - `unicorn`: Additional quality and consistency rules
   - `regexp`: Regular expression specific rules
   - `jsdoc`: Documentation comment rules

5. **Additional Features**:
   - `ignores`: Git-aware ignores (uses .gitignore)
   - `packageJson`: package.json validation

#### Type-Aware Linting

The package offers sophisticated type-aware linting for TypeScript projects:

- Configurable via `tsconfigPath` option
- Separate rule sets for type-aware and non-type-aware linting
- Special handling for mixed content files (like Markdown with TypeScript code blocks)

#### Rule Highlights

The configuration enforces a comprehensive set of rules, including:

- Modern JavaScript/TypeScript practices
- Consistent code style and formatting
- Error prevention and code quality checks
- Performance and security considerations
- Import/export organization

#### Usage Options

The package offers extensive customization via options:

```
defineConfig({
  // Core options
  name: 'project-name',
  gitignore: true,

  // Language support
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: { /* type-aware options */ }
  },
  jsx: true,

  // File type support
  jsonc: true,
  yaml: true,
  toml: true,
  markdown: true,

  // Framework support
  vitest: true,

  // Tool integration
  prettier: true,
  perfectionist: true,

  // Custom overrides
  overrides: { /* rule overrides */ }
})
```

#### Dependencies

The package relies on a set of core ESLint plugins:

- `typescript-eslint`: TypeScript support
- `eslint-plugin-import-x`: Import/export rules
- `eslint-plugin-unicorn`: Additional quality rules
- `eslint-plugin-jsdoc`: Documentation rules
- `eslint-plugin-perfectionist`: Code organization
- `eslint-plugin-regexp`: Regular expression rules

### prettier-config (@bfra.me/prettier-config)

The `prettier-config` package provides standardized Prettier configurations for consistent code formatting across bfra.me projects. It offers a default configuration and multiple specialized presets for different use cases.

#### Key Features

- **Modular Design**: Core configuration with multiple specialized presets
- **Customizable Presets**: Options for different line lengths and formatting styles
- **Type Safety**: Fully typed configurations using TypeScript
- **Overrides System**: Special formatting rules for specific file patterns
- **Smart File Handling**: Automatic exclusion of build outputs and unmodifiable files

#### Configuration Structure

The package is organized around a default configuration with several specialized presets:

1. **Base Configurations**:
   - `default`: The standard configuration with 100 character line width and no semicolons
   - `defineConfig`: A utility for creating and freezing Prettier configurations

2. **Line Length Presets** (named after alcohol proof, indicating "strength"):
   - `80-proof`: 80 character line width for stricter formatting
   - `100-proof`: 100 character line width (same as default)
   - `120-proof`: 120 character line width for more relaxed formatting

3. **Style Presets**:
   - `semi`: Enforces semicolons at the end of statements
   - Combined presets like `semi-120-proof`: Semicolons with 120 character line width

#### Default Configuration Highlights

The default configuration includes the following key settings:

- `printWidth`: 100 characters
- `semi`: false (no semicolons)
- `singleQuote`: true (use single quotes)
- `bracketSpacing`: false (no spaces in object literals: `{id: 5}`)
- `arrowParens`: 'avoid' (omit parentheses for single parameter arrow functions)
- `endOfLine`: 'auto' (maintain end of line format)

The configuration also includes specialized overrides for:
- Files not under version control or generated by build tools
- VS Code configuration files
- Markdown files

#### Implementation Details

1. **Configuration Freezing**:
   - Uses `Object.freeze()` to prevent accidental modification of configurations
   - Recursively freezes nested configuration objects and arrays

2. **Export System**:
   - Named exports for all configurations
   - Default export for the standard configuration
   - Path-specific exports for direct imports (e.g., `@bfra.me/prettier-config/120-proof`)

3. **Testing Approach**:
   - Comprehensive tests for all configurations
   - Test fixtures showing before/after formatting
   - Verification against snapshots to prevent regression

#### Usage Patterns

The configuration can be used in several ways:

1. **Package.json Reference**:
   ```json
   {
     "prettier": "@bfra.me/prettier-config"
   }
   ```

2. **Specific Preset Import**:
   ```javascript
   // prettier.config.js
   import config from '@bfra.me/prettier-config/120-proof'
   export default config
   ```

3. **Configuration Extension**:
   ```javascript
   // prettier.config.js
   import config from '@bfra.me/prettier-config'
   export default {
     ...config,
     semi: true,
     // Other custom overrides
   }
   ```

#### Dependencies

The package has minimal dependencies:
- `prettier`: Peer dependency (^3.0.0)
- Development tools: TypeScript, tsup (for building)

This standardized configuration ensures consistent code style across the bfra.me ecosystem while providing flexibility through multiple presets for different project needs.

### prettier-plugins (@bfra.me/prettier-plugins)

Custom Prettier plugins that extend the functionality of Prettier.

### semantic-release (@bfra.me/semantic-release)

The `semantic-release` package provides a shareable configuration and type definitions for semantic-release, enabling TypeScript-based configuration with full type checking and IntelliSense support.

#### Key Features

- **Type-Safe Configuration**: Fully typed semantic-release configuration using TypeScript
- **IntelliSense Support**: Provides code completion and validation in IDEs
- **Plugin Type Definitions**: Comprehensive typings for official semantic-release plugins
- **Extensible Type System**: Support for custom plugin configuration through type extension

#### Implementation Details

1. **Configuration Utility**:
   - `defineConfig` function for creating type-checked semantic-release configurations
   - Type safety for all standard semantic-release options

2. **Type System Structure**:
   - Core configuration types for semantic-release options
   - Plugin-specific type definitions with detailed configuration options
   - Extensible system for custom plugin type definitions

3. **Plugin Support**:
   - Built-in type definitions for official semantic-release plugins:
     - `@semantic-release/commit-analyzer`
     - `@semantic-release/release-notes-generator`
     - `@semantic-release/npm`
     - `@semantic-release/github`
   - Type-safe configuration options for each plugin

4. **Extensibility**:
   - Interface extension mechanism for third-party plugins
   - Support for custom configuration options via declaration merging

#### Usage Patterns

The package is designed to be used in TypeScript projects to configure semantic-release with full type checking:

```typescript
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    ["@semantic-release/release-notes-generator", {
      preset: "angular"
    }],
    "@semantic-release/changelog",
    "@semantic-release/npm",
    ["@semantic-release/github", {
      assets: "dist/*.tgz"
    }],
    "@semantic-release/git"
  ]
})
```

#### Type Extension Mechanism

The package provides a mechanism for third-party plugins to extend the type system:

```typescript
// In third-party plugin declaration file
declare module '@bfra.me/semantic-release' {
  export interface CustomPluginConfig {
    'semantic-release-custom-plugin': {
      option1: string;
      option2?: boolean;
    }
  }
}
```

#### Dependencies

The package has minimal dependencies:
- `semantic-release`: Peer dependency (^23.0.0)
- Type definition libraries: `type-fest` for utility types
- Development tools: TypeScript, tsup (for building)

#### Testing

The package includes type-checking tests to ensure type safety:
- Type compatibility tests using Vitest
- Type assertion tests for configuration objects

This package ensures type safety in semantic-release configurations, reducing errors and improving developer experience through IDE integrations.

### tsconfig (@bfra.me/tsconfig)

The `tsconfig` package provides shared TypeScript configuration for the bfra.me ecosystem, ensuring consistent TypeScript settings across projects.

#### Key Features

- **Strict Type Checking**: Comprehensive type safety with strict mode and additional safety flags
- **Modern JavaScript Support**: Targets ES2022 with ES2023 library support
- **Flexible Module Handling**: Uses "Preserve" for module and "Bundler" for moduleResolution
- **Developer Experience Enhancements**: Source maps and declaration generation for better IDE integration
- **ESM Compatibility**: verbatimModuleSyntax enabled for better ESM/CJS interoperability

#### Configuration Details

The configuration includes carefully selected compiler options:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "lib": ["ES2023"],
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "target": "ES2022",
    "verbatimModuleSyntax": true
    // Additional options omitted for brevity
  }
}
```

#### Usage Patterns

The package is designed to be extended in project-specific tsconfig.json files:

```json
{
  "extends": "@bfra.me/tsconfig"
}
```

This approach allows projects to inherit the base configuration while still being able to customize settings as needed.

#### Implementation Details

1. **Minimal Package Structure**:
   - Simple JSON configuration file without compiled code
   - Well-documented with clear usage instructions
   - Comprehensive test suite validating configuration correctness

2. **Evolution Strategy**:
   - Originally extended @tsconfig/strictest, now contains all settings directly
   - Regular updates to align with TypeScript best practices
   - Careful migration between TypeScript versions and module resolution strategies

3. **Quality Assurance**:
   - Validated against TypeScript's parsing logic
   - Conformance to the official schema from SchemaStore
   - Tests run with Vitest to ensure configuration validity

#### Dependencies

The package has minimal dependencies:
- Development tools: TypeScript, Vitest for testing
- Validation tools: ajv and ajv-draft-04 for schema validation

This standardized configuration serves as a foundational piece of the bfra.me development environment, reducing configuration duplication and ensuring consistent TypeScript behavior across all packages in the ecosystem.

### scripts (@bfra.me/scripts)

The `scripts` package is an internal utility package for the bfra.me monorepo that provides various helper scripts to automate repository maintenance tasks.

#### Key Features

- **Changeset Management**: Utilities for managing changeset files
- **Environment Variable Configuration**: Support for configuration via environment variables
- **Dry-Run Mode**: Preview capabilities for potentially destructive operations

#### Implementation Details

1. **Core Components**:
   - Node.js file system operations for reading and writing files
   - Command-line handling with environment variable configuration
   - Error handling with informative logging

2. **Available Scripts**:
   - `clean-changesets`: Removes private package entries from changeset files
     - Useful when working with Renovate and private packages that should not be included in versioning
     - Configurable via `PRIVATE_PACKAGES` and `DRY_RUN` environment variables

3. **Usage Patterns**:
   - Direct script execution: `pnpm tsx scripts/src/clean-changesets.ts`
   - Through package exports: `pnpm tsx -e "import '@bfra.me/scripts/clean-changesets'"`
   - With configuration: `PRIVATE_PACKAGES="@api/test-utils,@api/other-private" pnpm tsx scripts/src/clean-changesets.ts`

#### Dependencies

The package has minimal dependencies:
- `consola`: Console logging utilities
- Internal packages: `@bfra.me/eslint-config`, `@bfra.me/tsconfig`
- Development tools: TypeScript, tsx, Vitest

#### Testing

The package includes comprehensive tests for each script:
- Tests run with Vitest
- File system mocking for isolation
- Coverage for error cases and edge conditions
- Verification of dry-run mode functionality

## Development Workflows

The workspace root (`@bfra.me/works`) serves as the container for the monorepo and provides extensive tooling and automation for development workflows.

### Root Package Configuration

The root package.json establishes the foundation for the monorepo:

```json
{
  "name": "@bfra.me/works",
  "version": "0.0.0-development",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.8.0"
}
```

Key aspects of the configuration:
- Marked as `private: true` to prevent publishing
- Uses ES Modules via `"type": "module"`
- Specifies pnpm v10.8.0 as the package manager
- Provides extensive npm scripts for development workflows

### Development Scripts

The root package provides a comprehensive set of npm scripts that facilitate various development workflows:

1. **Setup and Installation**:
   ```bash
   pnpm bootstrap      # Installs dependencies
   pnpm clean          # Removes node_modules, build artifacts, and caches
   ```

2. **Development Flow**:
   ```bash
   pnpm dev            # Runs dev mode across all packages
   pnpm watch          # Builds and watches for changes
   ```

3. **Quality Assurance**:
   ```bash
   pnpm lint           # Runs all linting checks
   pnpm fix            # Fixes linting issues automatically
   pnpm test           # Runs tests across all packages
   pnpm type-check     # Runs TypeScript type checking
   pnpm validate       # Runs lint, test, and build in sequence
   ```

4. **Build and Publishing**:
   ```bash
   pnpm build                # Builds all packages
   pnpm version-changesets   # Creates versions based on changesets
   pnpm publish-changesets   # Publishes packages to npm
   pnpm clean-changesets     # Cleans private package entries from changesets
   ```

### Quality Assurance Tools

The repository employs several tools to maintain code quality:

1. **Pre-commit Hooks**:
   - Uses Husky to run `lint-staged` before commits
   - Automatically lints and fixes files
   - Sorts package.json files

2. **Linting and Formatting**:
   - ESLint with custom configuration
   - Prettier with standardized presets
   - Markdown linting via markdownlint-cli2
   - Package validation with Publint

3. **TypeScript Configuration**:
   - Extends the custom tsconfig package
   - Strict type checking enabled
   - Special configuration for ESLint integration

4. **Editor Settings**:
   - EditorConfig for consistent formatting
   - 100 character line length
   - UTF-8 encoding and LF line endings

### CI/CD Automation

The repository features comprehensive CI/CD automation using GitHub Actions:

1. **Main Workflow**:
   - Runs on pull requests and pushes to main
   - Performs linting and testing
   - Handles publishing via Changesets

2. **Auto-Release Workflow**:
   - Runs weekly (Sundays at 6 PM UTC)
   - Checks for pending changesets
   - Creates or updates release PRs
   - Enables auto-merge for ready PRs

3. **Renovate Workflow**:
   - Automates dependency updates
   - Integrates with the main CI workflow

### Release Process

The repository uses a modern, automated release process:

1. **Changesets for Versioning**:
   - Developers create changesets for changes
   - Changesets are cleaned to remove private packages
   - Versions are bumped and changelogs generated automatically

2. **Release Automation**:
   - Automatic PR creation for pending changesets
   - Auto-merge capability for release PRs
   - Automatic publishing to npm on merge

3. **Dependency Management**:
   - Renovate for automated dependency updates
   - Strict version pinning via npmrc configuration
   - Custom dependency overrides when needed

### Monorepo Structure

The workspace is configured through pnpm-workspace.yaml:

```yaml
packages:
  - .
  - 'packages/*'
  - scripts
```

This configuration:
- Treats the root directory as a package
- Includes all directories under packages/
- Treats the scripts directory as a separate package
- Enables packages to reference each other using `workspace:*`

## Conclusion

The `bfra-me/works` repository represents a well-organized set of development tools and configurations designed to standardize development practices across projects. It leverages modern JavaScript/TypeScript development practices, with a strong focus on type safety, code quality, and automated workflows. The use of a monorepo structure with pnpm workspaces allows for efficient management of multiple related packages.
