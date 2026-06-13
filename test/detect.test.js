"use strict";

const path = require("path");
const { detectProject } = require("../src/detect");

const FIXTURES = path.join(__dirname, "fixtures");

describe("detectProject", () => {
  test("reads the react-native version from package.json", () => {
    const result = detectProject(path.join(FIXTURES, "basic-app"));

    expect(result.rnVersion).toBe("0.76.3");
  });

  test("reports New Architecture enabled on Android from gradle.properties", () => {
    const result = detectProject(path.join(FIXTURES, "basic-app"));

    expect(result.newArchEnabled.android).toBe(true);
  });
});
