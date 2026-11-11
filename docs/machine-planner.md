# Private machine placement planner

The machine planner is a page in ITCAD Management for discussing approximate installation areas with field technicians. It keeps source-derived room/zone anchors distinct from proposed manual points and explicitly confirmed field points. Process relationships use dashed lines and are not utility or control routing.

Build with `npm run build`. Set `ITCAD_MACHINE_DATASET` to an external private `dataset.json`, then run `node server/machine-planner.mjs`. The default address is `http://127.0.0.1:42881/field/machines.html`. This dedicated adapter defaults to loopback. An explicit local management action can enable a selected private LAN interface with paired browser access. It rejects forwarded requests and unrelated Host/Origin headers, and does not mount private data on the normal shared server. Do not tunnel it. Only allowlisted package images are served; package real paths cannot escape their root.

The version 1 dataset contains `id`, `sourceSHA256`, `sourceWorkbookSHA256` (or `inventorySHA256`), `views` and `assets`. Views have `id`, `titleTh`, `titleZh`, `image`, `width`, `height`; image paths are relative to the external package. Assets have stable string `id`, `nameTh`, `nameZh`, `line`, `photos`, and optional `placement` with `viewId`, normalized full-image `anchor` and polygon `zone`. Empty placements stay unresolved. `connections` contain asset `from`/`to`, `label`, and evidence status. An anchor describing a shared room does not identify an individual machine footprint.

Choose an inventory item, its drawing view, and **ระบุตำแหน่งบนแบบ**. Tap a point, add field reference notes and explicitly save. New field confirmation uses explicit physical-unit identification and the structured evidence gates described below; legacy confirmation notes are retained as historical evidence. Edits and attached photo copies remain in IndexedDB keyed to dataset, drawing and inventory identity. Existing local-storage journals migrate on first load; the legacy copy is retained. Export JSON before changing browser, computer or origin; import validates all points and historical entries before replacing anything. Undo restores the previous placement. Clearing browser storage can remove edits. This is preparation evidence, not engineering or installation approval.

Coordinate, identity, persistence roundtrip and invalid import tests are in `tests/machine-model.test.mjs`. Desktop browser checks do not establish real tablet or physical-site acceptance.

## Field dimensions and photos

Per-view scale is defined by two image points, a measured millimetre distance, named provider and source note. It is bound to the exact image hash and dimensions. No CAD unit conversion is inferred. Check a second independent baseline before field use. Normalized coordinates convert through image width and height before physical measurement.

User-entered installation rectangles use centre anchors and clockwise image rotation; length, width, optional height and equal clearance are not inferred from packing dimensions. Rectangular area is not available-floor or collision acceptance. Foundations and elevations require structural drawings and manufacturer evidence. Serial/grid/datum offsets and transport checks document pending evidence. Inventory rows remain distinct from physical-unit records added explicitly under them; each identified unit can have separate dimensions and evidence.

The source-bound journal now migrates existing browser local storage into IndexedDB, retaining the legacy copy. Journal changes and attached photos save atomically. Machine and site photos carry asset IDs and captions. Input images up to 20 MB become JPEG copies up to 2400 pixels, with original files unchanged. Stored images are bounded to about 4 MB each / 28 MB encoded in total. JSON export includes all photo copies; import validates identity, geometry, attachment associations and actual image decoding before replacement. Quota errors are visible and do not claim successful saves. Clearing browser storage removes the local journal and photo copies. Previously exported JSON files remain recoverable through import.

## Field navigation and connection panel

The opening connection panel uses `/field/machines.html#connect`. Local use stays the default. The operator can explicitly enable a selected LAN interface, copy a short-lived pairing link, rotate it (revoking existing paired sessions), disable LAN access or stop the owned server. Pairing tokens are removed from the URL fragment before exchange. No QR or external image service receives connection data. Clipboard fallback selects the visible link for manual copying on insecure LAN origins. Photo IDs also support browsers without `crypto.randomUUID`. Server management is available only from the local host.

Building, floor and view navigation is derived from package metadata/source labels; platforms and utility schematics remain distinct. The inventory defaults to the visible drawing, with explicit all-records and unplaced filters. Selecting a record never silently changes floors; a separate button opens that record's reference view. The header separates inventory-row and explicitly added-unit totals. Line counts label their combined display-record grain; a row/unit filter separates the records. Neither count derives actual units from ambiguous inventory quantities. Zone polygons remain approximate. On phones, Map / List / Details tabs keep the selected record visible without a long stacked workflow. Primary navigation is Thai with Chinese key labels; this is not complete Chinese localization.

Edits remain local to each browser/origin and are not shared live across paired devices. Export/import is required to transfer field evidence. LAN availability does not itself establish firewall, Wi-Fi or real-device acceptance.

