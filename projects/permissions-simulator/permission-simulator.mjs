const ENVIRONMENT_KIND = "simulation";
const LABEL = "SIMULATED LINUX TERMINAL";
const RIGHTS = { r: 4, w: 2, x: 1 };

function archiveFixture(quest) {
  const source = quest?.fixture;
  if (!source?.file || !source.accounts || !source.desiredAccess) {
    throw new TypeError("Quest JSON does not contain the archive fixture data.");
  }
  return {
    id: source.id,
    workingDirectory: source.workingDirectory,
    file: { ...source.file },
    accounts: structuredClone(source.accounts),
    desiredAccess: structuredClone(source.desiredAccess),
  };
}

function greenhouseFixture(quest) {
  const stage = quest?.stages?.find((candidate) => candidate.id === "transfer");
  const source = stage?.variant;
  if (!source?.file || !source.owner || !source.teammate || !source.visitor) {
    throw new TypeError("Quest JSON does not contain the greenhouse fixture data.");
  }
  return {
    id: "greenhouse-v1",
    workingDirectory: source.workingDirectory,
    file: {
      name: source.file,
      type: "regular_file",
      owner: source.owner.account,
      group: source.group,
      initialMode: source.initialMode,
      targetMode: source.targetMode,
      contents: "Fictional greenhouse schedule.",
    },
    accounts: {
      [source.owner.account]: {
        memberOf: [...source.owner.memberOf],
        role: "owner",
        privileged: source.owner.privileged,
      },
      [source.teammate.account]: {
        memberOf: [...source.teammate.memberOf],
        role: "teammate",
        privileged: source.teammate.privileged,
      },
      [source.visitor.account]: {
        memberOf: [...source.visitor.memberOf],
        role: "unrelated visitor",
        privileged: source.visitor.privileged,
      },
    },
    desiredAccess: {
      [source.owner.account]: { read: true, write: true, execute: false },
      [source.teammate.account]: { read: true, write: false, execute: false },
      [source.visitor.account]: { read: false, write: false, execute: false },
    },
  };
}

function normalizeMode(value) {
  const text = String(value);
  if (!/^0?[0-7]{3}$/.test(text)) throw new TypeError(`Invalid fixture mode: ${text}`);
  return Number.parseInt(text.slice(-3), 8);
}

function modeText(mode) {
  return `0${mode.toString(8).padStart(3, "0")}`;
}

function permissionText(mode) {
  let result = "-";
  for (const shift of [6, 3, 0]) {
    const bits = (mode >> shift) & 7;
    result += bits & 4 ? "r" : "-";
    result += bits & 2 ? "w" : "-";
    result += bits & 1 ? "x" : "-";
  }
  return result;
}

function publicFile(file, mode) {
  return {
    name: file.name,
    type: file.type,
    owner: file.owner,
    group: file.group,
    mode: modeText(mode),
    permissions: permissionText(mode),
  };
}

function parseMode(expression, current) {
  if (/^0?[0-7]{3}$/.test(expression)) return Number.parseInt(expression.slice(-3), 8);
  const clauses = expression.split(",");
  if (!clauses.length || clauses.some((clause) => !/^[ugoa][+=-](?:[rwx]+|(?<==))$/.test(clause))) {
    return null;
  }

  let mode = current;
  for (const clause of clauses) {
    const [, who, operator, rightsText] = clause.match(/^([ugoa])([+=-])(.*)$/);
    const targets = who === "a" ? [6, 3, 0] : [{ u: 6, g: 3, o: 0 }[who]];
    const rights = [...rightsText].reduce((sum, right) => sum | RIGHTS[right], 0);
    for (const shift of targets) {
      const mask = 7 << shift;
      if (operator === "=") mode = (mode & ~mask) | (rights << shift);
      if (operator === "+") mode |= rights << shift;
      if (operator === "-") mode &= ~(rights << shift);
    }
  }
  return mode;
}

function response(kind, message, extra = {}) {
  return {
    environmentKind: ENVIRONMENT_KIND,
    label: LABEL,
    actualVmDemonstrated: false,
    kind,
    message,
    ...extra,
  };
}

