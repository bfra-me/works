import {existsSync, mkdirSync} from 'node:fs'
import {cp, readdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {consola} from 'consola'

export interface BackupInfo {
  /** Backup ID */
  id: string
  /** Backup timestamp */
  timestamp: Date
  /** Feature that triggered the backup */
  feature: string
  /** Files that were backed up */
  files: string[]
  /** Backup directory */
  backupDir: string
}

const BACKUP_DIR = path.join(tmpdir(), 'bfra-me-create-backups')

/**
 * Create a backup of the project before making changes
 */
export async function createBackup(projectDir: string, feature: string): Promise<string> {
  const backupId = `${feature}-${Date.now()}`
  const backupPath = path.join(BACKUP_DIR, backupId)

  // Ensure backup directory exists
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, {recursive: true})
  }

  if (!existsSync(backupPath)) {
    mkdirSync(backupPath, {recursive: true})
  }

  // Backup important files that might be modified
  const filesToBackup = [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    '.eslintrc*',
    'eslint.config.*',
    '.prettierrc*',
    'prettier.config.*',
    'tsconfig.json',
    'vitest.config.*',
    'jest.config.*',
    '.gitignore',
    'README.md',
  ]

  const backedUpFiles: string[] = []

  for (const filePattern of filesToBackup) {
    if (filePattern.includes('*')) {
      // Handle glob patterns
      try {
        const files = await readdir(projectDir)
        const matchingFiles = files.filter(file => {
          const pattern = filePattern.replaceAll('*', '.*')
          const regex = new RegExp(`^${pattern}$`)
          return regex.test(file)
        })

        for (const file of matchingFiles) {
          const sourcePath = path.join(projectDir, file)
          const targetPath = path.join(backupPath, file)

          if (existsSync(sourcePath)) {
            await cp(sourcePath, targetPath, {recursive: true})
            backedUpFiles.push(file)
          }
        }
      } catch {
        // Ignore errors for optional files
      }
    } else {
      // Handle exact file names
      const sourcePath = path.join(projectDir, filePattern)
      const targetPath = path.join(backupPath, filePattern)

      if (existsSync(sourcePath)) {
        try {
          await cp(sourcePath, targetPath, {recursive: true})
          backedUpFiles.push(filePattern)
        } catch {
          // Ignore errors for optional files
        }
      }
    }
  }

  // Store backup metadata
  const backupInfo: BackupInfo = {
    id: backupId,
    timestamp: new Date(),
    feature,
    files: backedUpFiles,
    backupDir: backupPath,
  }

  // Save backup info
  const {writeFile} = await import('node:fs/promises')
  const metadataPath = path.join(backupPath, '.backup-info.json')
  await writeFile(metadataPath, JSON.stringify(backupInfo, null, 2), 'utf-8')

  return backupId
}

/**
 * Restore a backup by ID
 */
export async function restoreBackup(backupId: string, projectDir: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, backupId)
  const metadataPath = path.join(backupPath, '.backup-info.json')

  if (!existsSync(backupPath) || !existsSync(metadataPath)) {
    throw new Error(`Backup ${backupId} not found`)
  }

  // Read backup metadata
  const {readFile} = await import('node:fs/promises')
  const metadataContent = await readFile(metadataPath, 'utf-8')
  const backupInfo = JSON.parse(metadataContent) as BackupInfo

  // Restore backed up files
  for (const file of backupInfo.files) {
    const sourcePath = path.join(backupPath, file)
    const targetPath = path.join(projectDir, file)

    if (existsSync(sourcePath)) {
      await cp(sourcePath, targetPath, {recursive: true, force: true})
    }
  }

  consola.success(`Restored backup ${backupId}`)
}

/**
 * Clean up old backups
 */
export async function cleanupBackups(olderThanHours = 24): Promise<void> {
  if (!existsSync(BACKUP_DIR)) {
    return
  }

  try {
    const entries = await readdir(BACKUP_DIR)
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000

    for (const entry of entries) {
      const entryPath = path.join(BACKUP_DIR, entry)
      const metadataPath = path.join(entryPath, '.backup-info.json')

      if (existsSync(metadataPath)) {
        try {
          const {readFile} = await import('node:fs/promises')
          const metadataContent = await readFile(metadataPath, 'utf-8')
          const backupInfo = JSON.parse(metadataContent) as BackupInfo

          if (backupInfo.timestamp.getTime() < cutoffTime) {
            await rm(entryPath, {recursive: true, force: true})
          }
        } catch {
          // Ignore errors when reading backup metadata
        }
      }
    }
  } catch {
    // Ignore errors when cleaning up backups
  }
}

/**
 * List available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  if (!existsSync(BACKUP_DIR)) {
    return []
  }

  const backups: BackupInfo[] = []

  try {
    const entries = await readdir(BACKUP_DIR)

    for (const entry of entries) {
      const metadataPath = path.join(BACKUP_DIR, entry, '.backup-info.json')

      if (existsSync(metadataPath)) {
        try {
          const {readFile} = await import('node:fs/promises')
          const metadataContent = await readFile(metadataPath, 'utf-8')
          const backupInfo = JSON.parse(metadataContent) as BackupInfo
          backups.push(backupInfo)
        } catch {
          // Ignore corrupted backup metadata
        }
      }
    }
  } catch {
    // Ignore errors when listing backups
  }

  return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
