/**
 * @module
 * This module provides a preset generator for creating GitHub Actions workflow status badges.
 * It generates dynamic badges that display the current status of a GitHub Actions workflow.
 */

import type {BadgeColor, BadgeStyle} from '../types'

/**
 * Configuration options for creating a GitHub Actions status badge.
 */
export interface GitHubActionsOptions {
  /**
   * The repository in "owner/repo" format.
   * @example 'bfra-me/works'
   */
  repository: string
  /**
   * The workflow file name or workflow name.
   * Can be a filename (e.g., 'ci.yaml') or a workflow name (e.g., 'Build and Test').
   * @example 'ci.yaml'
   * @example 'Build and Test'
   */
  workflow: string
  /**
   * The branch to show status for. If omitted, shows status for the default branch.
   * @example 'main'
   */
  branch?: string
  /**
   * The event type to filter by (e.g., 'push', 'pull_request').
   */
  event?: string
  /**
   * The text for the left side of the badge (custom label override).
   */
  label?: string
  /** The visual style of the badge. */
  style?: BadgeStyle
  /** A logo to embed in the badge. @default 'githubactions' */
  logo?: string
  /** The color of the embedded logo. */
  logoColor?: BadgeColor
  /** The number of seconds to cache the badge URL. */
  cacheSeconds?: number
}

/**
 * Result of a GitHub Actions badge generation.
 */
export interface GitHubActionsResult {
  /** The complete shields.io URL for the GitHub Actions badge. */
  url: string
}

/**
 * Generates a GitHub Actions workflow status badge URL.
 *
 * This creates a dynamic badge that queries GitHub Actions for the current
 * workflow status. The badge color is determined automatically based on
 * the workflow's latest run status (green for success, red for failure, etc.).
 *
 * @param options - The GitHub Actions badge configuration.
 * @returns An object containing the generated badge URL.
 *
 * @example
 * ```typescript
 * import { githubActions } from '@bfra.me/badge-config';
 *
 * // Generate a badge for a workflow file
 * const result = githubActions({
 *   repository: 'bfra-me/works',
 *   workflow: 'ci.yaml'
 * });
 * console.log(result.url);
 * // => https://img.shields.io/github/actions/workflow/status/bfra-me/works/ci.yaml?logo=githubactions
 *
 * // Generate a badge for a specific branch with custom label
 * const mainBadge = githubActions({
 *   repository: 'bfra-me/works',
 *   workflow: 'Build and Test',
 *   branch: 'main',
 *   label: 'build'
 * });
 * ```
 */
export function githubActions(options: GitHubActionsOptions): GitHubActionsResult {
  const {
    repository,
    workflow,
    branch,
    event,
    label,
    style,
    logo = 'githubactions',
    logoColor,
    cacheSeconds,
  } = options

  const encodedWorkflow = encodeURIComponent(workflow)

  // Shields.io endpoint format: /github/actions/workflow/status/:user/:repo/:workflow
  const baseUrl = `https://img.shields.io/github/actions/workflow/status/${repository}/${encodedWorkflow}`

  const searchParams = new URLSearchParams()

  if (branch !== undefined && branch !== '') {
    searchParams.set('branch', branch)
  }

  if (event !== undefined && event !== '') {
    searchParams.set('event', event)
  }

  if (label !== undefined && label !== '') {
    searchParams.set('label', label)
  }

  if (style !== undefined) {
    searchParams.set('style', style)
  }

  if (logo !== undefined && logo !== '') {
    searchParams.set('logo', logo)
  }

  if (logoColor !== undefined) {
    searchParams.set('logoColor', logoColor)
  }

  if (cacheSeconds !== undefined) {
    searchParams.set('cacheSeconds', cacheSeconds.toString())
  }

  const queryString = searchParams.toString()
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

  return {url}
}
