# Changelog

## Unreleased

- Added a separate multilingual IT–ERP readiness workspace with 36 generic
  construction-stage requirements, room/rack and equipment registers, explicit
  cable endpoint/port links, a relationship map, ERP service dependencies and
  decisions. Source/dataset-scoped planning remains separate from inspections
  and engineering acceptance.
- Added private browser drafts and explicit JSON import/export, authenticated
  versioned saves, operation retry recovery and viewer write restrictions.
  Evidence states require matching meaningful references; unknown load values
  remain distinct from zero and capacity totals are not engineering sizing.
- Documented room, pathways, cabling, China-hosted ERP/printing/interface
  dependencies and construction hold points with primary-source guidance.

- Included native block groups in the searchable drawing inventory, including groups without standalone captions, and preserved source block names in future extraction.

- Restored native solid-HATCH boundaries/holes and POINT markers in the review pipeline. Added a source-hash-checked region restoration tool that creates a separate package, preserves existing IDs, records skips and retains engineering blocks.
- Added native source-group names, part counts and explicit whole-group highlighting/zoom. Distinguished drawing frames from equipment and preserved native text alignment in server rendering and hit testing.
- Hardened native-boundary verification and added synthetic restoration/render regressions. New full extraction uses a separate dataset identity to prevent legacy inspection records from attaching to shifted primitive IDs.

- Reopened inspection details when an already-selected drawing object is chosen again after fullscreen closes its drawer.

- Added local Chinese/English CAD terminology explanations in Thai, Chinese and English, traceable candidate categorization, conservative same-handle and contained-rack evidence, and nearby cable-label route candidates. Preserved original categories/text and engineering review requirements.
- Added optional technical-text boxes, glyph-area text selection, a searchable sheet text inventory, category/evidence summaries and extracted title comparison. Inventory processing reads large scene parts sequentially with bounded output/cache.

- Made explicit system isolation exclude unknown-category objects as well, while ordinary highlighting continues to retain them.

- Added a fullscreen drawing focus mode with a browser fallback, true whole-sheet reference fitting, mouse drag/native touch scrolling, and explicit zoom-to-selection. Pan no longer silently switches away from the reference image.
- Preserved extracted context and unknown objects when highlighting systems, added reversible isolation and exact-layer filters, and improved small-label rendering.
- Added source-backed hover/selection evidence to the inspector and contextual assistant, including handles, original nearby text, and geometry length with explicit engineering limits. Added scene inventory and synthetic regression coverage.

- Replaced large inline onboarding with an original paperclip-inspired contextual assistant across field, analysis, management, offline and trial workspaces. Added live local-state/focus advice, safe control highlighting, expandable guides, keyboard dismissal and multilingual accessibility.
- Collapsed loaded management imports, compacted summary cards and bounded actual offline candidate rendering with progressive expansion and deferred filtering.
- Guarded manual field synchronization against duplicate/in-flight actions. Preserved trial isolation, private data boundaries and engineering gates.

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
