/**
 * Visualize command implementation.
 *
 * Generates interactive HTML visualizations of workspace dependency graphs,
 * highlighting circular imports and architectural violations.
 */

import type {ImportExtractionResult} from '../../parser/import-extractor'
import type {WorkspacePackage} from '../../scanner/workspace-scanner'
import type {VisualizeFormat, VisualizeOptions, VisualizePromptResult} from '../types'

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {createProject} from '@bfra.me/doc-sync'
import {isErr} from '@bfra.me/es/result'
import * as p from '@clack/prompts'
import open from 'open'

import {buildDependencyGraph, findCycles} from '../../graph/dependency-graph'
import {extractImports} from '../../parser/import-extractor'
import {createRuleEngine, DEFAULT_LAYER_CONFIG} from '../../rules/rule-engine'
import {createWorkspaceScanner} from '../../scanner/workspace-scanner'
import {
  buildVisualizationData,
  DEFAULT_VISUALIZER_OPTIONS,
  exportVisualizationJson,
  isWithinSizeLimit,
  renderVisualizationHtml,
} from '../../visualizer/index'
import {collectVisualizationViolations} from '../../visualizer/violation-collector'
import {
  createLogger,
  createSpinner,
  formatDuration,
  handleCancel,
  showCancel,
  showIntro,
  showOutro,
} from '../ui'

const ANALYZER_VERSION = '0.1.0'

/**
 * Prompts user for visualization options in interactive mode.
 */
async function promptVisualizeOptions(
  defaultOptions: VisualizeOptions,
): Promise<VisualizePromptResult | symbol> {
  const defaultOutput = defaultOptions.output ?? DEFAULT_VISUALIZER_OPTIONS.outputPath
  const defaultFormat = defaultOptions.format ?? 'html'
  const defaultNoOpen = defaultOptions.noOpen ?? false
  const defaultTitle = defaultOptions.title ?? DEFAULT_VISUALIZER_OPTIONS.title
  const defaultMaxNodes = defaultOptions.maxNodes ?? DEFAULT_VISUALIZER_OPTIONS.maxNodes
  const defaultIncludeTypeImports =
    defaultOptions.includeTypeImports ?? DEFAULT_VISUALIZER_OPTIONS.includeTypeImports

  const outputPath = await p.text({
    message: 'Output path for the visualization file:',
    initialValue: defaultOutput,
    validate(value: string) {
      if (value.trim().length === 0) {
        return 'Output path is required'
      }
      return undefined
    },
  })

  if (p.isCancel(outputPath)) return outputPath

  const format = await p.select({
    message: 'Select output format:',
    options: [
      {value: 'html' as const, label: 'HTML', hint: 'Interactive D3.js visualization'},
      {value: 'json' as const, label: 'JSON', hint: 'Raw data for external tools'},
      {value: 'both' as const, label: 'Both', hint: 'Generate HTML and JSON files'},
    ],
    initialValue: defaultFormat as 'html' | 'json' | 'both',
  })

  if (p.isCancel(format)) return format

  const autoOpen = await p.confirm({
    message: 'Open generated file in browser?',
    initialValue: !defaultNoOpen,
  })

  if (p.isCancel(autoOpen)) return autoOpen

  const title = await p.text({
    message: 'Visualization title:',
    initialValue: defaultTitle,
  })

  if (p.isCancel(title)) return title

  const maxNodesInput = await p.text({
    message: 'Maximum nodes to render (for performance):',
    initialValue: String(defaultMaxNodes),
    validate(value: string) {
      const num = Number(value)
      if (Number.isNaN(num) || num < 1) {
        return 'Must be a positive number'
      }
      return undefined
    },
  })

  if (p.isCancel(maxNodesInput)) return maxNodesInput

  const includeTypeImports = await p.confirm({
    message: 'Include type-only imports in the graph?',
    initialValue: defaultIncludeTypeImports,
  })

  if (p.isCancel(includeTypeImports)) return includeTypeImports

  return {
    outputPath: String(outputPath),
    format: format as VisualizeFormat,
    autoOpen: Boolean(autoOpen),
    title: String(title),
    maxNodes: Number(maxNodesInput),
    includeTypeImports: Boolean(includeTypeImports),
  }
}

