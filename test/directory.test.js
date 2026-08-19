"use strict";

const { buildDirectoryIndex } = require("../src/directory");

describe("buildDirectoryIndex", () => {
  test("indexes libraries by npm package name with their New Arch and archived flags", () => {
    const index = buildDirectoryIndex([
      {
        npmPkg: "react-native-screens",
        github: { newArchitecture: true, isArchived: false },
      },
      {
        npmPkg: "@notifee/react-native",
        github: { newArchitecture: false, isArchived: true },
      },
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

  test("the curated top-level flag wins over the repository-detected one", () => {
    const index = buildDirectoryIndex([
      {
        npmPkg: "expo-camera",
        newArchitecture: true,
        github: { newArchitecture: false, isArchived: false },
      },
      {
        npmPkg: "react-native-razorpay",
        newArchitecture: false,
        github: { newArchitecture: true, isArchived: false },
      },
    ]);

    expect(index.get("expo-camera").newArchitecture).toBe(true);
    expect(index.get("react-native-razorpay").newArchitecture).toBe(false);
  });

  test('"new-arch-only" is a stronger true, not a third state', () => {
    const index = buildDirectoryIndex([
      { npmPkg: "react-native-worklets", newArchitecture: "new-arch-only" },
    ]);

    expect(index.get("react-native-worklets").newArchitecture).toBe(true);
  });

  test("the repository-detected flag fills entries that declare nothing", () => {
    const index = buildDirectoryIndex([
      { npmPkg: "react-native-screens", github: { newArchitecture: true } },
    ]);

    expect(index.get("react-native-screens").newArchitecture).toBe(true);
  });

  test("a library marked unmaintained is archived even when its repo is not", () => {
    const index = buildDirectoryIndex([
      {
        npmPkg: "expo-av",
        unmaintained: true,
        github: { newArchitecture: false, isArchived: false },
      },
    ]);

    expect(index.get("expo-av").isArchived).toBe(true);
  });
});
