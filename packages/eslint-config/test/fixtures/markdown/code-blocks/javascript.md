# JavaScript Code Block Test

This file demonstrates JavaScript code blocks for testing code extraction and linting.

## ES Module Imports

```javascript
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
```

## Async/Await Function

```javascript
async function loadConfig(configPath) {
  try {
    const content = await readFile(configPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to load config:', error)
    return null
  }
}
```

## Arrow Functions

```javascript
const multiply = (a, b) => a * b

const processArray = (items) =>
  items
    .filter((item) => item.active)
    .map((item) => item.value)
    .reduce((sum, value) => sum + value, 0)
```

## Object Destructuring

```javascript
function processUser({id, name, email, ...rest}) {
  console.log(`Processing user ${name} (${id})`)
  return {
    id,
    displayName: name,
    contact: email,
    metadata: rest,
  }
}
```

## Promise Chain

```javascript
function fetchAndProcess(url) {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => data.items)
    .then((items) => items.filter((item) => item.status === 'active'))
    .catch((error) => {
      console.error('Error:', error)
      return []
    })
}
```

## Class Definition

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event).add(handler)
  }

  emit(event, data) {
    const handlers = this.events.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(data)
      }
    }
  }

  off(event, handler) {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }
}
```

## Template Literals

```javascript
const createMessage = (name, action) => `User ${name} performed ${action} at ${new Date().toISOString()}`

const htmlTemplate = `
  <div class="user-card">
    <h2>${name}</h2>
    <p>${email}</p>
  </div>
`
```
