import type {TemplateContext} from '../../src/types.js'
import {existsSync, rmSync} from 'node:fs'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {createDocumentationIntegrator} from '../../src/templates/documentation-integrator.js'

describe('DocumentationIntegrator navigation rollback', () => {
  const context: TemplateContext = {projectName: 'sample-package'}

  let testDir: string
  let navigationPath: string
  let originalNavContent: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.tmp', `doc-integrator-test-${Date.now()}`)
    await mkdir(path.join(testDir, 'docs', 'src', 'content', 'docs'), {recursive: true})

    navigationPath = path.join(testDir, 'nav.config.ts')
    originalNavContent = `export default {
  sidebar: [
    {
      label: 'Packages',
      'packages': [
        {
          label: 'other-package',
          link: '/packages/other-package',
        },
      ],
    },
  ],
}
`
    await writeFile(navigationPath, originalNavContent, 'utf8')
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true})
    }
  })

  it('round-trips an add followed by a remove back to the original content', async () => {
    const integrator = createDocumentationIntegrator({
      contentDir: path.join(testDir, 'docs', 'src', 'content', 'docs'),
      docsRoot: path.join(testDir, 'docs'),
      navigationPath,
    })

    const integrateResult = await integrator.integrate(testDir, context)
    expect(integrateResult.navigationUpdated).toBe(true)
    expect(await readFile(navigationPath, 'utf8')).not.toBe(originalNavContent)

    const removeResult = await integrator.removePackageFromNavigation(context.projectName)

    expect(removeResult).toEqual({success: true, removed: true})
    expect(await readFile(navigationPath, 'utf8')).toBe(originalNavContent)
  })

  it('is a no-op when the package entry is not present', async () => {
    const integrator = createDocumentationIntegrator({
      contentDir: path.join(testDir, 'docs', 'src', 'content', 'docs'),
      docsRoot: path.join(testDir, 'docs'),
      navigationPath,
    })

    const removeResult = await integrator.removePackageFromNavigation('never-added')

    expect(removeResult).toEqual({success: true, removed: false})
    expect(await readFile(navigationPath, 'utf8')).toBe(originalNavContent)
  })
})
