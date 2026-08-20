# rn-newarch-ready

[![rn-newarch-ready scans a React Native app for New Architecture readiness](https://raw.githubusercontent.com/AndrewDongminYoo/rn-newarch-ready/main/docs/assets/readme-hero.png)](https://rn-toolkits.donminzzi.kr/rn-newarch-ready)

[![npm version](https://img.shields.io/npm/v/rn-newarch-ready?style=flat-square&color=c57417)](https://www.npmjs.com/package/rn-newarch-ready) [![npm downloads](https://img.shields.io/npm/dm/rn-newarch-ready?style=flat-square&color=667085)](https://www.npmjs.com/package/rn-newarch-ready) [![Node.js](https://img.shields.io/node/v/rn-newarch-ready?style=flat-square&color=2f6f44)](package.json) [![license](https://img.shields.io/npm/l/rn-newarch-ready?style=flat-square&color=667085)](LICENSE) [![RN Toolkits](https://img.shields.io/badge/docs-RN_Toolkits-0086aa?style=flat-square)](https://rn-toolkits.donminzzi.kr/rn-newarch-ready)

A **read-only** New Architecture readiness audit for React Native projects.
Point it at a project and it reports which dependencies and settings would block enabling the New Architecture — it changes nothing.

[Documentation](https://rn-toolkits.donminzzi.kr/rn-newarch-ready) · [npm](https://www.npmjs.com/package/rn-newarch-ready) · [Issues](https://github.com/AndrewDongminYoo/rn-newarch-ready/issues)

This is the **deterministic layer**: it parses, classifies, and reports.
A separate judgment layer (the `rn-newarch-audit` skill) wraps it to interpret the report and guide remediation. Migration and any code changes are out of scope here by design.

## Install

```bash
npm install --save-dev rn-newarch-ready
```

## Usage

```bash
npx rn-newarch-ready                 # audit the current project, human-readable
npx rn-newarch-ready ./path/to/app   # audit a specific project
npx rn-newarch-ready --json          # machine-readable report
npx rn-newarch-ready --offline       # skip the directory lookup (local signals only)
```

## What it checks (v1)

- **RN version + current New Arch state** — reads `package.json` and, per platform, the Android
  `gradle.properties` `newArchEnabled` flag (iOS/Expo detection is planned).
- **Dependency classification** — for each installed dependency:
  - `supported` — ships a `codegenConfig` (a strong, local, network-free signal of New Arch support).
  - `unknown` — a native module with no `codegenConfig` signal.
    **Never reported as "unsupported"** — absence of a signal is not proof of incompatibility; verify it manually.
  - `not-native` — no native footprint; irrelevant to the migration.
  - `likely-supported` — no local signal, but the directory marks it New Arch ready (see below).
  - `not-installed` — declared but not resolved in `node_modules`; cannot be classified.
- **Directory enrichment** — unless `--offline`, `unknown` native dependencies are cross-checked against the public [React Native Directory](https://reactnative.directory) dataset (fetched once and cached).
  A dependency the directory marks `newArchitecture: true` is promoted to `likely-supported` — a **distinct, softer tier** than locally-confirmed `supported`.
  The directory flag is library-level (it reflects the repo, not your pinned version) and curated, so the tool reports it separately and asks you to confirm the installed version rather than counting it as confirmed-ready.
  A directory `false`/absent flag never produces a confident failure (the dataset lags real support), so the dependency stays `unknown`.
- **Maintenance signal** — native dependencies the directory marks archived are flagged separately (`archived`), since an unmaintained library is a migration risk regardless of its New Arch state.
- **App-local native modules** — your project's own `android/` and `ios/` native source is scanned for modules that use only legacy APIs (`ReactContextBaseJavaModule`, `RCT_EXPORT_MODULE`, …) and carry no New Architecture marker.
  These are reported as migration candidates, with the matched signals, for manual review.

The roll-up verdict is `ready` (every native dependency locally confirmed — no `unknown` or `likely-supported`) or `needs-review`.
Archived libraries are surfaced as a separate maintenance warning and do not by themselves change the verdict.

Compatibility and maintenance facts come from the React Native Directory (`react-native-community/directory`); this tool reads that public data and attributes it.
When offline, the audit degrades to local signals only and says so.

## Design notes

- **Conservative by default.** A positive signal yields `supported`; the absence of one yields `unknown`, never a false-confident failure.
- **Local-first.** Classification reads `codegenConfig` from `node_modules` — no network required.
  The directory enrichment is an additive, cached lookup layered on top, and `--offline` skips it.
- **Static analysis has limits.** Dynamically registered native modules and non-standard layouts may not be detected; the report states what it could not determine rather than guessing.

## Status

Early-stage (`0.x`).
The report shape may change.
Detection covers Android/iOS/Expo New Arch state, dependency classification with directory enrichment, and app-local native-module scanning; dependency-side native legacy scanning and richer verdict tiers are not yet implemented.

## Development

```bash
npm test       # jest
```

## License

MIT
