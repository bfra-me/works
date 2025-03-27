import {defaultConfig} from './default.js'
import {defineConfig} from './define-config.js'

export const semi = defineConfig({
  ...defaultConfig,
  semi: true,
})

export default semi
