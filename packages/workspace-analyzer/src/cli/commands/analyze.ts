/**
 * Analyze command implementation.
 *
 * Provides the main 'analyze' command for running workspace analysis
 * with interactive and non-interactive modes.
 */

import type {AnalysisResult} from '../../types/index'
import type {AnalyzeOptions, AnalyzerSelectionOption} from '../types'

import path from 'node:path'
import process from 'node:process'

import {BUILTIN_ANALYZER_IDS} from '../../analyzers/index'
import {analyzeWorkspace} from '../../api/analyze-workspace'
import {createConsoleReporter} from '../../reporters/console-reporter'
import {createJsonReporter} from '../../reporters/json-reporter'
import {createMarkdownReporter} from '../../reporters/markdown-reporter'
import {
  createLogger,
  createSpinner,
  formatDuration,
  formatSeveritySummary,
  handleCancel,
  selectAnalyzers,
  showCancel,
  showIntro,
  showOutro,
} from '../ui'

/**
 * Metadata for built-in analyzers used in selection UI.
 */
const ANALYZER_METADATA: Record<string, {label: string; hint: string}> = {
  [BUILTIN_ANALYZER_IDS.PACKAGE_JSON]: {
    label: 'Package.json Analyzer',
    hint: 'Validates package.json structure and required fields',
  },
  [BUILTIN_ANALYZER_IDS.TSCONFIG]: {
    label: 'TSConfig Analyzer',
    hint: 'Checks TypeScript configuration consistency',
  },
  [BUILTIN_ANALYZER_IDS.ESLINT_CONFIG]: {
    label: 'ESLint Config Analyzer',
    hint: 'Validates ESLint configuration patterns',
  },
  [BUILTIN_ANALYZER_IDS.BUILD_CONFIG]: {
    label: 'Build Config Analyzer',
    hint: 'Analyzes tsup and build configuration',
  },
  [BUILTIN_ANALYZER_IDS.CONFIG_CONSISTENCY]: {
    label: 'Config Consistency',
    hint: 'Cross-validates multiple configuration files',
  },
  [BUILTIN_ANALYZER_IDS.VERSION_ALIGNMENT]: {
    label: 'Version Alignment',
    hint: 'Checks dependency version consistency',
  },
  [BUILTIN_ANALYZER_IDS.EXPORTS_FIELD]: {
    label: 'Exports Field Analyzer',
    hint: 'Validates package.json exports against source files',
  },
  [BUILTIN_ANALYZER_IDS.UNUSED_DEPENDENCY]: {
    label: 'Unused Dependencies',
    hint: 'Detects dependencies not used in source code',
  },
  [BUILTIN_ANALYZER_IDS.CIRCULAR_IMPORT]: {
    label: 'Circular Imports',
    hint: 'Finds circular import dependencies',
  },
  [BUILTIN_ANALYZER_IDS.PEER_DEPENDENCY]: {
    label: 'Peer Dependencies',
    hint: 'Validates peer dependency requirements',
  },
  [BUILTIN_ANALYZER_IDS.DUPLICATE_DEPENDENCY]: {
    label: 'Duplicate Dependencies',
    hint: 'Finds duplicate packages across workspace',
  },
  [BUILTIN_ANALYZER_IDS.ARCHITECTURAL]: {
    label: 'Architecture',
    hint: 'Validates architectural patterns and layers',
  },
  [BUILTIN_ANALYZER_IDS.DEAD_CODE]: {
    label: 'Dead Code',
    hint: 'Detects unreachable or unused exports',
  },
  [BUILTIN_ANALYZER_IDS.DUPLICATE_CODE]: {
    label: 'Duplicate Code',
    hint: 'Finds similar code patterns via AST fingerprinting',
  },
  [BUILTIN_ANALYZER_IDS.LARGE_DEPENDENCY]: {
    label: 'Large Dependencies',
    hint: 'Identifies oversized dependencies',
  },
  [BUILTIN_ANALYZER_IDS.TREE_SHAKING_BLOCKER]: {
    label: 'Tree Shaking Blockers',
    hint: 'Finds patterns that prevent tree shaking',
  },
}

/**
 * Gets available analyzer options for selection UI.
 */
