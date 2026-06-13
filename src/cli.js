#!/usr/bin/env node
"use strict";

const path = require("path");
const { audit } = require("./index");
const { fetchDirectoryIndex } = require("./directory");

async function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const offline = args.includes("--offline") || args.includes("--no-directory");
  const positional = args.filter((a) => !a.startsWith("-"));
  const projectDir = path.resolve(positional[0] || process.cwd());

  const directory = offline ? null : await fetchDirectoryIndex();
  const report = audit(projectDir, { directory });
  report.directoryUsed = Boolean(directory);

  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatReport(report)}\n`);
  }
}

function formatReport(report) {
  const { project, dependencies, summary } = report;
  const lines = [];

  lines.push("React Native — New Architecture readiness");
  lines.push(`  react-native: ${project.rnVersion || "unknown"}`);
  lines.push(
    `  New Arch enabled: android=${fmt(project.newArchEnabled.android)} ` +
      `ios=${fmt(project.newArchEnabled.ios)} expo=${fmt(project.newArchEnabled.expo)}`,
  );
  if (!report.directoryUsed) {
    lines.push("  (directory lookup skipped — local signals only)");
  }
  lines.push("");

  const archived = dependencies.filter((d) => d.archived);
  if (archived.length > 0) {
    lines.push("Archived / unmaintained native dependencies (plan a replacement):");
    for (const dep of archived) {
      lines.push(`  - ${dep.name}@${dep.version || "?"}`);
    }
    lines.push("");
  }

  const unknown = dependencies.filter((d) => d.status === "unknown");
  if (unknown.length > 0) {
    lines.push("Native dependencies we couldn't auto-confirm (verify via reactnative.directory or the library docs):");
    for (const dep of unknown) {
      lines.push(`  - ${dep.name}@${dep.version || "?"}`);
    }
    lines.push("");
  }

  const c = summary.counts;
  lines.push(
    `Summary: ${c.supported || 0} supported, ${c.unknown || 0} unknown, ` +
      `${c["not-native"] || 0} non-native, ${summary.archived} archived`,
  );
  lines.push(`Verdict: ${summary.verdict}`);
  return lines.join("\n");
}

function fmt(value) {
  if (value === null) {
    return "?";
  }
  return value ? "yes" : "no";
}

main(process.argv).catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exitCode = 1;
});
