# Analysis, management, and trial workspaces

Version 0.5.0 adds separate local analysis and management interfaces. These are review tools; passing technical validation does not approve a drawing for construction or acceptance.

## Local analysis

1. Start the field server using `ITField-Control.cmd`. Select **Analysis**, or run `Start-Analysis.cmd`.
2. Choose a source under `data/sources` (or the administrator's `ITCAD_SOURCE_ROOT`). Alternatively, select an existing prepared package for verification.
3. Submit one job and inspect its status, warnings, and operational log. Jobs execute sequentially. Cancel or explicitly retry failed/interrupted work.
4. Review a ready result before choosing **Activate for review**. Activation verifies the result hashes again and preserves the previous active package until the explicit action succeeds.

The admin service uses loopback port `42875`, a separate private `analysis-token`, an HttpOnly session, exact Origin checks, and rejection of forwarded admin requests. Never tunnel this port. Its durable queue consists of atomic JSON job files under `data/analysis/jobs`; it is not a SQLite queue. A restarted service marks unfinished jobs interrupted instead of replaying or activating them.

New analysis runs extraction, package preparation, audit, and optimization in owned Python subprocesses. Only one job runs at a time; stage timeouts are ten minutes. Windows below-normal worker priority is attempted. These limits do not reserve RAM or guarantee field latency. Cancellation terminates only the owned worker tree. Original source hashes are checked before and after processing. Native binary DWG conversion still requires a separately installed and working ODA converter; no AutoCAD fallback is launched.

Existing package verification checks the manifest, every referenced geometry part, finite geometry coordinates, and output hashes. Its source verification is explicitly `prepared-package-only`: it does not re-certify the original DWG, fonts, Xrefs, legend, approved revision, or engineering criteria.

## Manager access and private snapshots

The local management page is `/field/manager.html`. An operator can obtain a read-only paired link from server information or the configured controller. Its separate viewer token authorizes reading; viewer-only sessions cannot POST inspection records or photos and cannot retrieve operator pairing links. Existing operator cookies still retain operator permissions. This is a shared workspace role, not per-person enterprise identity or tenant isolation.

`Export-Presentation.cmd` writes a private `data/exports/ITCAD-presentation-*.json` bundle. It includes whitelisted drawing metadata, candidate text, source/dataset-scoped records, reference PNGs, and record-linked photos. It excludes raw DWG, absolute source paths, pairing tokens, and credentials. Keep the file in approved private storage and share only through authorized company channels.

On the manager page, choose **Open private presentation bundle**. Imports validate the schema, a maximum of 80 MiB, record fields, image SHA-256 checksums, and image decoding. The bundle is stored in browser IndexedDB and is not uploaded by the import handler. Counts describe inspection records, not percentages of physical construction. Unknown classifications remain visible; source text and warnings preserve their original languages. Sheet handles disambiguate duplicate titles.

Snapshots display their export time and remain snapshots until explicitly refreshed or replaced. A first online visit and successful offline shell preparation are required before offline reload. Browser eviction, private browsing, device storage, and a changed origin can remove or separate local data; retain the original bundle as recovery.

## Isolated inspection trial

From a loaded management snapshot choose **Try inspection in an isolated sandbox**, or open `/field/sandbox.html` and import the same bundle. The sandbox uses `itcad-sandbox-v1`, separate from production `itfield-rayong-v1`. It can read the manager's cached presentation, but saves trial checklists only in its own database.

Select a candidate, enter checklist answers and notes, and save locally. Trial results never synchronize, never contribute to manager progress, and cannot be accepted as construction evidence. The backend also rejects a record explicitly marked `trial:true`. Exported `itcad-trial-v1` files are separate demonstration records, not production offline result packs. This focused trial does not provide production photo capture or coordinate-certified point placement; use the existing field/offline workspace for actual inspection evidence.

## Code-only static hosting

Build with `npm ci`, `npm run build`, and `npm run build:manager-static`. Publish only `dist/manager`; do not publish the repository root, `data`, CAD sources, or private snapshots.

Render Static Site settings:

| Setting | Value |
|---|---|
| Repository | Public ITCADManagement source |
| Branch | `main` |
| Build command | `npm ci && npm run build && npm run build:manager-static` |
| Publish directory | `dist/manager` |
| Secrets/company data | None |

Static management is snapshot-only and does not automatically call a live API. It provides a stable code URL without exposing the local CAD server. Use private bundle import for real drawings. Public-repository deployments may require manual deployment of later commits; inspect the Render deployment settings rather than assuming auto-deploy. The `_headers` file supports compatible hosts; configure equivalent headers explicitly where the host does not consume it.

Thailand and mainland China require tests from the actual networks/devices. A global CDN, a successful local browser test, or a free hosting plan is not evidence of uninterrupted mainland-China access. Keep the downloaded bundle and offline shell available for the presentation; do not change corporate DNS, VPN, ERP routing, or proxy settings to make the viewer work.

## Configuration and data continuity

| Variable | Purpose |
|---|---|
| `ITFIELD_DATA_DIR` | Shared private runtime data directory; source checkout stays clean |
| `ITCAD_SOURCE_ROOT` | Allowed local CAD source directory |
| `ITCAD_PYTHON` | Verified Python executable with CAD dependencies |
| `ITCAD_ANALYSIS_PORT` | Separate loopback admin port, default 42875 |

Existing pairing tokens, SQLite records, and active packages can remain in their operational data directory. Back up scripts and SQLite while the owned server is stopped before changing runtime paths. Machine-specific deployment bridges and configurations are private, not portable repository defaults.

Remaining release gates include approved construction revisions, legend/SPEC/ITP/BOQ review, native reference fidelity, project security policy, physical tablet/phone testing, and China-network acceptance. The software does not automatically establish these gates.

The static builder replaces only its fixed ignored `dist/manager` output, packages manager/trial dependencies, and versions all dependency/precache requests to avoid stale negative CDN cache entries. `.node-version` selects the tested Node 24 major for hosting builds.
