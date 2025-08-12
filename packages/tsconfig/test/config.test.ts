import assert from 'node:assert'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'
import {describe, it} from 'vitest'

const {sys, findConfigFile, readConfigFile, parseJsonConfigFileContent} = ts

const ExpectedScriptTarget = ts.ScriptTarget.ES2022

describe('config', () => {
  it('contains valid configuration', async () => {
    const tsconfigPath = findConfigFile(process.cwd(), fileName => sys.fileExists(fileName)) ?? ''
    if (!tsconfigPath) {
      throw new Error('No tsconfig.json file found')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const {config: tsconfig, error} = readConfigFile(tsconfigPath, path => sys.readFile(path))
    assert(
      error === undefined,
      `Error reading tsconfig.json${error ? `: ${error.toString()}` : ''}`,
    )

    const parsed = parseJsonConfigFileContent(tsconfig, sys, path.dirname(tsconfigPath))
    assert(
      parsed.errors.length === 0,
      `Error parsing tsconfig.json: ${parsed.errors.map(e => e.messageText).join(', ')}`,
    )

    assert(parsed.options.target === ExpectedScriptTarget, 'target must match expected value')
  })
})
