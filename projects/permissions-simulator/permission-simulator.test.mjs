import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPermissionSimulator } from "./permission-simulator.mjs";

const quest = JSON.parse(await readFile(new URL("./fixtures.json", import.meta.url), "utf8"));

test("documented inspection commands return bounded simulated fixture data", () => {
  const sim = createPermissionSimulator(quest);
  assert.equal(sim.execute("pwd").message, "/home/student/academy/archive");
  assert.equal(sim.execute("ls").message, "supply-ledger.txt");
  assert.equal(sim.execute("whoami").message, "student");
  const listing = sim.execute("ls -l supply-ledger.txt");
  assert.equal(listing.message, "-rw------- 1 student archivists supply-ledger.txt");
  assert.equal(listing.environmentKind, "simulation");
  assert.equal(listing.actualVmDemonstrated, false);
});

test("archive supports alternative symbolic and octal solutions", () => {
  for (const command of [
    "chmod g+r supply-ledger.txt",
    "chmod u=rw,g=r,o= supply-ledger.txt",
    "chmod 640 supply-ledger.txt",
    "chmod 0640 supply-ledger.txt",
  ]) {
    const sim = createPermissionSimulator(quest);
    sim.execute("ls -l supply-ledger.txt");
    const result = sim.execute(command);
    assert.equal(result.kind, "mutation");
    assert.equal(result.evaluation.outcome, "modeled_policy_match");
    assert.equal(result.evaluation.actualVmDemonstrated, false);
    assert.equal(result.evaluation.metadataInspectedBeforeFirstMutation, true);
  }
});

test("valid overbroad access is a modeled choice and fails policy", () => {
  const sim = createPermissionSimulator(quest);
  const result = sim.execute("chmod a+r supply-ledger.txt");
  assert.equal(result.kind, "mutation");
  assert.equal(result.evaluation.outcome, "modeled_policy_mismatch");
  assert.equal(result.evaluation.access.visitor.read, true);
  assert.equal(result.evaluation.masteryInferred, false);
});

test("execute access remains a valid choice but cannot pass the policy", () => {
  const sim = createPermissionSimulator(quest);
  const result = sim.execute("chmod 741 supply-ledger.txt");
  assert.equal(result.kind, "mutation");
  assert.equal(result.evaluation.noExecuteAccess, false);
  assert.equal(result.evaluation.outcome, "modeled_policy_mismatch");
});

test("greenhouse requires removing existing visitor read", () => {
  const sim = createPermissionSimulator(quest, { fixture: "greenhouse" });
  assert.equal(sim.execute("chmod g+r watering-schedule.txt").evaluation.outcome, "modeled_policy_mismatch");
  const fixed = sim.execute("chmod o-r watering-schedule.txt");
  assert.equal(fixed.evaluation.outcome, "modeled_policy_match");
  assert.deepEqual(fixed.evaluation.access.gardener, { read: true, write: false, execute: false });
  assert.deepEqual(fixed.evaluation.access.visitor, { read: false, write: false, execute: false });
});

test("symbolic clauses apply sequentially", () => {
  const sim = createPermissionSimulator(quest);
  sim.execute("chmod a=r,u+w,g-w,o-r supply-ledger.txt");
  assert.equal(sim.getState().file.mode, "0640");
});

test("malformed and shell-like inputs never mutate", () => {
  const rejected = [
    "chmod g+ supply-ledger.txt",
    "chmod g+r ../supply-ledger.txt",
    "chmod -R 640 supply-ledger.txt",
    "chmod 640 supply-ledger.txt extra",
    "chmod 640 supply-ledger.txt; whoami",
    "chmod 640 supply-ledger.txt|whoami",
    "chmod 640 supply-ledger.txt>elsewhere",
    "chmod $(whoami) supply-ledger.txt",
    "chmod ${MODE} supply-ledger.txt",
    "ls -la supply-ledger.txt",
    "cat supply-ledger.txt",
  ];
  for (const command of rejected) {
    const sim = createPermissionSimulator(quest);
    const result = sim.execute(command);
    assert.equal(result.kind, "unsupported", command);
    assert.equal(result.mutated, false, command);
    assert.equal(sim.getState().file.mode, "0600", command);
    assert.match(result.message, /Nothing was changed\.$/);
  }
});

test("owner class takes precedence over matching group membership", () => {
  const custom = structuredClone(quest);
  custom.fixture.file.initialMode = "0040";
  const sim = createPermissionSimulator(custom);
  assert.deepEqual(sim.effectiveAccess("student"), { read: false, write: false, execute: false });
  assert.deepEqual(sim.effectiveAccess("archivist"), { read: true, write: false, execute: false });
});

test("metadata inspection must occur before the first valid chmod", () => {
  const sim = createPermissionSimulator(quest);
  sim.execute("chmod 640 supply-ledger.txt");
  sim.execute("ls -l supply-ledger.txt");
  assert.equal(sim.evaluate().metadataInspectedBeforeFirstMutation, false);

  const inspected = createPermissionSimulator(quest);
  inspected.execute("ls -l supply-ledger.txt");
  inspected.execute("chmod 640 supply-ledger.txt");
  assert.equal(inspected.evaluate().metadataInspectedBeforeFirstMutation, true);
});

test("instances are isolated and reset restores all attempt state", () => {
  const first = createPermissionSimulator(quest);
  const second = createPermissionSimulator(quest);
  first.execute("ls -l supply-ledger.txt");
  first.execute("chmod 777 supply-ledger.txt");
  assert.equal(second.getState().file.mode, "0600");

  const reset = first.reset();
  assert.equal(reset.file.mode, "0600");
  assert.equal(reset.actions.length, 0);
  assert.equal(reset.metadataInspectedBeforeFirstMutation, false);
  assert.equal(reset.firstMutationOccurred, false);
});
