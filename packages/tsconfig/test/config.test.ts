import assert from 'node:assert'
import path from 'node:path'
import {describe, it} from 'node:test'
import ts from 'typescript'

const {sys, findConfigFile, readConfigFile, parseJsonConfigFileContent} = ts

describe('config', () => {
  it('contains valid configuration', async () => {
    const tsconfigPath = findConfigFile(process.cwd(), sys.fileExists)
    if (!tsconfigPath) {
      throw new Error('No tsconfig.json file found')
    }
    const {config: tsconfig, error} = readConfigFile(tsconfigPath, sys.readFile)
    assert(error === undefined, `Error reading tsconfig.json: ${error?.messageText}`)

    const parsed = parseJsonConfigFileContent(tsconfig, sys, path.dirname(tsconfigPath))
    assert(
      parsed.errors.length === 0,
      `Error parsing tsconfig.json: ${parsed.errors.map(e => e.messageText).join(', ')}`,
    )

    assert(parsed.options.target === ts.ScriptTarget.ES2022, 'target must be ES2022')
  })
})
