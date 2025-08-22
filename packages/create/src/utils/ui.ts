import type {DependencyRecommendation, TemplateRecommendation} from '../types.js'
import consola from 'consola'

/**
 * Emoji and color constants for enhanced CLI experience
 */
export const emoji = {
  // Status
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',

  // Actions
  rocket: '🚀',
  sparkles: '✨',
  gear: '⚙️',
  package: '📦',
  folder: '📁',
  file: '📄',

  // Progress
  hourglass: '⏳',
  checkmark: '✓',
  crossmark: '✗',

  // Features
  ai: '🤖',
  template: '📋',
  code: '💻',
  build: '🔨',
  test: '🧪',

  // AI specific
  brain: '🧠',
  lightbulb: '💡',
  magic: '✨',
  chart: '📊',
  magnifyingGlass: '🔍',
} as const

/**
 * Enhanced console logger with emoji and color support
 */
export const logger = {
  /**
   * Start a new operation with visual feedback
   */
  start(message: string): void {
    consola.start(`${emoji.hourglass} ${message}`)
  },

  /**
   * Success message with green color and checkmark
   */
  success(message: string): void {
    consola.success(`${emoji.success} ${message}`)
  },

  /**
   * Error message with red color and cross
   */
  error(message: string): void {
    consola.error(`${emoji.error} ${message}`)
  },

  /**
   * Warning message with yellow color
   */
  warn(message: string): void {
    consola.warn(`${emoji.warning} ${message}`)
  },

  /**
   * Info message with blue color
   */
  info(message: string): void {
    consola.info(`${emoji.info} ${message}`)
  },

  /**
   * Log project creation start
   */
  projectStart(projectName: string): void {
    consola.start(`${emoji.rocket} Creating project "${projectName}"...`)
  },

  /**
   * Log successful project creation
   */
  projectSuccess(projectName: string, location: string): void {
    consola.success(`${emoji.sparkles} Project "${projectName}" created successfully!`)
    consola.info(`${emoji.folder} Location: ${location}`)
  },

  /**
   * Log template processing
   */
  templateProcessing(templateName: string): void {
    consola.info(`${emoji.template} Processing template: ${templateName}`)
  },

  /**
   * Log dependency installation
   */
  dependencyInstall(): void {
    consola.start(`${emoji.package} Installing dependencies...`)
  },

  /**
   * Log successful dependency installation
   */
  dependencySuccess(): void {
    consola.success(`${emoji.checkmark} Dependencies installed successfully`)
  },

  /**
   * Log AI processing
   */
  aiProcessing(task: string): void {
    consola.info(`${emoji.ai} AI processing: ${task}`)
  },

  /**
   * Log build process
   */
  building(): void {
    consola.start(`${emoji.build} Building project...`)
  },

  /**
   * Log test execution
   */
  testing(): void {
    consola.start(`${emoji.test} Running tests...`)
  },

  /**
   * Log file generation
   */
  fileGenerated(filename: string): void {
    consola.info(`${emoji.file} Generated: ${filename}`)
  },

  /**
   * Log configuration update
   */
  configUpdated(configType: string): void {
    consola.info(`${emoji.gear} Updated ${configType} configuration`)
  },

  /**
   * Log AI analysis start
   */
  aiAnalysisStart(description?: string): void {
    const message =
      description != null && description.length > 0
        ? `Analyzing "${description}"`
        : 'Analyzing project requirements'
    consola.start(`${emoji.ai} ${message}...`)
  },

  /**
   * Log AI analysis completion
   */
  aiAnalysisComplete(): void {
    consola.success(`${emoji.brain} AI Analysis Complete`)
  },

  /**
   * Log AI fallback mode
   */
  aiFallback(reason: string): void {
    consola.warn(`${emoji.warning} AI features unavailable (${reason})`)
    consola.info(`${emoji.template} Continuing with standard template selection...`)
  },

  /**
   * Log AI API unavailable
   */
  aiUnavailable(): void {
    consola.info(`${emoji.lightbulb} AI features will be available again in 15 minutes`)
  },
} as const

/**
 * AI-specific progress indicators
 */
export class AIProgressIndicator {
  private spinnerInstance: ReturnType<typeof import('@clack/prompts').spinner> | null = null

  /**
   * Start AI analysis progress
   */
  async startAnalysis(description?: string): Promise<void> {
    const {spinner} = await import('@clack/prompts')
    const message =
      description != null && description.length > 0
        ? `${emoji.ai} Analyzing "${description}"`
        : `${emoji.ai} Analyzing project requirements`

    this.spinnerInstance = spinner()
    this.spinnerInstance.start(message)
  }

  /**
   * Update progress message
   */
  updateMessage(message: string): void {
    if (this.spinnerInstance) {
      this.spinnerInstance.message(`${emoji.brain} ${message}`)
    }
  }

