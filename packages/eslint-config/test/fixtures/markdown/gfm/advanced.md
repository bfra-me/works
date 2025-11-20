# GitHub Flavored Markdown Test Fixture

This file demonstrates GFM-specific features for testing Markdown linting.

## Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

Table with alignment:

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left         | Center         | Right         |
| Data         | Data           | Data          |

## Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
  - [ ] Nested incomplete task
  - [x] Nested completed task

## Strikethrough

This text has ~~strikethrough~~ formatting.

## Autolinks

Visit https://github.com for more information.

Email: user@example.com

## Footnotes

Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Syntax Highlighting

```javascript
const greeting = 'Hello, GFM!'
console.log(greeting)
```

## Emoji (if supported)

:smile: :rocket: :heart:

## Mentions and References

@username #123 GH-456

## Automatic URL Linking

www.example.com automatically becomes a link in GFM.
