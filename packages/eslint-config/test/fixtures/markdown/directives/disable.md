# ESLint Disable Directive Test

This file demonstrates ESLint directive handling in Markdown HTML comments.

## Disable Specific Rule

<!-- eslint-disable markdown/no-html -->

This paragraph contains <span class="highlight">HTML elements</span> that would normally trigger warnings.

<div class="custom-block">
  <p>Custom HTML block</p>
</div>

<!-- eslint-enable markdown/no-html -->

## Disable Multiple Rules

<!-- eslint-disable markdown/no-html, markdown/no-inline-html -->

More <strong>HTML</strong> content with <em>inline elements</em>.

<!-- eslint-enable markdown/no-html, markdown/no-inline-html -->

## Disable All Rules for Block

<!-- eslint-disable -->

This section has all rules disabled.

<script>
  console.log('Inline script')
</script>

Raw HTML: <div onclick="alert('test')">Click me</div>

<!-- eslint-enable -->

## Line-Specific Disable

<!-- eslint-disable-next-line markdown/no-html -->
<table>
  <tr><td>HTML table</td></tr>
</table>

## Code Block with Disable Comments

```javascript
// This code block should still be linted normally
function example() {
  const unused = 'variable' // This might trigger unused-vars
  console.log('Hello')
}
```

## Disable for Entire File

<!-- eslint-disable markdown/heading-increment -->

# Level 1

### Level 3 (skipping Level 2 - normally an error)

##### Level 5 (skipping Level 4 - normally an error)

<!-- eslint-enable markdown/heading-increment -->
