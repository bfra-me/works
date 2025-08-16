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
} as const

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
