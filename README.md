# rn-newarch-ready

A **read-only** New Architecture readiness audit for React Native projects. Point it at a project
and it reports which dependencies and settings would block enabling the New Architecture — it
changes nothing.

This is the **deterministic layer**: it parses, classifies, and reports. A separate judgment layer
(the `rn-newarch-audit` skill) wraps it to interpret the report and guide remediation. Migration
and any code changes are out of scope here by design.

## Install

```bash
npm install --save-dev rn-newarch-ready
```

## Usage

```bash
npx rn-newarch-ready                 # audit the current project, human-readable
npx rn-newarch-ready ./path/to/app   # audit a specific project
npx rn-newarch-ready --json          # machine-readable report
```

## What it checks (v1)

- **RN version + current New Arch state** — reads `package.json` and, per platform, the Android
  `gradle.properties` `newArchEnabled` flag (iOS/Expo detection is planned).
- **Dependency classification** — for each installed dependency:
  - `supported` — ships a `codegenConfig` (a strong, local, network-free signal of New Arch
    support).
  - `unknown` — a native module with no `codegenConfig` signal. **Never reported as
    "unsupported"** — absence of a signal is not proof of incompatibility; review it manually.
  - `not-native` — no native footprint; irrelevant to the migration.

The roll-up verdict is `ready` (no unknown native dependencies) or `needs-review`.

## Design notes

- **Conservative by default.** A positive signal yields `supported`; the absence of one yields
  `unknown`, never a false-confident failure.
- **Local-first.** Classification reads `codegenConfig` from `node_modules` — no network required.
  A future enrichment step may consult published compatibility data for `unknown` dependencies.
- **Static analysis has limits.** Dynamically registered native modules and non-standard layouts
  may not be detected; the report states what it could not determine rather than guessing.

## Status

Early-stage (`0.x`). The report shape may change. Local native-module legacy-API scanning and
iOS/Expo New Arch detection are planned but not yet implemented.

## Development

```bash
npm test       # jest
```

## License

MIT
