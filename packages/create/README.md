@bfra.me/create
===============

bfra.me create commands

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@bfra.me/create.svg)](https://npmjs.org/package/@bfra.me/create)
[![Downloads/week](https://img.shields.io/npm/dw/@bfra.me/create.svg)](https://npmjs.org/package/@bfra.me/create)
[![License](https://img.shields.io/npm/l/@bfra.me/create.svg)](https://github.com/bfra-me/works/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @bfra.me/create
$ create COMMAND
running command...
$ create (-v|--version|version)
@bfra.me/create/0.0.0 darwin-x64 node-v14.9.0
$ create --help [COMMAND]
USAGE
  $ create COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`create hello [FILE]`](#create-hello-file)
* [`create help [COMMAND]`](#create-help-command)

## `create hello [FILE]`

describe the command here

```
USAGE
  $ create hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ create hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/bfra-me/works/blob/v0.0.0/src/commands/hello.ts)_

## `create help [COMMAND]`

display help for create

```
USAGE
  $ create help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_
<!-- commandsstop -->
