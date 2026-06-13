"use strict";

const fs = require("fs");
const path = require("path");

// Directories never worth walking for app-local native source.
const SKIP_DIRS = new Set([
  "node_modules",
  "build",
  "Pods",
  ".gradle",
  "DerivedData",
  ".cxx",
]);

const ANDROID_EXT = new Set([".java", ".kt"]);
const IOS_EXT = new Set([".m", ".mm", ".swift", ".h"]);

// Legacy (old-architecture-only) API markers, per platform.
const ANDROID_LEGACY = [
  "ReactContextBaseJavaModule",
  "BaseJavaModule",
  "SimpleViewManager",
  "onCatalystInstanceDestroy",
];
const IOS_LEGACY = ["RCT_EXPORT_MODULE", "RCT_EXPORT_METHOD"];

// Any of these means the file already has a New Architecture path, so a legacy
// marker alongside them is a migrated/dual module — not flagged. Conservative:
// when in doubt about migration, do not flag.
const NEWARCH_MARKER =
  /RCT_NEW_ARCH_ENABLED|TurboModule|codegenNativeComponent|\bNative\w+Spec\b/;

/**
 * Scan a project's own native source (android/ and ios/) for modules that use
 * only legacy APIs and carry no New Architecture marker. Read-only, best-effort
 * static analysis: it reports candidates for manual review, never a definitive
 * verdict, and cannot see dynamically generated or non-standard layouts.
 *
 * @param {string} projectDir
 * @returns {Array<{ path: string, platform: "android"|"ios", signals: string[] }>}
 */
function scanLocalNativeModules(projectDir) {
  return [
    ...scanPlatform(projectDir, "android", ANDROID_EXT, ANDROID_LEGACY),
    ...scanPlatform(projectDir, "ios", IOS_EXT, IOS_LEGACY),
  ];
}

function scanPlatform(projectDir, platform, exts, legacyMarkers) {
  const root = path.join(projectDir, platform);
  const out = [];
  for (const file of walk(root, exts)) {
    const content = safeRead(file);
    if (content === null || NEWARCH_MARKER.test(content)) {
      continue;
    }
    const signals = legacyMarkers.filter((m) => content.includes(m));
    if (signals.length > 0) {
      out.push({ path: path.relative(projectDir, file), platform, signals });
    }
  }
  return out;
}

function* walk(dir, exts) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        yield* walk(path.join(dir, entry.name), exts);
      }
    } else if (exts.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name);
    }
  }
}

function safeRead(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

module.exports = { scanLocalNativeModules };
