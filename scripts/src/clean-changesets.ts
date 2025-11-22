#!/usr/bin/env tsx

import {readdir, readFile, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

const DEFAULT_CHANGESET_DIR = '.changeset'

interface ChangesetFile {
  path: string
  content: string
}

async function getChangesetFiles(changesetDir: string): Promise<ChangesetFile[]> {
  try {
    const files = await readdir(changesetDir)
    const changesetFiles = files.filter(file => file.endsWith('.md'))

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

function cleanChangesetContent(content: string, privatePackages: string[]): string {
  const lines = content.split('\n')
  const newLines = lines.filter(line => {
    // Skip lines that contain any of the private packages
    return !privatePackages.some(pkg => line.includes(pkg))
  })

  return newLines.join('\n')
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

  consola.info('Cleaning changesets for private packages:', privatePackages)

  const changesetFiles = await getChangesetFiles(changesetDir)

  for (const file of changesetFiles) {
    const cleanedContent = cleanChangesetContent(file.content, privatePackages)

    // Only write if content was actually changed
    if (cleanedContent === file.content) {
      consola.info(`No changes needed for ${file.path}`)
    } else {
      await writeChangesetFile(file, cleanedContent, dryRun)
    }
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
