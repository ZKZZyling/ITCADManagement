# Private machine planner launcher

The machine planner starts on `127.0.0.1:42881`. Reopening a package reuses a matching process instead of opening another port. This preserves the browser origin used by its IndexedDB field journal. Journals remain local to each browser; LAN access does not synchronize edits between devices.

## Start and manage a package

Run `scripts/machine-launcher.ps1 -Dataset <private dataset.json>` with normal PowerShell execution policy. The optional actions are `Start`, `Status`, `Restart`, and `Stop`; `-NoBrowser` supports diagnostics. A private package may provide a one-click wrapper that resolves its verified storage volume before calling this generic script. No task scheduler, startup service, firewall rule, public tunnel, or execution-policy bypass is installed.

The launcher checks the drawing SHA-256, workbook SHA-256, dataset JSON SHA-256, resolved dataset path identity, and running server code SHA-256. It serializes concurrent launches with a per-port Windows mutex. A matching listener is reused. A stale package or server is restarted only when the private runtime state, instance identifier, PID, server path, and live process command line establish ownership. An unrelated listener is left running, and the stable port is not silently changed.

Private runtime state and bounded stdout/stderr logs are stored beside the dataset under `runtime/`. The state contains ownership metadata, not pairing or management secrets. The launcher bootstrap adds native Windows PowerShell module locations to its child-process module lookup without changing saved system settings.

## Optional paired LAN access

The connection panel can explicitly enable a second listener on one currently available private IPv4 adapter. Loopback stays available at the same port. The server rejects wildcard binding, public addresses, common VPN/virtual adapter names, unexpected Host/Origin values, and forwarded-request headers. It does not change firewall rules or Windows network profiles.

A pairing link carries a random secret in its URL fragment, expires after ten minutes, and is exchanged through a same-origin POST. The client removes the fragment before loading private data. The server sets an HttpOnly, SameSite=Strict session cookie lasting eight hours. Renewing or disabling LAN access revokes all sessions. Dataset and file APIs require pairing over LAN; the static connection page contains no company data. The loopback-only management API additionally requires a random management token and an exact Origin header.

LAN uses HTTP and is intended for a trusted local network. Pairing is access control, not transport encryption. Do not forward this port, create a reverse proxy, or publish a pairing link. Header checks do not make an intentionally configured header-rewriting proxy safe. Actual phone reachability depends on the network profile, access point, and firewall; a same-PC LAN test does not establish phone acceptance.

No external QR service is used. Copying the private pairing link is the supported transfer method.

## API contract

- `GET /api/machine-server/health`: loopback-only application, protocol, process, instance and package identity.
- `GET /api/machine-server/status`: loopback includes adapters, management token and current pairing link; paired LAN receives a redacted status.
- `POST /api/machine-server/lan`: loopback management; JSON `{ "enabled": true, "address": "private IPv4" }` or `{ "enabled": false }`.
- `POST /api/machine-server/stop`: loopback management; stops only this server process.
- `POST /api/machine-server/pair`: same-origin LAN pairing; JSON `{ "token": "fragment token" }`.
- `GET /api/machines` and `GET /api/machine-file?path=...`: private package content, restricted to explicitly listed files and real paths inside the package.

Management POSTs require `X-Machine-Management` from local status and an exact `Origin`. Secrets are held in memory and must not be logged, included in screenshots, or committed.

## Validation

`node --test tests/machine-server.test.mjs` exercises real server processes and Windows launcher operations against temporary synthetic packages. It covers unauthorized and paired LAN APIs when a private adapter exists, file traversal, Host/Origin/forwarding rejection, management authorization, exact-package reuse, stale-package restart, duplicate JSON in a different package folder, owned stop, and preservation of an unrelated port listener. Private production packages and real-device journals are not test fixtures.
