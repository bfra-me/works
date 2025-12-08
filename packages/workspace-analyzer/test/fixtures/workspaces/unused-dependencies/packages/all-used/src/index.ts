import {debounce, throttle} from 'lodash'
import {format, parseISO} from 'date-fns'

export const debouncedFn = debounce(() => console.log('debounced'), 100)
export const throttledFn = throttle(() => console.log('throttled'), 100)

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'yyyy-MM-dd')
}
