# <%= it.name %>

<%= it.description %>

## Installation

```bash
npm install <%= it.name %>
```

## Usage

```typescript
import { greet, add } from '<%= it.name %>'

// Basic greeting
const message = greet('World')
console.log(message) // "Hello, World!"

// Simple math
const result = add(2, 3)
console.log(result) // 5
```

## API Reference

### `greet(name: string): string`

Returns a greeting message for the given name.

**Parameters:**

- `name` - The name to greet

**Returns:**

- A greeting message string

### `add(a: number, b: number): number`

Adds two numbers together.

**Parameters:**

- `a` - First number
- `b` - Second number

**Returns:**

- The sum of a and b

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

## License

MIT
