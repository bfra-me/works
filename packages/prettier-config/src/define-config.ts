import type {Config} from 'prettier'

const properties = ['overrides']

const freeze = <C extends Config>(config: C): Readonly<C> => {
  for (const property of properties) {
    const value = config[property]
    if (typeof value !== 'object' || value === null) {
      continue
    }

    Object.freeze(value)

    if (property === 'overrides') {
      const overrides = value as NonNullable<Config['overrides']>
      for (const override of overrides) {
        const {files, excludeFiles = null, options} = override

        Object.freeze(files)
        if (excludeFiles != null) {
          Object.freeze(excludeFiles)
        }
        if (options) {
          Object.freeze(options)
        }
      }
    }
  }

  return Object.freeze(config)
}

export const defineConfig = <C extends Config>(config: C): C => freeze(config) as C
