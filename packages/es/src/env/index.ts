/**
 * @bfra.me/es/env - Environment detection utilities
 */

export {isInCI} from './ci'
export {isInEditorEnv} from './editor'
export {isInGitLifecycle} from './git'
export {hasNonEmptyEnv} from './helpers'
export {getEnvironment, isBrowser, isDeno, isNode} from './runtime'
export type {EnvironmentInfo} from './runtime'
