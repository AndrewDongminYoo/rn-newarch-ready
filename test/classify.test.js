"use strict";

const { classifyDependency } = require("../src/classify");

describe("classifyDependency", () => {
  test("a package exposing codegenConfig is classified supported", () => {
    const packageJson = {
      name: "react-native-something",
      codegenConfig: { name: "RNSomethingSpec", type: "modules" },
    };

    const result = classifyDependency(packageJson, { hasNativeBuildFiles: true });

    expect(result.status).toBe("supported");
  });

  test("a native package without codegenConfig is unknown, not unsupported", () => {
    const packageJson = {
      name: "react-native-legacy",
      peerDependencies: { "react-native": "*" },
    };

    const result = classifyDependency(packageJson, { hasNativeBuildFiles: true });

    expect(result.status).toBe("unknown");
  });

  test("a package with no native footprint is classified not-native", () => {
    const packageJson = { name: "lodash" };

    const result = classifyDependency(packageJson, { hasNativeBuildFiles: false });

    expect(result.status).toBe("not-native");
  });
});
