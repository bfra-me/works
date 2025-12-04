/**
 * @bfra.me/doc-sync/generators/content-merger - Preserve manual sections using sentinel markers
 */

import type {Result} from '@bfra.me/es/result'
import type {SyncError} from '../types'

import {err, ok} from '@bfra.me/es/result'
import {SENTINEL_MARKERS} from '../types'

/**
 * A section of content extracted from MDX
 */
export interface ContentSection {
  /** Section type */
  readonly type: 'auto' | 'manual' | 'unchanged'
  /** Section content */
  readonly content: string
  /** Start position in source */
  readonly startIndex: number
  /** End position in source */
  readonly endIndex: number
}

/**
 * Merge options
 */
export interface MergeOptions {
  /** Strategy for handling conflicts */
  readonly conflictStrategy?: 'keep-manual' | 'keep-auto' | 'merge'
  /** Preserve empty manual sections */
  readonly preserveEmptyManual?: boolean
}

/**
 * Result of a merge operation
 */
export interface MergeResult {
  /** Merged content */
  readonly content: string
  /** Number of manual sections preserved */
  readonly preservedCount: number
  /** Number of auto-generated sections updated */
  readonly updatedCount: number
  /** Whether content changed */
  readonly hasChanges: boolean
}

export function mergeContent(
  existingContent: string,
  newContent: string,
  options: MergeOptions = {},
): Result<MergeResult, SyncError> {
  const {conflictStrategy = 'keep-manual', preserveEmptyManual = true} = options

  try {
    const existingManualSections = extractManualSections(existingContent)
    const newAutoSections = extractAutoSections(newContent)

    if (existingManualSections.length === 0 && newAutoSections.length === 0) {
      const hasChanges = existingContent.trim() !== newContent.trim()
      return ok({
        content: newContent,
        preservedCount: 0,
        updatedCount: hasChanges ? 1 : 0,
        hasChanges,
      })
    }

    let merged = newContent
    let preservedCount = 0

    for (const manual of existingManualSections) {
      if (!preserveEmptyManual && manual.content.trim().length === 0) {
        continue
      }

      const manualMarker = `${SENTINEL_MARKERS.MANUAL_START}\n${manual.content}\n${SENTINEL_MARKERS.MANUAL_END}`

      if (!merged.includes(SENTINEL_MARKERS.MANUAL_START)) {
        const autoEndIndex = merged.indexOf(SENTINEL_MARKERS.AUTO_END)
        if (autoEndIndex === -1) {
          merged = `${merged}\n\n${manualMarker}`
        } else {
          merged = `${merged.slice(0, autoEndIndex + SENTINEL_MARKERS.AUTO_END.length)}\n\n${manualMarker}\n${merged.slice(autoEndIndex + SENTINEL_MARKERS.AUTO_END.length)}`
        }
      } else if (conflictStrategy === 'keep-manual') {
        const existingManualInNew = extractManualSections(merged)
        if (existingManualInNew.length > 0) {
          const firstManualInNew = existingManualInNew[0]
          if (firstManualInNew !== undefined) {
            merged = replaceSection(merged, firstManualInNew, manual.content)
          }
        }
      }

      preservedCount++
    }

    const hasChanges = existingContent.trim() !== merged.trim()

    return ok({
      content: merged,
      preservedCount,
      updatedCount: newAutoSections.length,
      hasChanges,
    })
  } catch (error) {
    return err({
      code: 'GENERATION_ERROR',
      message: `Failed to merge content: ${error instanceof Error ? error.message : String(error)}`,
      cause: error,
    })
  }
}

export function extractManualSections(content: string): ContentSection[] {
  const sections: ContentSection[] = []
  let searchStart = 0

  while (searchStart < content.length) {
    const startIndex = content.indexOf(SENTINEL_MARKERS.MANUAL_START, searchStart)
    if (startIndex === -1) break

    const endIndex = content.indexOf(SENTINEL_MARKERS.MANUAL_END, startIndex)
    if (endIndex === -1) break

    const contentStart = startIndex + SENTINEL_MARKERS.MANUAL_START.length
    const sectionContent = content.slice(contentStart, endIndex).trim()

    sections.push({
      type: 'manual',
      content: sectionContent,
      startIndex,
      endIndex: endIndex + SENTINEL_MARKERS.MANUAL_END.length,
    })

    searchStart = endIndex + SENTINEL_MARKERS.MANUAL_END.length
  }

  return sections
}

