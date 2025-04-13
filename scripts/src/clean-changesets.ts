#!/usr/bin/env tsx

import {readdir, readFile, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

const CHANGESET_DIR = '.changeset'

interface ChangesetFile {
  path: string
  content: string
}

async function getChangesetFiles(): Promise<ChangesetFile[]> {
  try {
    const files = await readdir(CHANGESET_DIR)
    const changesetFiles = files.filter(file => file.endsWith('.md'))

    const fileContents = await Promise.all(
      changesetFiles.map(async file => ({
        path: join(CHANGESET_DIR, file),
        content: await readFile(join(CHANGESET_DIR, file), 'utf8'),
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

async function main(): Promise<void> {
  try {
    // Get private packages from environment variable, fallback to default
    const privatePackagesEnv = process.env['PRIVATE_PACKAGES']
    const privatePackages = privatePackagesEnv ? privatePackagesEnv.split(',') : ['@api/test-utils']

    // Check if dry-run mode is enabled
    const dryRun = process.env['DRY_RUN'] === 'true'
    if (dryRun) {
      consola.info('Running in dry-run mode (no changes will be made)')
    }

    consola.info('Cleaning changesets for private packages:', privatePackages)

    const changesetFiles = await getChangesetFiles()

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
  } catch (error) {
    consola.error('Failed to clean changesets:', error)
    process.exit(1)
  }
}

await main()
