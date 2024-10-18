import {composer} from 'eslint-flat-config-utils'
import type {FlatConfigComposer} from './types'

type InferConfig<T> = T extends FlatConfigComposer<infer U> ? U : never
type InferConfigNames<T> = T extends FlatConfigComposer<any, infer U> ? U : never

/**
 * Composes an ESLint configuration object from the provided flat configurations.
 *
 * @param configs - The configuration names to compose.
 * @returns The composed ESLint configuration object.
 */
export const composeConfig = composer<
  InferConfig<FlatConfigComposer>,
  InferConfigNames<FlatConfigComposer>
>
