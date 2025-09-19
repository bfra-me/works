import type {Linter} from 'eslint'

// Make sure they are compatible

import type {Config} from '../src'
;

((): Linter.Config => ({}) as Config)()
;((): Config => ({}) as Linter.Config)()
