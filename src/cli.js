#!/usr/bin/env node
"use strict";

const path = require("path");
const { audit } = require("./index");

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("-"));
  const projectDir = path.resolve(positional[0] || process.cwd());

  const report = audit(projectDir);

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
  lines.push("");

  const unknown = dependencies.filter((d) => d.status === "unknown");
  if (unknown.length > 0) {
    lines.push("Native dependencies with no New Arch signal (review manually):");
    for (const dep of unknown) {
      lines.push(`  - ${dep.name}@${dep.version || "?"}`);
    }
    lines.push("");
  }

  const c = summary.counts;
  lines.push(
    `Summary: ${c.supported || 0} supported, ${c.unknown || 0} unknown, ` +
      `${c["not-native"] || 0} non-native`,
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

main(process.argv);
