"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  buildDirectoryIndex,
  fetchDirectoryIndex,
} = require("../src/directory");

const tempDirs = [];

afterEach(() => {
  jest.restoreAllMocks();
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createCacheFile() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rn-newarch-ready-"));
  tempDirs.push(tempDir);
  return path.join(tempDir, "directory.json");
}

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

describe("fetchDirectoryIndex", () => {
  test("returns and caches a valid directory response", async () => {
    const cacheFile = createCacheFile();
    const libraries = [
      {
        npmPkg: "react-native-screens",
        newArchitecture: true,
        unmaintained: false,
        github: { newArchitecture: true, isArchived: false },
      },
    ];
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ total: 1, libraries }),
    });

    const index = await fetchDirectoryIndex({ cacheFile });

    expect(index.get("react-native-screens")).toEqual({
      newArchitecture: true,
      isArchived: false,
    });
    expect(JSON.parse(fs.readFileSync(cacheFile, "utf8"))).toEqual(libraries);
  });

  test("rejects a response that omits the libraries array", async () => {
    const cacheFile = createCacheFile();
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ total: 1 }),
    });

    await expect(fetchDirectoryIndex({ cacheFile })).resolves.toBeNull();
    expect(fs.existsSync(cacheFile)).toBe(false);
  });
});