## Drawing dimensions and manual laser positioning

Source DIMENSION annotations are rendered over their bound drawing image with native labels, handles, overrides and extension/reference geometry. The default layer is on; a per-view searchable list includes every annotation, while the map renders labels inside the current viewport without an arbitrary item cap. Linear source labels and source-specific angle/radius symbols are not interchanged. Consistent source-dimension scale candidates can provide immediately readable plan distances, footprints and a ruler using independent X/Y image-pixel factors. These are explicitly drawing-reference calculations, not field measurements or INSUNITS assumptions; manual calibrations remain separate and take precedence.

The laser workflow requires named A/B points, a manual horizontal AB reading with explicit m/cm/mm units, the operator and instrument reference (front, rear or tripod). Unknown instrument models can be recorded honestly. Eligible source dimension reference endpoints can help select A/B; projected-span-only references cannot automatically become a physical baseline. No Bluetooth connection is claimed.

Two modes are explicit: choose a desired P to calculate target AP/BP for setting out, or enter actual horizontal AP/BP and explicitly choose left/right looking A to B to calculate the measured point. A fresh observation operator/date is separate from the baseline author. An optional C check reports a signed residual without an invented tolerance/pass result. Preview and an explicit save create only a proposed point. Baseline snapshots, entered readings and calculated results persist with the point and transfer through export/import. A changed baseline or manual scale visibly marks prior survey evidence stale without silently moving the stored point. Pointer locations and source dimensions are not claims of millimetre field accuracy.


## Physical units and revision review

An inventory row may describe several pieces of equipment or packaging. Add a physical unit with an explicit local label and serial/nameplate tag; quantities never expand automatically. Units receive independent placement, photos and dimensional records. Group-row positions remain reference records. Legacy `field-confirmed` records remain readable and are labelled as legacy rather than promoted to the new workflow.

A new point is proposed. A physical unit can be site-checked only with a named physical reference, at least two positive numeric actual readings with explicit mm/cm/m units, named references and measurement methods, dimension/source basis, evidence, participants, real calendar date and explicit confirmation of an actual site observation. Recording installation additionally requires the prior site-check evidence and installation evidence. These are operator records, not engineering approval or proof of structural/clearance suitability. Drawings that prohibit scaling for construction remain authoritative: use annotated dimensions and verify on site.

Checked relationship records identify explicit source and target physical units, process/utility/control type, evidence, participants and date. They do not establish cable/pipe routing or PLC design. The selected-unit print sheet includes the plan and P marker, Thai/Chinese names, status, actual versus plan information, units, photos and source hashes. Browser print/PDF is user initiated. JSON backup remains the full recoverable local record.

Revision changes create separate source-bound journals. Existing journals can be exported from the revision-backup list. Migration requires dataset-provided verified coordinate correspondence and an explicit preview/confirmation. Points are reprojected through old/new world bounds and drawable image heights, with all imported positions marked proposed/NEEDS_RECHECK. Original position evidence is retained as provenance; active surveys/calibrations/relationship confirmations are cleared, and old installation checks become pending. Out-of-view or unmatched points remain in the old backup. Migration refuses to replace existing current work, and never overwrites an existing old-source journal.

The client checks source status periodically and before changing a site-check, installation record or checked relationship. Unavailable or changed-source verification blocks confirmation but allows draft work and export. A verified archived source can remain usable when the original file is unavailable. The server verifies optional archived/live source hashes and per-view image hashes; changed source returns an error, and original source files are not exposed through the asset allowlist. These checks prove byte identity, not CAD rendering completeness, engineering approval, or real-device installation acceptance. All browser evidence remains device-local; LAN access does not synchronize journals.

Checked physical-unit relationships use a separate dash-dot map overlay only when both endpoints are placed in the displayed view. Cross-view and unplaced endpoints remain listed, with explicit navigation; they are never interpolated into physical routes. The print sheet includes incoming and outgoing unit names, serials, floors and relationship evidence. Re-rendered images with changed coordinate frames must receive a new dataset ID and an independently verified revision-migration contract; do not silently reuse a journal identity.

Views may provide `noticeTh` and `noticeZh` to identify source-backed restrictions such as voids, roofs or inaccessible regions. The active-view notice is prominent below the view toolbar and repeated in that view's printed unit sheet. A raster boundary does not imply usable installation floor area.

A package can declare additional reviewed predecessor contracts in `previousRevisions` alongside the primary `previousRevision`. File-based migration selects the unique contract matching the backup identity and uses that contract's coordinate and per-view proof. Unknown, duplicate or unverified contracts are rejected. The primary browser-migration button remains bound to the primary predecessor; other revisions can be exported from the backup list and selected as files. Corrected image releases use a new dataset ID so image-bound evidence is never silently rebound and prior journals remain accessible.

