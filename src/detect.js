"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Inspect a React Native project directory and report its RN version and the
 * current New Architecture enablement state per platform. Read-only.
 *
 * Each platform flag is `true`/`false` when a definitive marker is found, or
 * `null` when it cannot be determined statically (never guessed).
 *
 * @param {string} projectDir - absolute path to the RN project root
 * @returns {{ rnVersion: string|null, newArchEnabled: { android: boolean|null, ios: boolean|null, expo: boolean|null } }}
 */
function detectProject(projectDir) {
  return {
    rnVersion: detectRnVersion(projectDir),
    newArchEnabled: {
      android: detectAndroidNewArch(projectDir),
      ios: null,
      expo: null,
    },
  };
}

function detectRnVersion(projectDir) {
  const pkg = readJson(path.join(projectDir, "package.json"));
  if (!pkg) {
    return null;
  }
  const range =
    (pkg.dependencies && pkg.dependencies["react-native"]) ||
    (pkg.devDependencies && pkg.devDependencies["react-native"]);
  if (!range) {
    return null;
  }
  return normalizeVersion(range);
}

function detectAndroidNewArch(projectDir) {
  const content = readFile(path.join(projectDir, "android", "gradle.properties"));
  if (content === null) {
    return null;
  }
  const match = content.match(/^\s*newArchEnabled\s*=\s*(true|false)\s*$/m);
  if (!match) {
    return null;
  }
  return match[1] === "true";
}

function normalizeVersion(range) {
  return String(range).replace(/^[\^~>=<\s]+/, "").trim();
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function readJson(filePath) {
  const content = readFile(filePath);
  if (content === null) {
    return null;
  }
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

module.exports = { detectProject };
