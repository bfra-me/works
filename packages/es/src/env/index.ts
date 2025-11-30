/**
 * @bfra.me/es/env - Environment detection utilities
 */

export {isInCI} from './ci'
export {isInEditorEnv} from './editor'
export {isInGitLifecycle} from './git'
export {getEnvironment, isBrowser, isDeno, isNode} from './runtime'
