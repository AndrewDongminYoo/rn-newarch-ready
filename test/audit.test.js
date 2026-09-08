"use strict";

const path = require("path");
const { audit } = require("../src/index");

const DEPS_APP = path.join(__dirname, "fixtures", "deps-app");
const NATIVE_APP = path.join(__dirname, "fixtures", "native-app");
const INCOMPLETE_APP = path.join(__dirname, "fixtures", "incomplete-app");
const NON_RN_APP = path.join(__dirname, "fixtures", "non-rn-app");

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
    expect(report.summary.verdict).toBe("incomplete");
  });

  test("rejects a project that does not declare react-native", () => {
    expect(() => audit(NON_RN_APP)).toThrow(
      "Project does not declare react-native in package.json",
    );
  });

  test("reports an incomplete verdict when a runtime dependency is not installed", () => {
    const report = audit(INCOMPLETE_APP);

    expect(statusOf(report, "ghost-lib")).toBe("not-installed");
    expect(report.summary.verdict).toBe("incomplete");
  });

  test("a declared dependency that is not installed is reported as not-installed", () => {
    const report = audit(DEPS_APP);

    expect(statusOf(report, "ghost-lib")).toBe("not-installed");
  });

  test("devDependencies are excluded from the audit", () => {
    const report = audit(DEPS_APP);

    expect(statusOf(report, "dev-only-tool")).toBeUndefined();
  });

  test("directory data promotes an unknown native dep marked newArchitecture=true to likely-supported", () => {
    const directory = new Map([
      ["rn-legacy", { newArchitecture: true, isArchived: false }],
    ]);

    const report = audit(DEPS_APP, { directory });

    expect(statusOf(report, "rn-legacy")).toBe("likely-supported");
  });

  test("directory archived status is surfaced on the dependency", () => {
    const directory = new Map([
      ["rn-legacy", { newArchitecture: false, isArchived: true }],
    ]);

    const report = audit(DEPS_APP, { directory });
    const dep = report.dependencies.find((d) => d.name === "rn-legacy");

    expect(dep.archived).toBe(true);
    expect(dep.status).toBe("unknown");
  });

  test("reports app-local legacy native modules, which drive the verdict", () => {
    const report = audit(NATIVE_APP);

    expect(report.localNativeModules.length).toBe(2);
    expect(report.summary.verdict).toBe("needs-review");
  });

  test("reports legacy API candidates inside installed dependencies", () => {
    const report = audit(DEPS_APP);

    expect(report.dependencyNativeModules).toEqual([
      expect.objectContaining({
        dependency: "rn-legacy",
        platform: "android",
        signals: expect.arrayContaining(["ReactContextBaseJavaModule"]),
      }),
    ]);
  });
});
