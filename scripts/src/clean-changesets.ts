#!/usr/bin/env tsx

import {readdir, readFile, unlink, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import parseChangesetFile from '@changesets/parse'
import {consola} from 'consola'

const DEFAULT_CHANGESET_DIR = '.changeset'

interface ChangesetFile {
  path: string
  content: string
}

/**
 * Checks if a filename matches the Renovate changeset naming pattern.
 * Renovate generates changesets with names like: renovate-{7-char-hex}.md
 * @param filename - The changeset filename (not the full path)
 * @returns True if the filename matches the Renovate pattern
 */
function isRenovateChangeset(filename: string): boolean {
  return /^renovate-[\da-f]{7}\.md$/i.test(filename)
}

async function getChangesetFiles(changesetDir: string): Promise<ChangesetFile[]> {
  try {
    const files = await readdir(changesetDir)
    const changesetFiles = files.filter(
      file =>
        file.endsWith('.md') && !/^(?:README|CHANGELOG)/i.test(file) && isRenovateChangeset(file),
    )

    const fileContents = await Promise.all(
      changesetFiles.map(async file => ({
        path: join(changesetDir, file),
        content: await readFile(join(changesetDir, file), 'utf8'),
      })),
    )

    return fileContents
  } catch (error) {
    consola.error('Failed to read changeset files:', error)
    throw error
  }
}

function hasEmptyFrontmatter(content: string): boolean {
  try {
    const parsed = parseChangesetFile(content)
    return parsed.releases.length === 0
  } catch (error) {
    // If parsing fails, file is malformed - don't delete it
    consola.warn(
      `Failed to parse changeset content, skipping deletion check: ${error instanceof Error ? error.message : String(error)}`,
    )
    return false
  }
}

function cleanChangesetContent(content: string, privatePackages: string[]): string {
  const lines = content.split('\n')
  const newLines = lines.filter(line => {
    // Skip lines that contain any of the private packages
    return !privatePackages.some(pkg => line.includes(pkg))
  })

  return newLines.join('\n')
}

async function deleteChangesetFile(file: ChangesetFile, dryRun: boolean): Promise<void> {
  try {
    if (dryRun) {
      consola.info(`[DRY RUN] Would delete empty changeset: ${file.path}`)
      return
    }

    await unlink(file.path)
    consola.success(`Deleted empty changeset: ${file.path}`)
  } catch (error) {
    consola.error(`Failed to delete ${file.path}:`, error)
    throw error
  }
}

async function writeChangesetFile(
  file: ChangesetFile,
  cleanedContent: string,
  dryRun: boolean,
): Promise<void> {
  try {
    if (dryRun) {
      consola.info(`[DRY RUN] Would write to ${file.path}`)
      return
    }

    await writeFile(file.path, cleanedContent, 'utf8')
    consola.success(`Cleaned ${file.path}`)
  } catch (error) {
    consola.error(`Failed to write changes to ${file.path}:`, error)
    throw error
  }
}

export interface CleanChangesetsOptions {
  changesetDir?: string
  privatePackages?: string[]
  dryRun?: boolean
}

export async function cleanChangesets(options: CleanChangesetsOptions = {}): Promise<void> {
  const {
    changesetDir = DEFAULT_CHANGESET_DIR,
    privatePackages = ['@bfra.me/works'],
    dryRun = false,
  } = options

  if (dryRun) {
    consola.info('Running in dry-run mode (no changes will be made)')
  }

  consola.info('Only processing Renovate-generated changesets (renovate-*.md)')
  consola.info('Cleaning Renovate changesets for private packages:', privatePackages)

  const changesetFiles = await getChangesetFiles(changesetDir)

  // Phase 1: Delete existing empty changesets
  consola.info('Phase 1: Checking for existing empty changesets...')
  let deletedCount = 0
  const filesToProcess: ChangesetFile[] = []

  for (const file of changesetFiles) {
    if (hasEmptyFrontmatter(file.content)) {
      await deleteChangesetFile(file, dryRun)
      deletedCount++
    } else {
      filesToProcess.push(file)
    }
  }

  if (deletedCount > 0) {
    consola.success(`Phase 1 complete: Deleted ${deletedCount} empty changeset(s)`)
  } else {
    consola.info('Phase 1 complete: No empty changesets found')
  }

  // Phase 2: Clean remaining files and delete if emptied
  consola.info('Phase 2: Cleaning private packages from remaining changesets...')
  let cleanedCount = 0
  let emptyAfterCleaningCount = 0

  for (const file of filesToProcess) {
    const cleanedContent = cleanChangesetContent(file.content, privatePackages)

    // No changes needed
    if (cleanedContent === file.content) {
      consola.info(`No changes needed for ${file.path}`)
      continue
    }

    // Check if cleaning resulted in empty frontmatter
    if (hasEmptyFrontmatter(cleanedContent)) {
      await deleteChangesetFile(file, dryRun)
      emptyAfterCleaningCount++
    } else {
      await writeChangesetFile(file, cleanedContent, dryRun)
      cleanedCount++
    }
  }

  if (cleanedCount > 0) {
    consola.success(`Phase 2 complete: Cleaned ${cleanedCount} changeset(s)`)
  }
  if (emptyAfterCleaningCount > 0) {
    consola.success(
      `Phase 2 complete: Deleted ${emptyAfterCleaningCount} changeset(s) that became empty after cleaning`,
    )
  }
  if (cleanedCount === 0 && emptyAfterCleaningCount === 0) {
    consola.info('Phase 2 complete: No changesets needed cleaning')
  }

  consola.success('Changeset cleaning completed successfully')
}

async function main(): Promise<void> {
  try {
    // Get configuration from environment variables
    const changesetDir = process.env.CHANGESET_DIR ?? DEFAULT_CHANGESET_DIR
    const privatePackages = (process.env.PRIVATE_PACKAGES ?? '@bfra.me/works')
      .split(',')
      .map(pkg => pkg.trim())
    const dryRun = process.env.DRY_RUN === 'true'

    await cleanChangesets({changesetDir, privatePackages, dryRun})
  } catch (error) {
    consola.error('Failed to clean changesets:', error)
    process.exit(1)
  }
}

// Only run main if this script is being executed directly (not imported for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
