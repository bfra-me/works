# CI/CD Integration Guide

Complete guide for integrating `@bfra.me/semantic-release` with popular CI/CD platforms, including configuration examples, best practices, and troubleshooting.

## Overview

This guide covers how to set up semantic-release with various CI/CD platforms to automate your release workflow. Each platform has specific considerations for authentication, environment variables, and pipeline configuration.

## Prerequisites

Before setting up CI/CD integration, ensure you have:

1. **semantic-release configuration** - A properly configured `release.config.ts` file
2. **Authentication tokens** - Required tokens for your target platforms (GitHub, npm, etc.)
3. **Branch protection** - Protected branches to prevent unauthorized releases
4. **Conventional commits** - Team following conventional commit format

## Platform-Specific Configurations

### GitHub Actions

GitHub Actions provides excellent integration with semantic-release, especially for GitHub-hosted repositories.

#### Basic Configuration

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: read # for checkout

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write # to be able to publish a GitHub release
      issues: write # to be able to comment on released issues
      pull-requests: write # to be able to comment on released pull requests
      id-token: write # to enable use of OIDC for npm provenance
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Verify the integrity of provenance attestations
        run: npm audit signatures

      - name: Build
        run: npm run build

      - name: Test
        run: npm test

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

#### Advanced GitHub Actions Configuration

For more complex workflows with multiple Node versions and conditional releases:

```yaml
name: Release

on:
  push:
    branches: [main, beta, alpha]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run build
      - run: npm test

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          # Required for pushing changes back to repo
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

#### Environment Variables

Configure these secrets in your GitHub repository settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions | Yes |
| `NPM_TOKEN` | npm authentication token (publish access) | Yes (for npm publishing) |

#### npm Provenance

Enable npm provenance for enhanced security:

```typescript
// release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/npm', {
      npmPublish: true,
      provenance: true // Enable npm provenance
    }],
    '@semantic-release/github',
    '@semantic-release/git'
  ]
})
```

### GitLab CI

GitLab CI provides robust pipeline support with excellent integration for GitLab-hosted repositories.

#### GitLab CI Basic Configuration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - release

# Test stage with multiple Node versions
test:
  stage: test
  image: node:18
  parallel:
    matrix:
      - NODE_VERSION: [18, 20, 22]
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
    - npm test
  cache:
    paths:
      - node_modules/

# Release stage
release:
  stage: release
  image: node:20
  script:
    - npm ci
    - npm run build
    - npx semantic-release
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  cache:
    paths:
      - node_modules/
```

#### Advanced GitLab CI Configuration

For complex workflows with conditional releases and artifact management:

```yaml
variables:
  NODE_VERSION: "20"

stages:
  - build
  - test
  - security
  - release

cache:
  paths:
    - node_modules/
    - dist/

before_script:
  - apt-get update && apt-get install -y git
  - npm ci

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:$NODE_VERSION
  parallel:
    matrix:
      - NODE_VERSION: [18, 20, 22]
  script:
    - npm test
    - npm run lint
    - npm run type-check
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

security:
  stage: security
  image: node:$NODE_VERSION
  script:
    - npm audit --audit-level=high
    - npm run security-check
  allow_failure: true

release:
  stage: release
  image: node:$NODE_VERSION
  script:
    - npx semantic-release
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "beta"
    - if: $CI_COMMIT_BRANCH =~ /^release\/.*$/
  artifacts:
    reports:
      dotenv: release.env
```

#### GitLab CI Environment Variables

Configure these variables in GitLab CI/CD settings as protected variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `GITLAB_TOKEN` | GitLab personal access token | Yes (for GitLab releases) |
| `NPM_TOKEN` | npm authentication token | Yes (for npm publishing) |
| `CI_JOB_TOKEN` | Automatically provided by GitLab | Available by default |

### CircleCI

CircleCI provides powerful workflow orchestration with matrix jobs and conditional execution.

#### CircleCI Basic Configuration

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.0.0

jobs:
  test:
    executor: node/default
    parameters:
      node-version:
        type: string
        default: "18"
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Build
          command: npm run build
      - run:
          name: Test
          command: npm test

  release:
    executor: node/default
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Build
          command: npm run build
      - run:
          name: Release
          command: npx semantic-release

workflows:
  test_and_release:
    jobs:
      - test:
          matrix:
            parameters:
              node-version: ["18", "20", "22"]
      - release:
          requires:
            - test
          filters:
            branches:
              only: main
