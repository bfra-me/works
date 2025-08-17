import type {ProjectAnalysis} from '../types'
import type {LLMClient} from './llm-client'

/**
 * Represents different types of documentation that can be generated
 */
export type DocumentationType =
  | 'readme'
  | 'api'
  | 'contributing'
  | 'changelog'
  | 'license'
  | 'getting-started'
  | 'configuration'
  | 'examples'
  | 'troubleshooting'

/**
 * Represents the structure and content of a documentation file
 */
export interface DocumentationFile {
  /** File path relative to project root */
  filePath: string
  /** File content in markdown format */
  content: string
  /** Type of documentation */
  type: DocumentationType
  /** Priority for generation (higher = more important) */
  priority: number
  /** Whether this file should overwrite existing content */
  overwrite: boolean
  /** Metadata about the documentation */
  metadata: {
    title: string
    description: string
    sections: string[]
    estimatedReadTime?: number
    lastGenerated: string
  }
}

/**
 * Configuration options for documentation generation
 */
export interface DocumentationOptions {
  /** Whether to use AI for content generation */
  useAI?: boolean
  /** Project name */
  projectName?: string
  /** Project description */
  projectDescription?: string
  /** Author information */
  author?: {
    name: string
    email?: string
    url?: string
  }
  /** License type */
  license?: string
  /** Repository URL */
  repositoryUrl?: string
  /** Types of documentation to generate */
  documentationTypes?: DocumentationType[]
  /** Whether to include code examples */
  includeExamples?: boolean
  /** Whether to include API documentation */
  includeApiDocs?: boolean
  /** Custom sections to include in README */
  customSections?: string[]
  /** Template style (basic, detailed, comprehensive) */
  templateStyle?: 'basic' | 'detailed' | 'comprehensive'
  /** Language/framework specific documentation */
  framework?: string
  /** Whether to overwrite existing documentation */
  overwriteExisting?: boolean
}

/**
 * Result of documentation generation
 */
export interface DocumentationResult {
  /** Generated documentation files */
  files: DocumentationFile[]
  /** Whether AI was used for generation */
  aiGenerated: boolean
  /** Summary of what was generated */
  summary: {
    filesGenerated: number
    totalWords: number
    estimatedReadTime: number
    documentationTypes: DocumentationType[]
  }
  /** Warnings or issues encountered */
  warnings: string[]
  /** Generation metadata */
  metadata: {
    generatedAt: string
    generationTime: number
    templateStyle: string
    aiModel?: string
  }
}

/**
 * Project structure information for documentation generation
 */
export interface ProjectStructure {
  /** Project root directory */
  rootPath: string
  /** Main source files */
  sourceFiles: string[]
  /** Configuration files */
  configFiles: string[]
  /** Test files */
  testFiles: string[]
  /** Documentation files (existing) */
  docFiles: string[]
  /** Package.json content */
  packageJson?: Record<string, unknown>
  /** Project type detected */
  projectType: 'library' | 'application' | 'cli' | 'website' | 'monorepo' | 'other'
  /** Framework/tools detected */
  frameworks: string[]
  /** Dependencies detected */
  dependencies: string[]
}

/**
 * Template sections for different documentation types
 */
const DOCUMENTATION_TEMPLATES = {
  readme: {
    basic: ['title', 'description', 'installation', 'usage', 'license'],
    detailed: [
      'title',
      'badges',
      'description',
      'features',
      'installation',
      'usage',
      'api',
      'examples',
      'contributing',
      'license',
    ],
    comprehensive: [
      'title',
      'badges',
      'description',
      'table-of-contents',
      'features',
      'installation',
      'quick-start',
      'usage',
      'api',
      'examples',
      'configuration',
      'troubleshooting',
      'contributing',
      'changelog',
      'license',
      'acknowledgments',
    ],
  },
  api: {
    sections: ['overview', 'classes', 'interfaces', 'functions', 'types', 'examples'],
  },
  contributing: {
    sections: [
      'getting-started',
      'development-setup',
      'coding-standards',
      'pull-requests',
      'issue-reporting',
      'community-guidelines',
    ],
  },
} as const

/**
 * AI-powered documentation generator that creates comprehensive
 * project documentation including README, API docs, and guides
 */
