"use strict";

/**
 * Roll up classified dependencies into counts and an overall verdict.
 *
 * Conservative: the local codegenConfig signal cannot prove a dependency is
 * incompatible, so there is no "blocker" verdict here — an unknown native
 * dependency yields "needs-review", never a false-confident failure.
 *
 * @param {Array<{ name: string, status: string, archived?: boolean }>} dependencies
 * @returns {{ counts: Record<string, number>, archived: number, verdict: "ready" | "needs-review" }}
 */
function summarize(dependencies) {
  const counts = {};
  let archived = 0;
  for (const dep of dependencies) {
    counts[dep.status] = (counts[dep.status] || 0) + 1;
    if (dep.archived) {
      archived += 1;
    }
  }

  // `ready` requires every native dep to be locally confirmed. `unknown` (no
  // signal) and `likely-supported` (directory-only, library-level — verify the
  // installed version) both warrant review. archived is a maintenance warning,
  // orthogonal to readiness, and does not by itself flip the verdict.
  const needsReview = (counts.unknown || 0) > 0 || (counts["likely-supported"] || 0) > 0;
  const verdict = needsReview ? "needs-review" : "ready";

  return { counts, archived, verdict };
}

module.exports = { summarize };
