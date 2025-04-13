import process from 'node:process'
import fs from 'fs-extra'
import {tsImport} from 'tsx/esm/api'
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

// Mock consola to prevent console output during tests
vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const cleanup = async () => fs.rm('.changeset', {force: true, recursive: true})

beforeAll(async () => {
  await cleanup()
})

afterAll(async () => {
  await cleanup()
})

// Helper function to run the script with tsx
async function runCleanChangesetsScript(options: {
  privatePackages?: string
  dryRun?: boolean
  expectError?: boolean
}) {
  const {privatePackages = '@api/test-utils', dryRun = false} = options
  const originalEnv = {...process.env}

  process.env['PRIVATE_PACKAGES'] = privatePackages
  if (dryRun) {
    process.env['DRY_RUN'] = 'true'
  }

  try {
    // Use tsImport to load the script directly
    await tsImport('../src/clean-changesets', import.meta.url)
  } finally {
    process.env = originalEnv
  }
}

describe('clean-changesets', () => {
  const mockChangesetContent = `---
'@api/test-utils': patch
'@bfra.me/api-core': patch
---

Updated dependency \`@readme/oas-to-har\` to \`25.0.4\`.
Updated dependency \`oas\` to \`26.0.4\`.
`

  beforeEach(async () => {
    await cleanup()
    await fs.ensureDir('.changeset')
    await fs.writeFile('.changeset/test.md', mockChangesetContent)
  })

  afterEach(async () => {
    await cleanup()
  })

  it('should remove private package entries from changeset files', async () => {
    await runCleanChangesetsScript({privatePackages: '@api/test-utils'})

    const result = await fs.readFile('.changeset/test.md', 'utf8')
    expect(result).toContain('@bfra.me/api-core')
    expect(result).not.toContain('@api/test-utils')
  })

  it('should handle multiple private packages', async () => {
    await runCleanChangesetsScript({privatePackages: '@api/test-utils,@api/other-private'})

    const result = await fs.readFile('.changeset/test.md', 'utf8')
    expect(result).toContain('@bfra.me/api-core')
    expect(result).not.toContain('@api/test-utils')
    expect(result).not.toContain('@api/other-private')
  })

  it('should handle file system errors gracefully', async () => {
    await cleanup()
    await expect(runCleanChangesetsScript({expectError: true})).rejects.toThrow()
  })

  it('should not modify files if no private packages are found', async () => {
    const contentWithoutPrivate = `---
'@bfra.me/api-core': patch
---

Updated dependency \`@readme/oas-to-har\` to \`25.0.4\`.
`
    await fs.writeFile('.changeset/test.md', contentWithoutPrivate)

    await runCleanChangesetsScript({privatePackages: '@api/test-utils'})

    const result = await fs.readFile('.changeset/test.md', 'utf8')
    expect(result).toBe(contentWithoutPrivate)
  })

  it('should not write changes in dry-run mode', async () => {
    await runCleanChangesetsScript({dryRun: true})

    const result = await fs.readFile('.changeset/test.md', 'utf8')
    expect(result).toBe(mockChangesetContent)
  })
})
