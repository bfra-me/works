/**
 * Build tooling package for synthetic monorepo.
 * Demonstrates composition of utilities for build processes.
 */

import type {Result} from '@bfra.me/es/result'
import {err, isErr, ok} from '@bfra.me/es/result'
import {pipe, compose} from '@bfra.me/es/functional'

/** Build error */
export interface BuildError {
  code: 'COMPILE_ERROR' | 'BUNDLE_ERROR' | 'LINK_ERROR' | 'CONFIG_ERROR' | 'BUILD_ERROR'
  message: string
  file?: string
  line?: number
}

/** Build configuration */
export interface BuildConfig {
  entry: string
  output: string
  minify?: boolean
  sourcemap?: boolean
  target?: 'es2020' | 'es2021' | 'es2022' | 'esnext'
}

/** Build artifact */
export interface BuildArtifact {
  path: string
  size: number
  hash: string
  timestamp: number
}

/** Validates build configuration */
export function validateBuildConfig(config: Partial<BuildConfig>): Result<BuildConfig, BuildError> {
  if (!config.entry) {
    return err({
      code: 'CONFIG_ERROR',
      message: 'Missing required config: entry',
    })
  }

  if (!config.output) {
    return err({
      code: 'CONFIG_ERROR',
      message: 'Missing required config: output',
    })
  }

  return ok({
    entry: config.entry,
    output: config.output,
    minify: config.minify ?? false,
    sourcemap: config.sourcemap ?? true,
    target: config.target ?? 'es2022',
  })
}

/** Creates a build pipeline */
export function createBuildPipeline(...steps: BuildStep[]): BuildPipeline {
  return {
    async run(config: BuildConfig): Promise<Result<BuildArtifact, BuildError>> {
      let currentConfig = config
      let artifact: BuildArtifact | null = null

      for (const step of steps) {
        const result = await step.execute(currentConfig, artifact)

        if (isErr(result)) {
          return result
        }

        artifact = result.data
      }

      if (!artifact) {
        return err({
          code: 'BUILD_ERROR',
          message: 'No artifact produced',
        })
      }

      return ok(artifact)
    },
  }
}

/** Build step interface */
export interface BuildStep {
  name: string
  execute: (
    config: BuildConfig,
    input: BuildArtifact | null,
  ) => Promise<Result<BuildArtifact, BuildError>>
}

/** Build pipeline interface */
export interface BuildPipeline {
  run: (config: BuildConfig) => Promise<Result<BuildArtifact, BuildError>>
}

/** Creates a compile step */
export function createCompileStep(): BuildStep {
  return {
    name: 'compile',
    async execute(config): Promise<Result<BuildArtifact, BuildError>> {
      return ok({
        path: config.output,
        size: 1024,
        hash: 'abc123',
        timestamp: Date.now(),
      })
    },
  }
}

/** Creates a minify step */
export function createMinifyStep(): BuildStep {
  return {
    name: 'minify',
    async execute(_config, input): Promise<Result<BuildArtifact, BuildError>> {
      if (!input) {
        return err({
          code: 'BUILD_ERROR',
          message: 'Minify step requires input artifact',
        })
      }

      return ok({
        ...input,
        size: Math.floor(input.size * 0.7),
        hash: 'min_' + input.hash,
      })
    },
  }
}

/** Transforms configuration using pipe */
export const normalizeConfig = pipe(
  (config: BuildConfig) => ({...config, entry: config.entry.replace(/\\/g, '/')}),
  (config: BuildConfig) => ({...config, output: config.output.replace(/\\/g, '/')}),
)

/** Transforms configuration using compose (right-to-left) */
export const enhanceConfig = compose(
  (config: BuildConfig) => ({...config, sourcemap: true}),
  (config: BuildConfig) => ({...config, minify: true}),
)
