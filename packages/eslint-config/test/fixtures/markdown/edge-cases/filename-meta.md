# Filename Meta Test

This file demonstrates code blocks with filename metadata for virtual file naming.

## TypeScript File with Filename

```typescript filename="src/utils/math.ts"
export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}
```

## JavaScript File with Filename

```javascript filename="src/config/index.js"
export const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
}

export function getConfig() {
  return config
}
```

## Configuration File with Filename

```json filename="package.json"
{
  "name": "example-package",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./lib/index.js"
  }
}
```

## Multiple Files with Filenames

```typescript filename="src/types.ts"
export interface User {
  id: number
  name: string
  email: string
}
```

```typescript filename="src/services/user.ts"
import type {User} from '../types.js'

export async function getUser(id: number): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    return null
  }
  return await response.json() as User
}
```

## React Component with Filename

```tsx filename="src/components/Button.tsx"
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({label, onClick, disabled = false}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```