```

#### Advanced CircleCI Configuration

For complex workflows with caching and conditional steps:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.0.0

executors:
  node-executor:
    docker:
      - image: cimg/node:20.0
    working_directory: ~/project

jobs:
  install-and-cache:
    executor: node-executor
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}
      - persist_to_workspace:
          root: ~/project
          paths:
            - node_modules

  build:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: Build
          command: npm run build
      - persist_to_workspace:
          root: ~/project
          paths:
            - dist

  test:
    executor: node-executor
    parameters:
      node-version:
        type: string
    docker:
      - image: cimg/node:<< parameters.node-version >>
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: Test
          command: npm test
      - run:
          name: Lint
          command: npm run lint
      - store_test_results:
          path: test-results

  release:
    executor: node-executor
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: Release
          command: npx semantic-release

workflows:
  build_test_release:
    jobs:
      - install-and-cache
      - build:
          requires:
            - install-and-cache
      - test:
          requires:
            - build
          matrix:
            parameters:
              node-version: ["18.0", "20.0", "22.0"]
      - release:
          requires:
            - test
          filters:
            branches:
              only: main
```

#### CircleCI Environment Variables

Configure these in CircleCI project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `GH_TOKEN` | GitHub personal access token | Yes (for GitHub releases) |
| `NPM_TOKEN` | npm authentication token | Yes (for npm publishing) |

### Azure DevOps

Azure DevOps provides comprehensive pipeline support with YAML-based configuration.

#### Azure DevOps Basic Configuration

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - beta
      - alpha

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'

stages:
  - stage: Test
    displayName: 'Test and Build'
    jobs:
      - job: TestMultipleVersions
        displayName: 'Test on multiple Node versions'
        strategy:
          matrix:
            node_18:
              nodeVersion: '18.x'
            node_20:
              nodeVersion: '20.x'
            node_22:
              nodeVersion: '22.x'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run build
            displayName: 'Build'

          - script: npm test
            displayName: 'Test'

          - task: PublishTestResults@2
            condition: succeededOrFailed()
            inputs:
              testRunner: JUnit
              testResultsFiles: 'test-results.xml'

  - stage: Release
    displayName: 'Release'
    dependsOn: Test
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: Release
        displayName: 'Semantic Release'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
            displayName: 'Install Node.js'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run build
            displayName: 'Build'

          - script: npx semantic-release
            displayName: 'Semantic Release'
            env:
              GITHUB_TOKEN: $(GITHUB_TOKEN)
              NPM_TOKEN: $(NPM_TOKEN)
