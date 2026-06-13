"use strict";

const path = require("path");
const { scanLocalNativeModules } = require("../src/nativeScan");

const FIXTURES = path.join(__dirname, "fixtures");
const names = (mods) => mods.map((m) => path.basename(m.path)).sort();

describe("scanLocalNativeModules", () => {
  test("flags app-local native modules that use only legacy APIs", () => {
    const mods = scanLocalNativeModules(path.join(FIXTURES, "native-app"));

    expect(names(mods)).toEqual(["LegacyModule.kt", "LegacyModule.m"]);
  });

  test("does not flag modules that carry a New Architecture marker", () => {
    const mods = scanLocalNativeModules(path.join(FIXTURES, "native-app"));
    const flagged = names(mods);

    expect(flagged).not.toContain("ModernModule.kt");
    expect(flagged).not.toContain("ModernModule.mm");
  });

  test("reports the matched legacy signals per module", () => {
    const mods = scanLocalNativeModules(path.join(FIXTURES, "native-app"));
    const kt = mods.find((m) => path.basename(m.path) === "LegacyModule.kt");

    expect(kt.platform).toBe("android");
    expect(kt.signals).toContain("ReactContextBaseJavaModule");
  });

  test("returns nothing for a project with no app-local native source", () => {
    const mods = scanLocalNativeModules(path.join(FIXTURES, "basic-app"));

    expect(mods).toEqual([]);
  });
});
