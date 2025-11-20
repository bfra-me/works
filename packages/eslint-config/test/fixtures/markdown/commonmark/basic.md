# CommonMark Basic Test Fixture

This file demonstrates standard CommonMark features for testing Markdown linting.

## Level 2 Heading

### Level 3 Heading

This is a paragraph with **bold text** and *italic text* and `inline code`.

## Lists

Unordered list:

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

Ordered list:

1. First numbered item
2. Second numbered item
   1. Nested numbered item
   2. Another nested numbered item
3. Third numbered item

## Links and References

This is a [link to example.com](https://example.com) and this is a reference-style link to [Google][google-link].

[google-link]: https://google.com "Google Homepage"

## Code Block

```
Plain code block without language specification
const example = 'no language'
```

## Blockquote

> This is a blockquote with multiple lines.
> It can span several lines and maintain formatting.
>
> > Nested blockquote

## Emphasis

Text can be *emphasized* or **strongly emphasized** or even ***both***.

## Horizontal Rule

---

## Images

![Alt text for image](https://example.com/image.png)

## Inline HTML

This paragraph contains <span>inline HTML</span> elements.