export function createPermissionSimulator(quest, options = {}) {
  const fixtureName = options.fixture ?? "archive";
  const fixture = fixtureName === "archive"
    ? archiveFixture(quest)
    : fixtureName === "greenhouse"
      ? greenhouseFixture(quest)
      : null;
  if (!fixture) throw new RangeError(`Unknown fixture: ${fixtureName}`);

  const initialMode = normalizeMode(fixture.file.initialMode);
  let mode = initialMode;
  let actions = [];
  let metadataInspectedBeforeFirstMutation = false;
  let firstMutationOccurred = false;

  function effectiveAccess(accountName) {
    const account = fixture.accounts[accountName];
    if (!account) throw new RangeError(`Unknown fixture account: ${accountName}`);
    const shift = accountName === fixture.file.owner
      ? 6
      : account.memberOf.includes(fixture.file.group) ? 3 : 0;
    const bits = (mode >> shift) & 7;
    return { read: Boolean(bits & 4), write: Boolean(bits & 2), execute: Boolean(bits & 1) };
  }

  function evaluate() {
    const access = Object.fromEntries(
      Object.keys(fixture.accounts).map((name) => [name, effectiveAccess(name)]),
    );
    const accessMatchesPolicy = Object.entries(fixture.desiredAccess).every(
      ([name, desired]) => Object.keys(desired).every((right) => access[name]?.[right] === desired[right]),
    );
    const noExecuteAccess = Object.values(access).every((entry) => !entry.execute);
    return response("evaluation", "Modeled simulation access evaluated against the fixture policy.", {
      fixtureId: fixture.id,
      file: publicFile(fixture.file, mode),
      access,
      accessMatchesPolicy,
      noExecuteAccess,
      outcome: accessMatchesPolicy && noExecuteAccess ? "modeled_policy_match" : "modeled_policy_mismatch",
      metadataInspectedBeforeFirstMutation,
      explanationEvaluated: false,
      masteryInferred: false,
    });
  }

  function getState() {
    return response("state", "Current in-memory simulation state.", {
      fixtureId: fixture.id,
      workingDirectory: fixture.workingDirectory,
      currentAccount: fixture.file.owner,
      file: publicFile(fixture.file, mode),
      metadataInspectedBeforeFirstMutation,
      firstMutationOccurred,
      actions: structuredClone(actions),
    });
  }

  function unsupported(message) {
    return response("unsupported", `${message} Nothing was changed.`, { mutated: false });
  }

  function execute(input) {
    if (typeof input !== "string") return unsupported("Commands must be text.");
    const command = input.trim();
    if (!command) return unsupported("Enter one documented simulation command.");
    if (/[\r\n;|&<>`]|\$\(|\$\{/.test(command)) {
      return unsupported("Shell operators, substitutions, redirection, and multiple commands are unsupported.");
    }
    if (command === "pwd") {
      const result = response("output", fixture.workingDirectory, { command, mutated: false });
      actions.push({ command, kind: result.kind, mutated: false });
      return result;
    }
    if (command === "ls") {
      const result = response("output", fixture.file.name, { command, mutated: false });
      actions.push({ command, kind: result.kind, mutated: false });
      return result;
    }
    if (command === "whoami") {
      const result = response("output", fixture.file.owner, { command, mutated: false });
      actions.push({ command, kind: result.kind, mutated: false });
      return result;
    }

    const listing = command.match(/^ls -l (\S+)$/);
    if (listing) {
      if (listing[1] !== fixture.file.name) {
        return unsupported("Only the active fixture file's exact basename is supported; paths and other names are unavailable.");
      }
      if (!firstMutationOccurred) metadataInspectedBeforeFirstMutation = true;
      const line = `${permissionText(mode)} 1 ${fixture.file.owner} ${fixture.file.group} ${fixture.file.name}`;
      const result = response("output", line, {
        command,
        mutated: false,
        file: publicFile(fixture.file, mode),
        inspectionRecorded: !firstMutationOccurred,
      });
      actions.push({ command, kind: result.kind, mutated: false, metadataInspection: true });
      return result;
    }

    const chmod = command.match(/^chmod (\S+) (\S+)$/);
    if (chmod) {
      if (chmod[1].startsWith("-")) return unsupported("chmod flags are unsupported in this simulation.");
      if (chmod[2] !== fixture.file.name) {
        return unsupported("Only the active fixture file's exact basename is supported; paths and other names are unavailable.");
      }
      const nextMode = parseMode(chmod[1], mode);
      if (nextMode === null) {
        return unsupported("Use three octal digits (optional leading 0), or sequential u/g/o/a symbolic clauses; empty rights are allowed only with '='.");
      }
      const before = modeText(mode);
      mode = nextMode;
      firstMutationOccurred = true;
      const result = response("mutation", `Modeled permissions changed from ${before} to ${modeText(mode)}.`, {
        command,
        mutated: true,
        file: publicFile(fixture.file, mode),
        evaluation: evaluate(),
      });
      actions.push({ command, kind: result.kind, mutated: true, before, after: modeText(mode) });
      return result;
    }

    if (/^(?:ls|chmod)\s/.test(command)) {
      return unsupported("That argument form is outside the documented simulation grammar; flags, paths, and trailing syntax are unsupported.");
    }
    return unsupported("Only pwd, ls, whoami, ls -l <active basename>, and chmod <mode> <active basename> are supported.");
  }

  function reset() {
    mode = initialMode;
    actions = [];
    metadataInspectedBeforeFirstMutation = false;
    firstMutationOccurred = false;
    return getState();
  }

  return Object.freeze({ execute, evaluate, getState, reset, effectiveAccess });
}