/**
 * Generates HTML and/or JSON visualization files.
 */
async function writeVisualizationFiles(
  outputPath: string,
  format: VisualizeFormat,
  html: string | undefined,
  json: string,
): Promise<{htmlPath?: string; jsonPath?: string}> {
  const result: {htmlPath?: string; jsonPath?: string} = {}

  if (format === 'html' || format === 'both') {
    const htmlPath = outputPath.endsWith('.html') ? outputPath : `${outputPath}.html`
    await fs.mkdir(path.dirname(htmlPath), {recursive: true})
    await fs.writeFile(htmlPath, html ?? '', 'utf-8')
    result.htmlPath = htmlPath
  }

  if (format === 'json' || format === 'both') {
    const jsonPath = format === 'json' ? outputPath : outputPath.replace(/\.html$/, '.json')
    const finalJsonPath = jsonPath.endsWith('.json') ? jsonPath : `${jsonPath}.json`
    await fs.mkdir(path.dirname(finalJsonPath), {recursive: true})
    await fs.writeFile(finalJsonPath, json, 'utf-8')
    result.jsonPath = finalJsonPath
  }

  return result
}

/**
 * Extracts imports from all source files in packages.
 *
 * Uses ts-morph to parse TypeScript/JavaScript files and extract import declarations.
 * Files that fail to parse are skipped with a warning in verbose mode.
 *
 * @param packages - Workspace packages to extract imports from
 * @param includeTypeImports - Whether to include type-only imports
 * @param reportProgress - Callback for progress updates (verbose logging)
 * @returns Import results and package mapping
 */
async function extractAllImports(
  packages: readonly WorkspacePackage[],
  includeTypeImports: boolean,
  reportProgress?: (message: string) => void,
): Promise<{results: ImportExtractionResult[]; packageMap: Map<string, string>}> {
  const results: ImportExtractionResult[] = []
  const packageMap = new Map<string, string>()

  for (const pkg of packages) {
    reportProgress?.(`Processing ${pkg.name}...`)

    const tsconfigPath = path.join(pkg.packagePath, 'tsconfig.json')

    let project
    try {
      project = createProject({tsConfigPath: tsconfigPath})
    } catch {
      project = createProject()
    }

    for (const sourceFilePath of pkg.sourceFiles) {
      packageMap.set(sourceFilePath, pkg.name)

      try {
        const sourceFile = project.addSourceFileAtPath(sourceFilePath)
        const importResult = extractImports(sourceFile, {
          includeTypeImports,
          includeDynamicImports: true,
          includeRequireCalls: true,
          workspacePrefixes: ['@bfra.me/'],
        })
        results.push(importResult)
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
        reportProgress?.(`Skipping unparseable file: ${sourceFilePath} (${errorMessage})`)
      }
    }
  }

  return {results, packageMap}
}

/**
 * Runs the visualize command.
 */
