# Security policy

Do not put factory drawings, source hashes/paths identifying company projects, inspection records, paired URLs, tokens, photos or SSH private keys in public issues, pull requests or Git history. `data/`, CAD/reference outputs and runtime binaries are ignored. Ignoring files does not remove secrets already committed; this release starts clean rather than reusing private legacy history.

Default bind is loopback. HTTPS temporary tunnel is optional and must be permitted by the data owner/company; it carries company data through an external provider. Treat paired links as bearer access. A random/long URL is not authentication. User approvals for this deployment do not authorize other organizations to publish data.

Controls: protected CAD/API routes, pairing cookie, exact proxy-origin trust, mutation Origin checks, input validation/limits, optimistic conflicts, escaped CSV, owned-process stop guard. Limitations: shared workspace, shared operator/viewer capabilities only; no individual audit identity or enterprise RBAC, no pairing rate limiter, no full malware/image decoding validation on server upload, no encryption at rest, no enterprise retention/SSO/tenant isolation. Apply company-approved HTTPS access control, network segmentation and storage controls before broader deployment.

Report a vulnerability privately to the repository owner using GitHub private vulnerability reporting if enabled; otherwise request a private contact without disclosing exploit details or company files publicly. This repository does not claim a maintained security-response SLA.

Dependency/secret scans are partial evidence. Run `npm audit`, review transitive licenses, and use organization secret scanning if available. Never paste credential-manager output into a report. Health checks do not verify authenticated ERP sessions or production engineering readiness.

The analysis service has a separate token and loopback-only port with exact Origin checks; never expose it through a tunnel. Viewer-only sessions cannot mutate records/photos or retrieve operator links. Static presentation hosts code only. Private snapshot imports are browser-local, but anyone who obtains the file can read its contents; share and retain it under company policy. Sandbox data is isolated and never synchronized.
