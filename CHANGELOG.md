# Changelog

## Unreleased — clearer drawing presentation and work-area context

- Kept floor/area scope visible in expanded mode and added viewport-only fit-area/focus-point actions.
- Added reversible stronger-line display and reduced-label modes without altering source imagery or coordinates.
- Verified loaded image dimensions for coordinate actions and exposed DPR-aware source-pixel sampling feedback; dimension mismatch blocks point operations.
- Disabled zoom controls at their existing bounds and reduced reference-region fill opacity to preserve machinery linework.


## Unreleased — floor and work-area navigation on the expanded map

- Added floor/area selection, searchable important locations and five display layers within expanded mode.
- Distinguished saved unit points, approximate inventory zones, source text anchors and unplaced items; focused labels remain identifiable without inventing boundaries.
- Added explicit discard guards for unsaved points and picked references before floor, area or item changes, preserving cancellation and saved records.


## Unreleased — expanded field map

- Added an explicit app-contained expanded map workspace, distinct from reset-to-fit zoom, without requiring browser fullscreen permission.
- Retained unit/source/save context, placement and A/B tools with 44 px controls; exit and rotation preserve the map and unsaved draft.
- Kept source restrictions and accessible detail/tool overlays while collapsing the normal navigation stack.


## Unreleased — focused field queue and recoverable local storage

- Added a physical-unit work queue with stage filters and next unfinished task, unit photographs/serials, a local plan preview and a persistent next-action bar.
- Added explicitly confirmed reusable area reference profiles and per-unit opt-in tolerance application; current source, image, scope and evidence checks remain mandatory.
- Added current-input target/measured point overlays and A-to-B axis deltas, with invalid/stale preview suppression and guidance outside the drawing.
- Integrated revision-aware local saves, conflict locking, unsaved-record export and bounded recovery snapshots; load failures never substitute an editable empty record.


## Unreleased — physical-unit field positioning

- Prioritize explicitly identified units, serial labels and separately classified unit/site photographs; inventory rows remain references.
- Add expected/actual AP/BP comparisons, explicit observed side and center datum, documented tolerance, current-evidence status and printable blockers.
- Provide center-crosshair capture, scale-based nudging and pinch zoom; preserve the active task across mobile rotation and use 44 px core controls with a height-aware landscape map.
- Keep legacy records readable while requiring current model evidence before new site/installation confirmation.


## Unreleased — prepared Chinese–Thai drawing text

- Added source/image-bound bilingual text search, selected or density-managed map labels, explicit pending/review states, source handles and printable source details.
- Added shared-glossary all-view search and separate unpinned source notes, retaining complete occurrence counts and explicit view navigation.
- Flagged changed numeric tokens and potentially omitted prohibitions for review without changing source drawings, equipment points or journal identity; no automatic external translation is performed.


## Unreleased — revision-safe physical equipment field records

- Displayed source-backed per-view restrictions prominently on the plan and printed field sheet; view bounds do not imply usable installation floor area.
- Preserved intermediate image revisions through explicit predecessor contracts and rejected stale-tab confirmation when the dataset ID changes even if the DWG hash is unchanged.

- Added explicitly identified physical units under inventory rows, with independent positions, dimensions, photos and evidence; ambiguous inventory quantities never create units automatically.
- Added actual-field evidence gates for site checks and installation records, explicit process/utility/control relationship evidence, and a printable bilingual field sheet with plan context and source traceability.
- Added old-revision backup access and explicit reviewed-coordinate migration to proposed points only; old confirmations, image calibrations and survey baselines are not reused.
- Added source-status checks before field confirmation and periodic revision status. Archived/live source and image integrity gates preserve offline archived-source operation while rejecting changed sources; byte integrity does not establish geometry or engineering acceptance.


## Unreleased — drawing dimensions and manual laser positioning

