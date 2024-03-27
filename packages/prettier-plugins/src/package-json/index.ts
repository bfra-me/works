import type {Parser, ParserOptions} from 'prettier'
import {parsers as babelParsers} from 'prettier/plugins/babel'
import {format, type Options as PrettierPackageJsonOptions} from 'prettier-package-json'

const jsonStringifyParser = babelParsers['json-stringify']

export const parsers = {
  'json-stringify': {
    ...jsonStringifyParser,

    preprocess(text: string, options: ParserOptions) {
      if (jsonStringifyParser.preprocess) {
        text = jsonStringifyParser.preprocess(text, options)
      }
      if (/package.*json$/u.test(options.filepath)) {
        text = format(JSON.parse(text), {
          tabWidth: options.tabWidth,
          useTabs: options.useTabs === true,
          ...((options['prettier-package-json'] ?? {}) as Partial<PrettierPackageJsonOptions>),
        })
      }
      return text
    },
  },
} satisfies Record<string, Parser>
