import type {Config} from '../config'
import {interopDefault} from '../utils'

export async function jsonSchema(name: string, files: string[]): Promise<Config[]> {
  const pluginJsonSchemaValidator = await interopDefault(
    import('eslint-plugin-json-schema-validator'),
  )

  return [
    ...pluginJsonSchemaValidator.configs['flat/base']
      .map((config: Config) => {
        if (config.files == null) {
          return {...config, files}
        }
        if (config.files.flat().some(file => files.some(suffix => file.endsWith(suffix)))) {
          return config
        }
        return {}
      })
      .filter(o => Object.keys(o).length > 0)
      .map((config: Config, index) => ({
        ...config,
        name: config.plugins
          ? `@bfra.me/${name}/json-schema/plugins`
          : `@bfra.me/${name}/json-schema/${(config.name ?? '') || `unnamed${index}`}`,
      })),
    {
      name: `@bfra.me/${name}/json-schema`,
      files,
      rules: {
        'json-schema-validator/no-invalid': 'off',
      },
    },
  ]
}
