# Field inspection and manager guide

## Before leaving for site

1. Have the responsible person confirm drawing revision, approval, and checklist criteria. Check the drawing name, source hash, and visible warnings.
2. Select English, Thai, or Simplified Chinese, open the three-step guide, and select the required sheets.
3. Search original tags, layers, or text and compare against the legend and reference image. Automated classification does not replace legend verification.
4. Prepare an offline pack, test it after disconnecting, and export a backup before departure.
5. Check battery, device storage, and the current team link. Share paired links only with authorized team members.

## During inspection

Select a sheet → search for an asset → open its checklist → enter answers, status, assignee, notes, and photos → save. Records remain in the browser queue until synchronization succeeds. Pass/installed/tested values are entered by inspectors and require the evidence specified by the project's SPEC and ITP.

Keep unknown and coordination candidates available to avoid losing unclassified evidence. Hiding architectural context can clarify IT scope, but return to the overall view before assessing routes, distances, or conflicts.

Reference images support viewing and zooming, not coordinate pins or measurement, because image-to-DWG mapping has not been certified. Geometry mode uses drawing units; derived distances must not be treated as cable takeoffs or acceptance evidence without verification.

## After inspection

Reconnect in the same browser origin, send pending records, inspect pending/conflict counts, and export results for backup. Do not clear browser data until all results have been confirmed on the server and in backup. Avoid simultaneous synchronization from multiple tabs.

HTTP 409 means the server version has changed. Local evidence is retained. Compare the records and resolve the correct result; there is no automatic overwrite.

## Managers and multilingual teams

Select the preferred UI language and review records by status within the same source SHA and dataset. Progress counts cover recorded inspection items only; they are not construction completion percentages because an approved bill-of-quantities denominator is unavailable.

The UI language does not alter drawing text, tags, units, notes, or assignee names. Users share a workspace with separate operator and server-enforced read-only viewer capabilities. This is not individual identity, enterprise RBAC, or per-tenant isolation.

For Simplified Chinese users, the same workflow applies: select language, select a sheet, search an identifier, then review the record and pending synchronization count. Prepare and test offline packs before disconnecting. Synthetic demo drawings cannot be used for construction.

## Fullscreen drawing review and object evidence

Open **Fullscreen** to dedicate the viewport to the drawing; if the browser cannot enter native fullscreen, the application uses a full-viewport focus layout. Exit with the same button or Escape. Engineering readiness warnings remain visible.

For the reference image, **Fit whole sheet** fits both dimensions. Zoom, drag with a mouse, or scroll normally; Ctrl/Command + wheel zooms. Touch devices retain native image scrolling. Pan preserves reference mode. This image is a comparison source, with no certified pixel-to-CAD registration or semantic hover overlay.

Choose **Point at objects for evidence** for interactive extracted geometry. Selecting a system highlights it while retaining other categories; **Hide other systems** explicitly isolates that category. Exact layer filters provide a second level of inspection. Restore all layers/categories to review context. Inventory counts represent extracted objects, including text and lines, rather than installed equipment quantities. A viewport can contain fewer objects than the sheet inventory; hidden-source objects remain excluded.

Hover with a mouse or tap/click an object to read its layer, source handle, original text and nearby source notes. The assistant presents this same evidence. **Zoom selected object** enlarges its geometry. Nearby notes do not establish an electrical/network connection. Layer-based system classification is provisional until checked against the legend. Geometry length is in source drawing units and is not an installed cable takeoff. Large sheets require zoom for legible labels; dense viewport requests fail explicitly rather than silently discarding objects.

This verifies interaction with a prepared review package. It does not certify fresh DWG conversion, fonts, Xrefs, block semantics, equipment identity, drawing approval, or physical tablet acceptance. Compare the reference and obtain the responsible engineer's confirmation before using results for acceptance.

### Terminology-assisted review

Enable **Important text boxes** in extracted geometry to outline recognized source terminology. Text selection uses an approximate rotated glyph region and takes precedence over nearby linework. **Drawing text inventory** lists source text with traceable handles and lets users search original text or localized explanations. Select an entry, then use **Zoom selected object**. Category summaries count drawing objects, not equipment. Compare extracted drawing titles with the selected sheet title; overlapping extraction regions can contain more than one diagram.

The local glossary recognizes rack, switch, patch panel/RJ45, fiber, CAT cabling, wireless, outlet, CCTV/recorder, access, pathway, power and coordination terms. This is terminology assistance, not unrestricted sentence translation or an external AI service. Unrecognized annotations remain visible with a translation-pending label. Same-source-handle evidence is used only where the group's recognized system is unambiguous. Rack enclosures require a contained rack label; nearby cable labels produce explicitly provisional route associations. Original text and original system category are retained. Neither containment nor proximity proves electrical connectivity, installed quantities or engineering acceptance.

Large inventories are processed one scene part at a time; cross-part associations require further review. The displayed text list is bounded to the first 1,000 entries and identifies truncation; total object/text/category counts still cover the entire prepared scene. Native DWG completeness, Xrefs/fonts, inferred symbol meanings and unknown geometry require responsible-person verification. Existing offline image packs do not gain semantic overlays automatically; this interaction is in the local extracted-geometry workspace.

### Native primitives and source groups

A native-supplement review revision can restore solid HATCH areas (including holes), POINT markers and source text alignment from a previously exported DXF. Select a primitive or text, inspect the source group name and part count, then choose **Highlight source group** and **Zoom selected object**. Group highlighting explicitly includes visible members from that source handle even when a category/layer filter would hide them. A drawing-frame group is background rather than equipment. Group counts and POINT markers are not installed asset counts.

The restoration tool writes a separate private package, keeps the old package and existing object IDs, validates source hashes and reports exactly which regions were restored. Activate through the local analysis verification gate. Other regions and previously prepared offline snapshots are not silently claimed to be repaired. Pattern hatches currently show boundaries; native fonts, line types/weights, wipeouts, proxy objects, cross-sheet associations and engineering acceptance require further verification. A fresh full extraction uses the `review-v3-native-primitives` dataset so records from older primitive sequences remain isolated. Bounded region restoration preserves the existing dataset only when all original identities are retained.

The drawing inventory also includes native block groups with no standalone caption. Search the group name or localized system explanation, select the group, then highlight and zoom its members in the prepared region. Names and counts describe source CAD structure, not approved installed devices.
