# Changelog

## Unreleased

- Added contextual multilingual onboarding and troubleshooting to all five workspaces. Clarified that static presentation imports prepared snapshots locally and does not analyze uploaded DWG or host the full inspection backend.
- Added a complete workspace/format/startup guide and corrected obsolete documentation about read-only manager authorization.

## 0.5.0 — 2026-10-14

- Hardened static deployment against CDN-cached 404 responses with release-specific dependency/page requests, a complete management-only dependency closure, and an artifact regression test. Pinned the hosting Node major to the tested version 24.

- Added a separate loopback analysis admin service with a durable single-worker queue, source containment, subprocess cancellation, restart interruption, and explicit hash-verified review-package activation.
- Added read-only management authorization, source-scoped summaries, and private presentation export/import with image checksums and a bounded file size.
- Added an isolated local trial workspace with separate IndexedDB, no production synchronization, and backend rejection of explicitly marked trial records.
- Added code-only static presentation builds for stable hosting without publishing company drawings, credentials, records, or snapshots.
- Added Windows analysis/export launchers and controller entry points, while preserving existing private runtime data through an optional data-directory configuration.
- Preserved English/Thai/Chinese source evidence and engineering acceptance blocks. New native DWG conversion, physical field-device acceptance, and China-network availability remain separately verifiable requirements.

## Earlier maintenance updates

- Documented the proposed local analysis worker, IT review package, real-data manager presentation, and Thailand/China validation plan. This is a design update; it does not deploy a new workspace or upload company data.

- Made the README, installation, field, and offline guides English-first for international users and contributors.
- Recorded the owner's standing authorization for gated automatic commit/push after verified project updates, with English change descriptions.
- Added a publication helper that checks the target, upstream, selected staged paths, build/tests, and private-data scan before normal push and remote verification.
- Preserved multilingual application behavior, private runtime data separation, and engineering acceptance boundaries.

## 0.4.0 — 2026-10-14

Initial clean public source release, isolated from legacy private drawing/hosting history.

- Thai/简体中文/English online and offline inspection UI, source-preserving text and scoped progress counts.
- Explicit offline pack preparation and validation, local outbox/photos, manual export/import and scoped synchronization.
- Windows controller handles failures once; local mode independent from optional temporary tunnel.
- localhost.run support with isolated SSH configuration, exact origin guard and rotating link verification; Cloudflare optional with documented DNS limits.
- Portable bootstrap/runtime lookup, loopback default, synthetic demo generator and isolated integration tests.
- Documentation, MIT license, dependency notices and CI/release scan.

Engineering acceptance, full DWG editing, per-user permissions and real-device field validation are pending, not announced as completed features.
