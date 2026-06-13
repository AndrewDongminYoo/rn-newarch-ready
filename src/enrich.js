"use strict";

const NATIVE_STATUSES = new Set(["supported", "unknown"]);

/**
 * Enrich a locally-classified dependency with React Native Directory data.
 *
 * Two orthogonal axes are kept separate:
 *   - `status`   — New Architecture readiness (supported / unknown / ...)
 *   - `archived` — maintenance state (boolean), scoped to native deps
 *
 * Only the `unknown` bucket is ever reclassified, and only upward: a directory
 * `newArchitecture === true` promotes it to `likely-supported` — a softer tier
 * than locally-confirmed `supported`, because the directory flag is library-level
 * (repo HEAD) and not pinned to the installed version. A `false`/absent flag
 * never produces a confident failure — the directory lags real support, so the
 * dep stays `unknown`. not-native / not-installed / supported are left as-is.
 *
 * @param {{ name: string, version: string|null, status: string }} local
 * @param {{ newArchitecture?: boolean, isArchived?: boolean }|null} [entry]
 *   the matching directory entry's github metadata, or null if not found
 * @returns {{ name: string, version: string|null, status: string, archived: boolean, source?: string }}
 */
function enrichDependency(local, entry) {
  const isNative = NATIVE_STATUSES.has(local.status);
  const archived = Boolean(isNative && entry && entry.isArchived === true);

  if (local.status === "unknown" && entry && entry.newArchitecture === true) {
    return {
      ...local,
      status: "likely-supported",
      source: "directory",
      archived,
    };
  }

  return { ...local, archived };
}

module.exports = { enrichDependency };
