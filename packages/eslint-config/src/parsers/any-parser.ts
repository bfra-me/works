import type {Linter} from 'eslint'
import {fileURLToPath} from 'node:url'
import {version} from '../../package.json'

const lineBreakPattern = /\r\n|[\n\r\u2028\u2029]/u

export const meta = {
  name: fileURLToPath(import.meta.url),
  version,
}
export function parseForESLint(text: string): Linter.ESLintParseResult {
  const lines = text.split(lineBreakPattern)
  return {
    ast: {
      body: [],
      comments: [],
      loc: {
        end: {
          column: lines.at(-1)?.length ?? 0,
          line: lines.length,
        },
        start: {
          column: 0,
          line: 1,
        },
      },
      range: [0, text.length],
      sourceType: 'module',
      tokens: [],
      type: 'Program',
    },
  }
}

export const anyParser = {meta, parseForESLint}
