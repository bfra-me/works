+++
title = "TOML Frontmatter Test"
description = "Testing TOML frontmatter parsing in Markdown files"
author = "Test Author"
date = 2025-11-20
tags = ["markdown", "toml", "testing"]
published = true
version = "1.0.0"

[metadata]
category = "documentation"
status = "active"
priority = 1

[build]
environment = "production"
optimize = true
+++

# TOML Frontmatter Test Document

This document contains TOML frontmatter at the top, which should be parsed correctly by the Markdown linter.

## Content Section

The frontmatter above uses TOML format, which includes:
- String values
- Boolean values
- Array values
- Table (nested object) values
- Date values

## Usage

TOML frontmatter is commonly used in:
- Hugo static site generator
- Rust documentation
- Configuration-heavy documentation systems
