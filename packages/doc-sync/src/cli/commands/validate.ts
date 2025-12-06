import type {GlobalOptions, ValidationStatus} from '../types.js'

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {generateMDXDocument, mergeContent} from '../../generators/index.js'
import {createPackageScanner} from '../../orchestrator/package-scanner.js'
import {createValidationPipeline} from '../../orchestrator/validation-pipeline.js'
import {getUnscopedName} from '../../parsers/index.js'
import {createLogger, createSpinner, formatDuration, showIntro, showOutro} from '../ui.js'

export async function runValidate(packages: string[], options: GlobalOptions): Promise<void> {
  const logger = createLogger(options)
  const rootDir = path.resolve(options.root)
  const outputDir = path.join(rootDir, 'docs', 'src', 'content', 'docs', 'packages')

  if (options.quiet !== true) {
    showIntro('🔍 doc-sync validate')
  }

  const startTime = Date.now()
  const spinner = options.quiet === true ? undefined : createSpinner()
  const validationResults: ValidationStatus[] = []

  spinner?.start('Scanning packages...')

  const scanner = createPackageScanner({
    rootDir,
    parseSourceFiles: true,
    parseReadme: true,
  })

  const validationPipeline = createValidationPipeline()
  const scanResult = await scanner.scan()

  spinner?.stop(`Found ${scanResult.packages.length} packages`)

  const packagesToValidate =
    packages.length > 0
      ? scanResult.packages.filter(pkg => packages.includes(pkg.info.name))
      : scanResult.packages

  spinner?.start(`Validating ${packagesToValidate.length} packages...`)

  for (const pkg of packagesToValidate) {
    const issues: string[] = []
    let isValid = true

    const docPath = buildDocPath(pkg.info.name, outputDir)

    try {
      await fs.access(docPath)

      const existingContent = await fs.readFile(docPath, 'utf-8')
      const contentValidation = validationPipeline.validateContent(existingContent)

      if (!contentValidation.valid) {
        isValid = false
        for (const error of contentValidation.errors) {
          issues.push(`MDX error: ${error.message}`)
        }
      }

      const docResult = generateMDXDocument(pkg.info, pkg.readme, pkg.api)

      if (docResult.success) {
        const generatedContent = docResult.data.rendered
        const mergedResult = mergeContent(existingContent, generatedContent)

        // Use mergeContent to respect manual edits between sentinel markers
        // This ensures validation matches sync behavior
        if (mergedResult.success) {
          if (normalizeContent(existingContent) !== normalizeContent(mergedResult.data.content)) {
            isValid = false
            issues.push('Documentation is out of date with source')
          }
        } else if (normalizeContent(existingContent) !== normalizeContent(generatedContent)) {
          isValid = false
          issues.push('Documentation is out of date with source')
        }
      } else {
        issues.push(`Generation failed: ${docResult.error.message}`)
      }
    } catch {
      isValid = false
      issues.push('Documentation file does not exist')
    }

    validationResults.push({
      packageName: pkg.info.name,
      isValid,
      issues,
    })

    if (options.verbose === true) {
      if (isValid) {
        logger.success(`✓ ${pkg.info.name}`)
      } else {
        logger.warn(`✗ ${pkg.info.name}: ${issues.join(', ')}`)
      }
    }
  }

  spinner?.stop('Validation complete')

  const validCount = validationResults.filter(r => r.isValid).length
  const invalidCount = validationResults.filter(r => !r.isValid).length
  const durationMs = Date.now() - startTime

  if (invalidCount > 0) {
    logger.warn(`Found ${invalidCount} package${invalidCount === 1 ? '' : 's'} with issues:`)

    for (const result of validationResults) {
      if (!result.isValid) {
        logger.error(`  ${result.packageName}:`)
        for (const issue of result.issues) {
          logger.error(`    - ${issue}`)
        }
      }
    }
  }

  logger.info(`${validCount} valid, ${invalidCount} invalid in ${formatDuration(durationMs)}`)

  if (options.quiet !== true) {
    if (invalidCount > 0) {
      showOutro(
        `⚠️  ${invalidCount} package${invalidCount === 1 ? '' : 's'} need${invalidCount === 1 ? 's' : ''} attention`,
      )
    } else {
      showOutro('✨ All documentation is up to date!')
    }
  }

  if (invalidCount > 0) {
    process.exit(1)
  }
}

function buildDocPath(packageName: string, outputDir: string): string {
  const slug = getUnscopedName(packageName)
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, '-')

  return path.join(outputDir, `${slug}.mdx`)
}

function normalizeContent(content: string): string {
  return content.replaceAll('\r\n', '\n').replaceAll(/\s+$/gm, '').trim()
}
