---
description: Repository Analysis Tool
globs: *
alwaysApply: false
---
# Repository Analysis Tool

A generic tool for analyzing repository structure and locating code definitions across any codebase.

<rule>
name: repo_analyzer
description: Analyzes repository structure and suggests a plan for extracting relevant code context
filters:
  - type: message
    pattern: "(?i)(analyze repo|analyze repository|understand repo|understand repository|extract definitions|find definitions|locate code)"
  - type: context
    pattern: "code structure|repository analysis|find where|locate in codebase|extract relevant code"

actions:
  - type: suggest
    message: |
      # Repository Analysis and Context Extraction Plan

      I'll help you analyze this repository and create a plan for extracting the most relevant code context. Let's start by understanding the repository structure.

      ## Step 1: Analyze Repository Structure

      First, let's get a comprehensive view of the repository structure:

      ```bash
      # Works on both Linux and MacOS
      find . -type d -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/__pycache__/*" | sort
      ```

      Or using tree if available:

      ```bash
      # If tree is installed
      tree -L 7 -I "*.pyc|__pycache__|.git|.pytest_cache|.ruff_cache|.mypy_cache|.coverage|htmlcov|.venv|.env|*.egg-info|build|dist|node_modules|.DS_Store|images"
      ```

      ## Step 2: Identify Key Components

      Based on the repository structure, I'll identify:

      1. **Entry Points**: Main files that serve as entry points to the application
      2. **Core Modules**: Key functionality modules and their organization
      3. **Type Definitions**: Where types and interfaces are defined
      4. **Configuration**: Configuration files and settings
      5. **Utilities**: Helper functions and utilities

      ## Step 3: Locate Definitions

      To find specific definitions in the codebase, I'll use these search strategies:

      ### For Functions and Classes:
      ```bash
      # Find function definitions (works on both MacOS and Linux)
      # For Python functions
      grep -r "def " --include="*.py" .
      # For JavaScript/TypeScript functions
      grep -r "function " --include="*.js" --include="*.ts" .
      # For class definitions
      grep -r "class " --include="*.py" --include="*.js" --include="*.ts" --include="*.java" .
      ```

      ### For Type Definitions:
      ```bash
      # Find type definitions (for typed languages)
      # For TypeScript types
      grep -r "type " --include="*.ts" --include="*.tsx" .
      # For interfaces
      grep -r "interface " --include="*.ts" --include="*.tsx" --include="*.java" .
      # For structs (Go, Rust)
      grep -r "struct " --include="*.go" --include="*.rs" .
      ```

      ### For Constants and Variables:
      ```bash
      # Find constant definitions
      grep -r "const " --include="*.js" --include="*.ts" .
      grep -r "final " --include="*.java" .
      # For Python constants (typically uppercase)
      grep -r "^[A-Z][A-Z0-9_]* = " --include="*.py" .
      ```

      ## Step 4: Analyze Dependencies

      For understanding how components relate to each other:

      ```bash
      # Find imports/requires (language-specific patterns)
      # Python imports
      grep -r "^import " --include="*.py" .
      grep -r "^from " --include="*.py" .
      # JavaScript/TypeScript imports
      grep -r "import " --include="*.js" --include="*.ts" .
      grep -r "require(" --include="*.js" .
      ```

      ## Step 5: Create Context Extraction Plan

      Based on the repository analysis, I'll create a tailored plan for extracting the most relevant code context:

      1. Identify the specific functionality you're interested in
      2. Locate the main implementation files
      3. Find related utility functions and helpers
      4. Determine configuration and environment requirements
      5. Understand the dependency chain

      ## Step 6: Extract Relevant Code

      For extracting code context, we can use various approaches:

      ### Using grep for targeted extraction:
      ```bash
      # Extract specific function/class and surrounding context (works on both MacOS and Linux)
      # Extract a Python function with 20 lines after and 5 lines before
      grep -r -A 20 -B 5 "def target_function" --include="*.py" .
      # Extract a class definition
      grep -r -A 50 -B 5 "class TargetClass" --include="*.py" .
      ```

      ### Using find and cat for full file extraction:
      ```bash
      # Find relevant files and extract their content (works on both MacOS and Linux)
      # Find all Python files in a specific directory
      find ./src -name "*.py" -type f | xargs cat > extracted_files.txt
      ```

      ## Step 7: Save Analysis to Markdown File

      To save this analysis to a markdown file for future reference:

      ```bash
      # Create a markdown file with the analysis
      # Replace "component_name" with the specific component you're analyzing
      cat > component_name_repo_analysis.md << 'EOL'
      # Repository Analysis: Component Name

      ## Repository Structure

      [Insert tree output here]

      ## Key Components

      1. **Entry Points**:
         - [List entry points]

      2. **Core Modules**:
         - [List core modules]

      3. **Type Definitions**:
         - [List type definitions]

      4. **Configuration**:
         - [List configuration files]

      5. **Utilities**:
         - [List utility functions]

      ## Relevant Code Extracts

      ### Component Implementation

      ```python
      # Insert relevant code here
      ```

      ### Dependencies

      [List dependencies]

      ## Analysis Summary

      [Summarize findings]
      EOL
      ```

