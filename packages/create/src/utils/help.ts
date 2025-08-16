/**
 * Help system with contextual guidance and examples
 */

import {consola} from 'consola'

export interface HelpTopic {
  name: string
  description: string
  examples: string[]
  relatedTopics?: string[]
}

export interface CommandHelp {
  command: string
  description: string
  usage: string
  options: {
    flag: string
    description: string
    example?: string
  }[]
  examples: string[]
}

/**
 * Help system for interactive guidance
 */
export class HelpSystem {
  private readonly topics: Map<string, HelpTopic> = new Map()
  private readonly commands: Map<string, CommandHelp> = new Map()

  constructor() {
    this.initializeDefaultTopics()
    this.initializeDefaultCommands()
  }

  /**
   * Get help for a specific topic
   */
  getTopicHelp(topicName: string): HelpTopic | undefined {
    return this.topics.get(topicName)
  }

  /**
   * Get help for a specific command
   */
  getCommandHelp(commandName: string): CommandHelp | undefined {
    return this.commands.get(commandName)
  }

  /**
   * Show contextual help based on current situation
   */
  showContextualHelp(context: 'template-selection' | 'customization' | 'error' | 'general'): void {
    switch (context) {
      case 'template-selection': {
        this.showTemplateSelectionHelp()
        break
      }
      case 'customization': {
        this.showCustomizationHelp()
        break
      }
      case 'error': {
        this.showErrorHelp()
        break
      }
      case 'general':
      default: {
        this.showGeneralHelp()
        break
      }
    }
  }

  /**
   * Show command examples
   */
  showExamples(): void {
    consola.box(`
📝 Usage Examples

Basic Project Creation:
npx @bfra.me/create my-project

Library with Custom Settings:
npx @bfra.me/create my-lib \\
  --template=library \\
  --author="John Doe <john@example.com>" \\
  --description="My awesome library"

React App with Specific Package Manager:
npx @bfra.me/create my-react-app \\
  --template=react \\
  --package-manager=pnpm

Custom GitHub Template:
npx @bfra.me/create my-custom-project \\
  --template=github:user/repo

Non-Interactive Mode:
npx @bfra.me/create my-project \\
  --template=default \\
  --no-interactive \\
  --force

CLI Tool Project:
npx @bfra.me/create my-cli \\
  --template=cli \\
  --output-dir=./tools/my-cli
    `)
  }

  /**
   * Show advanced usage tips
   */
  showAdvancedTips(): void {
    consola.box(`
💡 Advanced Tips

Environment Variables:
• NO_COLOR=1 - Disable colored output
• DEBUG=create:* - Enable debug logging
• CI=true - Enable CI mode (non-interactive)

Template Development:
• Use template.json for metadata
• Support Eta templating syntax
• Include README with usage instructions

Project Organization:
• Use consistent naming conventions
• Follow semver for versioning
• Include proper LICENSE file
• Set up CI/CD early

Performance Tips:
• Use pnpm for faster installs
• Enable template caching
• Use .gitignore patterns
• Keep templates minimal
    `)
  }

  /**
   * Show help for template selection
   */
  private showTemplateSelectionHelp(): void {
    consola.box(`
🎯 Template Selection Help

Built-in Templates:
• default   - Basic TypeScript project
• library   - NPM library with publishing
• cli       - Command-line application
• node      - Node.js server with Express
• react     - React app with modern tooling

Custom Templates:
• GitHub: github:user/repo or user/repo
• URL: https://example.com/template.zip
• Local: ./path/to/template

Examples:
• github:microsoft/TypeScript-Node-Starter
• https://github.com/user/template/archive/main.zip
• ./my-custom-template
• ~/templates/my-template
    `)
  }

  /**
   * Show help for project customization
   */
  private showCustomizationHelp(): void {
    consola.box(`
⚙️ Project Customization Help

Project Details:
• Name: Use lowercase, numbers, hyphens only
• Description: Brief project summary
• Author: Your name and email
• Version: Follow semver (e.g., 1.0.0)

Package Managers:
• npm - Default Node.js package manager
• yarn - Fast, reliable package manager
• pnpm - Efficient disk space usage
• bun - All-in-one JavaScript runtime

Output Directory:
• Relative: ./my-project
• Absolute: /path/to/project
• Current: . (use with caution)

Features are template-specific and optional.
    `)
  }

  /**
   * Show help for error situations
   */
  private showErrorHelp(): void {
    consola.box(`
🔧 Troubleshooting Help

Common Issues:
• Network errors: Check internet connection
• Permission errors: Run with appropriate permissions
• Template not found: Verify template source
• Invalid project name: Use lowercase, numbers, hyphens only

Recovery Options:
• Use --verbose flag for detailed output
• Try a different template
• Check available disk space
• Verify Node.js version compatibility

For more help: npx @bfra.me/create --help
    `)
  }

