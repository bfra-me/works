import type {TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

/**
 * Configuration for documentation integration.
 */
export interface DocumentationConfig {
  /** Path to the documentation site root */
  docsRoot: string
  /** Path to the content directory */
  contentDir: string
  /** Path to the navigation configuration */
  navigationPath: string
  /** Template for package documentation */
  packageDocTemplate: string
  /** Enable navigation auto-update */
  autoUpdateNavigation: boolean
}

/**
 * Result of documentation integration.
 */
export interface DocumentationResult {
  /** Whether MDX file was generated */
  mdxGenerated: boolean
  /** Path to generated MDX file */
  mdxPath?: string
  /** Whether navigation was updated */
  navigationUpdated: boolean
  /** Any warnings during integration */
  warnings: string[]
}

/**
 * Manages documentation site integration for generated packages.
 * Generates MDX files and updates navigation structure.
 */
export class DocumentationIntegrator {
  private readonly config: DocumentationConfig

  constructor(config: Partial<DocumentationConfig> = {}) {
    // Default configuration based on the bfra.me/works docs structure
    this.config = {
      docsRoot: path.join(process.cwd(), 'docs'),
      contentDir: path.join(process.cwd(), 'docs', 'src', 'content', 'docs'),
      navigationPath: path.join(process.cwd(), 'docs', 'src', 'content', 'config.ts'),
      packageDocTemplate: this.getDefaultTemplate(),
      autoUpdateNavigation: true,
      ...config,
    }
  }

  /**
   * Integrate documentation for a generated package.
   *
   * @param packagePath - Path to the generated package
   * @param context - Template context used for generation
   * @param options - Integration options
   * @param options.verbose - Enable verbose logging
   * @returns Result of documentation integration
   */
  async integrate(
    packagePath: string,
    context: TemplateContext,
    options: {verbose?: boolean} = {},
  ): Promise<DocumentationResult> {
    const warnings: string[] = []
    let mdxGenerated = false
    let mdxPath: string | undefined
    let navigationUpdated = false

    try {
      if (options.verbose) {
        consola.info('Starting documentation integration...', {
          package: packagePath,
          docsRoot: this.config.docsRoot,
        })
      }

      // Check if docs directory exists
      if (!existsSync(this.config.docsRoot)) {
        warnings.push(`Documentation directory not found: ${this.config.docsRoot}`)
        return {mdxGenerated, navigationUpdated, warnings}
      }

      // Step 1: Generate package documentation MDX file
      const mdxResult = await this.generatePackageDocumentation(packagePath, context, options)
      if (mdxResult.success) {
        mdxGenerated = true
        mdxPath = mdxResult.path
      } else {
        warnings.push(`Failed to generate MDX: ${mdxResult.error}`)
      }

      // Step 2: Update navigation configuration
      if (this.config.autoUpdateNavigation && mdxGenerated) {
        const navResult = await this.updateNavigation(context, options)
        if (navResult.success) {
          navigationUpdated = true
        } else {
          warnings.push(`Failed to update navigation: ${navResult.error}`)
        }
      }

      if (options.verbose) {
        consola.success('Documentation integration completed', {
          mdxGenerated,
          navigationUpdated,
          warnings: warnings.length,
        })
      }

      return {
        mdxGenerated,
        mdxPath,
        navigationUpdated,
        warnings,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      warnings.push(`Documentation integration failed: ${errorMessage}`)

      return {
        mdxGenerated: false,
        navigationUpdated: false,
        warnings,
      }
    }
  }

  /**
   * Generate MDX documentation file for the package.
   */
  private async generatePackageDocumentation(
    packagePath: string,
    context: TemplateContext,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; path?: string; error?: string}> {
    try {
      const packageName = context.projectName
      const packageJsonPath = path.join(packagePath, 'package.json')

      // Read package.json to get package information
      let packageInfo: {name?: string; description?: string; version?: string} = {}
      if (existsSync(packageJsonPath)) {
        const packageJson = await readFile(packageJsonPath, 'utf8')
        packageInfo = JSON.parse(packageJson) as {
          name?: string
          description?: string
          version?: string
        }
      }

      // Prepare MDX content
      const mdxContent = this.generateMDXContent(context, packageInfo)

      // Determine output path
      const packagesDir = path.join(this.config.contentDir, 'packages')
      await mkdir(packagesDir, {recursive: true})

      const mdxPath = path.join(packagesDir, `${packageName}.mdx`)

      // Write MDX file
      await writeFile(mdxPath, mdxContent, 'utf8')

      if (options.verbose) {
        consola.success(`Generated documentation: ${mdxPath}`)
      }

      return {success: true, path: mdxPath}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, error: errorMessage}
    }
  }

  /**
   * Update navigation configuration to include the new package.
   */
  private async updateNavigation(
    context: TemplateContext,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; error?: string}> {
    try {
      const packageName = context.projectName

      if (!existsSync(this.config.navigationPath)) {
        return {success: false, error: `Navigation config not found: ${this.config.navigationPath}`}
      }

      // Read current navigation config
      const navContent = await readFile(this.config.navigationPath, 'utf8')

      // Find the packages section and add new entry
      const newNavContent = this.addPackageToNavigation(navContent, packageName, context)

      // Write updated navigation
      await writeFile(this.config.navigationPath, newNavContent, 'utf8')

      if (options.verbose) {
        consola.success(`Updated navigation for package: ${packageName}`)
      }

      return {success: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, error: errorMessage}
    }
  }

  /**
   * Generate MDX content for a package.
   */
  private generateMDXContent(
    context: TemplateContext,
    packageInfo: {name?: string; description?: string; version?: string},
  ): string {
    const packageName = context.projectName
    const description =
      context.description ?? packageInfo.description ?? 'A package in the bfra.me Works monorepo'
    const version = packageInfo.version ?? context.version ?? '1.0.0'
    const npmName = packageInfo.name ?? `@bfra.me/${packageName}`

    return `---
title: ${packageName}
description: ${description}
---

import { Card, CardGrid } from '@astrojs/starlight/components';
import { Badge } from '@astrojs/starlight/components';

# ${packageName}

<Badge text="v${version}" variant="tip" />

${description}

## Installation

\`\`\`bash
npm install ${npmName}
\`\`\`

\`\`\`bash
pnpm add ${npmName}
\`\`\`

\`\`\`bash
yarn add ${npmName}
\`\`\`

## Usage

\`\`\`typescript
import { /* exports */ } from '${npmName}'

// Example usage
\`\`\`

## API Reference

### Functions

#### \`exampleFunction\`

Description of the main function.

**Parameters:**
- \`param1\` (\`string\`) - Description of parameter
- \`options\` (\`object\`, optional) - Configuration options

**Returns:** \`Promise<Result>\`

**Example:**
\`\`\`typescript
import { exampleFunction } from '${npmName}'

const result = await exampleFunction('value', {
  option: true
})
\`\`\`

## Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`option1\` | \`string\` | \`'default'\` | Description of option |
| \`option2\` | \`boolean\` | \`false\` | Description of option |

## Examples

### Basic Usage

\`\`\`typescript
import { ${packageName} } from '${npmName}'

// Basic example
const result = await ${packageName}.process()
console.log(result)
\`\`\`

### Advanced Usage

\`\`\`typescript
import { ${packageName} } from '${npmName}'

// Advanced example with configuration
const result = await ${packageName}.process({
  advanced: true,
  customOption: 'value'
})
\`\`\`

## Related Packages

<CardGrid>
  <Card title="@bfra.me/eslint-config" icon="setting">
    ESLint configuration for consistent code style.
  </Card>
  <Card title="@bfra.me/prettier-config" icon="setting">
    Prettier configuration for code formatting.
  </Card>
  <Card title="@bfra.me/tsconfig" icon="setting">
    TypeScript configuration for strict type checking.
  </Card>
</CardGrid>

## Contributing

Contributions are welcome! Please read the [contributing guide](../guides/contributing) for details.

## License

This package is part of the bfra.me Works project and is licensed under the [MIT License](../../../license).
`
  }

  /**
   * Add package to navigation configuration.
   */
  private addPackageToNavigation(
    navContent: string,
    packageName: string,
    _context: TemplateContext,
  ): string {
    // Look for the packages section in the navigation
    const packagesRegex = /(['"]packages['"]:\s*\[[\s\S]*?\])/
    const match = navContent.match(packagesRegex)

    if (!match || match[1] == null || match[1].trim() === '') {
      consola.warn('Could not find packages section in navigation config')
      return navContent
    }

    const packagesSection = match[1]
    const newEntry = `        {
          label: '${packageName}',
          link: '/packages/${packageName}',
        },`

    // Insert the new entry at the end of the packages array (before the closing bracket)
    const closingBracketIndex = packagesSection.lastIndexOf(']')
    if (closingBracketIndex === -1) {
      return navContent
    }

    const updatedPackagesSection = [
      packagesSection.slice(0, closingBracketIndex),
      newEntry,
      '\n      ',
      packagesSection.slice(closingBracketIndex),
    ].join('')

    return navContent.replace(packagesSection, updatedPackagesSection)
  }

  /**
   * Get default MDX template for packages.
   */
  private getDefaultTemplate(): string {
    return `---
title: {{name}}
description: {{description}}
---

# {{name}}

{{description}}

## Installation

\`\`\`bash
npm install @bfra.me/{{name}}
\`\`\`

## Usage

\`\`\`typescript
import { /* exports */ } from '@bfra.me/{{name}}'
\`\`\`
`
  }

  /**
   * Check if documentation integration is available.
   */
  isAvailable(): boolean {
    return existsSync(this.config.docsRoot) && existsSync(this.config.contentDir)
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<DocumentationConfig> {
    return {...this.config}
  }
}

/**
 * Create a documentation integrator with default configuration.
 */
export function createDocumentationIntegrator(
  config?: Partial<DocumentationConfig>,
): DocumentationIntegrator {
  return new DocumentationIntegrator(config)
}
