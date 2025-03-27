import {defaultConfig} from './default.js'
import {defineConfig} from './define-config.js'

export const $80ProofConfig = defineConfig({
  ...defaultConfig,
  printWidth: 80,
})

export default $80ProofConfig
