import {fileURLToPath} from 'node:url'
import {version} from '../../package.json'

export const plainParser = {
  meta: {
    name: fileURLToPath(import.meta.url),
    version,
  },
  parseForESLint: (code: string) => ({
    ast: {
      body: [],
      comments: [],
      loc: {end: code.length, start: 0},
      range: [0, code.length],
      tokens: [],
      type: 'Program',
    },
    scopeManager: null,
    services: {isPlain: true},
    visitorKeys: {
      Program: [],
    },
  }),
}