- Restored source DIMENSION labels/lines as a readable, selectable image-bound overlay, with source evidence and separate anisotropic drawing-reference scales.
- Added persistent visible units/ruler and separate planned set-out versus actual manual laser workflows with named A/B, explicit side and horizontal-plane/instrument-reference checks.
- Added operator/date provenance, saved survey annotations, source-bound import validation and stale-baseline warnings without moving prior points.

## Unreleased — field navigation and device connection

- Added building/floor/view/zone navigation, explicit view-scoped inventory, line row counts and deliberate cross-floor reference navigation.
- Added phone Map/List/Details tabs and compact position/dimensions/process workflows with Thai-Chinese primary labels.
- Added a local connection panel for owned-server status, opt-in paired LAN access and link copying; browser evidence remains local, without implicit synchronization.

## Unreleased — field dimensions and photo evidence

- Added explicit image-bound scale baselines, measured distances, user-entered centred footprints, clearance and rectangular area estimates without automatic CAD unit assumptions.
- Added serial/grid/datum references and evidence-based transport checks, keeping grouped inventory records distinct from individual physical units.
- Migrated machine journals to atomic IndexedDB storage and added captioned machine/site photo copies, full preview and recoverable bounded exports.

## Unreleased — machine placement planner

- Added a Thai-first private machine planner with floor/line search, approximate zone references, source photos, and proposed process relationships.
- Added explicit manual placement confirmation, named field verification, undo, source/workbook-bound local persistence and guarded JSON transfer.
- Kept private datasets outside source and added a dedicated loopback-only adapter; schematic views cannot be used as installation placement surfaces.
- Added coordinate, persistence, identity and private-adapter regression tests. Physical installation and tablet acceptance remain separate.

## Unreleased

- Added explicitly configured open access for deployments that authorize anonymous viewing and record writes, while retaining paired access as the default and preserving origin/input/engineering gates. Open-mode links contain no pairing or viewer codes.
- Corrected free-tunnel hostname rotation recovery: register the latest logged domain before health checks, keep a watcher for direct starts, and refresh unchanged-link health.
- Added paired-deployment recovery with verified cookie persistence, invitation paste, hash-change handling and separate network/origin/token errors. Unauthorized responses no longer masquerade as a cached online workspace.
- Fixed a reference-view resize callback after its scroll container unmounts. Documented Thailand-first device/network requirements and bounded testing from China.

- Simplified the field workspace with reachable three-step onboarding, expandable display options, and secondary workspace links under More tools. Added a work-picker close action, selected-control semantics, reduced-motion support and scrollable short-screen layouts.
- Connected contextual guidance to hidden search and inspection panels, including checklist highlighting and focus; reset outdated guidance when the sheet or selection changes.
- Added bounded transient raster retries, explicit image retry actions, stale-result disposal and request cancellation. Resizing now renders the latest viewport state rather than a captured earlier sheet or mode.
- Normalized legacy translation rows so the generated Thai/Chinese/English catalog includes existing source-evidence and new workflow labels.

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

### Guided field workspace
- Replace the overflowing three-column control wall with a bounded map, four-step selection sidebar and explicit tools/details drawers.
- Keep source units and view notices visible; preserve all advanced tools, evidence gates and browser-local journals.
- Separate source text landmarks from known zone membership, exclude pending fragments from room choices, and clear stale downstream selection on floor/area changes.
- Keep unassigned inventory selectable on the chosen floor without implicit navigation.

### Windows launcher test capture
- Capture PowerShell launcher output in per-invocation files so background-server pipe handles do not outlive the launcher test. Preserve the 25-second deadline, concurrent suite execution and all functional assertions.
- Register cleanup before startup and reject process errors in both success and package-refusal cases. A controlled pipe-versus-file capture comparison reproduced and isolated the original CI timeout.

### Visible Thai on-plan labels
- Enable source-bound Thai map labels by default with a prominent map on/off switch and visible density counts.
- Keep original Chinese raster unchanged; use anchored cards, collision handling and machine-pin exclusion while preserving full search/detail access.
- Label pending interpretations explicitly and pass pointer input through labels during placement or measurements.