  /**
   * Complete analysis successfully
   */
  complete(message = 'AI analysis complete'): void {
    if (this.spinnerInstance) {
      this.spinnerInstance.stop(`${emoji.checkmark} ${message}`)
      this.spinnerInstance = null
    }
  }

  /**
   * Stop with error
   */
  error(message = 'AI analysis failed'): void {
    if (this.spinnerInstance) {
      this.spinnerInstance.stop(`${emoji.crossmark} ${message}`)
      this.spinnerInstance = null
    }
  }

  /**
   * Stop with fallback message
   */
  fallback(reason: string): void {
    if (this.spinnerInstance) {
      this.spinnerInstance.stop(`${emoji.warning} AI unavailable (${reason}) - using fallback`)
      this.spinnerInstance = null
    }
  }
}

/**
 * Display AI template recommendations with visual indicators
 */
export function displayTemplateRecommendations(templates: TemplateRecommendation[]): void {
  if (templates.length === 0) return

  consola.box(`
${emoji.ai} AI Template Recommendations

${templates
  .slice(0, 3) // Show top 3 recommendations
  .map(template => {
    const percentage = Math.round(template.confidence * 100)
    const matchIcon = percentage >= 90 ? '🎯' : percentage >= 75 ? '🔥' : '💡'
    return `${matchIcon} ${template.source.location} (${percentage}% match)
   ${template.reason}`
  })
  .join('\n\n')}
  `)
}

/**
 * Display AI dependency recommendations with reasoning
 */
export function displayDependencyRecommendations(dependencies: DependencyRecommendation[]): void {
  if (dependencies.length === 0) return

  const essentialDeps = dependencies.filter(dep => dep.confidence >= 0.8).slice(0, 5)
  const suggestedDeps = dependencies
    .filter(dep => dep.confidence < 0.8 && dep.confidence >= 0.6)
    .slice(0, 3)

  let content = `${emoji.ai} AI Dependency Suggestions\n\n`

  if (essentialDeps.length > 0) {
    content += `📦 Essential Dependencies:\n${essentialDeps
      .map(dep => {
        const percentage = Math.round(dep.confidence * 100)
        const icon = dep.isDev ? '🛠️' : '📦'
        return `${icon} ${dep.name} - ${dep.reason} (${percentage}% confidence)`
      })
      .join('\n')}\n\n`
  }

  if (suggestedDeps.length > 0) {
    content += `💡 Suggested Dependencies:\n${suggestedDeps
      .map(dep => {
        const percentage = Math.round(dep.confidence * 100)
        const icon = dep.isDev ? '🛠️' : '📦'
        return `${icon} ${dep.name} - ${dep.reason} (${percentage}% confidence)`
      })
      .join('\n')}`
  }

  consola.box(content.trim())
}

/**
 * Display AI analysis summary
 */
export function displayAIAnalysisSummary(analysis: {
  projectType: string
  confidence: number
  description: string
  features: string[]
}): void {
  const percentage = Math.round(analysis.confidence * 100)

  consola.box(`
${emoji.brain} AI Project Analysis

🎯 Project Type: ${analysis.projectType} (${percentage}% confidence)
📝 Description: ${analysis.description}
${analysis.features.length > 0 ? `✨ Recommended Features: ${analysis.features.join(', ')}` : ''}
  `)
}

/**
 * Progress indicator for long-running operations
 */
export class ProgressIndicator {
  private message: string

  constructor(message: string) {
    this.message = message
  }

  start(): void {
    consola.start(`${emoji.hourglass} ${this.message}`)
  }

  update(message: string): void {
    this.message = message
    consola.info(`${emoji.hourglass} ${message}`)
  }

  succeed(message?: string): void {
    const displayMessage = message ?? this.message
    consola.success(`${emoji.success} ${displayMessage}`)
  }

  fail(message?: string): void {
    const displayMessage = message ?? this.message
    consola.error(`${emoji.error} ${displayMessage}`)
  }

  stop(): void {
    // Cleanup if needed
  }
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Display a summary box with project details
 */
export function displayProjectSummary(details: {
  name: string
  template: string
  location: string
  dependencies: string[]
  scripts: string[]
}): void {
  const {name, template, location, dependencies, scripts} = details

  consola.box(`
${emoji.sparkles} Project Created Successfully!

${emoji.package} Name: ${name}
${emoji.template} Template: ${template}
${emoji.folder} Location: ${location}
${emoji.gear} Dependencies: ${dependencies.length} packages
${emoji.code} Scripts: ${scripts.join(', ')}

Next steps:
1. cd ${name}
2. Start coding! ${emoji.rocket}
  `)
}
