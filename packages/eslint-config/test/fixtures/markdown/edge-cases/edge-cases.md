# Edge Cases Test

This file contains various edge cases for Markdown parsing and linting.

## Empty Code Blocks

```typescript
```

```javascript
```

```
```

## Code Block Without Closing Fence

This should still parse correctly even though the code block below is unusual.

## Malformed Frontmatter

This file intentionally has no frontmatter, but tests that parsers don't break.

## Multiple Consecutive Code Blocks

```typescript
const a = 1
```
```typescript
const b = 2
```
```typescript
const c = 3
```

## Code Block with Only Whitespace

```javascript
   
   
```

## Extremely Long Line

This is a very long line of text that exceeds typical line length limits and should be tested to ensure the parser and linter can handle it without issues: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Unicode Characters

Code with emoji: 🚀 ✨ 🎉

```javascript
const message = '你好世界' // Hello World in Chinese
const emoji = '🚀'
```

## Special Characters in Code

```typescript
const regex = /[a-z]{2,5}/gi
const template = `Hello ${name}`
const escaped = "String with \"quotes\" inside"
```

## Unclosed Tags in HTML (in Markdown context)

This tests HTML parsing: <div>

## Mixed Line Endings

This file should handle mixed line endings gracefully (though Git normalizes them).

## Empty Headings

##

###

## Lists with No Content

-
-
-

1.
2.
3.

## Blockquote with No Content

>
>
>

## Link with Empty URL

[Empty link]()

## Image with Empty URL

![Empty image]()

## Table with Empty Cells

| Header 1 | Header 2 |
|----------|----------|
|          |          |
|          |          |

## Code Block with Invalid Language

```unknownlanguage
some code here
```

## Nested Emphasis

***Bold and italic*** and **bold with *italic* inside** and *italic with **bold** inside*.

## Multiple Spaces

This    has    multiple    spaces    between    words.