export function extractAutoSections(content: string): ContentSection[] {
  const sections: ContentSection[] = []
  let searchStart = 0

  while (searchStart < content.length) {
    const startIndex = content.indexOf(SENTINEL_MARKERS.AUTO_START, searchStart)
    if (startIndex === -1) break

    const endIndex = content.indexOf(SENTINEL_MARKERS.AUTO_END, startIndex)
    if (endIndex === -1) break

    const contentStart = startIndex + SENTINEL_MARKERS.AUTO_START.length
    const sectionContent = content.slice(contentStart, endIndex).trim()

    sections.push({
      type: 'auto',
      content: sectionContent,
      startIndex,
      endIndex: endIndex + SENTINEL_MARKERS.AUTO_END.length,
    })

    searchStart = endIndex + SENTINEL_MARKERS.AUTO_END.length
  }

  return sections
}

function replaceSection(content: string, section: ContentSection, newContent: string): string {
  const marker =
    section.type === 'manual' ? SENTINEL_MARKERS.MANUAL_START : SENTINEL_MARKERS.AUTO_START
  const endMarker =
    section.type === 'manual' ? SENTINEL_MARKERS.MANUAL_END : SENTINEL_MARKERS.AUTO_END

  const before = content.slice(0, section.startIndex)
  const after = content.slice(section.endIndex)

  return `${before}${marker}\n${newContent}\n${endMarker}${after}`
}

export function hasManualContent(content: string): boolean {
  return content.includes(SENTINEL_MARKERS.MANUAL_START)
}

export function hasAutoContent(content: string): boolean {
  return content.includes(SENTINEL_MARKERS.AUTO_START)
}

export function wrapManualSection(content: string): string {
  return `${SENTINEL_MARKERS.MANUAL_START}\n${content}\n${SENTINEL_MARKERS.MANUAL_END}`
}

export function wrapAutoSection(content: string): string {
  return `${SENTINEL_MARKERS.AUTO_START}\n${content}\n${SENTINEL_MARKERS.AUTO_END}`
}

export function stripSentinelMarkers(content: string): string {
  return content
    .replaceAll(SENTINEL_MARKERS.AUTO_START, '')
    .replaceAll(SENTINEL_MARKERS.AUTO_END, '')
    .replaceAll(SENTINEL_MARKERS.MANUAL_START, '')
    .replaceAll(SENTINEL_MARKERS.MANUAL_END, '')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()
}

export function validateMarkerPairing(content: string): Result<true, SyncError> {
  const autoStartCount = countOccurrences(content, SENTINEL_MARKERS.AUTO_START)
  const autoEndCount = countOccurrences(content, SENTINEL_MARKERS.AUTO_END)
  const manualStartCount = countOccurrences(content, SENTINEL_MARKERS.MANUAL_START)
  const manualEndCount = countOccurrences(content, SENTINEL_MARKERS.MANUAL_END)

  if (autoStartCount !== autoEndCount) {
    return err({
      code: 'VALIDATION_ERROR',
      message: `Mismatched AUTO-GENERATED markers: ${autoStartCount} starts, ${autoEndCount} ends`,
    })
  }

  if (manualStartCount !== manualEndCount) {
    return err({
      code: 'VALIDATION_ERROR',
      message: `Mismatched MANUAL-CONTENT markers: ${manualStartCount} starts, ${manualEndCount} ends`,
    })
  }

  const autoNesting = checkNesting(content, SENTINEL_MARKERS.AUTO_START, SENTINEL_MARKERS.AUTO_END)
  if (!autoNesting) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'AUTO-GENERATED markers are improperly nested',
    })
  }

  const manualNesting = checkNesting(
    content,
    SENTINEL_MARKERS.MANUAL_START,
    SENTINEL_MARKERS.MANUAL_END,
  )
  if (!manualNesting) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'MANUAL-CONTENT markers are improperly nested',
    })
  }

  return ok(true)
}

function countOccurrences(content: string, substring: string): number {
  let count = 0
  let position = content.indexOf(substring, 0)

  while (position !== -1) {
    count++
    position = content.indexOf(substring, position + substring.length)
  }

  return count
}

function checkNesting(content: string, startMarker: string, endMarker: string): boolean {
  let depth = 0
  let position = 0

  while (position < content.length) {
    const startPos = content.indexOf(startMarker, position)
    const endPos = content.indexOf(endMarker, position)

    if (startPos === -1 && endPos === -1) break

    if (startPos !== -1 && (endPos === -1 || startPos < endPos)) {
      depth++
      position = startPos + startMarker.length
    } else {
      depth--
      if (depth < 0) return false
      position = endPos + endMarker.length
    }
  }

  return depth === 0
}

export function createDiffSummary(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const added = newLines.filter(line => !oldLines.includes(line)).length
  const removed = oldLines.filter(line => !newLines.includes(line)).length

  return `${added} lines added, ${removed} lines removed`
}
