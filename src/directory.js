"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

// The API paginates (30/page) unless given a large limit; one call fetches all.
const API_URL = "https://reactnative.directory/api/libraries?limit=5000";
const CACHE_FILE = path.join(os.tmpdir(), "rn-newarch-ready-directory.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Index React Native Directory library entries by npm package name, keeping
 * only the two flags this tool consumes. Entries without an npm name are
 * skipped (they cannot be matched against a project's dependencies).
 *
 * Each flag exists in two places in the payload. Reading only the `github`
 * fields omits curated readiness and maintenance data. The top-level fields
 * therefore take precedence, and the repository-derived fields act as a
 * fallback when the curated fields are absent.
 *
 * @param {Array<{ npmPkg?: string, newArchitecture?: boolean|string, unmaintained?: boolean, github?: object }>} libraries
 * @returns {Map<string, { newArchitecture: boolean|undefined, isArchived: boolean }>}
 */
function buildDirectoryIndex(libraries) {
  const index = new Map();
  for (const lib of libraries || []) {
    if (!lib || !lib.npmPkg) {
      continue;
    }
    const gh = lib.github || {};
    index.set(lib.npmPkg, {
      newArchitecture: resolveNewArchitecture(lib, gh),
      isArchived: lib.unmaintained === true || gh.isArchived === true,
    });
  }
  return index;
}

/**
 * Resolve the two New Architecture signals into one.
 *
 * The curated entry value wins wherever it is set, including when it says
 * `false`; `github.newArchitecture` is repository-detected and fills entries
 * that declare nothing. `"new-arch-only"` is a stronger form of
 * `true` — the library runs on the New Architecture and nothing else — so it
 * collapses to `true` for a readiness audit.
 */
function resolveNewArchitecture(lib, gh) {
  const declared = lib.newArchitecture;
  if (declared === true || declared === "new-arch-only") {
    return true;
  }
  if (declared === false) {
    return false;
  }
  return gh.newArchitecture;
}

/**
 * Resolve a directory index: served from a fresh local cache when available,
 * otherwise fetched once and cached. Returns `null` on any failure (offline,
 * network error, bad payload) so the audit degrades to local-only signals
 * rather than throwing. Invalid response payloads also return `null`.
 *
 * @returns {Promise<Map|null>}
 */
async function fetchDirectoryIndex(opts = {}) {
  const cacheFile = opts.cacheFile || CACHE_FILE;
  const ttl = opts.ttl == null ? CACHE_TTL_MS : opts.ttl;

  const cached = readFreshCache(cacheFile, ttl, opts.now);
  if (cached) {
    return buildDirectoryIndex(cached);
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.libraries)) {
      return null;
    }
    const libraries = data.libraries;
    if (typeof data.total === "number" && libraries.length < data.total) {
      // No silent caps: if the ?limit ever truncates the dataset, say so —
      // the dropped libraries would otherwise read as `unknown`.
      process.stderr.write(
        `rn-newarch-ready: directory returned ${libraries.length} of ${data.total} ` +
          `libraries; some may be missing from enrichment.\n`,
      );
    }
    writeCache(cacheFile, libraries);
    return buildDirectoryIndex(libraries);
  } catch {
    return null;
  }
}

function readFreshCache(cacheFile, ttl, now) {
  try {
    const stat = fs.statSync(cacheFile);
    const age = (now || Date.now()) - stat.mtimeMs;
    if (age > ttl) {
      return null;
    }
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(cacheFile, libraries) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(libraries));
  } catch {
    // best-effort cache; ignore write failures
  }
}

module.exports = { buildDirectoryIndex, fetchDirectoryIndex };
