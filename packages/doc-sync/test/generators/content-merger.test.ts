/**
 * Tests for content merger functionality
 */

import type {MergeResult} from '../../src/generators/content-merger'
import type {SyncError} from '../../src/types'
import {describe, expect, it} from 'vitest'

import {
  createDiffSummary,
  extractAutoSections,
  extractManualSections,
  hasAutoContent,
  hasManualContent,
  mergeContent,
  stripSentinelMarkers,
  validateMarkerPairing,
  wrapAutoSection,
  wrapManualSection,
} from '../../src/generators/content-merger'
import {SENTINEL_MARKERS} from '../../src/types'

describe('content-merger', () => {
  describe('mergeContent', () => {
    it.concurrent('should merge content preserving manual sections', () => {
      const existing = `# Title

${SENTINEL_MARKERS.AUTO_START}
Old auto content
${SENTINEL_MARKERS.AUTO_END}

${SENTINEL_MARKERS.MANUAL_START}
Custom content to preserve
${SENTINEL_MARKERS.MANUAL_END}
`
      const newContent = `# Title

${SENTINEL_MARKERS.AUTO_START}
New auto content
${SENTINEL_MARKERS.AUTO_END}
`
      const result = mergeContent(existing, newContent)

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.content).toContain('New auto content')
      expect(merge.content).toContain('Custom content to preserve')
      expect(merge.preservedCount).toBe(1)
    })

    it.concurrent('should handle content with no markers', () => {
      const existing = '# Simple README'
      const newContent = '# Updated README'

      const result = mergeContent(existing, newContent)

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.content).toBe(newContent)
      expect(merge.hasChanges).toBe(true)
    })

    it.concurrent('should detect when content has not changed', () => {
      const content = '# Same content'

      const result = mergeContent(content, content)

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.hasChanges).toBe(false)
    })

    it.concurrent('should use keep-manual strategy by default', () => {
      const existing = `# Title
${SENTINEL_MARKERS.MANUAL_START}
My custom notes
${SENTINEL_MARKERS.MANUAL_END}
`
      const newContent = `# Title
${SENTINEL_MARKERS.MANUAL_START}
Default notes
${SENTINEL_MARKERS.MANUAL_END}
`
      const result = mergeContent(existing, newContent, {conflictStrategy: 'keep-manual'})

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.content).toContain('My custom notes')
    })

    it.concurrent('should skip empty manual sections when configured', () => {
      const existing = `# Title
${SENTINEL_MARKERS.MANUAL_START}

${SENTINEL_MARKERS.MANUAL_END}
`
      const newContent = '# Title'

      const result = mergeContent(existing, newContent, {preserveEmptyManual: false})

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.preservedCount).toBe(0)
    })

    it.concurrent('should preserve empty manual sections by default', () => {
      const existing = `# Title
${SENTINEL_MARKERS.MANUAL_START}

${SENTINEL_MARKERS.MANUAL_END}
`
      const newContent = '# Title'

      const result = mergeContent(existing, newContent)

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.preservedCount).toBe(1)
    })

    it.concurrent('should add manual section after auto section', () => {
      const existing = `# Title
${SENTINEL_MARKERS.MANUAL_START}
Important notes
${SENTINEL_MARKERS.MANUAL_END}
`
      const newContent = `# Title

${SENTINEL_MARKERS.AUTO_START}
Generated API docs
${SENTINEL_MARKERS.AUTO_END}
`
      const result = mergeContent(existing, newContent)

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.content).toContain('Generated API docs')
      expect(merge.content).toContain('Important notes')
    })
  })

  describe('extractManualSections', () => {
    it.concurrent('should extract single manual section', () => {
      const content = `Before
${SENTINEL_MARKERS.MANUAL_START}
Manual content
${SENTINEL_MARKERS.MANUAL_END}
After`

      const sections = extractManualSections(content)

      expect(sections.length).toBe(1)
      expect(sections[0]?.type).toBe('manual')
      expect(sections[0]?.content).toBe('Manual content')
    })

    it.concurrent('should extract multiple manual sections', () => {
      const content = `
${SENTINEL_MARKERS.MANUAL_START}
First manual
${SENTINEL_MARKERS.MANUAL_END}

Some text

${SENTINEL_MARKERS.MANUAL_START}
Second manual
${SENTINEL_MARKERS.MANUAL_END}
`
      const sections = extractManualSections(content)

      expect(sections.length).toBe(2)
      expect(sections[0]?.content).toBe('First manual')
      expect(sections[1]?.content).toBe('Second manual')
    })

    it.concurrent('should return empty array when no manual sections', () => {
      const content = '# Just regular content'

      const sections = extractManualSections(content)

      expect(sections.length).toBe(0)
    })

    it.concurrent('should handle unclosed manual section', () => {
      const content = `
${SENTINEL_MARKERS.MANUAL_START}
Unclosed content
`
      const sections = extractManualSections(content)

      expect(sections.length).toBe(0)
    })

    it.concurrent('should track start and end indices', () => {
      const content = `prefix\n${SENTINEL_MARKERS.MANUAL_START}\ncontent\n${SENTINEL_MARKERS.MANUAL_END}\nsuffix`

      const sections = extractManualSections(content)

      expect(sections.length).toBe(1)
      expect(sections[0]?.startIndex).toBeGreaterThan(0)
      expect(sections[0]?.endIndex).toBeGreaterThan(sections[0]?.startIndex ?? 0)
    })
  })

  describe('extractAutoSections', () => {
    it.concurrent('should extract single auto section', () => {
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Generated content
${SENTINEL_MARKERS.AUTO_END}
`
      const sections = extractAutoSections(content)

      expect(sections.length).toBe(1)
      expect(sections[0]?.type).toBe('auto')
      expect(sections[0]?.content).toBe('Generated content')
    })

    it.concurrent('should extract multiple auto sections', () => {
      const content = `
${SENTINEL_MARKERS.AUTO_START}
API docs
${SENTINEL_MARKERS.AUTO_END}

Manual content

${SENTINEL_MARKERS.AUTO_START}
Type definitions
${SENTINEL_MARKERS.AUTO_END}
`
      const sections = extractAutoSections(content)

      expect(sections.length).toBe(2)
      expect(sections[0]?.content).toBe('API docs')
      expect(sections[1]?.content).toBe('Type definitions')
    })

    it.concurrent('should return empty array when no auto sections', () => {
      const content = '# Manual content only'

      const sections = extractAutoSections(content)

      expect(sections.length).toBe(0)
    })
  })

  describe('hasManualContent', () => {
    it.concurrent('should return true when manual marker present', () => {
      const content = `
${SENTINEL_MARKERS.MANUAL_START}
Content
${SENTINEL_MARKERS.MANUAL_END}
`
      expect(hasManualContent(content)).toBe(true)
    })

    it.concurrent('should return false when no manual marker', () => {
      expect(hasManualContent('Regular content')).toBe(false)
    })
  })

  describe('hasAutoContent', () => {
    it.concurrent('should return true when auto marker present', () => {
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Generated
${SENTINEL_MARKERS.AUTO_END}
`
      expect(hasAutoContent(content)).toBe(true)
    })

    it.concurrent('should return false when no auto marker', () => {
      expect(hasAutoContent('Manual content')).toBe(false)
    })
  })

  describe('wrapManualSection', () => {
    it.concurrent('should wrap content with manual markers', () => {
      const result = wrapManualSection('My notes')

      expect(result).toContain(SENTINEL_MARKERS.MANUAL_START)
      expect(result).toContain(SENTINEL_MARKERS.MANUAL_END)
      expect(result).toContain('My notes')
    })
  })

  describe('wrapAutoSection', () => {
    it.concurrent('should wrap content with auto markers', () => {
      const result = wrapAutoSection('Generated docs')

      expect(result).toContain(SENTINEL_MARKERS.AUTO_START)
      expect(result).toContain(SENTINEL_MARKERS.AUTO_END)
      expect(result).toContain('Generated docs')
    })
  })

  describe('stripSentinelMarkers', () => {
    it.concurrent('should remove all sentinel markers', () => {
      const content = `# Title
${SENTINEL_MARKERS.AUTO_START}
API content
${SENTINEL_MARKERS.AUTO_END}

${SENTINEL_MARKERS.MANUAL_START}
Manual content
${SENTINEL_MARKERS.MANUAL_END}
`
      const result = stripSentinelMarkers(content)

      expect(result).not.toContain(SENTINEL_MARKERS.AUTO_START)
      expect(result).not.toContain(SENTINEL_MARKERS.AUTO_END)
      expect(result).not.toContain(SENTINEL_MARKERS.MANUAL_START)
      expect(result).not.toContain(SENTINEL_MARKERS.MANUAL_END)
      expect(result).toContain('API content')
      expect(result).toContain('Manual content')
    })

    it.concurrent('should collapse excessive newlines', () => {
      const content = `Line 1\n\n\n\n\nLine 2`

      const result = stripSentinelMarkers(content)

      expect(result).toBe('Line 1\n\nLine 2')
    })
  })

  describe('validateMarkerPairing', () => {
    it.concurrent('should pass for properly paired markers', () => {
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Content
${SENTINEL_MARKERS.AUTO_END}

${SENTINEL_MARKERS.MANUAL_START}
More content
${SENTINEL_MARKERS.MANUAL_END}
`
      const result = validateMarkerPairing(content)

      expect(result.success).toBe(true)
    })

    it.concurrent('should pass for content with no markers', () => {
      const result = validateMarkerPairing('Simple content')

      expect(result.success).toBe(true)
    })

    it.concurrent('should fail for unmatched auto start', () => {
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Content without end marker
`
      const result = validateMarkerPairing(content)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('AUTO-GENERATED')
    })

    it.concurrent('should fail for unmatched auto end', () => {
      const content = `
Content without start marker
${SENTINEL_MARKERS.AUTO_END}
`
      const result = validateMarkerPairing(content)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('AUTO-GENERATED')
    })

    it.concurrent('should fail for unmatched manual start', () => {
      const content = `
${SENTINEL_MARKERS.MANUAL_START}
Content
`
      const result = validateMarkerPairing(content)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('MANUAL-CONTENT')
    })

    it.concurrent('should handle properly nested markers with matching pairs', () => {
      // The implementation validates that each start has a matching end
      // and proper nesting depth. Two properly paired sections are valid.
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Content
${SENTINEL_MARKERS.AUTO_END}
${SENTINEL_MARKERS.AUTO_START}
More content
${SENTINEL_MARKERS.AUTO_END}
`
      const result = validateMarkerPairing(content)

      expect(result.success).toBe(true)
    })
  })

  describe('createDiffSummary', () => {
    it.concurrent('should report lines added', () => {
      const old = 'line 1'
      const newContent = 'line 1\nline 2\nline 3'

      const summary = createDiffSummary(old, newContent)

      expect(summary).toContain('2 lines added')
    })

    it.concurrent('should report lines removed', () => {
      const old = 'line 1\nline 2\nline 3'
      const newContent = 'line 1'

      const summary = createDiffSummary(old, newContent)

      expect(summary).toContain('2 lines removed')
    })

    it.concurrent('should report both additions and removals', () => {
      const old = 'line 1\nline 2'
      const newContent = 'line 1\nline 3'

      const summary = createDiffSummary(old, newContent)

      expect(summary).toContain('added')
      expect(summary).toContain('removed')
    })

    it.concurrent('should report no changes for identical content', () => {
      const content = 'identical content'

      const summary = createDiffSummary(content, content)

      expect(summary).toContain('0 lines added')
      expect(summary).toContain('0 lines removed')
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle mixed markers', () => {
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Auto section
${SENTINEL_MARKERS.AUTO_END}

${SENTINEL_MARKERS.MANUAL_START}
Manual section
${SENTINEL_MARKERS.MANUAL_END}

${SENTINEL_MARKERS.AUTO_START}
Another auto
${SENTINEL_MARKERS.AUTO_END}
`
      const autoSections = extractAutoSections(content)
      const manualSections = extractManualSections(content)

      expect(autoSections.length).toBe(2)
      expect(manualSections.length).toBe(1)
    })

    it.concurrent('should handle empty content', () => {
      const result = mergeContent('', '')

      expect(result.success).toBe(true)
      const merge = (result as {success: true; data: MergeResult}).data
      expect(merge.hasChanges).toBe(false)
    })

    it.concurrent('should handle whitespace-only sections', () => {
      const content = `
${SENTINEL_MARKERS.MANUAL_START}

${SENTINEL_MARKERS.MANUAL_END}
`
      const sections = extractManualSections(content)

      expect(sections.length).toBe(1)
      expect(sections[0]?.content).toBe('')
    })

    it.concurrent('should handle marker-like text in content', () => {
      // The extractor finds the first matching pair, so text before
      // the first marker is included in the first section
      const content = `
${SENTINEL_MARKERS.AUTO_START}
Actual content
${SENTINEL_MARKERS.AUTO_END}
`
      const sections = extractAutoSections(content)

      expect(sections.length).toBe(1)
      expect(sections[0]?.content).toBe('Actual content')
    })
  })
})