Source-status confirmation requires both the drawing SHA and the currently loaded dataset ID to match the server. An old open tab cannot confirm against a replacement image package sharing the same DWG SHA. A missing dataset ID is not verified; draft saving and backup remain available.


## Prepared Chinese–Thai drawing text

The optional text layer reads prepared, source-bound translation metadata. It is not a raw-DWG upload translator and does not call external translation services. Original raster text and dimensions remain unchanged. Selected-only labels are the default; optional viewport labels use visible collision-density reduction with explicit shown/visible counts, while the full searchable list retains every valid occurrence. Chinese originals, Thai drafts, handles, categories, pending/review status and provenance remain accessible. All-view search groups shared glossary entries and exposes explicit view-opening buttons instead of silently changing floors. Selected text can be printed as an attachment to the field sheet.

Inline `drawingTextTranslations` records may contain source/Thai strings directly, or reference shared `drawingTextTranslationEntries` with `entryId`. Each placed occurrence carries a unique `id`, `viewId`, normalized `anchor`, `sourceHandle`, and its exact Chinese `sourceZh` matching the glossary and `evidence` with DWG, DXF and image hashes. Glossary translations remain authoritative; occurrences cannot override them. When `worldAnchor` is supplied, it must agree with the image position within one pixel using the view bounds and drawable height. Invalid bindings, duplicate references and out-of-plan positions are excluded from map rendering and counted with visible rejection reasons. Status is `pending` or `draft-reviewed`; a reviewed draft is not engineering approval. Untranslated or semantically unresolved entries remain explicitly pending and searchable by their Chinese source, even if they contain a Thai explanation. Compact map labels use an explicit ellipsis without splitting grapheme clusters; full source and draft text remain in details and print.

Numeric-token differences trigger review rather than rewriting the source or suppressing the translation. Explicit reviewed `numeralMappings` can account for Chinese integer words rendered as Arabic digits, while altered existing Arabic values remain flagged. A source-prohibition/Thai-wording heuristic also requests review; it is not a semantic translation validator. Consequential notes retain their explicit `reviewRequired` flags and must be checked in their original scope.

Optional `drawingTextGlobalReferences` link glossary entries to source handles and `sourceScope` with `locationStatus: outside-current-views`. They require drawing/DXF provenance and appear in a separate unpinned notes panel and print attachment. They cannot supply a view or map anchor. Translation metadata updates do not move equipment, recalibrate images, or change the journal identity.

## Guided workspace and map ownership

The field workspace uses four selection steps: drawing/floor, an existing source area or text landmark, work/production line, and an inventory row or explicitly identified physical unit. Floor and area changes clear the selected machine, line/search filters and unsaved placement draft. Selecting an unplaced row from the all-items scope keeps the operator's chosen floor; opening its reference drawing is a separate explicit action. Text landmarks do not define room boundaries or machine membership. Pending translation fragments stay in translation search and are excluded from area navigation; review-required interpreted labels remain marked.

The map has its own bounded viewport. Desktop inventory and details drawers scroll independently; phones switch between map, list and details. Dimensions, manual laser tools, translations and relationships are available through a closable tools drawer. Native dimension text remains in the drawing; additional dimension overlays are optional. Calculated units and source-derived unit context remain visible beside the map. Source notices, source/revision checks, journal persistence, evidence requirements and print sheets retain their existing roles. The source/backup panel explains browser-local storage; the workspace does not imply shared LAN journal synchronization.

### Thai labels directly on the plan

Prepared, source-bound Thai labels are enabled in the map viewport by default. The main map has an explicit Thai on/off button; switching it never replaces the original Chinese raster or changes coordinates. Label cards retain leader lines to exact source anchors, use screen-rectangle collision handling and avoid known machine pins. Counts state shown labels versus source occurrences in the current zoom; zooming and full-text search expose remaining prepared entries. This does not imply complete DWG translation. Pending or failed-review text shows Chinese with a review-needed marker rather than an explanatory Thai guess. Placement and measurement modes disable label pointer interception. Full Chinese/Thai text, status and provenance remain available by selecting a label.


## Physical-unit field workflow (v9)

1. Choose building/floor/area and an inventory reference. Select an existing identified unit or add one from its actual label/serial; inventory quantity does not automatically create equipment.
2. Record the checked center datum and dimensions for that unit. Machine photos and site photos are separate from inherited inventory reference images. Establish the current A/B reference and calibration.
3. Propose a point by touch or move the plan under the center crosshair. Optional nudging uses a user-entered millimetre step and the current scale. Normalized image coordinates and raster-derived distances are not survey accuracy claims. Cancel discards the unsaved draft only.
4. Read expected AP/BP, enter actual measurements and explicitly select the observed side when looking from A toward B. Enter the responsible person's documented tolerance, applicable to both radial distance and reconstructed positional displacement; no passing value is supplied by default.
5. Save a site check only when the model accepts current evidence. Installation additionally requires the current prior check, dimensions including height, rotation/source/checker and documented door, path, headroom and load reviews. Printed sheets use effective status and expose stale evidence and blockers.

