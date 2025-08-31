/**
 * Zod schemas for semantic-release plugin configurations.
 */

import {z} from 'zod'

/**
 * Schema for @semantic-release/commit-analyzer configuration.
 */
export const commitAnalyzerConfigSchema = z.object({
  preset: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  parserOpts: z.record(z.string(), z.unknown()).optional(),
  releaseRules: z
    .array(
      z.object({
        type: z.string().optional(),
        scope: z.string().optional(),
        subject: z.string().optional(),
        release: z
          .union([z.literal('major'), z.literal('minor'), z.literal('patch'), z.literal(false)])
          .optional(),
        breaking: z.boolean().optional(),
        revert: z.boolean().optional(),
      }),
    )
    .optional(),
  presetConfig: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Schema for @semantic-release/release-notes-generator configuration.
 */
export const releaseNotesGeneratorConfigSchema = z.object({
  preset: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  parserOpts: z.record(z.string(), z.unknown()).optional(),
  writerOpts: z
    .object({
      groupBy: z.string().optional(),
      commitGroupsSort: z.union([z.string(), z.unknown()]).optional(),
      commitsSort: z.union([z.string(), z.unknown()]).optional(),
      noteGroupsSort: z.union([z.string(), z.unknown()]).optional(),
      notesSort: z.union([z.string(), z.unknown()]).optional(),
      generateOn: z.union([z.string(), z.unknown()]).optional(),
      finalizeContext: z.unknown().optional(),
      debug: z.unknown().optional(),
      reverse: z.boolean().optional(),
      includeDetails: z.boolean().optional(),
      ignoreReverted: z.boolean().optional(),
      doFlush: z.boolean().optional(),
      mainTemplate: z.string().optional(),
      headerPartial: z.string().optional(),
      commitPartial: z.string().optional(),
      footerPartial: z.string().optional(),
      partials: z.record(z.string(), z.string()).optional(),
      transform: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  presetConfig: z.record(z.string(), z.unknown()).optional(),
  linkCompare: z.boolean().optional(),
  linkReferences: z.boolean().optional(),
  host: z.string().optional(),
  owner: z.string().optional(),
  repository: z.string().optional(),
  repoUrl: z.string().optional(),
  commit: z.string().optional(),
  issue: z.string().optional(),
  userUrlFormat: z.string().optional(),
})

/**
 * Schema for @semantic-release/changelog configuration.
 */
export const changelogConfigSchema = z.object({
  changelogFile: z.string().optional(),
  changelogTitle: z.string().optional(),
})

/**
 * Schema for @semantic-release/npm configuration.
 */
export const npmConfigSchema = z.object({
  npmPublish: z.boolean().optional(),
  pkgRoot: z.string().optional(),
  tarballDir: z.string().optional(),
})

/**
 * Schema for @semantic-release/github configuration.
 */
export const githubConfigSchema = z.object({
  githubUrl: z.string().optional(),
  githubApiPathPrefix: z.string().optional(),
  proxy: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  assets: z
    .array(
      z.union([
        z.string(),
        z.object({
          path: z.string(),
          name: z.string().optional(),
          label: z.string().optional(),
        }),
      ]),
    )
    .optional(),
  successComment: z.union([z.string(), z.literal(false)]).optional(),
  failTitle: z.string().optional(),
  failComment: z.union([z.string(), z.literal(false)]).optional(),
  labels: z.union([z.array(z.string()), z.literal(false)]).optional(),
  assignees: z.array(z.string()).optional(),
  releasedLabels: z.union([z.array(z.string()), z.literal(false)]).optional(),
  addReleases: z.union([z.literal('bottom'), z.literal('top'), z.literal(false)]).optional(),
  draftRelease: z.boolean().optional(),
  releaseBodyTemplate: z.string().optional(),
  releaseNameTemplate: z.string().optional(),
  discussionCategoryName: z.string().optional(),
})

/**
 * Schema for @semantic-release/git configuration.
 */
export const gitConfigSchema = z.object({
  assets: z.array(z.string()).optional(),
  message: z.string().optional(),
})
