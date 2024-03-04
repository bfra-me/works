import assert from 'node:assert'
import {promises as fs} from 'node:fs'
import {test} from 'node:test'
import Ajv, {type JSONSchemaType} from 'ajv-draft-04'
import type {TsConfigJson} from 'type-fest'

test('validates against tsconfig.json schema', async () => {
  const tsconfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf8'))
  const schema = (await (
    await fetch('https://json.schemastore.org/tsconfig')
  ).json()) as JSONSchemaType<TsConfigJson>
  const ajv = new Ajv({
    strict: false,
    keywords: ['allowTrailingCommas', 'markdownDescription', 'markdownEnumDescriptions'],
  })
  const validate = ajv.compile(schema)

  assert(validate(tsconfig), 'tsconfig.json does not validate against the schema')
})
