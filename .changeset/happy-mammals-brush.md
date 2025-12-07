---
"@bfra.me/doc-sync": patch
---

Fix MDX validation false positives for TypeScript generics in documentation

Fixed an issue where TypeScript generic syntax (e.g., `Result<T, E>`) in README content was incorrectly flagged as unclosed JSX tags during MDX validation. The validator now:

- Extracts and filters inline code spans (backtick-wrapped text) in addition to fenced code blocks
- Filters out single-letter tag names (T, E, K, V, etc.) that are common TypeScript generic type parameters
- Correctly validates documentation containing type signatures without false positives

This fix enables successful synchronization of packages with TypeScript generic types in their documentation, such as `@bfra.me/create`.
