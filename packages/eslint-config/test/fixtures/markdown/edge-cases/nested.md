# Nested Code Blocks Test

This file demonstrates code blocks inside blockquotes and other nested structures.

## Code Block in Blockquote

> Example usage:
>
> ```typescript
> function greet(name: string): string {
>   return `Hello, ${name}!`
> }
> ```
>
> The function above returns a greeting message.

## Nested Blockquote with Code

> Primary quote
>
> > Nested quote with code example:
> >
> > ```javascript
> > const result = multiply(5, 10)
> > console.log(result)
> > ```

## List with Code Blocks

1. First step - Install dependencies:

   ```bash
   npm install
   ```

2. Second step - Run the application:

   ```bash
   npm start
   ```

3. Third step - Verify the configuration:

   ```javascript
   const config = require('./config.js')
   console.log(config.isValid())
   ```

## Table with Code References

| Language   | Example                      |
|------------|------------------------------|
| JavaScript | `const x = 10`               |
| TypeScript | `const x: number = 10`       |
| Python     | `x = 10`                     |

## Definition List with Code

Term 1
: Definition with code example:

  ```typescript
  type Definition = string
  ```

Term 2
: Another definition with code:

  ```javascript
  const term = 'example'
  ```
