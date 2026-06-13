"use strict";

const { buildDirectoryIndex } = require("../src/directory");

describe("buildDirectoryIndex", () => {
  test("indexes libraries by npm package name with their New Arch and archived flags", () => {
    const index = buildDirectoryIndex([
      { npmPkg: "react-native-screens", github: { newArchitecture: true, isArchived: false } },
      { npmPkg: "@notifee/react-native", github: { newArchitecture: false, isArchived: true } },
    ]);

    expect(index.get("react-native-screens")).toEqual({
      newArchitecture: true,
      isArchived: false,
    });
    expect(index.get("@notifee/react-native").isArchived).toBe(true);
  });

  test("skips entries that have no npm package name", () => {
    const index = buildDirectoryIndex([
      { github: { newArchitecture: true } },
      { npmPkg: "react-native-svg", github: { newArchitecture: true } },
    ]);

    expect(index.size).toBe(1);
    expect(index.has("react-native-svg")).toBe(true);
  });
});
