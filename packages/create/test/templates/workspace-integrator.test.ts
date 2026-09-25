import type {TemplateContext} from '../../src/types.js'
import {existsSync, rmSync} from 'node:fs'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {createWorkspaceIntegrator} from '../../src/templates/workspace-integrator.js'

describe('WorkspaceIntegrator pnpm-workspace.yaml rollback', () => {
  const context: TemplateContext = {projectName: 'sample-package'}

  let testDir: string
  let packagePath: string
  let pnpmWorkspacePath: string
  let originalWorkspaceContent: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.tmp', `workspace-integrator-test-${Date.now()}`)
    packagePath = path.join(testDir, 'packages', 'sample-package')
    await mkdir(packagePath, {recursive: true})

    pnpmWorkspacePath = path.join(testDir, 'pnpm-workspace.yaml')
    originalWorkspaceContent = 'packages:\n  - "packages/existing-package"\n'
    await writeFile(pnpmWorkspacePath, originalWorkspaceContent, 'utf8')
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true})
    }
  })

  it('round-trips an add followed by a remove back to the original content', async () => {
    const integrator = createWorkspaceIntegrator({
      autoInstall: false,
      pnpmWorkspace: pnpmWorkspacePath,
      workspacePackageJson: path.join(testDir, 'package.json'),
      workspaceRoot: testDir,
    })

    const integrateResult = await integrator.integrate(packagePath, context, {skipInstall: true})
    expect(integrateResult.pnpmWorkspaceUpdated).toBe(true)
    expect(await readFile(pnpmWorkspacePath, 'utf8')).not.toBe(originalWorkspaceContent)

    const removeResult = await integrator.removePackageFromWorkspace(packagePath)

    expect(removeResult).toEqual({success: true, removed: true})
    expect(await readFile(pnpmWorkspacePath, 'utf8')).toBe(originalWorkspaceContent)
  })

  it('is a no-op when the package entry is not present', async () => {
    const integrator = createWorkspaceIntegrator({
      autoInstall: false,
      pnpmWorkspace: pnpmWorkspacePath,
      workspacePackageJson: path.join(testDir, 'package.json'),
      workspaceRoot: testDir,
    })

    const removeResult = await integrator.removePackageFromWorkspace(
      path.join(testDir, 'packages', 'never-added'),
    )

    expect(removeResult).toEqual({
      success: true,
      removed: false,
      message: 'Package not found in workspace configuration',
    })
    expect(await readFile(pnpmWorkspacePath, 'utf8')).toBe(originalWorkspaceContent)
  })
})
