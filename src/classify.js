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

  if (isNativeModule(pkg, opts)) {
    return { status: "unknown" };
  }

  return { status: "not-native" };
}

/**
 * A dependency is treated as a native module if it ships native build files or
 * declares a react-native peer/runtime relationship. codegenConfig is handled
 * separately by the caller as the stronger, positive signal.
 */
function isNativeModule(pkg, opts) {
  if (opts.hasNativeBuildFiles) {
    return true;
  }
  const peer = pkg.peerDependencies || {};
  const deps = pkg.dependencies || {};
  return Boolean(peer["react-native"] || deps["react-native"] || pkg["react-native"]);
}

module.exports = { classifyDependency };
