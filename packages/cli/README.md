@bfra.me/cli
============

bfra.me command line

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@bfra.me/cli.svg)](https://npmjs.org/package/@bfra.me/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@bfra.me/cli.svg)](https://npmjs.org/package/@bfra.me/cli)
[![License](https://img.shields.io/npm/l/@bfra.me/cli.svg)](https://github.com/bfra-me/works/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @bfra.me/cli
$ bfra.me COMMAND
running command...
$ bfra.me (-v|--version|version)
@bfra.me/cli/0.0.0 darwin-x64 node-v14.9.0
$ bfra.me --help [COMMAND]
USAGE
  $ bfra.me COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`bfra.me hello [FILE]`](#bframe-hello-file)
* [`bfra.me help [COMMAND]`](#bframe-help-command)

## `bfra.me hello [FILE]`

describe the command here

```
USAGE
  $ bfra.me hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ bfra.me hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/bfra-me/works/blob/v0.0.0/src/commands/hello.ts)_

## `bfra.me help [COMMAND]`

display help for bfra.me

```
USAGE
  $ bfra.me help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_
<!-- commandsstop -->
