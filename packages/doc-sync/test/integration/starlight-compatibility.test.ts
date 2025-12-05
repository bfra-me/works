import type {PackageInfo, ReadmeContent} from '../../src/types'

import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {
  createBadge,
  createCard,
  createCardGrid,
  createTabs,
  generateFrontmatter,
  generateInstallTabs,
  generateMDXDocument,
  mapToStarlightComponents,
} from '../../src/generators'
import {analyzePublicAPI, parsePackageComplete, parseReadmeFile} from '../../src/parsers'

const FIXTURES_DIR = path.join(__dirname, '../fixtures/packages')

const createTestPackageInfo = (overrides: Partial<PackageInfo> = {}): PackageInfo => ({
  name: '@test/package',
  version: '1.0.0',
  description: 'A test package',
  packagePath: '/test/packages/package',
  srcPath: '/test/packages/package/src',
  ...overrides,
})

const createTestReadme = (overrides: Partial<ReadmeContent> = {}): ReadmeContent => ({
  title: 'Test Package',
  preamble: 'A test package preamble.',
  sections: [],
  raw: '# Test Package\n\nA test package preamble.',
  ...overrides,
})

describe('starlight-compatibility integration', () => {
  describe('badge component generation', () => {
    it.concurrent('should generate Badge with text', () => {
      const badge = createBadge('New')
      expect(badge).toContain('<Badge')
      expect(badge).toContain('text="New"')
      expect(badge).toContain('/>')
    })

    it.concurrent('should generate Badge with variant', () => {
      const badge = createBadge('Warning', 'caution')
      expect(badge).toContain('variant="caution"')
    })

    it.concurrent('should generate Badge with tip variant', () => {
      const badge = createBadge('Info', 'tip')
      expect(badge).toContain('variant="tip"')
    })

    it.concurrent('should generate Badge with note variant', () => {
      const badge = createBadge('Note', 'note')
      expect(badge).toContain('variant="note"')
    })

    it.concurrent('should escape special characters in badge text', () => {
      const badge = createBadge('Has "quotes" & <brackets>')
      // Should escape properly to prevent XSS
      expect(badge).not.toContain('"><')
    })
  })

  describe('card component generation', () => {
    it.concurrent('should generate Card with title and content', () => {
      const card = createCard('Feature', 'Description of feature')
      expect(card).toContain('<Card')
      expect(card).toContain('title="Feature"')
      expect(card).toContain('Description of feature')
      expect(card).toContain('</Card>')
    })

    it.concurrent('should generate Card with icon', () => {
      const card = createCard('Info', 'Content', 'information')
      expect(card).toContain('icon="information"')
    })

    it.concurrent('should handle multiline content', () => {
      const card = createCard(
        'Features',
        `- Feature 1
- Feature 2
- Feature 3`,
      )
      expect(card).toContain('Feature 1')
      expect(card).toContain('Feature 2')
      expect(card).toContain('Feature 3')
    })
  })

  describe('cardGrid component generation', () => {
    it.concurrent('should generate CardGrid with multiple cards', () => {
      const cards = [
        {title: 'Card 1', content: 'Content 1'},
        {title: 'Card 2', content: 'Content 2'},
      ]
      const grid = createCardGrid(cards)

      expect(grid).toContain('<CardGrid>')
      expect(grid).toContain('</CardGrid>')
      expect(grid).toContain('title="Card 1"')
      expect(grid).toContain('title="Card 2"')
    })

    it.concurrent('should handle empty cards array', () => {
      const grid = createCardGrid([])
      expect(grid).toContain('<CardGrid>')
      expect(grid).toContain('</CardGrid>')
    })

    it.concurrent('should generate cards with icon', () => {
      const cards = [{title: 'Card', content: 'Content', icon: 'star'}]
      const grid = createCardGrid(cards)
      expect(grid).toContain('icon="star"')
    })
  })

  describe('tabs component generation', () => {
    it.concurrent('should generate Tabs with TabItems', () => {
      const items = [
        {label: 'npm', content: 'npm install package'},
        {label: 'pnpm', content: 'pnpm add package'},
        {label: 'yarn', content: 'yarn add package'},
      ]
      const tabs = createTabs(items)

      expect(tabs).toContain('<Tabs>')
      expect(tabs).toContain('</Tabs>')
      expect(tabs).toContain('<TabItem')
      expect(tabs).toContain('label="npm"')
      expect(tabs).toContain('label="pnpm"')
      expect(tabs).toContain('label="yarn"')
      expect(tabs).toContain('</TabItem>')
    })

    it.concurrent('should handle single tab', () => {
      const items = [{label: 'Only', content: 'Single tab content'}]
      const tabs = createTabs(items)

      expect(tabs).toContain('<Tabs>')
      expect(tabs).toContain('label="Only"')
    })

    it.concurrent('should preserve code formatting in tab content', () => {
      const items = [
        {
          label: 'Code',
          content: `\`\`\`typescript
const x = 1;
\`\`\``,
        },
      ]
      const tabs = createTabs(items)

      expect(tabs).toContain('```typescript')
    })
  })

  describe('install tabs generation', () => {
    it.concurrent('should generate installation tabs for package', () => {
      const packageName = '@scope/my-package'
      const installTabs = generateInstallTabs(packageName)

      expect(installTabs).toContain('<Tabs>')
      expect(installTabs).toContain('npm')
      expect(installTabs).toContain('pnpm')
      expect(installTabs).toContain(packageName)
    })

    it.concurrent('should include yarn option', () => {
      const installTabs = generateInstallTabs('test-package')
      expect(installTabs).toContain('yarn')
    })

    it.concurrent('should format as code blocks', () => {
      const installTabs = generateInstallTabs('test-package')
      expect(installTabs).toContain('```')
    })
  })

  describe('starlight frontmatter generation', () => {
    it.concurrent('should generate valid frontmatter', () => {
      const packageInfo = createTestPackageInfo()
      const frontmatter = generateFrontmatter(packageInfo, undefined)

      expect(frontmatter.title).toBe('@test/package')
      expect(frontmatter.description).toBe('A test package')
    })

    it.concurrent('should include sidebar configuration', () => {
      const packageInfo = createTestPackageInfo({
        docsConfig: {
          sidebar: {
            label: 'Custom Label',
            order: 5,
          },
        },
      })
      const frontmatter = generateFrontmatter(packageInfo, undefined)

      expect(frontmatter.sidebar?.label).toBe('Custom Label')
      expect(frontmatter.sidebar?.order).toBe(5)
    })

    it.concurrent('should allow frontmatter overrides', () => {
      const packageInfo = createTestPackageInfo()
      const frontmatter = generateFrontmatter(packageInfo, undefined, {
        title: 'Custom Title',
      })

      expect(frontmatter.title).toBe('Custom Title')
    })

    it.concurrent('should use readme title when available', () => {
      const packageInfo = createTestPackageInfo()
      const readme = createTestReadme({title: 'README Title'})
      const frontmatter = generateFrontmatter(packageInfo, readme)

      expect(frontmatter.title).toBe('README Title')
    })
  })

  describe('content mapping to Starlight components', () => {
    it.concurrent('should map readme content to components', () => {
      const readme = createTestReadme({
        sections: [
          {heading: 'Features', level: 2, content: 'Feature list', children: []},
          {heading: 'Installation', level: 2, content: 'Install steps', children: []},
        ],
      })
      const packageInfo = createTestPackageInfo()

      const mapped = mapToStarlightComponents(readme, packageInfo)

      expect(mapped).toContain('Features')
      expect(mapped).toContain('Installation')
    })

    it.concurrent('should preserve section hierarchy', () => {
      const readme = createTestReadme({
        sections: [
          {
            heading: 'Usage',
            level: 2,
            content: 'Usage content',
            children: [{heading: 'Basic', level: 3, content: 'Basic usage', children: []}],
          },
        ],
      })
      const packageInfo = createTestPackageInfo()

      const mapped = mapToStarlightComponents(readme, packageInfo)

      expect(mapped).toContain('Usage')
      expect(mapped).toContain('Basic')
    })
  })

  describe('full MDX document with Starlight components', () => {
    it.concurrent('should include Starlight imports', () => {
      const packageInfo = createTestPackageInfo()
      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.rendered).toContain(
        "import { Badge, Card, CardGrid, Tabs, TabItem } from '@astrojs/starlight/components'",
      )
    })

    it.concurrent('should generate version badge', () => {
      const packageInfo = createTestPackageInfo({version: '2.0.0'})
      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.rendered).toContain('v2.0.0')
      expect(result.data.rendered).toContain('Badge')
    })

    it.concurrent('should generate CLI badge for CLI packages', () => {
      const packageInfo = createTestPackageInfo({
        keywords: ['cli', 'command-line'],
      })
      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.rendered).toContain('CLI')
    })

    it.concurrent('should generate Library badge for library packages', () => {
      const packageInfo = createTestPackageInfo({
        keywords: ['library'],
      })
      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.rendered).toContain('Library')
    })

    it.concurrent('should generate Config badge for config packages', () => {
      const packageInfo = createTestPackageInfo({
        keywords: ['config', 'configuration'],
      })
      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.rendered).toContain('Config')
    })
  })

  describe('fixture-based Starlight compatibility', () => {
    it.concurrent('should generate Starlight-compatible MDX from sample-lib', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const indexPath = path.join(packagePath, 'src', 'index.ts')
      const readmePath = path.join(packagePath, 'README.md')

      const packageResult = await parsePackageComplete(packagePath)
      const readmeResult = await parseReadmeFile(readmePath)
      const apiResult = analyzePublicAPI(indexPath)

      expect(packageResult.success).toBe(true)
      expect(readmeResult.success).toBe(true)
      expect(apiResult.success).toBe(true)

      if (!packageResult.success || !readmeResult.success || !apiResult.success) return

      const mdxResult = generateMDXDocument(
        packageResult.data,
        readmeResult.data,
        apiResult.data.api,
      )
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const rendered = mdxResult.data.rendered

      expect(rendered).toContain('---')
      expect(rendered).toContain('title:')
      expect(rendered).toContain('@astrojs/starlight/components')
      expect(rendered.startsWith('---')).toBe(true)
      expect(mdxResult.data.frontmatter.title).toBe('@fixtures/sample-lib')
    })

    it.concurrent('should handle API reference with Starlight formatting', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const indexPath = path.join(packagePath, 'src', 'index.ts')

      const packageResult = await parsePackageComplete(packagePath)
      const apiResult = analyzePublicAPI(indexPath)

      expect(packageResult.success).toBe(true)
      expect(apiResult.success).toBe(true)

      if (!packageResult.success || !apiResult.success) return

      const mdxResult = generateMDXDocument(packageResult.data, undefined, apiResult.data.api)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      expect(mdxResult.data.rendered).toContain('## API Reference')
      expect(mdxResult.data.rendered).toContain('### Functions')
    })
  })

  describe('component escaping and safety', () => {
    it.concurrent('should escape HTML in Badge text', () => {
      const badge = createBadge('<script>alert("xss")</script>')
      expect(badge).not.toContain('<script>')
    })

    it.concurrent('should escape quotes in Card title', () => {
      const card = createCard('Title with "quotes"', 'Content')
      expect(card.match(/<Card/g)?.length).toBe(1)
    })

    it.concurrent('should handle special characters in TabItem labels', () => {
      const items = [{label: 'Label & more <>', content: 'Content'}]
      const tabs = createTabs(items)
      expect(tabs).toContain('<Tabs>')
      expect(tabs).toContain('</Tabs>')
    })
  })
})
