"use strict";

const { summarize } = require("../src/report");

describe("summarize", () => {
  test("counts dependencies by status", () => {
    const result = summarize([
      { name: "a", status: "supported" },
      { name: "b", status: "supported" },
      { name: "c", status: "unknown" },
      { name: "d", status: "not-native" },
    ]);

    expect(result.counts).toEqual({
      supported: 2,
      unknown: 1,
      "not-native": 1,
    });
  });

  test("verdict is needs-review when any native dependency is unknown", () => {
    const result = summarize([
      { name: "a", status: "supported" },
      { name: "c", status: "unknown" },
    ]);

    expect(result.verdict).toBe("needs-review");
  });

  test("verdict is ready when every native dependency is supported", () => {
    const result = summarize([
      { name: "a", status: "supported" },
      { name: "d", status: "not-native" },
    ]);

    expect(result.verdict).toBe("ready");
  });

  test("a likely-supported (directory) dep is not counted as ready — verdict needs-review", () => {
    const result = summarize([
      { name: "a", status: "supported" },
      { name: "b", status: "likely-supported" },
    ]);

    expect(result.verdict).toBe("needs-review");
    expect(result.counts["likely-supported"]).toBe(1);
  });

  test("app-local legacy native modules drive needs-review", () => {
    const result = summarize([{ name: "a", status: "supported" }], {
      localNativeModules: 1,
    });

    expect(result.verdict).toBe("needs-review");
  });

  test("counts archived dependencies but keeps the verdict about readiness only", () => {
    const result = summarize([
      { name: "a", status: "supported", archived: true },
      { name: "b", status: "not-native", archived: false },
    ]);

    expect(result.archived).toBe(1);
    // archived is a maintenance warning, orthogonal to New Arch readiness — it
    // does not by itself flip the verdict.
    expect(result.verdict).toBe("ready");
  });
});
