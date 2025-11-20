---
title: Malformed YAML
description: This has a syntax error
items:
  - unclosed string: "this is broken
  - another: value
bad_yaml: {unclosed: bracket
---

# Malformed Frontmatter Test

This file contains intentionally malformed YAML frontmatter to test error handling.
