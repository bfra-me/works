import type {ChangeDetector} from '@bfra.me/es/watcher'
import type {FileChangeEvent, PackageInfo} from '../types'

import {createChangeDetector as createBaseDetector} from '@bfra.me/es/watcher'

import {categorizeFile, type FileCategory} from './file-watcher'

export interface DocChangeDetectorOptions {
  readonly algorithm?: 'sha256' | 'md5'
}

export interface PackageChangeAnalysis {
  readonly packageName: string
  readonly needsRegeneration: boolean
  readonly changedCategories: readonly FileCategory[]
  readonly changedFiles: readonly string[]
}

export interface DocChangeDetector {
  readonly hasChanged: (filePath: string) => Promise<boolean>
  readonly record: (filePath: string) => Promise<void>
  readonly recordPackage: (pkg: PackageInfo, files: readonly string[]) => Promise<void>
  readonly clear: (filePath: string) => void
  readonly clearAll: () => void
  readonly analyzeChanges: (events: readonly FileChangeEvent[]) => Promise<PackageChangeAnalysis[]>
}

export function createDocChangeDetector(options: DocChangeDetectorOptions = {}): DocChangeDetector {
  const baseDetector: ChangeDetector = createBaseDetector({algorithm: options.algorithm})
  const packageFiles = new Map<string, Set<string>>()

  return {
    async hasChanged(filePath: string): Promise<boolean> {
      return baseDetector.hasChanged(filePath)
    },

    async record(filePath: string): Promise<void> {
      await baseDetector.record(filePath)
    },

    async recordPackage(pkg: PackageInfo, files: readonly string[]): Promise<void> {
      const fileSet = new Set(files)
      packageFiles.set(pkg.name, fileSet)

      await Promise.all(files.map(async file => baseDetector.record(file)))
    },

    clear(filePath: string): void {
      baseDetector.clear(filePath)

      for (const fileSet of packageFiles.values()) {
        fileSet.delete(filePath)
      }
    },

    clearAll(): void {
      baseDetector.clearAll()
      packageFiles.clear()
    },

    async analyzeChanges(events: readonly FileChangeEvent[]): Promise<PackageChangeAnalysis[]> {
      const packageChanges = new Map<string, {categories: Set<FileCategory>; files: string[]}>()

      for (const event of events) {
        const packageName = event.packageName ?? '__unknown__'
        const category = categorizeFile(event.path)

        let analysis = packageChanges.get(packageName)
        if (analysis === undefined) {
          analysis = {categories: new Set(), files: []}
          packageChanges.set(packageName, analysis)
        }

        if (category !== 'unknown') {
          analysis.categories.add(category)
        }
        analysis.files.push(event.path)
      }

      const results: PackageChangeAnalysis[] = []

      for (const [packageName, analysis] of packageChanges) {
        const changedCategories = [...analysis.categories]

        // Package needs regeneration if any documentation-relevant files changed
        const needsRegeneration =
          changedCategories.includes('readme') ||
          changedCategories.includes('package-json') ||
          changedCategories.includes('source')

        results.push({
          packageName,
          needsRegeneration,
          changedCategories,
          changedFiles: analysis.files,
        })
      }

      return results
    },
  }
}

export type RegenerationScope = 'full' | 'api-only' | 'readme-only' | 'metadata-only' | 'none'

export function determineRegenerationScope(
  changedCategories: readonly FileCategory[],
): RegenerationScope {
  const hasReadme = changedCategories.includes('readme')
  const hasSource = changedCategories.includes('source')
  const hasPackageJson = changedCategories.includes('package-json')

  if (hasReadme && hasSource) {
    return 'full'
  }

  if (hasSource) {
    return 'api-only'
  }

  if (hasReadme) {
    return 'readme-only'
  }

  if (hasPackageJson) {
    return 'metadata-only'
  }

  return 'none'
}

export async function hasAnyFileChanged(
  detector: DocChangeDetector,
  files: readonly string[],
): Promise<boolean> {
  const results = await Promise.all(files.map(async file => detector.hasChanged(file)))
  return results.some(changed => changed)
}