export class DocumentationGenerator {
  constructor(private readonly llmClient?: LLMClient) {}

  /**
   * Generate comprehensive documentation for a project
   */
  async generateDocumentation(
    projectPath: string,
    options: DocumentationOptions = {},
  ): Promise<DocumentationResult> {
    const startTime = Date.now()

    const {
      useAI = true,
      templateStyle = 'detailed',
      documentationTypes = ['readme', 'contributing', 'changelog'],
      // overwriteExisting = false,
    } = options

    // Analyze project structure
    const projectStructure = await this.analyzeProjectStructure(projectPath)

    // Generate documentation files
    const files: DocumentationFile[] = []
    const warnings: string[] = []
    let aiGenerated = false

    for (const docType of documentationTypes) {
      try {
        const docFile = await this.generateDocumentationFile(docType, projectStructure, options)

        if (docFile) {
          files.push(docFile)

          // Check if we should use AI enhancement
          if (useAI && this.llmClient) {
            try {
              const enhancedFile = await this.enhanceWithAI(docFile, projectStructure, options)
              files[files.length - 1] = enhancedFile
              aiGenerated = true
            } catch (error) {
              warnings.push(
                `AI enhancement failed for ${docType}: ${error instanceof Error ? error.message : String(error)}`,
              )
            }
          }
        }
      } catch (error) {
        warnings.push(
          `Failed to generate ${docType}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // Calculate summary statistics
    const totalWords = files.reduce((sum, file) => sum + file.content.split(/\s+/).length, 0)

    const estimatedReadTime = Math.ceil(totalWords / 200) // ~200 words per minute

    const generationTime = Date.now() - startTime

    return {
      files,
      aiGenerated,
      summary: {
        filesGenerated: files.length,
        totalWords,
        estimatedReadTime,
        documentationTypes: files.map(f => f.type),
      },
      warnings,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime,
        templateStyle,
        aiModel: aiGenerated ? 'llm-enhanced' : undefined,
      },
    }
  }

  /**
   * Generate documentation from project analysis result
   */
  async generateFromAnalysis(
    analysisResult: ProjectAnalysis,
    options: DocumentationOptions = {},
  ): Promise<DocumentationResult> {
    // Convert analysis result to project structure
    const projectStructure: ProjectStructure = {
      rootPath: '.',
      sourceFiles: [],
      configFiles: [],
      testFiles: [],
      docFiles: [],
      packageJson: {},
      projectType: this.detectProjectType(analysisResult),
      frameworks:
        analysisResult.techStack.length > 0 ? analysisResult.techStack.map(tech => tech.name) : [],
      dependencies:
        analysisResult.dependencies.length > 0
          ? analysisResult.dependencies.map(dep => dep.name)
          : [],
    }

    // Merge options with analysis result
    const mergedOptions: DocumentationOptions = {
      projectDescription: analysisResult.description,
      ...options,
    }

    return this.generateDocumentation(projectStructure.rootPath, mergedOptions)
  }

  /**
   * Generate a specific type of documentation file
   */
  async generateDocumentationFile(
    type: DocumentationType,
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): Promise<DocumentationFile | null> {
    switch (type) {
      case 'readme':
        return this.generateReadme(projectStructure, options)
      case 'api':
        return this.generateApiDocumentation(projectStructure, options)
      case 'contributing':
        return this.generateContributing(projectStructure, options)
      case 'changelog':
        return this.generateChangelog(projectStructure, options)
      case 'license':
        return this.generateLicense(projectStructure, options)
      case 'getting-started':
        return this.generateGettingStarted(projectStructure, options)
      case 'configuration':
        return this.generateConfiguration(projectStructure, options)
      case 'examples':
        return this.generateExamples(projectStructure, options)
      case 'troubleshooting':
        return this.generateTroubleshooting(projectStructure, options)
      default:
        return null
    }
  }

  /**
   * Enhance documentation content using AI
   */
  async enhanceWithAI(
    docFile: DocumentationFile,
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): Promise<DocumentationFile> {
    if (!this.llmClient) {
      return docFile
    }

    const prompt = `
Enhance the following ${docFile.type} documentation for a ${projectStructure.projectType} project:

Project Context:
- Name: ${options.projectName !== undefined && options.projectName.length > 0 ? options.projectName : 'Unknown Project'}
- Type: ${projectStructure.projectType}
- Frameworks: ${projectStructure.frameworks.join(', ') || 'None detected'}
- Dependencies: ${projectStructure.dependencies.slice(0, 10).join(', ')}

Current Documentation:
\`\`\`markdown
${docFile.content}
\`\`\`

Please enhance this documentation by:
1. Improving clarity and readability
2. Adding relevant examples where appropriate
3. Ensuring proper markdown formatting
4. Adding helpful details for users
5. Following best practices for ${docFile.type} documentation
6. Maintaining the existing structure while improving content

Return only the enhanced markdown content.
`

    try {
      const response = await this.llmClient.complete(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      })

      if (response.success && response.content && response.content.trim().length > 0) {
        return {
          ...docFile,
          content: response.content.trim(),
          metadata: {
            ...docFile.metadata,
            lastGenerated: new Date().toISOString(),
          },
        }
      }
    } catch (error) {
      console.warn('AI enhancement failed:', error)
    }

    return docFile
  }

  /**
   * Analyze project structure to gather information for documentation
   */
  private async analyzeProjectStructure(projectPath: string): Promise<ProjectStructure> {
    // This is a simplified implementation - in a real scenario,
    // you would scan the file system to gather project information

    const structure: ProjectStructure = {
      rootPath: projectPath,
      sourceFiles: [],
      configFiles: [],
      testFiles: [],
      docFiles: [],
      projectType: 'library',
      frameworks: [],
      dependencies: [],
    }

    // Try to read package.json if it exists
    try {
      // In a real implementation, you would read the actual file
      structure.packageJson = {}
      structure.projectType = this.detectProjectTypeFromPackageJson(structure.packageJson)
    } catch {
      // File doesn't exist or can't be read
    }

    return structure
  }

  /**
   * Generate README.md documentation
   */
  private generateReadme(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {
      projectName = 'Project',
      projectDescription = 'A new project',
      author,
      license = 'MIT',
      // repositoryUrl,
      templateStyle = 'detailed',
    } = options

    const template = DOCUMENTATION_TEMPLATES.readme[templateStyle]
    const sections: string[] = []

    // Build README content based on template
    template.forEach(section => {
      switch (section) {
        case 'title':
          sections.push(`# ${projectName}`)
          break

        case 'badges':
          sections.push(this.generateBadges(projectStructure, options))
          break

        case 'description':
          sections.push(projectDescription)
          break

        case 'table-of-contents':
          sections.push(this.generateTableOfContents(template))
          break

        case 'features':
          sections.push(this.generateFeatures(projectStructure))
          break

        case 'installation':
          sections.push(this.generateInstallation(projectStructure))
          break

        case 'quick-start':
          sections.push(this.generateQuickStart(projectStructure, options))
          break

        case 'usage':
          sections.push(this.generateUsage(projectStructure, options))
          break

        case 'api':
          if (options.includeApiDocs) {
            sections.push(this.generateApiOverview(projectStructure))
          }
          break

        case 'examples':
          if (options.includeExamples) {
            sections.push(this.generateExamplesSection(projectStructure))
          }
          break

        case 'configuration':
          sections.push(this.generateConfigurationSection(projectStructure))
          break

        case 'troubleshooting':
          sections.push(this.generateTroubleshootingSection())
          break

        case 'contributing':
          sections.push(this.generateContributingSection())
          break

        case 'changelog':
          sections.push(this.generateChangelogSection())
          break

        case 'license':
          sections.push(this.generateLicenseSection(license, author))
          break

        case 'acknowledgments':
          sections.push(this.generateAcknowledgments())
          break
      }
    })

    const content = sections.filter(s => s.length > 0).join('\n\n')

    return {
      filePath: 'README.md',
      content,
      type: 'readme',
      priority: 10,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: projectName,
        description: 'Project README documentation',
        sections: [...template],
        estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200),
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate API documentation
   */
  private generateApiDocumentation(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {projectName = 'Project'} = options

    const content = `# API Documentation

## Overview

This document provides comprehensive API documentation for ${projectName}.

## Classes

### Main Classes

Documentation for the main classes will be generated from source code analysis.

## Interfaces

### Type Definitions

Type definitions and interfaces will be documented here.

## Functions

### Public Functions

Public function documentation will be generated from source code.

## Examples

### Basic Usage

\`\`\`typescript
// Basic usage examples will be provided here
\`\`\`

## Type Definitions

Complete type definitions are available in the TypeScript declaration files.
`

    return {
      filePath: 'docs/API.md',
      content,
      type: 'api',
      priority: 7,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'API Documentation',
        description: 'Comprehensive API documentation',
        sections: [...DOCUMENTATION_TEMPLATES.api.sections],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate contributing guidelines
   */
  private generateContributing(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {projectName = 'Project', repositoryUrl} = options

    const content = `# Contributing to ${projectName}

Thank you for your interest in contributing to ${projectName}! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository${repositoryUrl !== undefined && repositoryUrl.length > 0 ? ` at ${repositoryUrl}` : ''}
2. Clone your fork locally
3. Install dependencies
4. Create a new branch for your changes

## Development Setup

\`\`\`bash
# Install dependencies
${projectStructure.projectType === 'library' ? 'npm install' : 'npm install'}

# Run tests
npm test

# Run linting
npm run lint
\`\`\`

## Code Style

- Follow the existing code style
- Run the linter before submitting changes
- Write tests for new functionality
- Update documentation as needed

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if necessary
3. Create a pull request with a clear description
4. Wait for review and address feedback

## Issue Reporting

When reporting issues:
- Use a clear and descriptive title
- Provide steps to reproduce the problem
- Include relevant system information
- Add examples or screenshots if helpful

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Follow the code of conduct
- Celebrate diversity and different perspectives
`

    return {
      filePath: 'CONTRIBUTING.md',
      content,
      type: 'contributing',
      priority: 5,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'Contributing Guidelines',
        description: 'Guidelines for project contributors',
        sections: [...DOCUMENTATION_TEMPLATES.contributing.sections],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate changelog template
   */
  private generateChangelog(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const content = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release
- Core functionality
- Documentation
- Tests

[Unreleased]: https://github.com/user/repo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
`

    return {
      filePath: 'CHANGELOG.md',
      content,
      type: 'changelog',
      priority: 4,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'Changelog',
        description: 'Project change history',
        sections: ['unreleased', 'released-versions'],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate license file
   */
  private generateLicense(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {license = 'MIT', author} = options
    const year = new Date().getFullYear()
    const authorName =
      author?.name !== undefined && author.name.length > 0 ? author.name : 'Project Author'

    let content = ''

    switch (license.toUpperCase()) {
      case 'MIT':
        content = `MIT License

Copyright (c) ${year} ${authorName}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
        break

      default:
        content = `${license} License

Copyright (c) ${year} ${authorName}

This project is licensed under the ${license} License.
Please see the license terms for more details.`
    }

    return {
      filePath: 'LICENSE',
      content,
      type: 'license',
      priority: 3,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'License',
        description: `${license} license file`,
        sections: ['license-text'],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate getting started guide
   */
  private generateGettingStarted(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {projectName = 'Project'} = options

    const content = `# Getting Started with ${projectName}

This guide will help you get up and running with ${projectName} quickly.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm or yarn package manager

## Installation

\`\`\`bash
npm install ${projectName.toLowerCase()}
\`\`\`

## Quick Start

1. **Basic Setup**
   \`\`\`javascript
   const { main } = require('${projectName.toLowerCase()}')
   \`\`\`

2. **First Steps**
   Follow these steps to get started...

3. **Next Steps**
   Once you have the basics working, you can explore...

## Common Use Cases

### Use Case 1
Description and example...

### Use Case 2
Description and example...

## Troubleshooting

If you encounter issues, check out our [troubleshooting guide](docs/TROUBLESHOOTING.md).

## Next Steps

- Read the full [documentation](README.md)
- Check out [examples](examples/)
- Join our [community](https://github.com/user/repo/discussions)
`

    return {
      filePath: 'docs/GETTING_STARTED.md',
      content,
      type: 'getting-started',
      priority: 6,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'Getting Started Guide',
        description: 'Quick start guide for new users',
        sections: ['prerequisites', 'installation', 'quick-start', 'use-cases'],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate configuration documentation
   */
  private generateConfiguration(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {projectName = 'Project'} = options

    const content = `# Configuration Guide

This document describes the configuration options available in ${projectName}.

## Configuration Files

### Package Configuration

Configuration is typically done through:
- \`package.json\` - Package-level configuration
- Configuration files (if applicable)
- Environment variables

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`NODE_ENV\` | Environment setting | \`development\` |

## Configuration Options

### Option 1
Description of configuration option...

### Option 2
Description of configuration option...

## Examples

### Basic Configuration
\`\`\`json
{
  "config": {
    "option1": "value1",
    "option2": "value2"
  }
}
\`\`\`

### Advanced Configuration
\`\`\`json
{
  "config": {
    "advanced": true,
    "features": ["feature1", "feature2"]
  }
}
\`\`\`
`

    return {
      filePath: 'docs/CONFIGURATION.md',
      content,
      type: 'configuration',
      priority: 4,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'Configuration Guide',
        description: 'Configuration options and setup',
        sections: ['files', 'environment', 'options', 'examples'],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate examples documentation
   */
  private generateExamples(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {projectName = 'Project'} = options

    const content = `# Examples

This document provides practical examples of how to use ${projectName}.

## Basic Examples

### Example 1: Basic Usage
\`\`\`javascript
// Basic usage example
const result = await basicFunction()
console.log(result)
\`\`\`

### Example 2: Advanced Usage
\`\`\`javascript
// Advanced usage example
const advancedResult = await advancedFunction({
  option1: 'value1',
  option2: true
})
\`\`\`

## Framework-Specific Examples

${projectStructure.frameworks
  .map(
    framework => `
### ${framework} Integration
\`\`\`javascript
// ${framework} specific example
\`\`\`
`,
  )
  .join('')}

## Real-World Examples

### Use Case 1
Description and complete example...

### Use Case 2
Description and complete example...

## Running the Examples

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Run examples: \`npm run examples\`

## Contributing Examples

We welcome example contributions! Please see our [contributing guide](CONTRIBUTING.md).
`

    return {
      filePath: 'docs/EXAMPLES.md',
      content,
      type: 'examples',
      priority: 5,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'Examples',
        description: 'Practical usage examples',
        sections: ['basic', 'framework-specific', 'real-world'],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate troubleshooting documentation
   */
  private generateTroubleshooting(
    projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): DocumentationFile {
    const {projectName = 'Project'} = options

    const content = `# Troubleshooting

This guide helps you resolve common issues with ${projectName}.

## Common Issues

### Issue 1: Installation Problems

**Problem:** Error during installation

**Solution:**
1. Check Node.js version (requires 18+)
2. Clear npm cache: \`npm cache clean --force\`
3. Delete \`node_modules\` and reinstall

### Issue 2: Runtime Errors

**Problem:** Unexpected runtime errors

**Solution:**
1. Check configuration
2. Verify dependencies
3. Review error logs

## Error Messages

### Error: "Module not found"
This error typically indicates...

**Fix:**
\`\`\`bash
npm install --save missing-module
\`\`\`

### Error: "Permission denied"
This error occurs when...

**Fix:**
\`\`\`bash
sudo chown -R $(whoami) ~/.npm
\`\`\`

## Getting Help

If you can't find a solution here:

1. **Check the Issues** - Search existing [GitHub issues](https://github.com/user/repo/issues)
2. **Ask the Community** - Join our [discussions](https://github.com/user/repo/discussions)
3. **Report a Bug** - Create a new issue with detailed information

## Debugging Tips

1. Enable debug logging
2. Check browser console (for web projects)
3. Use debugging tools
4. Isolate the problem with minimal examples

## Performance Issues

If you're experiencing performance problems:

1. Check for memory leaks
2. Profile your application
3. Review configuration settings
4. Consider optimization strategies
`

    return {
      filePath: 'docs/TROUBLESHOOTING.md',
      content,
      type: 'troubleshooting',
      priority: 3,
      overwrite: options.overwriteExisting ?? false,
      metadata: {
        title: 'Troubleshooting Guide',
        description: 'Common issues and solutions',
        sections: ['common-issues', 'error-messages', 'getting-help', 'debugging'],
        lastGenerated: new Date().toISOString(),
      },
    }
  }

  /**
   * Helper methods for generating README sections
   */
  private generateBadges(
    _projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): string {
    const {repositoryUrl, license = 'MIT'} = options
    const badges: string[] = []

    if (repositoryUrl !== undefined && repositoryUrl.length > 0) {
      badges.push(
        `[![Build Status](${repositoryUrl}/actions/workflows/ci.yml/badge.svg)](${repositoryUrl}/actions)`,
      )
      badges.push(`[![License](https://img.shields.io/badge/license-${license}-blue.svg)](LICENSE)`)
    }

    return badges.length > 0 ? badges.join('\n') : ''
  }

  private generateTableOfContents(sections: readonly string[]): string {
    const tocSections = sections
      .filter(s => !['title', 'badges', 'table-of-contents'].includes(s))
      .map(
        section =>
          `- [${this.formatSectionTitle(section)}](#${section.toLowerCase().replaceAll(' ', '-')})`,
      )

    return tocSections.length > 0 ? `## Table of Contents\n\n${tocSections.join('\n')}` : ''
  }

  private generateFeatures(_projectStructure: ProjectStructure): string {
    return `## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

<!-- Add more features based on project analysis -->`
  }

  private generateInstallation(projectStructure: ProjectStructure): string {
    const installCommand =
      projectStructure.projectType === 'library' ? 'npm install package-name' : 'npm install'

    return `## Installation

\`\`\`bash
${installCommand}
\`\`\`

### Requirements
- Node.js 18 or higher
- npm or yarn`
  }

  private generateQuickStart(
    _projectStructure: ProjectStructure,
    options: DocumentationOptions,
  ): string {
    return `## Quick Start

\`\`\`javascript
// Quick start example
const { main } = require('${(options.projectName ?? 'package-name').toLowerCase()}')

async function quickStart() {
  const result = await main()
  console.log(result)
}

quickStart()
\`\`\``
  }

  private generateUsage(
    _projectStructure: ProjectStructure,
    _options: DocumentationOptions,
  ): string {
    return `## Usage

### Basic Usage

\`\`\`javascript
// Basic usage example
\`\`\`

### Advanced Usage

\`\`\`javascript
// Advanced usage example
\`\`\``
  }

  private generateApiOverview(_projectStructure: ProjectStructure): string {
    return `## API Reference

For detailed API documentation, see [API.md](docs/API.md).

### Quick Reference

- \`function1()\` - Description
- \`function2()\` - Description
- \`Class1\` - Description`
  }

  private generateExamplesSection(_projectStructure: ProjectStructure): string {
    return `## Examples

For more examples, see [EXAMPLES.md](docs/EXAMPLES.md).

\`\`\`javascript
// Example usage
\`\`\``
  }

  private generateConfigurationSection(_projectStructure: ProjectStructure): string {
    return `## Configuration

For detailed configuration options, see [CONFIGURATION.md](docs/CONFIGURATION.md).`
  }

  private generateTroubleshootingSection(): string {
    return `## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).`
  }

  private generateContributingSection(): string {
    return `## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.`
  }

  private generateChangelogSection(): string {
    return `## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.`
  }

  private generateLicenseSection(license: string, author?: DocumentationOptions['author']): string {
    const authorText = author ? ` by ${author.name}` : ''
    return `## License

This project is licensed under the ${license} License${authorText} - see the [LICENSE](LICENSE) file for details.`
  }

  private generateAcknowledgments(): string {
    return `## Acknowledgments

- Hat tip to anyone whose code was used
- Inspiration sources
- Contributors and maintainers`
  }

  private formatSectionTitle(section: string): string {
    return section
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private detectProjectType(analysisResult: ProjectAnalysis): ProjectStructure['projectType'] {
    if (analysisResult.projectType) {
      return analysisResult.projectType as ProjectStructure['projectType']
    }

    return 'library' // Default fallback
  }

  private detectProjectTypeFromPackageJson(
    packageJson: Record<string, unknown>,
  ): ProjectStructure['projectType'] {
    if (packageJson.bin !== undefined && packageJson.bin !== null) return 'cli'
    if (packageJson.private !== undefined && packageJson.private !== null) return 'application'
    return 'library'
  }
}