```

#### Advanced Azure DevOps Configuration

For complex workflows with templates and conditional releases:

```yaml
trigger:
  branches:
    include:
      - main
      - develop
      - release/*
  paths:
    exclude:
      - docs/*
      - '*.md'

pr:
  branches:
    include:
      - main
      - develop

resources:
  repositories:
    - repository: templates
      type: git
      name: shared-pipeline-templates
      ref: refs/heads/main

variables:
  - template: variables/common.yml@templates
  - name: nodeVersion
    value: '20.x'
  - name: isMain
    value: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - template: jobs/node-matrix-test.yml@templates
        parameters:
          nodeVersions: ['18.x', '20.x', '22.x']
          buildCommand: 'npm run build'
          testCommand: 'npm test'

  - stage: Security
    displayName: 'Security Checks'
    dependsOn: Build
    jobs:
      - job: SecurityAudit
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
          - script: npm ci
          - script: npm audit --audit-level=high
            displayName: 'Security Audit'
          - script: npm run security-check
            displayName: 'Additional Security Checks'
            continueOnError: true

  - stage: Release
    displayName: 'Semantic Release'
    dependsOn:
      - Build
      - Security
    condition: and(succeeded(), eq(variables.isMain, true))
    jobs:
      - deployment: Release
        displayName: 'Release to npm and GitHub'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: NodeTool@0
                  inputs:
                    versionSpec: $(nodeVersion)

                - script: npm ci
                  displayName: 'Install dependencies'

                - script: npm run build
                  displayName: 'Build for production'

                - script: npx semantic-release
                  displayName: 'Semantic Release'
                  env:
                    GITHUB_TOKEN: $(GITHUB_TOKEN)
                    NPM_TOKEN: $(NPM_TOKEN)
                    AZURE_DEVOPS_TOKEN: $(System.AccessToken)
```

#### Azure DevOps Environment Variables

Configure these in Azure DevOps variable groups or pipeline variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub personal access token | Yes (for GitHub releases) |
| `NPM_TOKEN` | npm authentication token | Yes (for npm publishing) |
| `AZURE_DEVOPS_TOKEN` | Azure DevOps access token | Yes (for Azure DevOps integration) |

### Jenkins

Jenkins provides flexible pipeline support with Groovy-based Jenkinsfile configuration.

#### Jenkins Basic Configuration

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        NPM_TOKEN = credentials('npm-token')
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                script {
                    def nodeHome = tool name: "Node-${NODE_VERSION}", type: 'nodejs'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm test'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results.xml'
                        }
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'npm run type-check'
                    }
                }
            }
        }

        stage('Release') {
            when {
                branch 'main'
            }
            steps {
                sh 'npx semantic-release'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

#### Advanced Jenkins Configuration

For complex workflows with matrix builds and conditional execution:

```groovy
pipeline {
    agent none

    environment {
        NPM_TOKEN = credentials('npm-token')
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Matrix Build and Test') {
            matrix {
                axes {
                    axis {
                        name 'NODE_VERSION'
                        values '18', '20', '22'
                    }
                }
                stages {
                    stage('Test') {
                        agent {
                            docker {
                                image "node:${NODE_VERSION}"
                            }
                        }
                        steps {
                            sh 'npm ci'
                            sh 'npm run build'
                            sh 'npm test'
                            sh 'npm run lint'
                        }
                        post {
                            always {
                                publishTestResults testResultsPattern: 'test-results.xml'
                                publishCoverage adapters: [
                                    istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')
                                ]
                            }
                        }
                    }
                }
            }
        }

        stage('Security') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm audit --audit-level=high'
                script {
                    try {
                        sh 'npm run security-check'
                    } catch (Exception e) {
                        currentBuild.result = 'UNSTABLE'
                        echo "Security check failed: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Release') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            when {
                anyOf {
                    branch 'main'
                    branch 'beta'
                    branch 'alpha'
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm run build'
                script {
                    try {
                        sh 'npx semantic-release'
                        currentBuild.description = "Released successfully"
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error "Release failed: ${e.getMessage()}"
                    }
                }
            }
        }
    }

    post {
        always {
            node('master') {
                script {
                    def buildResult = currentBuild.result ?: 'SUCCESS'
                    echo "Pipeline completed with result: ${buildResult}"
                }
            }
        }
        success {
            node('master') {
                echo 'Pipeline succeeded!'
            }
        }
        failure {
            node('master') {
                echo 'Pipeline failed!'
            }
        }
    }
}
```

#### Jenkins Environment Variables

Configure these in Jenkins credentials store:

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub personal access token | Yes (for GitHub releases) |
| `NPM_TOKEN` | npm authentication token | Yes (for npm publishing) |

### Other Platforms

#### Bitbucket Pipelines

Create `bitbucket-pipelines.yml`:

```yaml
image: node:20

pipelines:
  default:
    - step:
        name: Test
        caches:
          - node
        script:
          - npm ci
          - npm run build
          - npm test

  branches:
    main:
      - step:
          name: Test and Build
          caches:
            - node
          script:
            - npm ci
            - npm run build
            - npm test
          artifacts:
            - dist/**

      - step:
          name: Release
          script:
            - npm ci
            - npx semantic-release
```

#### Travis CI

Create `.travis.yml`:

```yaml
language: node_js
node_js:
  - '18'
  - '20'
  - '22'

cache: npm

install:
  - npm ci

script:
  - npm run build
  - npm test
  - npm run lint

jobs:
  include:
    - stage: release
      node_js: '20'
      script: npx semantic-release
      if: branch = main

stages:
  - test
  - name: release
    if: branch = main
```

## Advanced Patterns

### Multi-Platform Releases

Configure semantic-release to work with multiple platforms simultaneously:

```typescript
// release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main', 'beta', 'alpha'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',

    // npm publishing
    ['@semantic-release/npm', {
      npmPublish: true,
      provenance: true
    }],

    // GitHub releases
    ['@semantic-release/github', {
      assets: [
        { path: 'dist/*.tgz', label: 'Distribution' },
        { path: 'CHANGELOG.md', label: 'Changelog' }
      ]
    }],

    // GitLab releases (if using GitLab as mirror)
    ['@semantic-release/gitlab', {
      gitlabUrl: 'https://gitlab.example.com',
      assets: [
        { path: 'dist/*.tgz', label: 'Distribution' }
      ]
    }],

    // Azure DevOps releases
    ['@semantic-release/ado', {
      setOnlyOnRelease: true
    }],

    '@semantic-release/git'
  ]
})
```

### Environment-Specific Configuration

Use environment detection for platform-specific behavior:

```typescript
// release.config.ts
import { defineConfig, detectCIEnvironment } from '@bfra.me/semantic-release'

const ciContext = detectCIEnvironment()

export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',

    // Platform-specific plugins
    ...(ciContext.vendor === 'github' ? [
      ['@semantic-release/github', {
        assignees: process.env.GITHUB_ASSIGNEES?.split(',') || [],
        addReleases: 'bottom'
      }]
    ] : []),

    ...(ciContext.vendor === 'gitlab' ? [
      ['@semantic-release/gitlab', {
        gitlabUrl: process.env.CI_SERVER_URL,
        assets: ['dist/**']
      }]
    ] : []),

    ...(ciContext.vendor === 'azure' ? [
      ['@semantic-release/ado', {
        setOnlyOnRelease: true
      }]
    ] : []),

    '@semantic-release/git'
  ]
})
```

### Monorepo Configuration

For monorepos, configure workspace-aware releases:

```typescript
// packages/my-package/release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main'],
  tagFormat: `@my-org/my-package@\${version}`,

  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { scope: 'my-package', release: 'patch' },
        { scope: '!my-package', release: false }
      ]
    }],

    '@semantic-release/release-notes-generator',

    ['@semantic-release/changelog', {
      changelogFile: 'packages/my-package/CHANGELOG.md'
    }],

    ['@semantic-release/npm', {
      pkgRoot: 'packages/my-package',
      npmPublish: true
    }],

    ['@semantic-release/github', {
      assets: [
        { path: 'packages/my-package/dist/*.tgz', label: 'Package Distribution' }
      ],
      successComment: 'Released @my-org/my-package@${nextRelease.version}'
    }],

    ['@semantic-release/git', {
      assets: [
        'packages/my-package/CHANGELOG.md',
        'packages/my-package/package.json'
      ],
      message: 'chore(@my-org/my-package): release ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }]
  ]
})
```

## Security Best Practices

### Token Management

1. **Use least privilege principle** - Grant minimal required permissions
2. **Rotate tokens regularly** - Set up automatic token rotation where possible
3. **Use environment-specific tokens** - Different tokens for different environments
4. **Never commit tokens** - Always use CI/CD secret management

### Branch Protection

Configure branch protection rules:

```yaml
# GitHub branch protection example
rules:
  - pattern: main
    protection:
      required_status_checks:
        strict: true
        contexts: ['ci/test', 'ci/build']
      enforce_admins: true
      required_pull_request_reviews:
        required_approving_review_count: 2
        dismiss_stale_reviews: true
      restrictions:
        users: []
        teams: ['maintainers']
```

### Environment Isolation

Use different configurations for different environments:

```typescript
// release.config.ts
const environment = process.env.NODE_ENV || 'development'

const configs = {
  development: {
    dryRun: true,
    ci: false,
    debug: true
  },
  staging: {
    dryRun: false,
    ci: true,
    branches: ['staging']
  },
  production: {
    dryRun: false,
    ci: true,
    branches: ['main']
  }
}

export default defineConfig({
  ...configs[environment],
  plugins: [
    // Plugin configuration
  ]
})
```

## Troubleshooting

### Common Issues

#### Authentication Failures

**Problem**: `Error: GitHub authentication failed`

**Solutions**:

1. Verify token has correct permissions (Contents: write, Metadata: read, Pull requests: write)
2. Check token expiration date
3. Ensure token is properly set in CI/CD environment
4. For branch protection, use a personal access token instead of `GITHUB_TOKEN`

#### Plugin Errors

**Problem**: `Plugin X failed with error Y`

**Solutions**:

1. Check plugin version compatibility
2. Verify plugin configuration syntax
3. Ensure required environment variables are set
4. Review plugin documentation for breaking changes

#### Branch Configuration Issues

**Problem**: `No release will be done as no commits match the release rules`

**Solutions**:

1. Check branch configuration matches your repository branches
2. Verify commits follow conventional commit format
3. Review release rules configuration
4. Use `--dry-run` to debug release detection

#### Build Timeouts

**Problem**: Semantic release hangs or times out

**Solutions**:

1. Increase CI/CD timeout limits
2. Optimize build steps to run in parallel
3. Use caching for dependencies
4. Consider splitting test and release stages

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# GitHub Actions
DEBUG=semantic-release:* npx semantic-release

# GitLab CI
SEMANTIC_RELEASE_DEBUG=true npx semantic-release

# Other platforms
export DEBUG=semantic-release:*
npx semantic-release
```

### Dry Run Mode

Test your configuration without making actual releases:

```bash
npx semantic-release --dry-run
```

This will:

- Analyze commits
- Determine next version
- Generate release notes
- Show what would be published
- Skip actual publishing steps

### Common Environment Variables

Debug your CI environment with these checks:

```typescript
// release.config.ts debugging
console.log('CI Environment:', {
  CI: process.env.CI,
  GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
  GITLAB_CI: process.env.GITLAB_CI,
  CIRCLECI: process.env.CIRCLECI,
  JENKINS_URL: process.env.JENKINS_URL,
  BUILD_BUILDID: process.env.BUILD_BUILDID, // Azure DevOps
  TRAVIS: process.env.TRAVIS,

  // Branch information
  GITHUB_REF: process.env.GITHUB_REF,
  CI_COMMIT_REF_NAME: process.env.CI_COMMIT_REF_NAME,
  CIRCLE_BRANCH: process.env.CIRCLE_BRANCH,
  GIT_BRANCH: process.env.GIT_BRANCH,
  BUILD_SOURCEBRANCHNAME: process.env.BUILD_SOURCEBRANCHNAME,

  // Authentication
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '***' : 'not set',
  NPM_TOKEN: process.env.NPM_TOKEN ? '***' : 'not set'
})
```

## Migration Guides

### From Manual Releases

1. **Audit current process** - Document your current release workflow
2. **Set up CI/CD pipeline** - Choose and configure your platform
3. **Configure semantic-release** - Create `release.config.ts`
4. **Test with dry run** - Verify configuration works correctly
5. **Gradual rollout** - Start with beta/staging releases
6. **Team training** - Ensure team understands conventional commits

### From Other Release Tools

#### From `release-it`

```typescript
// Before (release-it)
{
  "release-it": {
    "git": {
      "commitMessage": "chore: release v${version}"
    },
    "github": {
      "release": true
    },
    "npm": {
      "publish": true
    }
  }
}

// After (semantic-release)
export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', {
      message: 'chore: release v${nextRelease.version} [skip ci]'
    }]
  ]
})
```

#### From `standard-version`

```typescript
// Before (standard-version scripts)
{
  "scripts": {
    "release": "standard-version",
    "release:major": "standard-version --release-as major",
    "release:minor": "standard-version --release-as minor",
    "release:patch": "standard-version --release-as patch"
  }
}

// After (semantic-release - automatic versioning)
export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    '@semantic-release/git'
  ]
})
```

## Performance Optimization

### Caching Strategies

#### npm Dependencies

```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# GitLab CI
cache:
  paths:
    - node_modules/
    - .npm/

# CircleCI
- restore_cache:
    keys:
      - v1-dependencies-{{ checksum "package-lock.json" }}
      - v1-dependencies-
```

#### Build Artifacts

```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: dist
    key: ${{ runner.os }}-build-${{ github.sha }}

# Azure DevOps
- task: Cache@2
  inputs:
    key: 'build | $(Agent.OS) | $(Build.SourceVersion)'
    path: 'dist'
```

### Parallel Execution

Configure parallel jobs for faster builds:

```yaml
# GitHub Actions Matrix
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]

# GitLab CI Parallel
test:
  parallel:
    matrix:
      - NODE_VERSION: [18, 20, 22]
        OS: [ubuntu, alpine]
```

### Conditional Steps

Skip unnecessary steps to reduce build time:

```yaml
# Only run release on main branch
- name: Release
  if: github.ref == 'refs/heads/main'
  run: npx semantic-release

# Skip tests on documentation changes
- name: Test
  if: "!contains(github.event.head_commit.message, '[skip tests]')"
  run: npm test
```

## Best Practices Summary

1. **Security First** - Use proper token management and branch protection
2. **Test Thoroughly** - Use dry run mode and test in staging environments
3. **Monitor Releases** - Set up notifications and monitoring for release processes
4. **Optimize Performance** - Use caching and parallel execution where possible
5. **Document Process** - Maintain clear documentation for your team
6. **Gradual Adoption** - Roll out semantic-release incrementally
7. **Stay Updated** - Keep semantic-release and plugins updated
8. **Backup Strategy** - Have rollback procedures for failed releases

## Next Steps

- **Plugin Development**: Learn how to create custom plugins - see [Plugin Development Guide](./plugin-development.md)
- **Advanced Configuration**: Explore complex configuration patterns - see [Advanced Configuration Guide](./advanced-configuration.md)
- **Monorepo Setup**: Configure releases for monorepos - see documentation coming in TASK-048
- **Migration**: Migrate from existing release tools - see [Migration Guide](./migration-guide.md)

For more information and examples, visit the [official semantic-release documentation](https://semantic-release.gitbook.io/).
