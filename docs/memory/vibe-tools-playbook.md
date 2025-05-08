# Vibe-Tools Playbook

## Introduction

Welcome to the Vibe-Tools Playbook! This document serves as a comprehensive guide to using the vibe-tools CLI, a powerful command-line interface tool designed to enhance your development experience with the Cursor IDE through AI-powered assistance.

The vibe-tools package (formerly known as cursor-tools) provides access to multiple AI models and specialized tools, helping you with tasks like analyzing repositories, getting answers from the web, planning implementations, automating browsers, and much more.

## Getting Started

### Installation

Install vibe-tools globally to access it from anywhere in your terminal:

```bash
npm install -g vibe-tools
```

Verify the installation:

```bash
vibe-tools --version
# Output: vibe-tools v0.60.9 (or your current version)
```

### Basic Usage

Vibe-tools commands follow this general structure:

```bash
vibe-tools <command> "<query>" [options]
```

Where:
- `<command>` is one of the available commands (repo, web, plan, etc.)
- `"<query>"` is your question or request in natural language
- `[options]` are additional parameters to customize the behavior

### General Command Options

These options are supported by all vibe-tools commands:

| Option | Description |
|--------|-------------|
| `--provider=<provider>` | AI provider to use (openai, anthropic, perplexity, gemini, modelbox, openrouter, or xai) |
| `--model=<model>` | Model to use for the task |
| `--max-tokens=<number>` | Control response length |
| `--save-to=<file path>` | Save output to a file (in addition to displaying it) |
| `--debug` | Show detailed logs and error information |

### Core Commands

| Command | Description | Nickname | Primary Use Cases |
|---------|-------------|----------|-------------------|
| `repo` | Analyze your codebase and get context-aware answers | Gemini | Code understanding, architecture reviews, debugging |
| `web` | Search the web for up-to-date information | Perplexity | Documentation, tutorials, best practices |
| `plan` | Generate implementation plans for features | - | Feature planning, breaking down complex tasks |
| `browser` | Automate browser interactions | Stagehand | Web testing, scraping, UI automation |
| `ask` | Direct question to an AI model | - | General questions not related to code |
| `doc` | Generate documentation for your project | - | Creating READMEs, API docs, code explanations |
| `youtube` | Analyze YouTube videos | - | Tutorial summaries, implementation ideas |
| `github` | Interact with GitHub PRs and issues | - | PR reviews, issue tracking |
| `mcp` | Use Model Context Protocol servers | - | Specialized AI tools and agents |
| `xcode` | Build, run, and lint iOS applications | - | iOS development workflows |

## Repository Analysis with `repo`

When you need to understand complex code in your project:

```bash
vibe-tools repo "Explain how our authentication system works and identify any security vulnerabilities"
```

This command will analyze your repository, focusing on authentication-related code, and provide a detailed explanation along with potential security concerns.

### Key Options for `repo`

- `--subdir=<path>`: Analyze a specific subdirectory instead of the entire repository
- `--from-github=<username/repo>[@<branch>]`: Analyze a remote GitHub repository without cloning it locally
- `--with-doc=<doc_url>`: Include content from one or more HTTPS URLs as additional context

## Web Research with `web`

When you need up-to-date information from the web:

```bash
vibe-tools web "What are the best practices for handling JWT tokens in React applications in 2023?"
```

This will search the web and compile relevant, current information about JWT token handling in React.

### Key Options for `web`

- `--provider=<provider>`: AI provider to use (perplexity, gemini, modelbox, or openrouter)

## Implementation Planning with `plan`

When starting a new feature:

```bash
vibe-tools plan "Add social authentication with Google and GitHub to our Next.js application"
```

This will identify relevant files in your codebase and generate a step-by-step implementation plan for adding social authentication.

### Key Options for `plan`

- `--fileProvider=<provider>`: Provider for file identification (gemini, openai, anthropic, perplexity, modelbox, openrouter, or xai)
- `--thinkingProvider=<provider>`: Provider for plan generation (gemini, openai, anthropic, perplexity, modelbox, openrouter, or xai)
- `--fileModel=<model>`: Model to use for file identification
- `--thinkingModel=<model>`: Model to use for plan generation
- `--with-doc=<doc_url>`: Include content from HTTPS URLs as additional context

