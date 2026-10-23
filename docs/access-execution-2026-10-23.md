# Tablet access recovery — 2026-10-23

1. Reproduce missing pairing and inspect the active tunnel without changing company DNS/VPN.
2. Add verified session pairing and explicit invitation recovery, preserving drafts and authentication protections.
3. Follow domain rotation in the tunnel controller, refresh readiness and keep the watcher active.
4. Test invalid/blocked pairing, cookie verification, hash changes, browser recovery and trusted origin isolation.
5. Document network/browser requirements for Thailand-first operations and bounded testing from China; publish verified source only.

## Findings

- The live free tunnel logged a newer domain while the registered team origin retained the older domain. The older hostname returned HTTP 502.
- The field client only consumed invitation fragments at mount, removed them before checking the resulting session, and could fall back to cached drawing metadata on HTTP 401.
- The existing failure screen offered reload but no invitation recovery.

## Limits

Android Chrome in China is user-reported; this workstation cannot measure that device or its network path. No company network/VPN policy is supplied. Existing pairing secrets, real drawings and private operational reports stay outside publication.

## Status

The owner explicitly authorized open access for the public tunnel after disclosure that anyone with the URL can view company drawings and write records. The private deployment is configured open; public source defaults to paired and exposes an explicit opt-in. No VPN, DNS or firewall setting changed.

Open-mode tests pass for environment/file configuration and default paired isolation. Browser evidence verified plain-URL opening without a pairing form; paired-mode tests verified invalid-code recovery and same-document invitation handling. The live tunnel's health and drawing APIs were accessible without cookies, and its published link contains no credentials. Rotation and controller regression tests pass. Full publication checks and exact-commit CI remain the final gates.

This does not prove physical Android/Chrome behavior in China or Thailand, carrier reachability, engineering acceptance or stable performance of a free cross-border tunnel.
