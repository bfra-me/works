/**
 * Zod schemas for core semantic-release configuration types.
 */

import {z} from 'zod'

/**
 * Schema for branch specification configuration.
 */
export const branchSpecSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    channel: z.string().optional(),
    range: z.string().optional(),
    prerelease: z.union([z.boolean(), z.string()]).optional(),
  }),
])

/**
 * Schema for plugin specification validation.
 */
export const pluginSpecSchema = z.union([
  z.string().min(1),
  z.tuple([z.string().min(1), z.record(z.string(), z.unknown())]),
])

/**
 * Schema for global semantic-release configuration.
 */
export const globalConfigSchema = z.object({
  // Core configuration
  extends: z.union([z.string(), z.array(z.string())]).optional(),
  branches: z.array(branchSpecSchema).optional(),
  repositoryUrl: z.string().url().optional(),
  tagFormat: z.string().optional(),
  plugins: z.array(pluginSpecSchema).optional(),

  // CI environment
  ci: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  debug: z.boolean().optional(),

  // Git configuration
  preset: z.string().optional(),
  presetConfig: z.record(z.string(), z.unknown()).optional(),

  // Advanced options
  noCi: z.boolean().optional(),

  // Environment variables will be validated separately
})
