import {SupportLanguage} from 'prettier'

declare module 'prettier/plugins/estree' {
  export const languages: SupportLanguage[]
}
