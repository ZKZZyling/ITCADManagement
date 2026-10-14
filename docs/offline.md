# Offline workspace

Open `/field/offline.html` in a separate window from the main application. Both pages share IndexedDB only when using the same browser origin. Prepare through HTTPS or localhost while the server is reachable.

## Workflow

1. Select up to 25 sheets and prepare the pack. Every PNG is downloaded and checked for signature, SHA-256, and image decoding.
2. Cache the current build's application shell and save the pack in IndexedDB. Do not leave for site with an incomplete pack.
3. Disconnect and reload the offline page. Verify readable images and asset lists on that particular device.
4. Save checklist answers, notes, statuses, and photos. Photos are resized to JPEG with a maximum dimension of 1600 px. Record and outbox writes are atomic within the browser.
5. Export the pack and results, including photos, to approved storage. Reconnect and synchronize explicitly; offline synchronization is scoped to the current source and dataset.

## Storage boundaries

- Pack JSON is limited to 80 MB. It is not raw DWG or a complete factory CAD model compressed onto a phone.
- The asset text list includes all candidates because asset-to-frame relationships are not certified; some entries may belong to other sheets.
- IndexedDB is not a backup. Private browsing, storage eviction, clearing browser data, or device loss can erase unsynchronized evidence.
- Service Workers use network-first GET requests for `/field/`, with the current build's shell as fallback on network errors or HTTP 5xx. API and CAD data are not all cached implicitly.
- There is no automatic background synchronization. Inspectors send results explicitly and inspect conflicts.
- The dynamic CAD engine is not included in the offline shell. Offline mode provides reference images and checklists, not DWG editing.

## URL changes and device transfer

A new origin has a separate IndexedDB store. Export pack and results from the old origin, then import them into the paired new origin. Source SHA and dataset must match. Existing records are not overwritten, and accepted results cannot be imported in this workflow. Verify imported evidence before explicitly synchronizing.

Free tunnel URLs may disappear permanently. Export before a URL changes rather than relying on recovering the old origin later.

Pack and results files contain company data readable as JSON. Export encryption at rest is not implemented. Use company-approved storage and access controls.

## Version 0.5.0 workspace extension

See [analysis, management, trial, and static hosting](workspaces.md) for the implemented endpoints, launcher/configuration changes, separate data stores, validation, and remaining limits.
