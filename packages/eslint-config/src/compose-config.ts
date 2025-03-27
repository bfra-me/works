import type {Config, ConfigNames, FlatConfigComposer, ResolvableFlatConfig} from './config'
import {composer} from 'eslint-flat-config-utils'

/**
 * Composes an ESLint configuration object from the provided flat configurations.
 *
 * @param configs - The configuration names to compose.
 * @returns The composed ESLint configuration object.
 */
export const composeConfig = <C extends Config = Config, CN extends ConfigNames = ConfigNames>(
  ...configs: ResolvableFlatConfig<Config extends C ? C : Config>[]
  // eslint-disable-next-line @typescript-eslint/promise-function-async
): FlatConfigComposer<Config extends C ? C : Config, CN> => composer(...configs)
