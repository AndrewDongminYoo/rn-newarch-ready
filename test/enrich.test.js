"use strict";

const { enrichDependency } = require("../src/enrich");

const dep = (status) => ({ name: "x", version: "1.0.0", status });

describe("enrichDependency", () => {
  test("an unknown native dep the directory marks newArchitecture=true becomes likely-supported (not confirmed)", () => {
    const result = enrichDependency(dep("unknown"), {
      newArchitecture: true,
      isArchived: false,
    });

    // A distinct, softer tier than locally-confirmed `supported`: the directory
    // flag is library-level (repo HEAD), not pinned to the installed version.
    expect(result.status).toBe("likely-supported");
    expect(result.source).toBe("directory");
  });

  test("an unknown dep with directory newArchitecture=false stays unknown (the directory lags; never a confident failure)", () => {
    const result = enrichDependency(dep("unknown"), {
      newArchitecture: false,
      isArchived: false,
    });

    expect(result.status).toBe("unknown");
  });

  test("an unknown dep absent from the directory stays unknown", () => {
    const result = enrichDependency(dep("unknown"), null);

    expect(result.status).toBe("unknown");
  });

  test("a not-native dep is never promoted, even if the directory marks newArchitecture=true", () => {
    const result = enrichDependency(dep("not-native"), {
      newArchitecture: true,
      isArchived: false,
    });

    expect(result.status).toBe("not-native");
  });

  test("an archived native dep is flagged archived (orthogonal to readiness status)", () => {
    const result = enrichDependency(dep("unknown"), {
      newArchitecture: false,
      isArchived: true,
    });

    expect(result.archived).toBe(true);
    expect(result.status).toBe("unknown");
  });

  test("the archived flag is scoped to native deps — a not-native dep is not flagged", () => {
    const result = enrichDependency(dep("not-native"), {
      newArchitecture: false,
      isArchived: true,
    });

    expect(result.archived).toBe(false);
  });
});
