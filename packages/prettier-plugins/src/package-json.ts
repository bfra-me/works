import type {Parser, SupportOption} from 'prettier'
import prettier from 'prettier'
import {parsers as babelParsers} from 'prettier/plugins/babel'
import {sortPackageJson} from 'sort-package-json'

type SortPackageJsonOptions = NonNullable<Parameters<typeof sortPackageJson>[1]>

interface PluginOptions {
  /** Custom ordering array or comparator function. */
  sortPackageJsonSortOrder: SortPackageJsonOptions['sortOrder']
}

declare module 'prettier' {
  interface RequiredOptions extends PluginOptions {}
}

export const options: Record<keyof PluginOptions, SupportOption> = {
  sortPackageJsonSortOrder: {
    category: 'Format',
    type: 'string',
    description: 'Custom ordering array.',
    default: [{value: []}],
    array: true,
  },
}

const parser = babelParsers['json-stringify']

export const parsers: Record<string, Parser> = {
  'json-stringify': {
    ...parser,

    async parse(text, options) {
      const {filepath} = options
      if (/package.*json$/u.test(filepath)) {
        // Format the text with prettier to avoid any parsing errors
        text = await prettier.format(text, {filepath})

        if (parser.preprocess) {
          text = parser.preprocess(text, options)
        }

        const sortOrder = options?.sortPackageJsonSortOrder
        text = sortPackageJson(
          text,
          (sortOrder && sortOrder.length > 0 ? {sortOrder} : {}) as SortPackageJsonOptions,
        )
      }

      return parser.parse(text, options)
    },
  },
}