examples:
  - input: |
      I need to understand where the authentication system is defined in this repository.
    output: |
      I'll help you locate and understand the authentication system in this repository.

      First, let's analyze the repository structure to get a comprehensive view:

      ```bash
      # Get directory structure
      tree -L 7 -I "*.pyc|__pycache__|.git|.pytest_cache|.ruff_cache|.mypy_cache|.coverage|htmlcov|.venv|.env|*.egg-info|build|dist|node_modules|.DS_Store|images"
      ```

      Now, let's search for authentication-related definitions:

      ```bash
      # Find auth-related files
      find . -type f -name "*auth*" -o -name "*login*" -o -name "*user*" | grep -v "node_modules" | grep -v "__pycache__"

      # Search for authentication-related functions and classes
      # Python
      grep -r "def authenticate" --include="*.py" .
      grep -r "class Auth" --include="*.py" .
      grep -r "class User" --include="*.py" .

      # JavaScript/TypeScript
      grep -r "function authenticate" --include="*.js" --include="*.ts" .
      grep -r "class Auth" --include="*.js" --include="*.ts" .

      # Look for authentication decorators or middleware
      grep -r "@login_required" --include="*.py" .
      grep -r "auth_required" --include="*.py" .
      grep -r "authMiddleware" --include="*.js" --include="*.ts" .
      ```

      Based on these findings, I can identify the key components of the authentication system:

      1. **User Model/Entity**: Files defining user data structure
      2. **Authentication Logic**: Files handling login, logout, and session management
      3. **Authentication Middleware**: Code that protects routes or endpoints
      4. **Authentication Configuration**: Settings for auth providers, tokens, etc.

      Now I'll extract the relevant code to help you understand the authentication system:

      ```bash
      # Extract user model definitions
      grep -r -A 50 -B 5 "class User" --include="*.py" .
      grep -r -A 50 -B 5 "function createUser" --include="*.js" --include="*.ts" .

      # Extract authentication logic
      grep -r -A 50 -B 5 "def authenticate" --include="*.py" .
      grep -r -A 50 -B 5 "function authenticate" --include="*.js" --include="*.ts" .

      # Extract middleware
      grep -r -A 30 -B 5 "@login_required" --include="*.py" .
      grep -r -A 30 -B 5 "authMiddleware" --include="*.js" --include="*.ts" .
      ```

      This extraction will give you a comprehensive view of the authentication system, including:
      - User model and data structure
      - Authentication logic and flow
      - Middleware for protecting routes/endpoints
      - Configuration settings for authentication

      Would you like me to help you understand any specific part of the authentication system in more detail?

  - input: |
      Where are the database models defined in this codebase?
    output: |
      I'll help you locate the database models in this codebase.

      First, let's analyze the repository structure:

      ```bash
      # Get directory structure
      tree -L 7 -I "*.pyc|__pycache__|.git|.pytest_cache|.ruff_cache|.mypy_cache|.coverage|htmlcov|.venv|.env|*.egg-info|build|dist|node_modules|.DS_Store|images"
      ```

      Now, let's search for model-related definitions using various patterns common across different frameworks and languages:

      ```bash
      # Find model files
      find . -type f -name "*model*" -o -name "*schema*" -o -name "*entity*" | grep -v "node_modules" | grep -v "__pycache__"

      # Search for model class definitions
      # Python ORM models
      grep -r "class.*Model" --include="*.py" .
      grep -r "class.*db.Model" --include="*.py" .
      grep -r "class.*models.Model" --include="*.py" .

      # JavaScript/TypeScript models
      grep -r "class.*Model" --include="*.js" --include="*.ts" .
      grep -r "interface.*Model" --include="*.ts" .

      # Look for ORM-specific patterns
      grep -r "@Entity" --include="*.java" --include="*.ts" .
      grep -r "createTable" --include="*.js" --include="*.ts" .
      grep -r "sequelize.define" --include="*.js" .
      ```

      Based on the search results, I can identify where the database models are defined:

      1. **Models Directory**: Look for directories named "models", "entities", or "schemas"
      2. **Main Model Files**: Files with names containing "model", "entity", or "schema"
      3. **Framework-Specific Patterns**: Code using ORM-specific patterns

      Now I'll extract the relevant code to help you understand the database models:

      ```bash
      # Extract model class definitions
      grep -r -A 100 -B 5 "class.*Model" --include="*.py" .
      grep -r -A 100 -B 5 "class.*db.Model" --include="*.py" .

      # Extract database configuration
      grep -r -A 30 -B 5 "DATABASES" --include="*.py" .
      grep -r -A 30 -B 5 "mongoose.connect" --include="*.js" .
      grep -r -A 30 -B 5 "new Sequelize" --include="*.js" .
      ```

      This extraction will provide you with:
      - All model definitions
      - Database schema structures
      - Database configuration
      - Relationships between models

      The models appear to be using various patterns based on the codebase's preferred ORM or database access layer.

      ## Repository Structure

      [Insert tree output here]

      ## Key Components

      1. **Models Directory**:
         - [List model directories]

      2. **Main Model Files**:
         - [List model files]

      3. **Database Configuration**:
         - [List configuration files]

      ## Relevant Code Extracts

      ### Model Definitions

      ```python
      # Insert model class definitions here
      ```

      ### Database Configuration

      ```python
      # Insert database configuration here
      ```

      ### Relationships

      [Describe relationships between models]

      ## Analysis Summary

      The database models in this repository use [ORM/framework name] and follow [architectural pattern].
      The main entities are [list main entities] with relationships that represent [describe domain model].
      EOL
      ```

      The database_models_repo_analysis.md file has been created with a comprehensive analysis of all database models in this repository. Would you like me to help you understand any specific aspect of the database models in more detail?

  - input: |
      I need to understand the API endpoints in this project.
    output: |
      I'll help you locate and understand the API endpoints in this project.

      First, let's analyze the repository structure:

      ```bash
      # Get directory structure
      tree -L 7 -I "*.pyc|__pycache__|.git|.pytest_cache|.ruff_cache|.mypy_cache|.coverage|htmlcov|.venv|.env|*.egg-info|build|dist|node_modules|.DS_Store|images"
      ```

      Now, let's search for API endpoint definitions using patterns common across different frameworks and languages:

      ```bash
      # Find route definitions in JavaScript/TypeScript frameworks
      grep -r "app.get" --include="*.js" --include="*.ts" .
      grep -r "app.post" --include="*.js" --include="*.ts" .
      grep -r "router.get" --include="*.js" --include="*.ts" .
      grep -r "router.post" --include="*.js" --include="*.ts" .

      # Find route definitions in Python frameworks
      grep -r "@app.route" --include="*.py" .
      grep -r "@app.get" --include="*.py" .
      grep -r "@app.post" --include="*.py" .
      grep -r "path(" --include="*.py" .

      # Find controller files
      find . -type f -name "*controller*" -o -name "*route*" -o -name "*api*" -o -name "*endpoint*" -o -name "*resource*" | grep -v "node_modules" | grep -v "__pycache__"

      # Look for API documentation
      find . -type f -name "*swagger*" -o -name "*openapi*" -o -name "*api-doc*" | grep -v "node_modules" | grep -v "__pycache__"
      ```

      Based on the search results, I can identify where the API endpoints are defined:

      1. **Controllers/Handlers**: Files that contain the business logic for endpoints
      2. **Routes/URL Configuration**: Files that map URLs to handlers
      3. **API Documentation**: Swagger/OpenAPI specs or other API docs

      Now I'll extract the relevant code to help you understand the API endpoints:

      ```bash
      # Extract route definitions
      # For Express.js
      grep -r -A 10 -B 2 "app.get" --include="*.js" --include="*.ts" .
      grep -r -A 10 -B 2 "router.post" --include="*.js" --include="*.ts" .

      # For Flask/FastAPI
      grep -r -A 10 -B 2 "@app.route" --include="*.py" .
      grep -r -A 10 -B 2 "@app.get" --include="*.py" .

      # Extract controller methods
      grep -r -A 30 -B 5 "def " --include="*.py" . | grep -A 30 -B 5 "request"
      grep -r -A 30 -B 5 "function" --include="*.js" --include="*.ts" . | grep -A 30 -B 5 "req, res"
      ```

      This extraction will provide you with:
      - All API route definitions
      - Controller/handler implementations
      - Middleware applied to routes
      - Request/response handling logic

      The API structure follows patterns typical of the framework used in this project, with endpoints organized around resources and following RESTful or RPC conventions.

metadata:
  priority: high
  version: 1.0
  tags:
    - repository-analysis
    - code-location
    - context-extraction
</rule>
