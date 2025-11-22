import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import fs from 'fs-extra'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {cleanChangesets} from '../src/clean-changesets'

// Mock consola to prevent console output during tests
vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('clean-changesets', () => {
  let tempDir: string
  let changesetDir: string

  const mockChangesetContent = `---
'@api/test-utils': patch
'@bfra.me/api-core': patch
---

Updated dependency \`@readme/oas-to-har\` to \`25.0.4\`.
Updated dependency \`oas\` to \`26.0.4\`.
`

  beforeEach(async () => {
    // Create unique temporary directory for this test
    tempDir = await mkdtemp(join(tmpdir(), 'clean-changesets-test-'))
    changesetDir = join(tempDir, '.changeset')

    // Set up test fixtures
    await fs.ensureDir(changesetDir)
    await fs.writeFile(join(changesetDir, 'test.md'), mockChangesetContent)
  })

  afterEach(async () => {
    // Clean up temporary directory
    if (tempDir) {
      await rm(tempDir, {recursive: true, force: true})
    }
  })

  it('should remove private package entries from changeset files', async () => {
    await cleanChangesets({
      changesetDir,
      privatePackages: ['@api/test-utils'],
    })

    const result = await fs.readFile(join(changesetDir, 'test.md'), 'utf8')
    expect(result).toContain('@bfra.me/api-core')
    expect(result).not.toContain('@api/test-utils')
  })

  it('should handle multiple private packages', async () => {
    await cleanChangesets({
      changesetDir,
      privatePackages: ['@api/test-utils', '@api/other-private'],
    })

    const result = await fs.readFile(join(changesetDir, 'test.md'), 'utf8')
    expect(result).toContain('@bfra.me/api-core')
    expect(result).not.toContain('@api/test-utils')
    expect(result).not.toContain('@api/other-private')
  })

  it('should handle file system errors gracefully', async () => {
    const nonExistentDir = join(tempDir, 'non-existent')
    await expect(
      cleanChangesets({
        changesetDir: nonExistentDir,
        privatePackages: ['@api/test-utils'],
      }),
    ).rejects.toThrow()
  })

  it('should not modify files if no private packages are found', async () => {
    const contentWithoutPrivate = `---
'@bfra.me/api-core': patch
---

Updated dependency \`@readme/oas-to-har\` to \`25.0.4\`.
`
    await fs.writeFile(join(changesetDir, 'test.md'), contentWithoutPrivate)

    await cleanChangesets({
      changesetDir,
      privatePackages: ['@api/test-utils'],
    })

    const result = await fs.readFile(join(changesetDir, 'test.md'), 'utf8')
    expect(result).toBe(contentWithoutPrivate)
  })

  it('should not write changes in dry-run mode', async () => {
    await cleanChangesets({
      changesetDir,
      privatePackages: ['@api/test-utils'],
      dryRun: true,
    })

    const result = await fs.readFile(join(changesetDir, 'test.md'), 'utf8')
    expect(result).toBe(mockChangesetContent)
  })
})
