/**
 * Tests for README parser functionality
 */

import type {ReadmeContent} from '../../src/types'
import {describe, expect, it} from 'vitest'

import {
  findSection,
  flattenSections,
  getSectionsByLevel,
  getTableOfContents,
  parseReadme,
} from '../../src/parsers/readme-parser'

describe('readme-parser', () => {
  describe('parseReadme', () => {
    it.concurrent('should parse simple README content', () => {
      const content = `# My Package

This is the description.

## Installation

Install with npm.

## Usage

Use it like this.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('data')
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.title).toBe('My Package')
      // Parser includes H1 as a section, with H2s nested under it
      expect(readme.sections.length).toBe(1)
      expect(readme.sections[0]?.heading).toBe('My Package')
      expect(readme.sections[0]?.children.length).toBe(2)
    })

    it.concurrent('should extract title from first H1', () => {
      const content = `# Package Name

Some content.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.title).toBe('Package Name')
    })

    it.concurrent('should extract preamble before first heading', () => {
      const content = `Some intro text before any heading.

More intro content.

# Title

Content after title.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.preamble).toContain('Some intro text')
      expect(readme.preamble).toContain('More intro content')
    })

    it.concurrent('should extract sections with headings', () => {
      const content = `# Main

## Section One

Content one.

## Section Two

Content two.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      // H1 is the top-level section with H2s nested as children
      expect(readme.sections.length).toBe(1)
      expect(readme.sections[0]?.heading).toBe('Main')
      expect(readme.sections[0]?.children.length).toBe(2)
      expect(readme.sections[0]?.children[0]?.heading).toBe('Section One')
      expect(readme.sections[0]?.children[0]?.level).toBe(2)
      expect(readme.sections[0]?.children[1]?.heading).toBe('Section Two')
    })

    it.concurrent('should handle nested sections', () => {
      const content = `# Main

## Parent Section

Parent content.

### Child Section

Child content.

### Another Child

More child content.

## Another Parent

Different parent.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      // H1 is top-level, H2s are nested under it
      expect(readme.sections.length).toBe(1)
      expect(readme.sections[0]?.heading).toBe('Main')
      expect(readme.sections[0]?.children.length).toBe(2)
      expect(readme.sections[0]?.children[0]?.heading).toBe('Parent Section')
      expect(readme.sections[0]?.children[0]?.children.length).toBe(2)
      expect(readme.sections[0]?.children[0]?.children[0]?.heading).toBe('Child Section')
      expect(readme.sections[0]?.children[0]?.children[1]?.heading).toBe('Another Child')
    })

    it.concurrent('should extract section content', () => {
      const content = `# Title

## Installation

Run the following command:

\`\`\`bash
npm install package
\`\`\`

That's it!
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      // Find the Installation section (nested under Title)
      const section = findSection(readme, 'Installation')

      expect(section?.content).toContain('Run the following command')
      expect(section?.content).toContain('npm install package')
    })

    it.concurrent('should preserve raw content', () => {
      const content = `# Title

Content here.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.raw).toBe(content)
    })

    it.concurrent('should respect preserveRaw option', () => {
      const content = `# Title

Content.
`
      const result = parseReadme(content, {preserveRaw: false})

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.raw).toBe('')
    })

    it.concurrent('should respect extractSections option', () => {
      const content = `# Title

## Section

Content.
`
      const result = parseReadme(content, {extractSections: false})

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.sections.length).toBe(0)
    })

    it.concurrent('should handle empty content', () => {
      const result = parseReadme('')

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.title).toBeUndefined()
      expect(readme.sections.length).toBe(0)
    })

    it.concurrent('should handle content with only whitespace', () => {
      const result = parseReadme('   \n\n   ')

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.title).toBeUndefined()
    })

    it.concurrent('should handle code blocks', () => {
      const content = `# Title

## Code Example

\`\`\`typescript
const x = 1
const y = 2
console.log(x + y)
\`\`\`
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const codeSection = findSection(readme, 'Code Example')
      expect(codeSection?.content).toContain('const x = 1')
    })

    it.concurrent('should handle lists', () => {
      const content = `# Title

## Features

- Feature one
- Feature two
- Feature three
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const featuresSection = findSection(readme, 'Features')
      expect(featuresSection?.content).toContain('Feature one')
      expect(featuresSection?.content).toContain('Feature two')
    })

    it.concurrent('should handle ordered lists', () => {
      const content = `# Title

## Steps

1. First step
2. Second step
3. Third step
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const stepsSection = findSection(readme, 'Steps')
      expect(stepsSection?.content).toContain('First step')
    })

    it.concurrent('should handle blockquotes', () => {
      const content = `# Title

## Note

> This is an important note.
> It spans multiple lines.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const noteSection = findSection(readme, 'Note')
      expect(noteSection?.content).toContain('important note')
    })

    it.concurrent('should handle thematic breaks', () => {
      const content = `# Title

## Section

Content before.

---

Content after.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const sectionContent = findSection(readme, 'Section')
      expect(sectionContent?.content).toContain('---')
    })

    it.concurrent('should handle inline HTML', () => {
      const content = `# Title

## Badges

<img src="badge.svg" alt="badge">
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const badgesSection = findSection(readme, 'Badges')
      expect(badgesSection?.content).toContain('<img')
    })

    it.concurrent('should handle deeply nested sections', () => {
      const content = `# Title

## Level 2

### Level 3

#### Level 4

##### Level 5

###### Level 6

Content at level 6.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      const flattened = flattenSections(readme)
      // All 6 heading levels are included
      expect(flattened.length).toBe(6)
    })
  })

  describe('findSection', () => {
    it.concurrent('should find section by heading', () => {
      const content = `# Title

## Installation

Install instructions.

## Usage

Usage instructions.
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const section = findSection(readme, 'Installation')

      expect(section).toBeDefined()
      expect(section?.heading).toBe('Installation')
      expect(section?.content).toContain('Install instructions')
    })

    it.concurrent('should find section case-insensitively', () => {
      const content = `# Title

## INSTALLATION

Content.
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const section = findSection(readme, 'installation')

      expect(section).toBeDefined()
      expect(section?.heading).toBe('INSTALLATION')
    })

    it.concurrent('should find nested sections', () => {
      const content = `# Title

## Parent

### Nested Target

Found it!
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const section = findSection(readme, 'Nested Target')

      expect(section).toBeDefined()
      expect(section?.content).toContain('Found it')
    })

    it.concurrent('should return undefined for non-existent section', () => {
      const content = `# Title

## Existing

Content.
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const section = findSection(readme, 'Non-existent')

      expect(section).toBeUndefined()
    })
  })

  describe('getSectionsByLevel', () => {
    it.concurrent('should get all sections at level 2', () => {
      const content = `# Title

## First H2

Content.

## Second H2

More content.

### H3 Section

Nested.

## Third H2

Final.
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const sections = getSectionsByLevel(readme, 2)

      expect(sections.length).toBe(3)
      expect(sections.map(s => s.heading)).toEqual(['First H2', 'Second H2', 'Third H2'])
    })

    it.concurrent('should get all sections at level 3', () => {
      const content = `# Title

## Parent

### Child One

### Child Two

## Another Parent

### Child Three
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const sections = getSectionsByLevel(readme, 3)

      expect(sections.length).toBe(3)
    })

    it.concurrent('should return empty array for non-existent level', () => {
      const content = `# Title

## Only H2

Content.
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const sections = getSectionsByLevel(readme, 5)

      expect(sections.length).toBe(0)
    })
  })

  describe('flattenSections', () => {
    it.concurrent('should flatten nested sections', () => {
      const content = `# Title

## A

### A1

### A2

## B

### B1
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const flattened = flattenSections(readme)

      // Includes Title (H1) + A, A1, A2, B, B1 = 6 sections
      expect(flattened.length).toBe(6)
      expect(flattened.map(s => s.heading)).toEqual(['Title', 'A', 'A1', 'A2', 'B', 'B1'])
    })

    it.concurrent('should preserve order in depth-first traversal', () => {
      const content = `# Title

## First

### First Child

## Second

### Second Child
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const flattened = flattenSections(readme)

      // Includes H1 title as first section
      expect(flattened[0]?.heading).toBe('Title')
      expect(flattened[1]?.heading).toBe('First')
      expect(flattened[2]?.heading).toBe('First Child')
      expect(flattened[3]?.heading).toBe('Second')
      expect(flattened[4]?.heading).toBe('Second Child')
    })
  })

  describe('getTableOfContents', () => {
    it.concurrent('should generate table of contents', () => {
      const content = `# Title

## Introduction

## Getting Started

### Prerequisites

### Installation

## API Reference

## License
`
      const result = parseReadme(content)
      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data

      const toc = getTableOfContents(readme)

      // Includes Title + all other headings = 7
      expect(toc.length).toBe(7)
      expect(toc[0]).toEqual({heading: 'Title', level: 1})
      expect(toc[1]).toEqual({heading: 'Introduction', level: 2})
      expect(toc[3]).toEqual({heading: 'Prerequisites', level: 3})
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle README without H1', () => {
      const content = `## Just H2

Content here.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      expect(readme.title).toBeUndefined()
      expect(readme.sections.length).toBe(1)
      expect(readme.sections[0]?.heading).toBe('Just H2')
    })

    it.concurrent('should handle multiple H1 headings', () => {
      const content = `# First Title

# Second Title

Content.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      // First H1 becomes title, both H1s become sections
      expect(readme.title).toBe('First Title')
      expect(readme.sections.length).toBe(2)
    })

    it.concurrent('should handle consecutive headings', () => {
      const content = `# Title

## Empty Section

## Another Empty

## Has Content

Actual content here.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      // H1 is top-level section with 3 H2 children
      expect(readme.sections.length).toBe(1)
      expect(readme.sections[0]?.children.length).toBe(3)
      // First child has empty content, third has content
      expect(readme.sections[0]?.children[0]?.content).toBe('')
      expect(readme.sections[0]?.children[2]?.content).toContain('Actual content')
    })

    it.concurrent('should handle special characters in headings', () => {
      const content = `# Title

## @scope/package-name

Content.

## <Badge>Component</Badge>

More content.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      // Find the section with special characters
      const scopeSection = findSection(readme, '@scope/package-name')
      expect(scopeSection).toBeDefined()
      expect(scopeSection?.heading).toBe('@scope/package-name')
    })

    it.concurrent('should handle headings with inline code', () => {
      const content = `# Title

## The \`add\` Function

Description of add.
`
      const result = parseReadme(content)

      expect(result.success).toBe(true)
      const readme = (result as {success: true; data: ReadmeContent}).data
      // Find the section with inline code
      const addSection = readme.sections[0]?.children[0]
      expect(addSection?.heading).toContain('add')
    })
  })
})