export async function runVisualize(inputPath: string, options: VisualizeOptions): Promise<void> {
  const rootDir = path.resolve(options.root ?? inputPath)
  const logger = createLogger({verbose: options.verbose, quiet: options.quiet})

  const suppressUI = options.quiet === true
  if (!suppressUI) {
    showIntro('📊 Dependency Graph Visualizer')
  }

  let visualizeOpts: VisualizePromptResult

  if (options.interactive === true) {
    const promptResult = await promptVisualizeOptions(options)
    if (handleCancel(promptResult)) {
      showCancel()
      process.exit(0)
    }
    visualizeOpts = promptResult
    logger.debug(`Interactive options: ${JSON.stringify(visualizeOpts)}`)
  } else {
    visualizeOpts = {
      outputPath: options.output ?? DEFAULT_VISUALIZER_OPTIONS.outputPath,
      format: options.format ?? 'html',
      autoOpen: options.noOpen !== true,
      title: options.title ?? DEFAULT_VISUALIZER_OPTIONS.title,
      maxNodes: options.maxNodes ?? DEFAULT_VISUALIZER_OPTIONS.maxNodes,
      includeTypeImports:
        options.includeTypeImports ?? DEFAULT_VISUALIZER_OPTIONS.includeTypeImports,
    }
  }

  const spinner = suppressUI ? undefined : createSpinner()

  try {
    spinner?.start('Scanning workspace packages...')
    const startTime = Date.now()

    const scanner = createWorkspaceScanner({rootDir})
    const scanResult = await scanner.scan()

    if (scanResult.errors.length > 0) {
      for (const scanError of scanResult.errors) {
        logger.warn(`Scan warning: ${scanError.message}`)
      }
    }

    const packages = scanResult.packages
    logger.debug(`Found ${packages.length} packages`)

    spinner?.message('Extracting imports...')

    const {results: importResults, packageMap} = await extractAllImports(
      packages,
      visualizeOpts.includeTypeImports,
      message => logger.debug(message),
    )

    logger.debug(`Extracted imports from ${importResults.length} files`)

    spinner?.message('Building dependency graph...')

    const graph = buildDependencyGraph(importResults, {rootPath: rootDir})

    spinner?.message('Finding circular dependencies...')

    const cycles = findCycles(graph)
    logger.debug(`Found ${cycles.length} cycles`)

    spinner?.message('Collecting architectural violations...')

    const ruleEngine = createRuleEngine()
    const violationsResult = await collectVisualizationViolations({
      packages,
      ruleEngine,
      workspacePath: rootDir,
      reportProgress: message => logger.debug(message),
    })

    const issues = isErr(violationsResult) ? [] : violationsResult.data
    logger.debug(`Collected ${issues.length} violations`)

    spinner?.message('Building visualization data...')

    const vizResult = buildVisualizationData(
      {
        graph,
        cycles,
        issues,
        layerConfig: DEFAULT_LAYER_CONFIG,
        packageMap,
        analyzerVersion: ANALYZER_VERSION,
      },
      {
        includeTypeImports: visualizeOpts.includeTypeImports,
        maxNodes: visualizeOpts.maxNodes,
        title: visualizeOpts.title,
      },
    )

    if (!vizResult.success) {
      spinner?.stop('Visualization build failed')
      logger.error(`Failed to build visualization: ${vizResult.error.message}`)
      process.exit(1)
    }

    const vizData = vizResult.data

    if (!isWithinSizeLimit(vizData)) {
      logger.warn('Generated visualization may exceed 5MB file size limit')
    }

    spinner?.message('Rendering visualization...')

    let htmlContent: string | undefined
    const jsonContent = exportVisualizationJson(vizData)

    if (visualizeOpts.format === 'html' || visualizeOpts.format === 'both') {
      const htmlResult = renderVisualizationHtml(vizData, {
        title: visualizeOpts.title,
        inlineD3: true,
        minify: false,
      })

      if (!htmlResult.success) {
        spinner?.stop('HTML render failed')
        logger.error(`Failed to render HTML: ${htmlResult.error.message}`)
        process.exit(1)
      }

      htmlContent = htmlResult.data
    }

    spinner?.message('Writing output files...')

    const outputFiles = await writeVisualizationFiles(
      visualizeOpts.outputPath,
      visualizeOpts.format,
      htmlContent,
      jsonContent,
    )

    const duration = Date.now() - startTime
    spinner?.stop(`Visualization generated in ${formatDuration(duration)}`)

    if (outputFiles.htmlPath != null) {
      logger.info(`HTML: ${outputFiles.htmlPath}`)
    }
    if (outputFiles.jsonPath != null) {
      logger.info(`JSON: ${outputFiles.jsonPath}`)
    }

    if (!suppressUI) {
      const stats = vizData.statistics
      showOutro(`${stats.totalNodes} nodes, ${stats.totalEdges} edges, ${stats.totalCycles} cycles`)
    }

    if (visualizeOpts.autoOpen && outputFiles.htmlPath != null) {
      logger.debug(`Opening ${outputFiles.htmlPath} in browser...`)
      await open(outputFiles.htmlPath)
    }
  } catch (error) {
    spinner?.stop('Failed')
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Visualization failed: ${message}`)
    if (options.verbose === true && error instanceof Error) {
      logger.debug(`Stack: ${error.stack ?? 'N/A'}`)
    }
    process.exit(1)
  }
}
