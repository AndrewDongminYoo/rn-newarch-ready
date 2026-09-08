"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const CLI = path.join(__dirname, "..", "src", "cli.js");
const DEPS_APP = path.join(__dirname, "fixtures", "deps-app");
const BASIC_APP = path.join(__dirname, "fixtures", "basic-app");
const INCOMPLETE_APP = path.join(__dirname, "fixtures", "incomplete-app");
const NATIVE_APP = path.join(__dirname, "fixtures", "native-app");
const NON_RN_APP = path.join(__dirname, "fixtures", "non-rn-app");

function runCli(args) {
  const r = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  if (r.error) throw r.error;
  return r.stdout;
}

function runCliRaw(args) {
  const r = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  if (r.error) throw r.error;
  return r;
}

describe("cli", () => {
  test("--json prints the machine-readable report", () => {
    const out = runCli([DEPS_APP, "--json", "--offline"]);
    const report = JSON.parse(out);

    expect(report.summary.verdict).toBe("incomplete");
    expect(report.project.rnVersion).toBe("0.76.3");
  });

  test("default output is human-readable and names the verdict", () => {
    const out = runCli([DEPS_APP, "--offline"]);

    expect(out).toMatch(/incomplete/);
    expect(out).toMatch(/rn-legacy/);
  });

  test("--offline notes that the directory lookup was skipped", () => {
    const out = runCli([DEPS_APP, "--offline"]);

    expect(out).toMatch(/directory lookup skipped/i);
  });

  test("exits with code 1 when verdict is needs-review", () => {
    const r = runCliRaw([NATIVE_APP, "--offline"]);
    expect(r.status).toBe(1);
  });

  test("exits with code 0 when verdict is ready", () => {
    const r = runCliRaw([BASIC_APP, "--offline"]);
    expect(r.status).toBe(0);
  });

  test("exits with code 1 when the audit is incomplete", () => {
    const r = runCliRaw([INCOMPLETE_APP, "--offline"]);

    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/not installed/i);
    expect(r.stdout).toMatch(/incomplete/);
  });

  test("exits with code 2 when the target is not a React Native project", () => {
    const r = runCliRaw([NON_RN_APP, "--offline"]);

    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(
      /Project does not declare react-native in package.json/,
    );
  });
});
