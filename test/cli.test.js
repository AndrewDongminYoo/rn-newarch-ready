"use strict";

const path = require("path");
const { execFileSync } = require("child_process");

const CLI = path.join(__dirname, "..", "src", "cli.js");
const DEPS_APP = path.join(__dirname, "fixtures", "deps-app");

function runCli(args) {
  return execFileSync("node", [CLI, ...args], { encoding: "utf8" });
}

describe("cli", () => {
  test("--json prints the machine-readable report", () => {
    const out = runCli([DEPS_APP, "--json"]);
    const report = JSON.parse(out);

    expect(report.summary.verdict).toBe("needs-review");
    expect(report.project.rnVersion).toBe("0.76.3");
  });

  test("default output is human-readable and names the verdict", () => {
    const out = runCli([DEPS_APP]);

    expect(out).toMatch(/needs-review/);
    expect(out).toMatch(/rn-legacy/);
  });
});
