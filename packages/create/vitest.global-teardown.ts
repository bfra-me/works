import {existsSync, rmSync} from 'node:fs'
import {readdir} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export default async function globalTeardown() {
  const packageRoot = process.cwd()

  // Clean up .tmp directory
  const tmpDir = path.join(packageRoot, '.tmp')
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, {recursive: true, force: true})
  }

  // Belt-and-suspenders: clean any remaining test-temp-pm-* directories
  try {
    const entries = await readdir(packageRoot)
    for (const entry of entries) {
      if (
        entry.startsWith('test-temp-pm-') ||
        entry === 'test-add-project' ||
        entry === 'test-dry-run'
      ) {
        const dirPath = path.join(packageRoot, entry)
        if (existsSync(dirPath)) {
          rmSync(dirPath, {recursive: true, force: true})
        }
      }
    }
  } catch {
    // Silent fail - best effort cleanup
  }

  // Clean up test/fixtures/temp directory
  const fixturesTempDir = path.join(packageRoot, 'test', 'fixtures', 'temp')
  if (existsSync(fixturesTempDir)) {
    try {
      const tempEntries = await readdir(fixturesTempDir)
      for (const entry of tempEntries) {
        const entryPath = path.join(fixturesTempDir, entry)
        rmSync(entryPath, {recursive: true, force: true})
      }
    } catch {
      // Silent fail - best effort cleanup
    }
  }
}
