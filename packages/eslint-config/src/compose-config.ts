import type {AwaitableFlatConfig, Config, ConfigComposer, ConfigNames} from './config'
import {composer} from 'eslint-flat-config-utils'

/**
 * Composes an ESLint configuration object from the provided flat configurations.
 *
 * @param configs - The configuration names to compose.
 * @returns The composed ESLint configuration object.
 */
// @ts-expect-error - TypeScript insists that the return type should be `Promise<T>`, but it's aa type which acts like a `Promise<T>`.
export const composeConfig = async (...configs: AwaitableFlatConfig[]): ConfigComposer =>
  composer<Config, ConfigNames>(...configs)
