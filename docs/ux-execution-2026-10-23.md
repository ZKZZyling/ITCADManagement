# Field workflow improvement — 2026-10-23

## Scope and acceptance

1. Audit the existing field workflow and contextual assistant without invoking Autodesk or changing source CAD.
2. Make onboarding reachable; make assistant targets open their containing panel; expose selected control states.
3. Reduce persistent navigation/filter chrome while keeping source readiness warnings visible and advanced actions available.
4. Recover from transient raster failures with bounded retries and cancellation; test stale-result isolation.
5. Build, run regression gates, inspect the real browser, review the public diff and publish only source and documentation.

## Verified findings

- The contextual assistant lacked the field navigation callback and checklist target.
- The existing three-step guide was not rendered by the field application.
- Failed raster signatures could prevent another request until the viewport changed.
- Multiple wrapping control rows can reduce drawing space on short screens.

## Boundaries

This is a UI/reliability update, not fresh DWG conversion or engineering acceptance. Original CAD, dataset identity, inspection scope and approval gates remain unchanged. Physical tablet and factory-network acceptance require separate verification.

## Execution

Implementation complete. Build and 62 Node tests passed during development, including seven synthetic raster recovery/race tests. Browser checks verified reachable onboarding, closed-inspector checklist navigation and focus, Thai/Chinese/English labels, and scrollable 390x844 / 844x390 layouts with a drawing stage of at least 240 CSS pixels and no page-level horizontal overflow. The local app opened real prepared reference and raster images. An independent review identified a stale ResizeObserver closure; its callback now uses current viewport functions. Physical device, multi-user factory-network and fresh DWG-conversion acceptance remain untested. Final publication gates are recorded in the commit and CI. Public artifacts must contain no company drawings, inspection records, tokens or private screenshots.
