"use strict";

const fs = require("fs");
const path = require("path");

const { detectProject } = require("./detect");
const { classifyDependency } = require("./classify");
const { summarize } = require("./report");

/**
 * Run a read-only New Architecture readiness audit on an RN project.
 *
 * @param {string} projectDir - absolute path to the RN project root
 * @returns {{
 *   project: object,
 *   dependencies: Array<{ name: string, version: string|null, status: string }>,
 *   summary: object
 * }}
 */
function audit(projectDir) {
  const project = detectProject(projectDir);
  const dependencies = scanDependencies(projectDir);
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
  const names = Object.keys({
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  }).filter((name) => name !== "react-native" && name !== "react");

  return names.map((name) => classifyInstalled(projectDir, name));
}

function classifyInstalled(projectDir, name) {
  const depDir = path.join(projectDir, "node_modules", name);
  const depPkg = readJson(path.join(depDir, "package.json"));
  if (!depPkg) {
    return { name, version: null, status: "unknown" };
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