function getAnalyzerOptions(): readonly AnalyzerSelectionOption[] {
  return Object.entries(BUILTIN_ANALYZER_IDS).map(([_key, id]) => {
    const metadata = ANALYZER_METADATA[id] ?? {
      label: id,
      hint: 'Analyzer',
    }
    return {
      value: id,
      label: metadata.label,
      hint: metadata.hint,
    }
  })
}

/**
 * Reports analysis results to the console or other formats.
 */
function reportResults(result: AnalysisResult, options: AnalyzeOptions): void {
  if (options.json === true) {
    const jsonReporter = createJsonReporter()
    const report = jsonReporter.generate(result)
    console.log(JSON.stringify(report, null, 2))
    return
  }

  if (options.markdown === true) {
    const mdReporter = createMarkdownReporter()
    const report = mdReporter.generate(result)
    console.log(report)
    return
  }

  const consoleReporter = createConsoleReporter({verbose: options.verbose})
  consoleReporter.generate(result)
}

/**
 * Runs the analyze command.
 */
export async function runAnalyze(inputPath: string, options: AnalyzeOptions): Promise<void> {
  const logger = createLogger(options)
  const rootDir = path.resolve(options.root ?? inputPath)

  if (options.quiet !== true) {
    showIntro('🔍 Workspace Analyzer')
  }

  let selectedAnalyzers: readonly string[] | undefined

  if (options.interactive === true) {
    const availableAnalyzers = getAnalyzerOptions()
    const selection = await selectAnalyzers(availableAnalyzers)

    if (handleCancel(selection)) {
      showCancel()
      process.exit(0)
    }

    selectedAnalyzers = selection
    logger.debug(`Selected ${selectedAnalyzers.length} analyzers: ${selectedAnalyzers.join(', ')}`)
  }

  if (options.dryRun === true) {
    logger.info(`[DRY RUN] Would analyze workspace at: ${rootDir}`)
    if (selectedAnalyzers != null && selectedAnalyzers.length > 0) {
      logger.info(`[DRY RUN] Using analyzers: ${selectedAnalyzers.join(', ')}`)
    } else {
      logger.info('[DRY RUN] Using all analyzers')
    }
    if (options.config != null) {
      logger.info(`[DRY RUN] Using config: ${options.config}`)
    }
    if (options.quiet !== true) {
      showOutro('Dry run complete - no analysis performed')
    }
    return
  }

  if (options.fix === true) {
    logger.warn('Auto-fix mode is not yet implemented. Running analysis only.')
  }

  const spinner = options.quiet === true ? undefined : createSpinner()
  spinner?.start('Analyzing workspace...')

  const startTime = Date.now()

  const result = await analyzeWorkspace(rootDir, {
    configPath: options.config,
    verbose: options.verbose,
    minSeverity: options.minSeverity,
    analyzers:
      selectedAnalyzers != null && selectedAnalyzers.length > 0
        ? Object.fromEntries(
            Object.values(BUILTIN_ANALYZER_IDS).map(id => [
              id,
              {enabled: selectedAnalyzers.includes(id)},
            ]),
          )
        : undefined,
    onProgress: progress => {
      const totalSuffix = progress.total == null ? '' : `/${progress.total}`
      const currentItem = progress.current ?? ''
      const message = `${progress.phase}: ${currentItem} (${progress.processed}${totalSuffix})`
      spinner?.message(message)
      logger.debug(message)
    },
  })

  const duration = Date.now() - startTime
  spinner?.stop(`Analysis complete in ${formatDuration(duration)}`)

  if (result.success) {
    const analysisResult = result.data

    reportResults(analysisResult, options)

    if (options.quiet !== true) {
      const summary = formatSeveritySummary(analysisResult.summary.bySeverity)
      showOutro(`${summary} (${analysisResult.summary.totalIssues} total issues)`)
    }

    const hasErrors =
      (analysisResult.summary.bySeverity.error ?? 0) > 0 ||
      (analysisResult.summary.bySeverity.critical ?? 0) > 0

    if (hasErrors) {
      process.exit(1)
    }
  } else {
    logger.error(`Analysis failed: ${result.error.message}`)
    if (options.verbose === true && result.error.cause != null) {
      logger.debug(`Cause: ${String(result.error.cause)}`)
    }
    process.exit(1)
  }
}
