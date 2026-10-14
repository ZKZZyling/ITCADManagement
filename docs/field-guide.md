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

The UI language does not alter drawing text, tags, units, notes, or assignee names. All paired users currently share one workspace. There are no individual user roles or server-enforced read-only manager permissions.

For Simplified Chinese users, the same workflow applies: select language, select a sheet, search an identifier, then review the record and pending synchronization count. Prepare and test offline packs before disconnecting. Synthetic demo drawings cannot be used for construction.
