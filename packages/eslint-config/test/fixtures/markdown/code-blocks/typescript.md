# TypeScript Code Block Test

This file demonstrates TypeScript code blocks for testing code extraction and linting.

## Interface Definition

```typescript
interface User {
  id: number
  name: string
  email: string
  isActive: boolean
  createdAt: Date
}
```

## Type Aliases

```typescript
type UserId = number
type UserRole = 'admin' | 'user' | 'guest'
type Optional<T> = T | undefined
```

## Function with Type Annotations

```typescript
function createUser(name: string, email: string): User {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    isActive: true,
    createdAt: new Date(),
  }
}
```

## Generic Function

```typescript
function arrayToMap<T extends {id: number}>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]))
}
```

## Class with Type Parameters

```typescript
class DataStore<T> {
  private data: Map<string, T> = new Map()

  set(key: string, value: T): void {
    this.data.set(key, value)
  }

  get(key: string): T | undefined {
    return this.data.get(key)
  }

  has(key: string): boolean {
    return this.data.has(key)
  }
}
```

## Async/Await with Types

```typescript
async function fetchUser(userId: number): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) {
      return null
    }
    return await response.json() as User
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}
```
