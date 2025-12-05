# @fixtures/sample-lib

A sample library package for testing documentation synchronization.

## Installation

```bash
pnpm add @fixtures/sample-lib
```

## Usage

Import and use the math utilities:

```typescript
import { add, subtract, multiply, Calculator } from '@fixtures/sample-lib'

// Basic operations
const sum = add(1, 2)       // 3
const diff = subtract(5, 3)  // 2
const product = multiply(4, 5) // 20

// Using the Calculator class
const calc = new Calculator(10)
calc.add(5).add(3)
console.log(calc.getValue()) // 18
```

## Features

- Simple math operations
- Type-safe Result type
- Calculator class for chaining operations
- Comprehensive TypeScript support

## API

See the API reference section below for detailed documentation.

## License

MIT
