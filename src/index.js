"use strict";

const fs = require("fs");
const path = require("path");

const { detectProject } = require("./detect");
const { classifyDependency } = require("./classify");
const { enrichDependency } = require("./enrich");
const {
  scanDependencyNativeModules,
  scanLocalNativeModules,
} = require("./nativeScan");
const { summarize } = require("./report");

/**
 * Run a read-only New Architecture readiness audit on an RN project.
 *
 * @param {string} projectDir - absolute path to the RN project root
 * @param {object} [opts]
 * @param {Map<string, object>} [opts.directory] - React Native Directory index
 *   (npm name -> { newArchitecture, isArchived }); when provided, unknown native
 *   deps may be promoted and archived deps flagged. Omitted -> local signals only.
 * @returns {{ project: object, dependencies: Array<object>, localNativeModules: Array<object>, dependencyNativeModules: Array<object>, summary: object }}
 */
function audit(projectDir, opts = {}) {
  const project = detectProject(projectDir);
  if (!project.rnVersion) {
    const error = new Error(
      "Project does not declare react-native in package.json",
    );
    error.code = "INVALID_PROJECT";
    throw error;
  }

  const directory = opts.directory || null;
  const localDependencies = scanDependencies(projectDir);
  const dependencies = localDependencies.map((dep) =>
    enrichDependency(dep, directory ? directory.get(dep.name) : null),
  );
  const localNativeModules = scanLocalNativeModules(projectDir);
  const dependencyNativeModules = scanDependencyNativeModules(
    projectDir,
    localDependencies
      .filter((dep) => dep.status === "unknown")
      .map((dep) => dep.name),
  );
  const summary = summarize(dependencies, {
    dependencyNativeModules: dependencyNativeModules.length,
    localNativeModules: localNativeModules.length,
  });
  return {
    project,
    dependencies,
    localNativeModules,
    dependencyNativeModules,
    summary,
  };
}

/**
 * Read the project's declared dependencies, resolve each from node_modules, and
 * classify it. A declared-but-not-installed dependency is reported as
 * `not-installed` rather than dropped.
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
    // gets its own status and makes the audit incomplete.
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
