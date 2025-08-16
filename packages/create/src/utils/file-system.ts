import type {Stats} from 'node:fs'
import {existsSync, statSync} from 'node:fs'
import {cp, mkdir, readdir, rm, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'
import {glob} from 'glob'

/**
 * Check if a path exists.
 */
export function exists(filePath: string): boolean {
  return existsSync(filePath)
}

/**
 * Ensure a directory exists.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, {recursive: true})
}

/**
 * Copy files and directories.
 */
export async function copy(
  source: string,
  target: string,
  options?: {
    overwrite?: boolean
    filter?: (src: string, dest: string) => boolean
  },
): Promise<void> {
  const {overwrite = true, filter} = options ?? {}

  // Apply filter if provided
  if (filter !== undefined && !filter(source, target)) {
    return
  }

  // Ensure target directory exists
  await ensureDir(path.dirname(target))

  // Check if target exists and handle overwrite
  if (existsSync(target) && overwrite === false) {
    consola.warn(`Skipping existing file: ${target}`)
    return
  }

  // Copy the file/directory
  await cp(source, target, {
    recursive: true,
    force: overwrite,
    filter: filter
      ? (src: string, dest: string) => {
          return filter(src, dest)
        }
      : undefined,
  })
}

/**
 * Remove a file or directory.
 */
export async function remove(targetPath: string): Promise<void> {
  if (!existsSync(targetPath)) {
    return
  }

  await rm(targetPath, {recursive: true, force: true})
}

/**
 * Create a temporary directory.
 */
export async function createTempDir(prefix = 'bfra-me-create-'): Promise<string> {
  const tempDir = path.join(process.cwd(), '.tmp', `${prefix}${Date.now()}`)
  await ensureDir(tempDir)
  return tempDir
}

/**
 * Read directory contents.
 */
export async function readDir(dirPath: string): Promise<string[]> {
  try {
    return await readdir(dirPath)
  } catch {
    return []
  }
}

/**
 * Get file stats.
 */
export async function getStats(filePath: string): Promise<Stats | null> {
  try {
    return await stat(filePath)
  } catch {
    return null
  }
}

/**
 * Check if a path is a directory.
 */
export function isDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if a path is a file.
 */
export function isFile(filePath: string): boolean {
  try {
    return statSync(filePath).isFile()
  } catch {
    return false
  }
}

/**
 * Find files matching a pattern.
 */
export async function findFiles(
  pattern: string,
  options?: {
    cwd?: string
    ignore?: string[]
  },
): Promise<string[]> {
  try {
    return await glob(pattern, {
      cwd: options?.cwd ?? process.cwd(),
      ignore: options?.ignore ?? ['node_modules/**', '.git/**'],
    })
  } catch {
    return []
  }
}

/**
 * Get the size of a file or directory.
 */
export async function getSize(filePath: string): Promise<number> {
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      return stats.size
    }
    if (stats.isDirectory()) {
      const files = await readdir(filePath)
      let totalSize = 0
      for (const file of files) {
        totalSize += await getSize(path.join(filePath, file))
      }
      return totalSize
    }
    return 0
  } catch {
    return 0
  }
}

/**
 * Create a file with content.
 */
export async function createFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await writeFile(filePath, content, 'utf-8')
}

/**
 * Check if a directory is empty.
 */
export async function isEmpty(dirPath: string): Promise<boolean> {
  try {
    const files = await readdir(dirPath)
    return files.length === 0
  } catch {
    return true
  }
}

/**
 * Move files from source to destination.
 */
export async function move(source: string, destination: string): Promise<void> {
  await copy(source, destination, {overwrite: true})
  await remove(source)
}

/**
 * Get the relative path from one location to another.
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to)
}

/**
 * Resolve a path to an absolute path.
 */
export function resolvePath(...paths: string[]): string {
  return path.resolve(...paths)
}

/**
 * Join path segments.
 */
export function joinPaths(...paths: string[]): string {
  return path.join(...paths)
}

/**
 * Get the basename of a path.
 */
export function getBasename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext)
}

/**
 * Get the directory name of a path.
 */
export function getDirname(filePath: string): string {
  return path.dirname(filePath)
}

/**
 * Get the extension of a file.
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath)
}

/**
 * Normalize a file path.
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath)
}

/**
 * Check if a path is absolute.
 */
export function isAbsolute(filePath: string): boolean {
  return path.isAbsolute(filePath)
}

/**
 * Convert backslashes to forward slashes for cross-platform compatibility.
 */
export function toUnixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

/**
 * Create a backup of a file or directory.
 */
export async function createBackup(
  filePath: string,
  options?: {
    suffix?: string
    keepOriginal?: boolean
  },
): Promise<string> {
  const {suffix = '.backup', keepOriginal = true} = options ?? {}
  const backupPath = `${filePath}${suffix}`

  if (keepOriginal === false) {
    await move(filePath, backupPath)
  } else {
    await copy(filePath, backupPath, {overwrite: true})
  }

  return backupPath
}

/**
 * Restore a file or directory from backup.
 */
export async function restoreFromBackup(originalPath: string, backupPath?: string): Promise<void> {
  const backup = backupPath ?? `${originalPath}.backup`

  if (!existsSync(backup)) {
    throw new Error(`Backup file not found: ${backup}`)
  }

  if (existsSync(originalPath)) {
    await remove(originalPath)
  }

  await move(backup, originalPath)
}

/**
 * Clean up old backup files.
 */
export async function cleanupBackups(
  dirPath: string,
  options?: {
    pattern?: string
    maxAge?: number // in days
  },
): Promise<void> {
  const {pattern = '*.backup', maxAge = 7} = options ?? {}
  const backupFiles = await findFiles(path.join(dirPath, pattern))
  const cutoffTime = Date.now() - maxAge * 24 * 60 * 60 * 1000

  for (const file of backupFiles) {
    const filePath = path.resolve(dirPath, file)
    const stats = await getStats(filePath)
    if (stats !== null && stats.mtime.getTime() < cutoffTime) {
      await remove(filePath)
      consola.info(`Cleaned up old backup: ${file}`)
    }
  }
}
