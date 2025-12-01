/**
 * Web components package for synthetic monorepo.
 * Demonstrates browser-targeted Result type usage.
 */

import type {Result} from '@bfra.me/es/result'
import {err, ok} from '@bfra.me/es/result'
import {debounce} from '@bfra.me/es/async'

/** Component render error */
export interface RenderError {
  code: 'RENDER_FAILED' | 'INVALID_PROPS' | 'MOUNT_FAILED'
  message: string
  componentName: string
}

/** Component props validation result */
export type PropsValidationResult<T> = Result<T, RenderError>

/** Base component props */
export interface BaseProps {
  id?: string
  className?: string
  style?: Record<string, string>
}

/** Creates a validated props object */
export function validateProps<T extends BaseProps>(
  componentName: string,
  props: Partial<T>,
  requiredKeys: (keyof T)[],
): PropsValidationResult<T> {
  const missingKeys = requiredKeys.filter(key => props[key] === undefined)

  if (missingKeys.length > 0) {
    return err({
      code: 'INVALID_PROPS',
      message: `Missing required props: ${missingKeys.join(', ')}`,
      componentName,
    })
  }

  return ok(props as T)
}

/** Button component props */
export interface ButtonProps extends BaseProps {
  label: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

/** Creates a button element with validated props */
export function createButton(props: ButtonProps): Result<HTMLButtonElement, RenderError> {
  const validationResult = validateProps<ButtonProps>('Button', props, ['label'])

  if (!validationResult.success) {
    return validationResult
  }

  const button = document.createElement('button')
  button.textContent = props.label
  button.disabled = props.disabled ?? false

  if (props.id) button.id = props.id
  if (props.className) button.className = props.className
  if (props.variant) button.dataset.variant = props.variant

  if (props.onClick) {
    button.addEventListener('click', props.onClick)
  }

  return ok(button)
}

/** Input component props */
export interface InputProps extends BaseProps {
  name: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  debounceMs?: number
}

/** Creates an input element with validated props and optional debouncing */
export function createInput(props: InputProps): Result<HTMLInputElement, RenderError> {
  const validationResult = validateProps<InputProps>('Input', props, ['name'])

  if (!validationResult.success) {
    return validationResult
  }

  const input = document.createElement('input')
  input.name = props.name
  input.type = props.type ?? 'text'

  if (props.id) input.id = props.id
  if (props.className) input.className = props.className
  if (props.placeholder) input.placeholder = props.placeholder
  if (props.value) input.value = props.value

  if (props.onChange) {
    const handler = props.debounceMs
      ? debounce((e: Event) => {
          props.onChange?.((e.target as HTMLInputElement).value)
        }, props.debounceMs)
      : (e: Event) => {
          props.onChange?.((e.target as HTMLInputElement).value)
        }

    input.addEventListener('input', handler)
  }

  return ok(input)
}
