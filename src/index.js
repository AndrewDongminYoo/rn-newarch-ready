"use strict";

const fs = require("fs");
const path = require("path");

const { detectProject } = require("./detect");
const { classifyDependency } = require("./classify");
const { enrichDependency } = require("./enrich");
const { summarize } = require("./report");

/**
 * Run a read-only New Architecture readiness audit on an RN project.
 *
 * @param {string} projectDir - absolute path to the RN project root
 * @param {object} [opts]
 * @param {Map<string, object>} [opts.directory] - React Native Directory index
 *   (npm name -> { newArchitecture, isArchived }); when provided, unknown native
 *   deps may be promoted and archived deps flagged. Omitted -> local signals only.
 * @returns {{ project: object, dependencies: Array<object>, summary: object }}
 */
function audit(projectDir, opts = {}) {
  const project = detectProject(projectDir);
  const directory = opts.directory || null;
  const dependencies = scanDependencies(projectDir).map((dep) =>
    enrichDependency(dep, directory ? directory.get(dep.name) : null),
  );
  const summary = summarize(dependencies);
  return { project, dependencies, summary };
}

/**
 * Read the project's declared dependencies, resolve each from node_modules, and
 * classify it. A declared-but-not-installed dependency is reported as unknown
 * rather than dropped.
 */
function scanDependencies(projectDir) {
  const pkg = readJson(path.join(projectDir, "package.json")) || {};
  // Runtime dependencies only: New Arch readiness is about what ships in the
  // app binary, so devDependencies (build/test tooling) are not relevant.
  const names = Object.keys(pkg.dependencies || {}).filter(
    (name) => name !== "react-native" && name !== "react",
  );

  return names.map((name) => classifyInstalled(projectDir, name));
}

function classifyInstalled(projectDir, name) {
  const depDir = path.join(projectDir, "node_modules", name);
  const depPkg = readJson(path.join(depDir, "package.json"));
  if (!depPkg) {
    // Declared but not resolved in node_modules — we cannot classify it. This
    // is a distinct fact from "native module with no signal" (unknown), so it
    // gets its own status and does not drive the readiness verdict.
    return { name, version: null, status: "not-installed" };
  }
  const { status } = classifyDependency(depPkg, {
    hasNativeBuildFiles: hasNativeBuildFiles(depDir),
  });
  return { name, version: depPkg.version || null, status };
}

/** A dependency ships native code if it has a podspec, android/, or ios/ dir. */
function hasNativeBuildFiles(depDir) {
  if (isDir(path.join(depDir, "android")) || isDir(path.join(depDir, "ios"))) {
    return true;
  }
  return listFiles(depDir).some((f) => f.endsWith(".podspec"));
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

module.exports = { audit };
