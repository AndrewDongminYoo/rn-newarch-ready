"use strict";

const path = require("path");
const { audit } = require("../src/index");

const DEPS_APP = path.join(__dirname, "fixtures", "deps-app");

function statusOf(report, name) {
  const dep = report.dependencies.find((d) => d.name === name);
  return dep && dep.status;
}

describe("audit", () => {
  test("classifies each installed dependency by its codegenConfig signal", () => {
    const report = audit(DEPS_APP);

    expect(statusOf(report, "rn-supported")).toBe("supported");
    expect(statusOf(report, "rn-legacy")).toBe("unknown");
    expect(statusOf(report, "plain-lib")).toBe("not-native");
  });

  test("composes project detection and a roll-up verdict", () => {
    const report = audit(DEPS_APP);

    expect(report.project.rnVersion).toBe("0.76.3");
    expect(report.summary.verdict).toBe("needs-review");
  });

  test("a declared dependency that is not installed is reported as not-installed", () => {
    const report = audit(DEPS_APP);

    expect(statusOf(report, "ghost-lib")).toBe("not-installed");
  });

  test("devDependencies are excluded from the audit", () => {
    const report = audit(DEPS_APP);

    expect(statusOf(report, "dev-only-tool")).toBeUndefined();
  });
});
