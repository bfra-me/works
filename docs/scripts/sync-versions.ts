#!/usr/bin/env tsx
/**
 * Synchronize package version badges in documentation MDX files
 * Reads package.json versions and updates Badge components in MDX files
 */

import type {Result} from '@bfra.me/es/result'

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {err, ok} from '@bfra.me/es/result'

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(DIR_NAME, '../..')
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages')
const DOCS_PACKAGES_DIR = path.join(DIR_NAME, '../src/content/docs/packages')

interface SyncResult {
  file: string
  oldVersion: string
  newVersion: string
  updated: boolean
}

interface PackageJson {
  name?: string
  version?: string
  [key: string]: unknown
}

const PACKAGE_MAPPING: Record<string, string> = {
  '@bfra.me/create': 'create',
  '@bfra.me/doc-sync': 'doc-sync',
  '@bfra.me/es': 'es',
  '@bfra.me/eslint-config': 'eslint-config',
  '@bfra.me/prettier-config': 'prettier-config',
  '@bfra.me/semantic-release': 'semantic-release',
  '@bfra.me/tsconfig': 'tsconfig',
  '@bfra.me/workspace-analyzer': 'workspace-analyzer',
}

async function readPackageVersion(packageJsonPath: string): Promise<Result<string, string>> {
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as PackageJson

    if (typeof packageJson.version !== 'string') {
      return err(`No version field found in ${packageJsonPath}`)
    }

    return ok(packageJson.version)
  } catch (error) {
    return err(
      `Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

async function updateMdxVersion(
  mdxPath: string,
  newVersion: string,
): Promise<Result<{oldVersion: string | null; updated: boolean}, string>> {
  try {
    const content = await fs.readFile(mdxPath, 'utf-8')

    // Match semver versions including pre-release tags (e.g., v1.0.0, v1.0.0-beta.1)
    const badgePattern = /<Badge\s+text="v([\d.]+(?:-[\w.]+)?)"\s+variant="note"\s*\/>/

    const match = content.match(badgePattern)
    const oldVersion = match?.[1] ?? null

    if (oldVersion === newVersion) {
      return ok({oldVersion, updated: false})
    }

    let updatedContent: string
    if (oldVersion === null) {
      const insertPattern = /(<Badge\s+text="[^"]+"\s+variant="tip"\s*\/>\s*\n)/
      if (!insertPattern.test(content)) {
        return err(`Could not find insertion point for version badge in ${mdxPath}`)
      }
      updatedContent = content.replace(
        insertPattern,
        `$1<Badge text="v${newVersion}" variant="note" />\n`,
      )
    } else {
      updatedContent = content.replace(
        badgePattern,
        `<Badge text="v${newVersion}" variant="note" />`,
      )
    }

    await fs.writeFile(mdxPath, updatedContent, 'utf-8')
    return ok({oldVersion, updated: true})
  } catch (error) {
    return err(
      `Failed to update MDX file: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

async function syncVersion(
  packageName: string,
  mdxFileName: string,
): Promise<Result<SyncResult, string>> {
  const packageJsonPath = path.join(PACKAGES_DIR, mdxFileName, 'package.json')
  const mdxPath = path.join(DOCS_PACKAGES_DIR, `${mdxFileName}.mdx`)

  const versionResult = await readPackageVersion(packageJsonPath)
  if (!versionResult.success) {
    return err(`${packageName}: ${versionResult.error}`)
  }

  const updateResult = await updateMdxVersion(mdxPath, versionResult.data)
  if (!updateResult.success) {
    return err(`${packageName}: ${updateResult.error}`)
  }

  return ok({
    file: `${mdxFileName}.mdx`,
    oldVersion: updateResult.data.oldVersion ?? 'none',
    newVersion: versionResult.data,
    updated: updateResult.data.updated,
  })
}

async function syncAllVersions(): Promise<Result<SyncResult[], string[]>> {
  const results: SyncResult[] = []
  const errors: string[] = []

  for (const [packageName, mdxFileName] of Object.entries(PACKAGE_MAPPING)) {
    const result = await syncVersion(packageName, mdxFileName)

    if (result.success) {
      results.push(result.data)
    } else {
      errors.push(result.error)
    }
  }

  if (errors.length > 0) {
    return err(errors)
  }

  return ok(results)
}

async function main(): Promise<void> {
  console.log('🔄 Synchronizing package versions in documentation...\n')

  const result = await syncAllVersions()

  if (!result.success) {
    console.error('❌ Synchronization failed with errors:\n')
    for (const error of result.error) {
      console.error(`   ${error}`)
    }
    process.exit(1)
  }

  const updatedFiles = result.data.filter(r => r.updated)

  if (updatedFiles.length === 0) {
    console.log('✅ All version badges are already up to date!')
  } else {
    console.log(`✅ Updated ${updatedFiles.length} file(s):\n`)
    for (const {file, oldVersion, newVersion} of updatedFiles) {
      console.log(`   ${file}: v${oldVersion} → v${newVersion}`)
    }
  }

  const unchangedCount = result.data.length - updatedFiles.length
  if (unchangedCount > 0) {
    console.log(`\n✓ ${unchangedCount} file(s) already synchronized`)
  }

  console.log(`\n📦 Total packages processed: ${result.data.length}`)
}

main().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