  /**
   * Show general help
   */
  private showGeneralHelp(): void {
    consola.box(`
🚀 @bfra.me/create - Project Scaffolding Tool

Quick Start:
• npx @bfra.me/create my-project
• npx @bfra.me/create my-lib --template=library
• npx @bfra.me/create my-app --template=react

Available Commands:
• create - Create a new project
• add - Add features to existing project (coming soon)

For detailed help on a command:
• npx @bfra.me/create create --help
• npx @bfra.me/create --help

Interactive Mode:
The tool will guide you through project setup
with prompts for templates, customization, and options.

Non-Interactive Mode:
Use CLI flags to skip prompts:
• --template - Specify template
• --no-interactive - Skip all prompts
• --skip-prompts - Use defaults
    `)
  }

  /**
   * Initialize default help topics
   */
  private initializeDefaultTopics(): void {
    this.topics.set('templates', {
      name: 'Templates',
      description: 'Understanding template types and sources',
      examples: [
        'npx @bfra.me/create my-lib --template=library',
        'npx @bfra.me/create my-app --template=github:user/repo',
        'npx @bfra.me/create my-project --template=./local-template',
      ],
      relatedTopics: ['customization', 'examples'],
    })

    this.topics.set('customization', {
      name: 'Customization',
      description: 'Configuring project details and options',
      examples: [
        '--author="John Doe <john@example.com>"',
        '--description="My awesome project"',
        '--package-manager=pnpm',
      ],
      relatedTopics: ['templates', 'examples'],
    })

    this.topics.set('troubleshooting', {
      name: 'Troubleshooting',
      description: 'Common issues and solutions',
      examples: [
        'npx @bfra.me/create my-project --verbose',
        'npx @bfra.me/create my-project --force',
        'npx @bfra.me/create my-project --dry-run',
      ],
      relatedTopics: ['examples'],
    })
  }

  /**
   * Initialize default command help
   */
  private initializeDefaultCommands(): void {
    this.commands.set('create', {
      command: 'create',
      description: 'Create a new project from a template',
      usage: 'npx @bfra.me/create [projectName] [options]',
      options: [
        {
          flag: '-t, --template <template>',
          description: 'Template to use (builtin, GitHub repo, URL, or local path)',
          example: '--template=library',
        },
        {
          flag: '-d, --description <desc>',
          description: 'Project description',
          example: '--description="My awesome project"',
        },
        {
          flag: '-a, --author <author>',
          description: 'Project author',
          example: '--author="John Doe <john@example.com>"',
        },
        {
          flag: '-v, --version <version>',
          description: 'Project version',
          example: '--version=1.0.0',
        },
        {
          flag: '-o, --output-dir <dir>',
          description: 'Output directory for the project',
          example: '--output-dir=./my-project',
        },
        {
          flag: '--package-manager <pm>',
          description: 'Package manager to use (npm, yarn, pnpm, bun)',
          example: '--package-manager=pnpm',
        },
        {
          flag: '--skip-prompts',
          description: 'Skip interactive prompts and use defaults',
        },
        {
          flag: '--force',
          description: 'Force overwrite existing files',
        },
        {
          flag: '--no-interactive',
          description: 'Disable interactive mode',
        },
        {
          flag: '--dry-run',
          description: 'Show what would be done without making changes',
        },
        {
          flag: '--verbose',
          description: 'Enable verbose output',
        },
      ],
      examples: [
        'npx @bfra.me/create my-project',
        'npx @bfra.me/create my-lib --template=library',
        'npx @bfra.me/create my-app --template=react --package-manager=pnpm',
        'npx @bfra.me/create my-project --template=github:user/repo --no-interactive',
      ],
    })
  }
}

/**
 * Global help system instance
 */
export const helpSystem = new HelpSystem()

/**
 * Show contextual help based on error type
 */
export function showErrorHelp(errorType: string, error?: Error): void {
  consola.error(`Error: ${error?.message ?? errorType}`)

  switch (errorType) {
    case 'network': {
      consola.info(`
💡 Network Error Help:
• Check your internet connection
• Verify the template URL is accessible
• Try using a different template source
• Use --verbose flag for more details
      `)
      break
    }
    case 'permission': {
      consola.info(`
💡 Permission Error Help:
• Check file/directory permissions
• Run with appropriate user permissions
• Verify write access to output directory
• Try a different output location
      `)
      break
    }
    case 'template': {
      consola.info(`
💡 Template Error Help:
• Verify template name or path is correct
• Check if GitHub repository exists and is public
• Try using a built-in template: default, library, cli, node, react
• Use --verbose flag for detailed error information
      `)
      break
    }
    case 'validation': {
      consola.info(`
💡 Validation Error Help:
• Project name must use lowercase, numbers, and hyphens only
• Version must follow semver format (e.g., 1.0.0)
• Output directory path must be valid
• Check all required fields are provided
      `)
      break
    }
    default: {
      helpSystem.showContextualHelp('error')
      break
    }
  }
}