## Browser Automation with `browser`

When testing a web application:

```bash
vibe-tools browser act "Fill the login form with email 'test@example.com' and password 'password123' then click the Submit button" --url=https://myapp.dev/login
```

This automates browser interactions to test your login form.

### Key Options for `browser`

- `--url=<url>`: URL to navigate to, or use special values like 'current' (use existing page without navigation) or 'reload-current' (refresh the current page)
- `--screenshot=<file path>`: Save a screenshot of the page
- `--html`: Capture page HTML content (disabled by default)
- `--console`: Capture browser console logs (enabled by default)
- `--network`: Capture network activity (enabled by default)
- `--timeout=<milliseconds>`: Set navigation timeout (default: 120000ms)
- `--viewport=<width>x<height>`: Set viewport size (e.g., 1280x720)
- `--headless`: Run browser in headless mode (default: true)
- `--no-headless`: Show browser UI (non-headless mode) for debugging
- `--connect-to=<port>`: Connect to existing Chrome instance
- `--video=<directory>`: Save a video recording of the browser interaction
- `--evaluate=<string>`: JavaScript code to execute in the browser before the main command

Note: The browser commands are stateless by default (each command starts with a fresh browser instance), unless you use `--connect-to` to connect to a long-lived interactive session. When using browser commands with multiple steps, separate the steps with a pipe symbol (`|`).

## Direct AI Queries with `ask`

For general questions not tied to your codebase:

```bash
vibe-tools ask "Explain the difference between OAuth and JWT authentication" --provider=anthropic --model=claude-3-sonnet-20240229
```

### Key Options for `ask`

- `--provider=<provider>`: AI provider to use
- `--model=<model>`: Model to use for the query
- `--reasoning-effort=<low|medium|high>`: Control the depth of reasoning for supported models (OpenAI o1/o3-mini models and Claude 3.7 Sonnet)
- `--with-doc=<doc_url>`: Include content from HTTPS URLs as additional context

## GitHub Integration with `github`

Access GitHub Pull Requests and Issues:

```bash
# Get the last 10 PRs
vibe-tools github pr

# Get a specific PR by number
vibe-tools github pr 123

# Get the last 10 issues
vibe-tools github issue

# Get a specific issue by number
vibe-tools github issue 456
```

### Key Options for `github`

- `--from-github=<username/repo>[@<branch>]`: Access PRs/issues from a specific GitHub repository

## Documentation Generation with `doc`

Generate comprehensive documentation for your project:

```bash
vibe-tools doc "Generate API documentation for our REST endpoints" --save-to docs/api-reference.md
```

### Key Options for `doc`

- `--from-github=<username/repo>[@<branch>]`: Generate documentation for a remote GitHub repository
- `--with-doc=<doc_url>`: Include content from HTTPS URLs as additional context

## YouTube Video Analysis with `youtube`

Extract valuable information from tutorial videos:

```bash
# Generate a summary of a video
vibe-tools youtube "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --type=summary

# Generate an implementation plan based on a tutorial video
vibe-tools youtube "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --type=plan
```

### Key Options for `youtube`

- `--type=<summary|transcript|plan|review|custom>`: Type of analysis to perform (default: summary)

## iOS Development with `xcode`

Build, run, and lint your iOS applications:

```bash
# Build the Xcode project
vibe-tools xcode build

# Run the Xcode project on a simulator
vibe-tools xcode run

# Run static analysis on the Xcode project
vibe-tools xcode lint
```

### Key Options for `xcode`

- `--buildPath=<path>`: Specifies a custom directory for derived build data (for `build` command)
- `--destination=<destination>`: Specifies the destination for building or running the app (e.g., 'platform=iOS Simulator,name=iPhone 16 Pro')

## MCP Server Integration with `mcp`

The Model Context Protocol (MCP) commands allow you to interact with specialized AI tools:

```bash
# Search for available MCP servers
vibe-tools mcp search "database schema management tools"

# Execute MCP server tools using natural language
vibe-tools mcp run "Analyze my TypeScript models and generate a PostgreSQL schema with proper indexes and constraints"
```

### Key Options for `mcp`

- `--provider=<provider>`: AI provider to use ('anthropic' or 'openrouter', default is 'anthropic')

## Back-to-Back Commands

