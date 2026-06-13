"use strict";

/**
 * Classify a single dependency's New Architecture readiness from its
 * package.json. Conservative by design: a positive signal yields "supported";
 * the absence of a signal never implies "unsupported" — it yields "unknown".
 *
 * @param {object} packageJson - the dependency's parsed package.json
 * @param {object} [opts]
 * @param {boolean} [opts.hasNativeBuildFiles] - whether the dependency ships
 *   native build files (a *.podspec, android/, or ios/ directory)
 * @returns {{ status: "supported" | "unknown" | "not-native" }}
 */
function classifyDependency(packageJson, opts = {}) {
  const pkg = packageJson || {};

  if (pkg.codegenConfig) {
    return { status: "supported" };
  }

  if (opts.hasNativeBuildFiles) {
    return { status: "unknown" };
  }

  return { status: "not-native" };
}

module.exports = { classifyDependency };
