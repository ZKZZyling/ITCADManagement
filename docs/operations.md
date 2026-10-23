# Operations and troubleshooting

Controller: local start/open, separate team link, copy verified paired link, stop owned services, open project folder. Closing controller does not shut down the server. Use stop-all button or `Stop-ITField.cmd`. Do not stop Node/SSH processes by global name.

## Tunnel

localhost.run forwards only `127.0.0.1:42873` via SSH `-R 80:127.0.0.1:42873 nokey@localhost.run -- --inject-http-proxy-headers`. The scripts use an empty app-specific SSH config, isolated known-hosts, no agent identity and no company keys. First host key uses accept-new (TOFU); changed key is rejected. Public health must succeed before presenting link. Watcher tracks newest `.lhr.life` hostname and checks health before paired-shortcut update. No guaranteed uptime, URL permanence or capacity.

Cloudflare Quick Tunnel is optional: install official signed binary in ignored `tools/cloudflared.exe`. On the original workstation, issued hostnames failed system DNS; the current recommended temporary route is localhost.run. Never automatically change system DNS, proxy, VPN, company SSH config or ERP routing to fix a tunnel.

| Symptom | Check / action |
|---|---|
| Node not found | Install Node 22.13+ and reopen shell; `node --version` |
| Client build missing | Run setup/build; inspect exit code |
| Port 42873 occupied | Identify owner; launcher refuses to take over another service/repo |
| Pairing required | Open paired launcher link; do not assume ChatGPT login gives local access |
| Tunnel DNS / SSH denied / 502 | Keep local mode; inspect team logs; retry explicitly; get latest link |
| External link changed | Copy newest verified link; offline export/import across origins |
| Renderer too dense | Use verified reference or zoom in; no silent object dropping |
| Unavailable reference | Supply matching author reference; review geometry remains provisional |
| Pending never clears | Check source/dataset, server readiness, photo availability and 409 conflict |
| Repeated error dialogs | This controller marks operation handled before UI and suspends modal timer; capture sanitized logs if reproduced |

## Logs and backup

Private logs: `data/server*.log`, `team*.log`, controller operation result/error files. Logs can contain URLs and document paths; sanitize before GitHub issues. No credentials/session DB should be copied into public reports.

Stop owned services and copy **entire data/** to authorized backup, including active package, native references, SQLite, photos and pair token if preserving sessions. Verify counts/hashes in destination and restore on a separate local port before declaring backup valid. Keep per-device exported results too; server backup does not contain unsynced browser work. Do not delete logs/photos/packages based on age automatically.

Token rotation is manual: stop server, securely replace/remove `data/pair-token`, restart and re-pair authorized team. Previous HMAC sessions become invalid; revoke old shared links. Do not perform rotation until pending offline results have been exported and an updated access plan is ready.

## Version 0.5.0 workspace extension

See [analysis, management, trial, and static hosting](workspaces.md) for the implemented endpoints, launcher/configuration changes, separate data stores, validation, and remaining limits.

## Optional open access

The server defaults to paired access. An operator who intentionally wants every reachable visitor to view drawings and write inspection/planning records can set `ITFIELD_ACCESS_MODE=open` or create `data/access-mode` containing exactly `open`, then restart the local web server. The environment setting takes precedence. Invalid server settings fail startup. Remove the file or set `paired` and restart to restore session enforcement.

Open mode is not an internal network boundary: an internet tunnel makes the workspace publicly reachable to anyone who obtains or discovers its address. It does not provide individual identity, read-only viewer separation or an approval log tied to a person. Use only with explicit data-owner authorization and the intended network exposure. Pairing and viewer credentials are omitted from open-mode discovery links. Existing data, source scope, input validation, same-origin write checks and engineering acceptance gates are preserved.

The separate analysis admin service retains its own authentication and loopback boundary. This setting does not expose that service or change VPN, DNS, ERP, routing or firewall configuration.

Free localhost.run hostnames may rotate while SSH remains connected. Both initial startup and the background watcher select the latest exact provider hostname from local logs. The watcher registers the new origin before probing, updates the shortcut and refreshes unchanged-link health periodically. A link shared earlier cannot redirect to a replacement hostname after the provider withdraws it. Get the current link from the controller; a stable company domain requires a separate deployment decision.