For more complex workflows, you can chain commands together:

```bash
# First, research the latest JWT best practices
vibe-tools web "What are the best practices for JWT refresh token rotation?" --save-to jwt-research.md

# Then, analyze your repository to find relevant authentication code
vibe-tools repo "Find all code related to JWT authentication" --save-to jwt-code-analysis.md

# Finally, create a plan to implement token rotation
vibe-tools plan "Implement JWT refresh token rotation based on the research in jwt-research.md and existing code identified in jwt-code-analysis.md"
```

## Crafting Effective Prompts

### Handling Multi-line and Complex Prompts

When your prompts span multiple lines, contain special characters, or are generally complex, use these methods to ensure reliable execution:

#### Method 1: Escaped Strings (For Simple/Short Multi-line Prompts)

For shorter multi-line prompts, use escaped newlines (`\\n`) and quotes:

```bash
vibe-tools plan "Create an implementation plan for a feature that:\\n1. Fetches data from an API\\n2. Processes the response with proper error handling\\n3. Updates multiple components"
```

#### Method 2: Temporary Files (For Complex/Long Prompts)

For complex prompts with special characters or formatting, use temporary files:

```bash
# 1. Create a temporary file
TMP_FILE=$(mktemp)

# 2. Write your complex prompt to the file
echo -e "Create an implementation plan for a feature that:\n1. Fetches data from an API (e.g., GET /users?id=\$USER_ID)\n2. Processes the response with proper error handling\n3. Updates multiple components\n\nInclude specific tasks for:\n- Setting up API client\n- Creating data models\n- Implementing UI components\n- Adding comprehensive tests" > "$TMP_FILE"

# 3. Use the file content as the prompt
vibe-tools plan "$(cat "$TMP_FILE")"

# 4. Clean up the temporary file
rm "$TMP_FILE"
```

> **Important:** Avoid using heredocs (e.g., `<<EOF ... EOF`) for prompts in programmatic execution contexts, as they are prone to issues with quoting, escaping, and variable expansion.

### Working with File Content

When you need to include the content of an existing file in your prompt:

#### For `--with-doc` Supported Commands (HTTPS URLs ONLY)

The `--with-doc` option only supports HTTPS URLs, not local file paths:

```bash
# Use built-in features when available with HTTPS URLs
vibe-tools ask "Process the content from this online document" --with-doc=https://example.com/online-document.txt
```

#### For Local Files

Include the file path directly in your prompt and let the command access it:

```bash
# For local files, reference the path in the prompt
vibe-tools repo "Analyze the code in path/to/local/code.py and explain its main functions"
```

