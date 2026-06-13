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

  const verdict = (counts.unknown || 0) > 0 || archived > 0 ? "needs-review" : "ready";

  return { counts, archived, verdict };
}

module.exports = { summarize };
