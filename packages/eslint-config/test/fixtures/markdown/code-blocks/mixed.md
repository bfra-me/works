# Mixed Language Code Blocks Test

This file demonstrates multiple language code blocks in a single Markdown file.

## TypeScript Configuration

```typescript
interface Config {
  name: string
  version: string
  debug: boolean
}

const config: Config = {
  name: 'my-app',
  version: '1.0.0',
  debug: false,
}
```

## JavaScript Implementation

```javascript
async function loadData(url) {
  const response = await fetch(url)
  return await response.json()
}

export {loadData}
```

## JSON Data

```json
{
  "name": "example-package",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

## YAML Configuration

```yaml
name: CI Pipeline
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
```

## Shell Script

```bash
#!/bin/bash

set -e

echo "Building project..."
npm run build

echo "Running tests..."
npm test

echo "Build complete!"
```

## CSS Styles

```css
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}
```

## SQL Query

```sql
SELECT
  users.id,
  users.name,
  users.email,
  COUNT(orders.id) AS order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.active = true
GROUP BY users.id, users.name, users.email
HAVING COUNT(orders.id) > 0
ORDER BY order_count DESC
LIMIT 10;
```