Or for `vibe-tools ask` (which doesn't have repository context access):

```bash
# Store file content in a variable for smaller files
FILE_CONTENT=$(cat file.txt)
vibe-tools ask "Format the following data which was read from a file:\\n\\n$FILE_CONTENT"
```

## Advanced Examples

### CI/CD Integration

Integrate vibe-tools into your CI/CD pipeline to enhance code reviews:

```yaml
# Jenkins pipeline example for test enhancement
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install -g vibe-tools'
                sh 'npm install'
            }
        }

        stage('Analyze Test Coverage') {
            steps {
                sh 'npm test -- --coverage'

                script {
                    def coverageReport = readFile('coverage/lcov-report/index.html')
                    def testSuggestions = sh(
                        script: "vibe-tools repo \"Analyze our test coverage report and suggest additional test cases for under-tested components\" --save-to test-suggestions.md",
                        returnStdout: true
                    )

                    echo "Test Suggestions:"
                    echo testSuggestions
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'test-suggestions.md', allowEmptyArchive: true
        }
    }
}
```

### GitHub Actions Example

```yaml
# GitHub Actions workflow for automated code review
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Important for getting the full history for comparison

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install vibe-tools
        run: npm install -g vibe-tools

      - name: Get changed files
        id: changed-files
        run: |
          echo "files=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.event.pull_request.head.sha }} | tr '\n' ' ')" >> $GITHUB_OUTPUT

      - name: Review code changes
        run: |
          vibe-tools repo "Review the following changed files for potential issues, code smells, and security vulnerabilities: ${{ steps.changed-files.outputs.files }}" > code-review.md

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs')
            const reviewContent = fs.readFileSync('code-review.md', 'utf8')
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: reviewContent
            })
```

### Complex Multi-Step Examples

#### Example 1: Refactoring Legacy Code

```bash
# Step 1: Analyze the legacy code structure
vibe-tools repo "Identify code smells and architectural issues in our legacy payment processing module" --save-to legacy-analysis.md

# Step 2: Research modern best practices
vibe-tools web "Current best practices for payment processing architecture in Node.js applications" --save-to payment-best-practices.md

# Step 3: Generate a refactoring plan
vibe-tools plan "Create a detailed refactoring plan for our payment processing module based on the analysis in legacy-analysis.md and the best practices in payment-best-practices.md. Include specific code changes, a migration strategy, and testing approach." --save-to refactoring-plan.md

# Step 4: Get feedback on the refactoring plan
vibe-tools repo "Review the refactoring plan in refactoring-plan.md and identify potential risks or implementation challenges" --save-to refactoring-feedback.md
```

#### Example 2: Comprehensive API Documentation Creation

```bash
# Step 1: Extract current API endpoints and usage
vibe-tools repo "Identify all API endpoints in our Express application, including their routes, methods, request/response formats, and current documentation status" --save-to api-inventory.md

# Step 2: Research API documentation standards
vibe-tools web "Best practices for REST API documentation, including OpenAPI specification examples" --save-to api-doc-standards.md

# Step 3: Generate OpenAPI specification
vibe-tools plan "Create an OpenAPI 3.0 specification for our API based on the endpoint inventory in api-inventory.md, following the standards in api-doc-standards.md" --save-to openapi-spec.json

# Step 4: Generate developer documentation
vibe-tools doc "Generate comprehensive API documentation based on the OpenAPI specification in openapi-spec.json. Include authentication, rate limiting, error handling, and usage examples." --save-to api-docs.md
```

#### Example 3: Security Audit and Improvement

```bash
# Step 1: Conduct a security audit
vibe-tools repo "Perform a security audit of our codebase, focusing on authentication, data validation, SQL injection risks, and secret management" --save-to security-audit.md

# Step 2: Research latest security best practices
vibe-tools web "Latest security best practices for Node.js web applications in 2023, including OWASP Top 10 mitigations" --save-to security-best-practices.md

# Step 3: Generate a security improvement plan
vibe-tools plan "Create a prioritized security improvement plan based on the audit in security-audit.md and the best practices in security-best-practices.md. Categorize issues by severity and include specific code changes for each issue." --save-to security-plan.md

# Step 4: Generate unit tests for security improvements
vibe-tools repo "Design unit tests that verify the security improvements proposed in security-plan.md, focusing on edge cases and attack vectors" --save-to security-tests.md
```

#### Example 4: Comprehensive Debugging Workflow

```bash
# Step 1: Analyze the error in your codebase
vibe-tools repo "I'm getting this error: 'Cannot read property 'user' of undefined' in our authentication middleware. It seems to originate from src/middleware/auth.js. Can you explain what might be causing it and suggest fixes based on the surrounding code?" --save-to error-analysis.md

# Step 2: Research similar issues online
vibe-tools web "Common causes for 'Cannot read property of undefined' errors in Express.js authentication middleware" --save-to error-research.md

# Step 3: Generate a fix and test plan
vibe-tools plan "Based on the error analysis in error-analysis.md and research in error-research.md, create a plan to fix the authentication middleware issue. Include verification steps and tests to ensure the fix works properly." --save-to fix-plan.md
```

#### Example 5: Test Generation and Coverage Improvement

```bash
# Step 1: Analyze current test coverage
vibe-tools repo "Analyze our test coverage and identify components with insufficient testing" --save-to test-coverage-analysis.md

# Step 2: Generate tests for under-tested components
vibe-tools repo "Generate Vitest unit tests for the functions in src/utils.ts. Ensure good coverage for edge cases and adhere to the testing patterns found in other test files in this project." --save-to generated-tests.md

# Step 3: Review the generated tests
vibe-tools repo "Review the tests in generated-tests.md and suggest improvements for better coverage and error handling" --save-to test-improvements.md
```

#### Example 6: Onboarding Assistance

```bash
# Get an overview of a specific module
vibe-tools repo "I'm new to this project. Can you give me an overview of the 'core-services' module located in 'packages/core/services/'? What are its main responsibilities, key files, and how does it interact with other parts of the system like 'packages/api'?" --subdir=packages/core/services/ --save-to module-overview.md

# Learn a new technology within project context
vibe-tools web "What are the best practices for using Zustand for state management in a Next.js 14 application?" --save-to zustand-best-practices.md

# Apply the research to your specific project
vibe-tools repo "Based on the Zustand best practices in zustand-best-practices.md, how would I integrate Zustand into our existing 'UserProfile' component ('src/components/UserProfile.tsx') to manage its local state?" --save-to zustand-integration.md
```

## Additional Command Examples

### Less Common Commands

#### MCP Server Integration

The Model Context Protocol (MCP) commands allow you to integrate with specialized tools:

```bash
# Search for available MCP servers that can help with database management
vibe-tools mcp search "database schema management tools"

# Use an MCP server to create a database schema from an existing codebase
vibe-tools mcp run "Analyze my TypeScript models and generate a PostgreSQL schema with proper indexes and constraints"
```

#### YouTube Video Analysis

Extract valuable information from tutorial videos:

```bash
# Generate an implementation plan from a YouTube tutorial
vibe-tools youtube "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --type=plan

# Get a detailed transcript of a technical presentation
vibe-tools youtube "https://www.youtube.com/watch?v=ABC123" --type=transcript
```

#### Combined Browser Automation and Analysis

For advanced web testing scenarios:

```bash
# Automate a multi-step workflow and then analyze the results
vibe-tools browser act "Navigate through the checkout process with a test product | Verify the order confirmation page shows correct totals" --url=https://myapp.dev/products --screenshot=checkout-process.png

# Then analyze the screenshot
vibe-tools repo "Analyze the checkout-process.png screenshot and identify any UI issues or improvements needed" --save-to checkout-analysis.md
```

#### ClickUp Task Management

Integrate with ClickUp for task management:

```bash
# Get information about a specific task
vibe-tools clickup task "1234567"

# Generate a plan for implementing a task
vibe-tools plan "Create an implementation plan for the task described in the ClickUp task 1234567" --save-to task-implementation.md
```

## Advanced Configuration

### Configuration File

You can create a `vibe-tools.config.json` file in your project root or in `~/.vibe-tools/config.json` for global settings:

```json
{
  "defaultProvider": "openai",
  "models": {
    "openai": "o3-mini",
    "anthropic": "claude-3-sonnet-20240229",
    "gemini": "gemini-pro"
  },
  "repo": {
    "defaultProvider": "gemini"
  },
  "web": {
    "defaultProvider": "perplexity"
  }
}
```

### Repomix Configuration

You can control which files are included/excluded during repository analysis by creating a `repomix.config.json` file in your project root. This file will be automatically detected by `repo`, `plan`, and `doc` commands:

```json
{
  "exclude": [
    "node_modules/",
    "dist/",
    "build/",
    ".git/"
  ],
  "include": [
    "src/",
    "docs/",
    "*.md",
    "*.json"
  ]
}
```

### Environment Variables

Store your API keys in a `.vibe-tools.env` file in your project directory or at `~/.vibe-tools/.env` for global access:

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
GEMINI_API_KEY=your_gemini_api_key
CLICKUP_API_TOKEN=your_clickup_api_token
```

## Resources

- [Vibe-Tools GitHub Repository](https://github.com/eastlondoner/cursor-tools) - Source code and issues
- [Vibe-Tools NPM Package](https://www.npmjs.com/package/vibe-tools) - NPM package information
- [Cursor IDE](https://cursor.sh) - The Cursor IDE that vibe-tools enhances

## Common Troubleshooting

### Command not found

If you see `command not found: vibe-tools`, ensure the package is installed globally:

```bash
npm install -g vibe-tools
```

### API key errors

If you encounter authentication errors, check that you've added the correct API keys to your `.vibe-tools.env` file.

### Browser automation issues

For browser automation commands, ensure Playwright is installed:

```bash
npm install -g playwright
npx playwright install
```

## Version History

Vibe-tools was previously known as cursor-tools. The package was renamed to vibe-tools in version 0.60.0.

Current stable version: 0.60.9

## Updated: 2025-05-07
