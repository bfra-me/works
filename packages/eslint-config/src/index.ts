import {defineConfig} from './define-config'

export * from './compose-config'
export * from './config.d'
export * from './configs'
export * from './define-config'
export * from './env'
export * from './globs'
export * from './options'
export * from './rules.d'

export {defineConfig}
export const config = defineConfig()
export default config
