# Release validation — 2026-10-14

Scope: clean public publication checkout, version 0.4.0. Original operational app and private factory data were kept separate. All CAD/server fixtures in this release verification were synthetic.

| Check | Observed result |
|---|---|
| Clean dependency installation | `npm ci` succeeded after stopping only the synthetic preview server; Node 24.21.0 on Windows |
| Fresh source installation | Committed source archive unpacked into a new folder; setup installed dependencies, built UI, generated demo and passed 20/20 tests without private workstation files |
| Build | esbuild produced online/offline bundles and shell manifest |
| Node tests | 20 passed, 0 failed; isolated server never used factory database |
| Server integration | unauthorized drawing denied; pair cookie; PNG/PDF; viewport limit; idempotent retry; 409 conflict; acceptance blocked; photo upload/download |
| Python CAD regression | 1 passed: no-title DXF fallback, source SHA unchanged, full-model retained, engineering release blocked |
| PDF | synthetic PDF parsed as one page and contained explicit training marker |
| PowerShell | 18 scripts parsed; controller-state reentrancy and latest-team-origin tests passed |
| Controller self-test | dependencies pass; localReady=false because another project owns port 42873 — correctly separated |
| Port collision | portable launcher refused occupied 42873; existing operational server was not stopped/replaced |
| npm audit | 0 reported vulnerabilities after sharp 0.35.5, esbuild 0.28.2 and lodash-es override 4.18.1 |
| Browser | desktop Simplified Chinese UI displayed synthetic reference and selected LAN checklist; original demo text retained |
| Publication scan | staged source excluded runtime/company CAD, records/photos, credentials, old hosting metadata and generated bundles |

Initial clean install attempt while the synthetic preview was running encountered a Windows DLL lock. The preview was stopped, installation completed and build/tests were rerun successfully. Installation/upgrade must stop the instance that uses that dependency directory.

Configured CI is a separate check after push, not a claimed successful remote run. This local validation does not establish Node 22/Linux execution until their CI jobs pass. No actual field tablet/phone camera, 4G, prolonged offline durability, load benchmark, arbitrary DWG completeness or signed engineering acceptance was established by this release check.

Dependency audit covers npm's current advisory database, not a security guarantee or a Python/native-tool audit. The optional MLight viewer bundles successfully with the override; complete CAD-engine interaction across browsers remains a separate compatibility check.

## 0.5.0 local validation

- Build and code-only static artifact generation passed; 28 Node tests passed.
- Added queue/activation/hash, source containment, malformed-part, restart, admin token/Origin, viewer-write denial, private-bundle export, and sandbox sync-denial coverage.
- PowerShell syntax passed for 21 scripts. Existing control-state and tunnel-origin regressions remain publication gates.
- Browser tests imported a real private snapshot locally, rendered its reference, saved an isolated multilingual trial, and reloaded that trial with the preview server stopped. The live factory record count remained unchanged.
- A prepared production package passed verification of every referenced scene file; this is output verification, not native source or construction approval. Detailed company evidence remains in private runtime reports.
- A temporary live tunnel returned 502 during repeat testing. A stable static shell/private snapshot is the presentation path; temporary-provider reliability is unresolved.
- No physical tablet/phone, camera, mainland-China network, enterprise identity, approved revision, or fresh binary DWG conversion acceptance is claimed.

Static deployment testing found cached negative CDN responses: affected files returned 404 without a query and 200 under a fresh release query. Static imports, navigation, and offline precache requests now use release-specific cache keys. Artifact tests verify the complete management/trial dependency closure.