On short landscape screens the controls scroll in a side column while the map retains the remaining height. Rotation preserves the selected unit, view and current detail/map task. Core touch buttons are at least 44 CSS pixels; desktop browser viewport testing does not establish physical-device or construction acceptance.


## Focused queue and recovery (v10)

The “today” queue is the unfinished physical-unit backlog for the selected floor/area, not a scheduled appointment list. Inventory-derived locations are marked as references; unassigned units remain explicit. Stage filtering and next unfinished selection do not manufacture units or mark work complete.

Each unit presents its serial, attached machine photograph and a small local plan only when the unit has a saved point. The bottom action follows the next stage. A missing unit point shows an unresolved placeholder rather than a source-row point disguised as the unit location.

Reusable area profiles snapshot a checked A/B baseline and calibration with source/image identity, recognized zone or floor scope, responsible checker, date, evidence and documented tolerance. Activation is explicit and warns about affected checks. Applying a profile's criterion to a unit requires a separate explicit action; editing the criterion converts it to a manually documented value. Neither a profile nor an overlay is construction authorization.

For a valid current measurement comparison, the plan distinguishes target P from measured P. Signed deltas are measured minus target along A→B and toward the left when looking A→B, not screen X/Y and not automatic machine movement instructions. Invalid readings, changed reference context and stale checks hide the comparison rather than showing old guidance.

Local storage loads fail closed on read/validation errors. Saves use an expected revision; a conflicting tab or failed storage write retains the attempted journal for export and requires explicit reload/recovery before further writes. Two previous revisions are retained locally; they are not an independent backup. Snapshot restoration is explicit, revision checked and source gated. Corrupt records can be downloaded raw without treating them as valid import files. Normal compact JSON import/export share a 64 MiB limit; advanced raw recovery export preserves access to older oversized records but does not promise they can be imported.

If current content is corrupt but revision metadata is intact, the locked recovery screen can restore a validated local snapshot or explicitly import a validated backup after source verification. It captures the revision before the action so another tab cannot be overwritten silently. Corrupt revision metadata permits raw preservation only until repaired; it does not grant an unsafe overwrite bypass.


## Expanded map workspace (v11)

Use **ขยายพื้นที่แบบ** on the map to enlarge the drawing workspace within the app. This is separate from **ดูเต็มแบบ**, which resets the drawing zoom. Expanded mode does not require the browser Fullscreen API and does not write a field record.

A compact bar retains the selected item/serial, floor, source-check and local-save state. The normal inventory and header stack collapse; unit details, A/B tools, placement and Thai labels remain accessible. Extra placement controls open from **ปรับจุด**. Source floor restrictions remain visible. Exit with **กลับหน้าปกติ** or Escape; selection, zoom/pan and unsaved placement remain intact across entry, exit and viewport rotation. Map tools and details remain overlays with their own close controls.

The image keeps its original aspect ratio. More map canvas does not add source pixels, increase survey accuracy or remove possible letterboxing. Desktop browser viewport tests cover responsive layout and interactions, not physical-device/site acceptance.


## Navigation within the expanded map (v12)

Open **ชั้น / พื้นที่ / จุดสำคัญ** without leaving expanded mode. Choose a floor, then a source-backed reference area or an anchored room label, search for a unit/Serial/source label, and focus it. A reference zone uses its existing approximate polygon; a room-text anchor never becomes an invented room boundary. A focused source label has its own halo and explanatory card even when label collision avoidance would omit its regular annotation.

The drawer distinguishes physical-unit saved points, approximate inventory references, source text positions and entries with no pin. Physical units never inherit a base inventory row's position. Known area-only records remain scoped to their known floor; truly unassigned records are explicitly identified. Selecting an unplaced item opens its details without manufacturing a map center point.

Layer switches expose physical units, inventory references, Thai/source labels, DWG dimensions and process relationships. Relationships remain connections for understanding, not approved routing for cables or pipes. Floor-specific restrictions remain visible in both the drawing and navigation drawer.

Changing floor, area or selected item while a point draft or picked measurement references exist asks whether to discard them. Cancel retains the current view and all draft points. Confirm clears temporary point, measurement, laser and comparison context before navigation; saved records are unchanged. The same-current-item selection is guarded as well. Navigation, layer switches and focusing do not write the journal.
