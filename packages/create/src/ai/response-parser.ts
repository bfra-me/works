/**
 * AI Response Parsing Utilities
 * Part of Phase 3: AI System Modernization (TASK-021)
 *
 * Provides comprehensive validation and parsing utilities for AI responses
 * using Phase 1 validators and error handling patterns.
 */

import type {Result} from '@bfra.me/es/result'
import type {ProjectAnalysis} from '../types.js'
import {err, isOk, ok} from '@bfra.me/es/result'
import {AIErrorCode, createAIError} from '../utils/errors.js'

/**
 * JSON extraction result
 */
export interface JsonExtractionResult {
  json: string
  startIndex: number
  endIndex: number
}

/**
 * Extracts JSON from a text response that may contain additional content.
 *
 * @param content - The response content that may contain JSON
 * @returns Result with extracted JSON string or error
 */
export function extractJsonFromResponse(content: string): Result<JsonExtractionResult, Error> {
  if (content.trim().length === 0) {
    return err(createAIError('Empty response content', AIErrorCode.AI_RESPONSE_INVALID))
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch == null) {
    return err(createAIError('No JSON object found in response', AIErrorCode.AI_RESPONSE_INVALID))
  }

  return ok({
    json: jsonMatch[0],
    startIndex: jsonMatch.index ?? 0,
    endIndex: (jsonMatch.index ?? 0) + jsonMatch[0].length,
  })
}

/**
 * Parses JSON string safely with error handling.
 *
 * @param jsonString - The JSON string to parse
 * @returns Result with parsed object or error
 */
export function parseJsonSafely<T>(jsonString: string): Result<T, Error> {
  try {
    const parsed = JSON.parse(jsonString) as T
    return ok(parsed)
  } catch (error) {
    return err(
      createAIError(
        `JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
        AIErrorCode.AI_RESPONSE_INVALID,
      ),
    )
  }
}

/**
 * Validates that a value is within a specified range.
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Normalizes a confidence score to 0-1 range.
 */
export function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.5
  }
  return clampNumber(value, 0, 1)
}

/**
 * Validates project type values
 */
export function isValidProjectType(value: unknown): value is ProjectAnalysis['projectType'] {
  const validTypes = ['library', 'cli', 'web-app', 'api', 'config', 'other']
  return typeof value === 'string' && validTypes.includes(value)
}

/**
 * Normalizes project type with fallback
 */
export function normalizeProjectType(value: unknown): ProjectAnalysis['projectType'] {
  if (isValidProjectType(value)) {
    return value
  }
  return 'other'
}

/**
 * Validates that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates that a value is an array
 */
export function isValidArray<T>(
  value: unknown,
  itemValidator?: (item: unknown) => item is T,
): value is T[] {
  if (!Array.isArray(value)) {
    return false
  }
  if (itemValidator != null) {
    return value.every(itemValidator)
  }
  return true
}

/**
 * Ensures a value is an array, converting if necessary
 */
export function ensureArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }
  return defaultValue
}

/**
 * Parses a string array from response, filtering invalid entries
 */
export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => isNonEmptyString(item))
}

/**
 * Response validation options
 */
export interface ValidationOptions {
  /** Whether to allow partial/incomplete responses */
  allowPartial?: boolean
  /** Minimum required confidence for acceptance */
  minConfidence?: number
  /** Required fields that must be present */
  requiredFields?: string[]
}

/**
 * Validates a parsed response against expected schema
 */
export function validateResponseStructure<T extends Record<string, unknown>>(
  data: unknown,
  options: ValidationOptions = {},
): Result<T, Error> {
  if (data == null || typeof data !== 'object') {
    return err(createAIError('Response must be an object', AIErrorCode.AI_RESPONSE_INVALID))
  }

  const obj = data as Record<string, unknown>

  const requiredFields = options.requiredFields ?? []
  for (const field of requiredFields) {
    if (!(field in obj)) {
      return err(createAIError(`Missing required field: ${field}`, AIErrorCode.AI_RESPONSE_INVALID))
    }
  }

  if (options.minConfidence != null && 'confidence' in obj) {
    const confidence = normalizeConfidence(obj.confidence)
    if (confidence < options.minConfidence) {
      return err(
        createAIError(
          `Response confidence ${confidence} below minimum ${options.minConfidence}`,
          AIErrorCode.AI_RESPONSE_INVALID,
        ),
      )
    }
  }

  return ok(obj as T)
}

/**
 * Combined extraction, parsing, and validation pipeline
 */
export function parseAndValidateResponse<T extends Record<string, unknown>>(
  content: string,
  options?: ValidationOptions,
): Result<T, Error> {
  const extractResult = extractJsonFromResponse(content)
  if (!isOk(extractResult)) {
    return err(extractResult.error)
  }

  const parseResult = parseJsonSafely<T>(extractResult.data.json)
  if (!isOk(parseResult)) {
    return err(parseResult.error)
  }

  return validateResponseStructure<T>(parseResult.data, options)
}
