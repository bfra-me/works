import {debounce} from 'lodash'

export const debouncedFn = debounce(() => {
  console.log('debounced')
}, 100)

export function greet(name: string): string {
  return `Hello, ${name}!`
}
