/**
 * Plugin template generator for scaffolding new semantic-release plugins.
 */

import type {
  PluginGenerationResult,
  PluginLifecycleHook,
  PluginTemplate,
  PluginTemplateConfig,
  PluginTemplateContext,
  PluginType,
} from './types.js'
import {existsSync} from 'node:fs'
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'

/**
 * Default lifecycle hooks for each plugin type.
 */
const DEFAULT_HOOKS: Record<PluginType, PluginLifecycleHook[]> = {
  analyze: ['verifyConditions', 'analyzeCommits'],
  generate: ['verifyConditions', 'generateNotes'],
  prepare: ['verifyConditions', 'prepare'],
  publish: ['verifyConditions', 'publish'],
  success: ['success'],
  fail: ['fail'],
  verify: ['verifyConditions', 'verifyRelease'],
  complete: [
    'verifyConditions',
    'analyzeCommits',
    'verifyRelease',
    'generateNotes',
    'prepare',
    'publish',
    'success',
    'fail',
  ],
}

/**
 * Create default template for plugin type.
 *
 * @param type - Plugin type
 * @returns Default plugin template
 */
function createDefaultTemplate(type: PluginType): PluginTemplate {
  const baseTemplate: PluginTemplate = {
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Plugin`,
    description: `Template for ${type} plugins`,
    pluginType: type,
    defaultHooks: DEFAULT_HOOKS[type],
    dependencies: ['semantic-release'],
    devDependencies: [
      '@types/node',
      'typescript',
      'vitest',
      '@vitest/coverage-v8',
      'eslint',
      'prettier',
    ],
    variables: {},
    files: [
      {
        sourcePath: 'package.json.eta',
        targetPath: 'package.json',
        processTemplate: true,
      },
      {
        sourcePath: 'tsconfig.json.eta',
        targetPath: 'tsconfig.json',
        processTemplate: true,
      },
      {
        sourcePath: 'src/index.ts.eta',
        targetPath: 'src/index.ts',
        processTemplate: true,
      },
      {
        sourcePath: 'src/types.ts.eta',
        targetPath: 'src/types.ts',
        processTemplate: true,
      },
      {
        sourcePath: 'src/plugin.ts.eta',
        targetPath: 'src/plugin.ts',
        processTemplate: true,
      },
      {
        sourcePath: 'test/plugin.test.ts.eta',
        targetPath: 'test/plugin.test.ts',
        processTemplate: true,
      },
      {
        sourcePath: 'README.md.eta',
        targetPath: 'README.md',
        processTemplate: true,
      },
      {
        sourcePath: 'vitest.config.ts',
        targetPath: 'vitest.config.ts',
        processTemplate: false,
      },
      {
        sourcePath: 'tsup.config.ts',
        targetPath: 'tsup.config.ts',
        processTemplate: false,
      },
    ],
  }

  return baseTemplate
}

/**
 * Plugin template registry mapping plugin types to templates.
 */
const PLUGIN_TEMPLATES: Record<PluginType, PluginTemplate> = {
  analyze: createDefaultTemplate('analyze'),
  generate: createDefaultTemplate('generate'),
  prepare: createDefaultTemplate('prepare'),
  publish: createDefaultTemplate('publish'),
  success: createDefaultTemplate('success'),
  fail: createDefaultTemplate('fail'),
  verify: createDefaultTemplate('verify'),
  complete: createDefaultTemplate('complete'),
}

/**
 * Simple template processing utility without external dependencies.
 */
class SimpleTemplateProcessor {
  /**
   * Process template string with variable substitution.
   *
   * @param template - Template string with <%= variable %> placeholders
   * @param context - Context object with variables
   * @returns Processed template string
   */
  process(template: string, context: PluginTemplateContext): string {
    return template.replaceAll(/<%=([^%]*)%>/g, (_match, expression: string) => {
      try {
        return this.evaluateExpression(expression.trim(), context)
      } catch {
        return _match // Return original if evaluation fails
      }
    })
  }

  /**
   * Evaluate simple dot notation expressions.
   *
   * @param expression - Expression to evaluate (e.g., "plugin.name")
   * @param context - Context object
   * @returns Evaluated value as string
   */
  private evaluateExpression(expression: string, context: PluginTemplateContext): string {
    const parts = expression.split('.')
    let current: unknown = context

    for (const part of parts) {
      if (
        current !== null &&
        current !== undefined &&
        typeof current === 'object' &&
        part in current
      ) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return expression // Return original if path doesn't exist
      }
    }

    return String(current ?? expression)
  }
}

/**
 * Plugin template generator class.
 */
export class PluginTemplateGenerator {
  private readonly templateProcessor: SimpleTemplateProcessor

  constructor() {
    this.templateProcessor = new SimpleTemplateProcessor()
  }

  /**
   * Generate a new semantic-release plugin from template.
   *
   * @param config - Plugin template configuration
   * @returns Promise resolving to generation result
   */
  async generatePlugin(config: PluginTemplateConfig): Promise<PluginGenerationResult> {
    try {
      // Validate configuration
      const validation = this.validateConfig(config)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        }
      }

      // Get template for plugin type
      const template = PLUGIN_TEMPLATES[config.type]
      if (template === undefined) {
        return {
          success: false,
          error: `Unknown plugin type: ${config.type}`,
        }
      }

      // Create template context
      const context = this.createTemplateContext(config, template)

      // Ensure output directory exists
      await this.ensureDirectory(config.outputDir)

      // Generate files
      const generatedFiles: string[] = []
      const warnings: string[] = []

      for (const file of template.files) {
        try {
          const filePath = path.join(config.outputDir, file.targetPath)
          await this.ensureDirectory(path.dirname(filePath))

          let content: string
          if (file.processTemplate) {
            // Process template with simple processor
            const templateContent = await this.getTemplateContent(file.sourcePath)
            content = this.templateProcessor.process(templateContent, context)
          } else {
            // Copy file as-is
            content = await this.getTemplateContent(file.sourcePath)
          }

          await writeFile(filePath, content, file.encoding || 'utf8')
          generatedFiles.push(filePath)
        } catch (error) {
          warnings.push(`Failed to generate file ${file.targetPath}: ${String(error)}`)
        }
      }

      return {
        success: true,
        pluginPath: config.outputDir,
        files: generatedFiles,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: `Plugin generation failed: ${String(error)}`,
      }
    }
  }

  /**
   * Get available plugin templates.
   *
   * @returns Array of available plugin templates
   */
  getAvailableTemplates(): PluginTemplate[] {
    return Object.values(PLUGIN_TEMPLATES)
  }

  /**
   * Get template for specific plugin type.
   *
   * @param type - Plugin type
   * @returns Plugin template or undefined if not found
   */
  getTemplate(type: PluginType): PluginTemplate | undefined {
    return PLUGIN_TEMPLATES[type]
  }

  /**
   * Get default lifecycle hooks for plugin type.
   *
   * @param type - Plugin type
   * @returns Array of default lifecycle hooks
   */
  getDefaultHooks(type: PluginType): PluginLifecycleHook[] {
    return DEFAULT_HOOKS[type] ?? []
  }

  /**
   * Validate plugin template configuration.
   *
   * @param config - Configuration to validate
   * @returns Validation result
   */
  private validateConfig(config: PluginTemplateConfig): {valid: boolean; error?: string} {
    if (!config.name) {
      return {valid: false, error: 'Plugin name is required'}
    }

    if (!config.description) {
      return {valid: false, error: 'Plugin description is required'}
    }

    if (!config.author) {
      return {valid: false, error: 'Plugin author is required'}
    }

    if (!config.outputDir) {
      return {valid: false, error: 'Output directory is required'}
    }

    if (!config.type || PLUGIN_TEMPLATES[config.type] === undefined) {
      return {valid: false, error: `Invalid plugin type: ${config.type}`}
    }

    // Validate plugin name format
    if (!/^[a-z0-9-]+$/.test(config.name)) {
      return {
        valid: false,
        error: 'Plugin name must contain only lowercase letters, numbers, and hyphens',
      }
    }

    return {valid: true}
  }

  /**
   * Create template context for variable substitution.
   *
   * @param config - Plugin configuration
   * @param template - Plugin template
   * @returns Template context
   */
  private createTemplateContext(
    config: PluginTemplateConfig,
    template: PluginTemplate,
  ): PluginTemplateContext {
    const packageName = config.name.startsWith('semantic-release-')
      ? config.name
      : `semantic-release-${config.name}`

    const className = this.toPascalCase(config.name.replace(/^semantic-release-/, ''))
    const configInterface = config.configInterface ?? `${className}Config`

    const hooks = config.customHooks || template.defaultHooks

    return {
      plugin: {
        name: config.name,
        description: config.description,
        author: config.author,
        email: config.email ?? '',
        version: '1.0.0',
        packageName,
        className,
        configInterface,
      },
      project: {
        packageManager: config.packageManager,
        typescript: config.typescript,
        includeTests: config.includeTests,
        includeDocs: config.includeDocs,
        includeCI: config.includeCI,
      },
      lifecycle: {
        hooks,
        type: config.type,
      },
      dependencies: {
        runtime: [...template.dependencies, ...(config.dependencies || [])],
        development: [...template.devDependencies, ...(config.devDependencies || [])],
      },
      meta: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    }
  }

  /**
   * Ensure directory exists, creating it if necessary.
   *
   * @param dirPath - Directory path to ensure
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, {recursive: true})
    }
  }

  /**
   * Get template file content.
   *
   * @param templatePath - Path to template file
   * @returns Template content
   */
  private async getTemplateContent(templatePath: string): Promise<string> {
    // In a real implementation, this would load template files
    // For now, we'll return basic templates
    return this.getBasicTemplate(templatePath)
  }

  /**
   * Convert string to PascalCase.
   *
   * @param str - String to convert
   * @returns PascalCase string
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  /**
   * Get basic template content for file.
   *
   * @param templatePath - Template file path
   * @returns Basic template content
   */
  private getBasicTemplate(templatePath: string): string {
    // Basic templates that can be used immediately
    switch (templatePath) {
      case 'package.json.eta':
        return JSON.stringify(
          {
            name: '<%= plugin.packageName %>',
            version: '<%= plugin.version %>',
            description: '<%= plugin.description %>',
            author: '<%= plugin.author %>',
            main: 'lib/index.js',
            types: 'lib/index.d.ts',
            scripts: {
              build: 'tsup',
              test: 'vitest run',
              'test:watch': 'vitest',
              lint: 'eslint .',
              'type-check': 'tsc --noEmit',
            },
            peerDependencies: {
              'semantic-release': '>=21.0.0',
            },
            dependencies: {},
            devDependencies: Object.fromEntries(
              ['@types/node', 'typescript', 'vitest', 'tsup', 'eslint'].map(dep => [dep, 'latest']),
            ),
          },
          null,
          2,
        )

      case 'tsconfig.json.eta':
        return JSON.stringify(
          {
            extends: '@bfra.me/tsconfig',
            include: ['src'],
            exclude: ['lib', 'test'],
            compilerOptions: {
              outDir: 'lib',
            },
          },
          null,
          2,
        )

      case 'src/index.ts.eta':
        return `/**
 * <%= plugin.description %>
 */

<% if (lifecycle.hooks.includes('verifyConditions')) { %>export {verifyConditions} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('analyzeCommits')) { %>export {analyzeCommits} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('verifyRelease')) { %>export {verifyRelease} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('generateNotes')) { %>export {generateNotes} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('prepare')) { %>export {prepare} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('publish')) { %>export {publish} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('success')) { %>export {success} from './plugin.js'
<% } %><% if (lifecycle.hooks.includes('fail')) { %>export {fail} from './plugin.js'
<% } %>
export type * from './types.js'`

      default:
        return `// Template file: ${templatePath}
// Generated by @bfra.me/semantic-release plugin generator
// TODO: Implement ${templatePath}`
    }
  }
}

/**
 * Create a new plugin template generator.
 *
 * @returns Plugin template generator instance
 */
export function createPluginGenerator(): PluginTemplateGenerator {
  return new PluginTemplateGenerator()
}

/**
 * Generate a plugin using the default generator.
 *
 * @param config - Plugin template configuration
 * @returns Promise resolving to generation result
 */
export async function generatePlugin(
  config: PluginTemplateConfig,
): Promise<PluginGenerationResult> {
  const generator = createPluginGenerator()
  return generator.generatePlugin(config)
}
