import {access, constants, mkdtemp, rm} from 'node:fs/promises'
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
    warn: vi.fn(),
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

  describe('empty frontmatter detection and deletion', () => {
    it('should delete changesets with empty frontmatter', async () => {
      const emptyChangesetContent = `---
---

Updated dependency \`some-dep\` to \`1.0.0\`.
`
      await fs.writeFile(join(changesetDir, 'empty.md'), emptyChangesetContent)

      await cleanChangesets({
        changesetDir,
        privatePackages: ['@bfra.me/works'],
      })

      // File should be deleted
      await expect(access(join(changesetDir, 'empty.md'), constants.F_OK)).rejects.toThrow()
    })

    it('should delete changesets that become empty after cleaning', async () => {
      const willBeEmptyContent = `---
'@bfra.me/works': patch
---

Updated dependency \`some-dep\` to \`1.0.0\`.
`
      await fs.writeFile(join(changesetDir, 'will-be-empty.md'), willBeEmptyContent)

      await cleanChangesets({
        changesetDir,
        privatePackages: ['@bfra.me/works'],
      })

      // File should be deleted
      await expect(access(join(changesetDir, 'will-be-empty.md'), constants.F_OK)).rejects.toThrow()
    })

    it('should not delete files with valid packages after cleaning', async () => {
      const validContent = `---
'@bfra.me/works': patch
'@bfra.me/other-package': minor
---

Updated dependencies.
`
      await fs.writeFile(join(changesetDir, 'valid.md'), validContent)

      await cleanChangesets({
        changesetDir,
        privatePackages: ['@bfra.me/works'],
      })

      // File should still exist with only @bfra.me/other-package
      const result = await fs.readFile(join(changesetDir, 'valid.md'), 'utf8')
      expect(result).toContain('@bfra.me/other-package')
      expect(result).not.toContain('@bfra.me/works')
    })

    it('should not delete malformed changeset files', async () => {
      const malformedContent = `---
this is not valid yaml: {]
---

Some description.
`
      await fs.writeFile(join(changesetDir, 'malformed.md'), malformedContent)

      await cleanChangesets({
        changesetDir,
        privatePackages: ['@bfra.me/works'],
      })

      // File should still exist (we don't delete unparseable files)
      const result = await fs.readFile(join(changesetDir, 'malformed.md'), 'utf8')
      expect(result).toBe(malformedContent)
    })

    it('should not delete files in dry-run mode', async () => {
      const emptyChangesetContent = `---
---

Updated dependency.
`
      await fs.writeFile(join(changesetDir, 'empty-dry-run.md'), emptyChangesetContent)

      await cleanChangesets({
        changesetDir,
        privatePackages: ['@bfra.me/works'],
        dryRun: true,
      })

      // File should still exist in dry-run mode
      const result = await fs.readFile(join(changesetDir, 'empty-dry-run.md'), 'utf8')
      expect(result).toBe(emptyChangesetContent)
    })
  })
})
