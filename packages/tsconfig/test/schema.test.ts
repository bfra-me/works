import type {Jsonify, TsConfigJson} from 'type-fest'
import assert from 'node:assert'
import {promises as fs} from 'node:fs'
import Ajv, {type JSONSchemaType} from 'ajv-draft-04'
import {describe, it} from 'vitest'

const SCHEMA_URL = 'https://json.schemastore.org/tsconfig'

describe('schema', () => {
  it('validates against tsconfig.json schema', async t => {
    const tsconfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf8')) as Jsonify<
      TsConfigJson & {['$schema']?: string}
    >
    const schemaUrl = tsconfig.$schema ?? SCHEMA_URL
    const response = await fetch(schemaUrl)
    if (!response.ok) {
      return t.skip()
    }
    const schema = (await response.json()) as JSONSchemaType<TsConfigJson>
    const ajv = new Ajv({
      strict: false,
      keywords: ['allowTrailingCommas', 'markdownDescription', 'markdownEnumDescriptions'],
    })
    const validate = ajv.compile(schema)

    assert(validate(tsconfig), 'tsconfig.json does not validate against the schema')
  })
})
