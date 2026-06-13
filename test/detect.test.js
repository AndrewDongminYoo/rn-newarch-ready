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

  test("reports Expo New Architecture from app.json expo.newArchEnabled", () => {
    const result = detectProject(path.join(FIXTURES, "expo-app"));

    expect(result.newArchEnabled.expo).toBe(true);
  });

  test("reports iOS New Architecture from ios/Podfile.properties.json", () => {
    const result = detectProject(path.join(FIXTURES, "ios-app"));

    expect(result.newArchEnabled.ios).toBe(true);
  });

  test("leaves iOS and Expo null when no marker is present (never guessed)", () => {
    const result = detectProject(path.join(FIXTURES, "basic-app"));

    expect(result.newArchEnabled.ios).toBeNull();
    expect(result.newArchEnabled.expo).toBeNull();
  });
});
