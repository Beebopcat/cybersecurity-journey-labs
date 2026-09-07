# Offline permissions simulator

An AI-assisted learning component for practicing simple file-permission decisions. It models fictional owner, group, and visitor accounts entirely in memory. It does not run commands on your computer, access a real filesystem, or provision a virtual machine.

## Run the tests

Install Node.js 22 or newer, download this folder, and run:

```sh
node --test permission-simulator.test.mjs
```

No npm packages, API keys, or network connection are required after Node.js is installed. The reviewed version has **10 passing tests**.

## Try an exercise

Save this as `example.mjs` next to the other files, then run `node example.mjs`:

```js
import { readFile } from 'node:fs/promises';
import { createPermissionSimulator } from './permission-simulator.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures.json', import.meta.url), 'utf8'));
const sim = createPermissionSimulator(fixture);
console.log(sim.execute('ls -l supply-ledger.txt').message);
console.log(sim.execute('chmod g+r supply-ledger.txt').evaluation);
```

The archive begins with owner-only read/write access. The goal is to preserve the owner's access, give the archive group read access, and deny visitor access. The greenhouse variant starts with excessive visitor access and tests transfer to a different starting state:

```js
const greenhouse = createPermissionSimulator(fixture, { fixture: 'greenhouse' });
console.log(greenhouse.execute('chmod g+r,o-r watering-schedule.txt').evaluation);
```

## What is checked

- A bounded grammar: `pwd`, `ls`, `whoami`, `ls -l <fixture basename>`, and `chmod <mode> <fixture basename>`.
- Octal modes and sequential `u`, `g`, `o`, or `a` symbolic clauses.
- Owner permissions take precedence over matching group membership.
- Alternate solutions are evaluated by resulting access, rather than matching one expected command.
- Malformed input, shell operators, paths, flags, and unsupported commands do not change state.
- Each exercise instance has independent state and can be reset.

## Limits

This intentionally models only ordinary read/write/execute bits on a single fictional regular file. It does not model directory traversal, ACLs, special bits, privileged overrides, real users, or arbitrary shell syntax. It assumes trusted, well-formed exercise fixtures. Accounts in the included fixtures are unprivileged.

Passing the modeled access policy does not prove learner mastery. The component records whether metadata was inspected before the first change, but interpretation, explanation, transfer, and real-system practice require additional assessment. It is a standalone component; Unreal integration is in development.

The implementation and tests were produced with AI assistance and reviewed as part of Casey Shingledecker's learning-project workflow. All fixture accounts, paths, and file contents are fictional.
