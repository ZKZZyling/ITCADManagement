# Contextual field assistant and compact workflow

The original paperclip-inspired SVG assistant replaces the large inline onboarding panel in all five workspaces. Open it from the floating button or the field header. It provides local, deterministic advice based on actual UI state; it is not a remote conversational model and does not independently inspect or certify CAD.

## Interaction

1. Choose a workspace, sheet or candidate normally. Open the assistant when guidance is needed.
2. Advice follows focused search/import/checklist controls and application state: errors, operations in flight, conflicts, disconnected pending work, unsent records, prepared analysis results and blocked readiness.
3. Choose **Show me where** to scroll to and highlight the relevant visible control. In offline inspection it can switch to the relevant existing tab. It never clicks save, send, activate or acceptance controls.
4. Expand **Full guide** for file types, startup, recovery, privacy and engineering boundaries. Minimize or press Escape to return to work and clear the highlight.

The panel is non-modal. It does not trap focus or open repeatedly on a timer. Keyboard users have labeled buttons, polite announcements, visible focus and Escape dismissal. Touch controls are at least 44 pixels. The panel is bounded to the viewport, moves left when the field record drawer is open, and respects reduced-motion preferences. No screenshot, camera, microphone or hardware permission is requested by the assistant.

## Data and performance

The assistant's rule module reads structured application state and a small focus context. It never transmits drawings, notes, credentials or user behavior; the existing application's explicit data operations continue to operate normally. It has no external AI dependency, telemetry, polling loop or new npm dependency. The guidance can operate inside a previously prepared offline shell.

The manager import panel collapses after a drawing loads, while validation errors remain visible. Summary cards use six columns on wide screens and three on narrow screens. Actual offline candidate lists render the first 100 matches with explicit **Show more**, reset the limit for a new query and use deferred filtering. Source candidates remain available; this does not silently remove evidence. Manual field synchronization now has a single-flight guard and a disabled button while a save or synchronization is in flight.

## Validation and limits

Automated tests cover advice priority, focused-control transitions, trial isolation, source/dataset boundaries, engineering acceptance blocks, multilingual strings and complete static dependencies. Browser verification covered real local references, advice changing with search, correct highlighting and cleanup, collapsed imports, progressive offline lists, Chinese labels and a 390-pixel viewport without horizontal overflow.

These are desktop browser/responsive checks, not physical tablet/phone, camera, network endurance or a measured FPS/RAM guarantee. No automatic engineering approval, CAD correction or free-form AI reasoning is implied. Project-specific checklists, native fidelity and approved revisions still need responsible-person validation.
