import type {AwaitableFlatConfig, Config, ConfigComposer, ConfigNames} from './config'
import {composer} from 'eslint-flat-config-utils'

/**
 * Composes an ESLint configuration object from the provided flat configurations.
 *
 * @param configs - The configuration names to compose.
 * @returns The composed ESLint configuration object.
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async
export const composeConfig = (...configs: AwaitableFlatConfig[]): ConfigComposer =>
  composer<Config, ConfigNames>(...configs)
