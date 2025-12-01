/**
 * Configuration management package.
 * Demonstrates cross-package Result type usage.
 */

import type {Result} from '@bfra.me/es/result'
import {err, ok} from '@bfra.me/es/result'

/** Configuration source types */
export type ConfigSource = 'file' | 'env' | 'remote' | 'default'

/** Configuration entry with metadata */
export interface ConfigEntry<T = unknown> {
  key: string
  value: T
  source: ConfigSource
  timestamp: number
}

/** Configuration error */
export interface ConfigError {
  code: 'NOT_FOUND' | 'INVALID_INPUT' | 'PERMISSION_DENIED' | 'PARSE_ERROR'
  message: string
  key?: string
}

/** Configuration store */
export interface ConfigStore {
  entries: Map<string, ConfigEntry>
  get<T>(key: string): Result<ConfigEntry<T>, ConfigError>
  set<T>(key: string, value: T, source?: ConfigSource): Result<ConfigEntry<T>, ConfigError>
}

/** Creates a new configuration store */
export function createConfigStore(): ConfigStore {
  const entries = new Map<string, ConfigEntry>()

  return {
    entries,

    get<T>(key: string): Result<ConfigEntry<T>, ConfigError> {
      const entry = entries.get(key)
      if (!entry) {
        return err({
          code: 'NOT_FOUND',
          message: `Configuration key '${key}' not found`,
          key,
        })
      }
      return ok(entry as ConfigEntry<T>)
    },

    set<T>(key: string, value: T, source: ConfigSource = 'default'): Result<ConfigEntry<T>, ConfigError> {
      if (!key || key.trim() === '') {
        return err({
          code: 'INVALID_INPUT',
          message: 'Configuration key cannot be empty',
          key,
        })
      }

      const entry: ConfigEntry<T> = {
        key,
        value,
        source,
        timestamp: Date.now(),
      }

      entries.set(key, entry)
      return ok(entry)
    },
  }
}

/** Loads configuration from environment with type transformation */
export function loadEnvConfig<T>(
  key: string,
  transform: (value: string) => T,
): Result<ConfigEntry<T>, ConfigError> {
  const envValue = process.env[key]

  if (envValue === undefined) {
    return err({
      code: 'NOT_FOUND',
      message: `Environment variable '${key}' not found`,
      key,
    })
  }

  try {
    const value = transform(envValue)
    return ok({
      key,
      value,
      source: 'env',
      timestamp: Date.now(),
    })
  } catch (error) {
    return err({
      code: 'PARSE_ERROR',
      message: `Failed to parse environment variable '${key}': ${String(error)}`,
      key,
    })
  }
}

/** Validates that a configuration has required keys */
export function validateConfig<T extends object>(
  config: Partial<T>,
  requiredKeys: (keyof T)[],
): Result<T, ConfigError> {
  const missingKeys = requiredKeys.filter(key => !(key in config))

  if (missingKeys.length > 0) {
    return err({
      code: 'INVALID_INPUT',
      message: `Missing required configuration keys: ${missingKeys.join(', ')}`,
    })
  }

  return ok(config as T)
}

/** Merges multiple configuration objects with later values taking precedence */
export function mergeConfigs<T extends object>(...configs: Partial<T>[]): T {
  return Object.assign({}, ...configs) as T
}
