// tsup DTS workaround: tsup v8.5.1 hardcodes `baseUrl` in its rollup DTS plugin,
// triggering a deprecation error in TypeScript 6+. Remove when tsup fixes this.
// See: https://github.com/egoist/tsup/blob/main/src/rollup.ts

import type {Options} from 'tsup'

type DtsConfig = Exclude<Exclude<Options['dts'], undefined>, boolean | string>

export const dts: DtsConfig = {
  compilerOptions: {
    ignoreDeprecations: '6.0',
    types: ['node'],
  },
}
