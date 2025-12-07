/**
 * TypeScript AST parser utilities for workspace analysis.
 *
 * Re-exports core parsing utilities from @bfra.me/doc-sync/parsers and provides
 * additional workspace-analyzer-specific helpers for multi-file analysis.
 */

import type {ParseError} from '@bfra.me/doc-sync/types'
import type {Result} from '@bfra.me/es/result'
import type {Project, SourceFile} from 'ts-morph'

import {
  createProject as createDocSyncProject,
  parseSourceFile as parseDocSyncSourceFile,
} from '@bfra.me/doc-sync/parsers'
import {err, ok} from '@bfra.me/es/result'

// Re-export core TypeScript parsing utilities from @bfra.me/doc-sync
export {createProject, parseSourceContent, parseSourceFile} from '@bfra.me/doc-sync/parsers'

export type {TypeScriptParserOptions} from '@bfra.me/doc-sync/parsers'

// Re-export ParseError type for consumers
export type {ParseError, ParseErrorCode} from '@bfra.me/doc-sync/types'

/**
 * Gets the source file at a path, creating the project if needed.
 *
 * Convenience function for one-off file parsing without manually managing a project.
 */
export function getSourceFile(
  filePath: string,
  options?: {tsConfigPath?: string; compilerOptions?: Record<string, unknown>},
): Result<SourceFile, ParseError> {
  const project = createDocSyncProject(options)
  return parseDocSyncSourceFile(project, filePath)
}

/**
 * Parses multiple source files into a single project.
 *
 * More efficient than parsing files individually when analyzing many files,
 * as the project can share type resolution and compiler settings.
 */
export function parseSourceFiles(
  filePaths: readonly string[],
  options?: {tsConfigPath?: string; compilerOptions?: Record<string, unknown>},
): Result<Project, ParseError> {
  const project = createDocSyncProject(options)

  for (const filePath of filePaths) {
    try {
      project.addSourceFileAtPath(filePath)
    } catch (error) {
      return err({
        code: 'FILE_NOT_FOUND',
        message: `Failed to add source file: ${filePath}`,
        filePath,
        cause: error,
      })
    }
  }

  return ok(project)
}

/**
 * Gets all source files from a project.
 */
export function getAllSourceFiles(project: Project): readonly SourceFile[] {
  return project.getSourceFiles()
}

/**
 * Checks if a file path represents a TypeScript file.
 */
export function isTypeScriptFile(filePath: string): boolean {
  const ext = filePath.toLowerCase()
  return ext.endsWith('.ts') || ext.endsWith('.tsx') || ext.endsWith('.mts') || ext.endsWith('.cts')
}

/**
 * Checks if a file path represents a JavaScript file.
 */
export function isJavaScriptFile(filePath: string): boolean {
  const ext = filePath.toLowerCase()
  return ext.endsWith('.js') || ext.endsWith('.jsx') || ext.endsWith('.mjs') || ext.endsWith('.cjs')
}

/**
 * Checks if a file path is a parseable source file (TypeScript or JavaScript).
 */
export function isSourceFile(filePath: string): boolean {
  return isTypeScriptFile(filePath) || isJavaScriptFile(filePath)
}
