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
      ios: detectIosNewArch(projectDir),
      expo: detectExpoNewArch(projectDir),
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
  const content = readFile(
    path.join(projectDir, "android", "gradle.properties"),
  );
  if (content === null) {
    return null;
  }
  const match = content.match(/^\s*newArchEnabled\s*=\s*(true|false)\s*$/m);
  if (!match) {
    return null;
  }
  return match[1] === "true";
}

function detectExpoNewArch(projectDir) {
  // app.config.js/.ts are executable and not statically parsed here; app.json /
  // app.config.json cover the common static case.
  for (const file of ["app.json", "app.config.json"]) {
    const config = readJson(path.join(projectDir, file));
    if (!config) {
      continue;
    }
    const expo = config.expo || config;
    if (typeof expo.newArchEnabled === "boolean") {
      return expo.newArchEnabled;
    }
  }
  return null;
}

function detectIosNewArch(projectDir) {
  const props = readJson(
    path.join(projectDir, "ios", "Podfile.properties.json"),
  );
  if (props && props.newArchEnabled != null) {
    return props.newArchEnabled === true || props.newArchEnabled === "true";
  }

  for (const file of [".xcode.env.local", ".xcode.env"]) {
    const env = readFile(path.join(projectDir, "ios", file));
    const match = env && env.match(/RCT_NEW_ARCH_ENABLED\s*=\s*(\d)/);
    if (match) {
      return match[1] === "1";
    }
  }

  const podfile = readFile(path.join(projectDir, "ios", "Podfile"));
  if (podfile && /:new_arch_enabled\s*=>\s*true/.test(podfile)) {
    return true;
  }

  return null;
}

function normalizeVersion(range) {
  return String(range)
    .replace(/^[\^~>=<\s]+/, "")
    .trim();
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
