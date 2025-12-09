import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {describe, expect, it} from 'vitest'

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(DIR_NAME, '../..')
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages')
const DOCS_PACKAGES_DIR = path.join(DIR_NAME, '../src/content/docs/packages')

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

async function readPackageVersion(mdxFileName: string): Promise<string | null> {
  try {
    const packageJsonPath = path.join(PACKAGES_DIR, mdxFileName, 'package.json')
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as PackageJson
    return packageJson.version ?? null
  } catch {
    return null
  }
}

async function readMdxVersion(mdxFileName: string): Promise<string | null> {
  try {
    const mdxPath = path.join(DOCS_PACKAGES_DIR, `${mdxFileName}.mdx`)
    const content = await fs.readFile(mdxPath, 'utf-8')
    // Match semver versions including pre-release tags (e.g., v1.0.0, v1.0.0-beta.1)
    const badgePattern = /<Badge\s+text="v([\d.]+(?:-[\w.]+)?)"\s+variant="note"\s*\/>/
    const match = content.match(badgePattern)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

describe('version synchronization', () => {
  it('should have version badges in all package MDX files', async () => {
    for (const [packageName, mdxFileName] of Object.entries(PACKAGE_MAPPING)) {
      const mdxVersion = await readMdxVersion(mdxFileName)
      expect(
        mdxVersion,
        `${packageName} (${mdxFileName}.mdx) should have a version badge`,
      ).not.toBeNull()
    }
  })

  it('should have version badges matching package.json versions', async () => {
    const mismatches: string[] = []

    for (const [packageName, mdxFileName] of Object.entries(PACKAGE_MAPPING)) {
      const packageVersion = await readPackageVersion(mdxFileName)
      const mdxVersion = await readMdxVersion(mdxFileName)

      if (packageVersion !== null && mdxVersion !== null && packageVersion !== mdxVersion) {
        mismatches.push(
          `${packageName}: package.json has v${packageVersion}, but ${mdxFileName}.mdx has v${mdxVersion}`,
        )
      }
    }

    expect(mismatches, 'All version badges should match package.json versions').toEqual([])
  })

  it('should have valid version format in badges', async () => {
    const invalidVersions: string[] = []

    for (const [packageName, mdxFileName] of Object.entries(PACKAGE_MAPPING)) {
      const mdxVersion = await readMdxVersion(mdxFileName)

      // Match semver format with optional pre-release tag (e.g., 1.0.0, 1.0.0-beta.1)
      if (mdxVersion !== null && !/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(mdxVersion)) {
        invalidVersions.push(
          `${packageName} (${mdxFileName}.mdx) has invalid version format: v${mdxVersion}`,
        )
      }
    }

    expect(
      invalidVersions,
      'All version badges should follow semver format (x.y.z[-prerelease])',
    ).toEqual([])
  })

  it('should have all packages in mapping present in filesystem', async () => {
    const missingFiles: string[] = []

    for (const [packageName, mdxFileName] of Object.entries(PACKAGE_MAPPING)) {
      const packageJsonPath = path.join(PACKAGES_DIR, mdxFileName, 'package.json')
      const mdxPath = path.join(DOCS_PACKAGES_DIR, `${mdxFileName}.mdx`)

      try {
        await fs.access(packageJsonPath)
      } catch {
        missingFiles.push(`${packageName}: Missing package.json at ${packageJsonPath}`)
      }

      try {
        await fs.access(mdxPath)
      } catch {
        missingFiles.push(`${packageName}: Missing MDX file at ${mdxPath}`)
      }
    }

    expect(missingFiles, 'All mapped packages should exist in the filesystem').toEqual([])
  })
})
