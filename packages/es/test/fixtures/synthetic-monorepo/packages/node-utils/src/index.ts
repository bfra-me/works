/**
 * Node.js utilities package for synthetic monorepo.
 * Demonstrates Node-specific Result type usage with file operations.
 */

import {readFile, writeFile, mkdir, stat} from 'node:fs/promises'
import {dirname} from 'node:path'
import type {Result} from '@bfra.me/es/result'
import {err, ok} from '@bfra.me/es/result'
import {validatePath} from '@bfra.me/es/validation'

/** File operation error */
export interface FileError {
  code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_PATH' | 'IO_ERROR'
  message: string
  path: string
}

/** Reads a file and returns its content as a Result */
export async function readFileResult(path: string): Promise<Result<string, FileError>> {
  const validPath = validatePath(path)
  if (!validPath.success) {
    return err({
      code: 'INVALID_PATH',
      message: validPath.error.message,
      path,
    })
  }

  try {
    const content = await readFile(path, 'utf-8')
    return ok(content)
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        return err({
          code: 'NOT_FOUND',
          message: `File not found: ${path}`,
          path,
        })
      }
      if (nodeError.code === 'EACCES') {
        return err({
          code: 'PERMISSION_DENIED',
          message: `Permission denied: ${path}`,
          path,
        })
      }
    }

    return err({
      code: 'IO_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      path,
    })
  }
}

/** Writes content to a file, creating directories as needed */
export async function writeFileResult(
  path: string,
  content: string,
): Promise<Result<void, FileError>> {
  const validPath = validatePath(path)
  if (!validPath.success) {
    return err({
      code: 'INVALID_PATH',
      message: validPath.error.message,
      path,
    })
  }

  try {
    await mkdir(dirname(path), {recursive: true})
    await writeFile(path, content, 'utf-8')
    return ok(undefined)
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'EACCES') {
        return err({
          code: 'PERMISSION_DENIED',
          message: `Permission denied: ${path}`,
          path,
        })
      }
    }

    return err({
      code: 'IO_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      path,
    })
  }
}

/** Checks if a file exists */
export async function fileExists(path: string): Promise<Result<boolean, FileError>> {
  const validPath = validatePath(path)
  if (!validPath.success) {
    return err({
      code: 'INVALID_PATH',
      message: validPath.error.message,
      path,
    })
  }

  try {
    await stat(path)
    return ok(true)
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        return ok(false)
      }
    }

    return err({
      code: 'IO_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      path,
    })
  }
}

/** Reads and parses a JSON file */
export async function readJsonFile<T>(path: string): Promise<Result<T, FileError>> {
  const contentResult = await readFileResult(path)

  if (!contentResult.success) {
    return contentResult
  }

  try {
    const data = JSON.parse(contentResult.data) as T
    return ok(data)
  } catch {
    return err({
      code: 'IO_ERROR',
      message: `Failed to parse JSON: ${path}`,
      path,
    })
  }
}
