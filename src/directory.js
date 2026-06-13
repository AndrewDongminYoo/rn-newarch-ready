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
 * @param {Array<{ npmPkg?: string, github?: object }>} libraries
 * @returns {Map<string, { newArchitecture: boolean|undefined, isArchived: boolean|undefined }>}
 */
function buildDirectoryIndex(libraries) {
  const index = new Map();
  for (const lib of libraries || []) {
    if (!lib || !lib.npmPkg) {
      continue;
    }
    const gh = lib.github || {};
    index.set(lib.npmPkg, {
      newArchitecture: gh.newArchitecture,
      isArchived: gh.isArchived,
    });
  }
  return index;
}

/**
 * Resolve a directory index: served from a fresh local cache when available,
 * otherwise fetched once and cached. Returns `null` on any failure (offline,
 * network error, bad payload) so the audit degrades to local-only signals
 * rather than throwing. I/O seam — not unit tested.
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
    const libraries = data.libraries || [];
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
