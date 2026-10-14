# Verified behavior, assumptions and untested capabilities

Release evidence is in [release-validation](release-validation.md). Passing automated tests establishes only the tested source/build and synthetic interactions. No claim that every DWG, browser/device or network works perfectly.

- Prepared geometry is a review derivative. Native author references, fonts/Xrefs/layouts, hidden objects and proxy entities need human checking.
- No supplied approved AFC, legend/SPEC/ITP/BOQ establishes project acceptance rules. Synthetic fixture and new imported geometry remain blocked.
- Source pipeline has pilot-specific frame heuristics; arbitrary CAD classification/complete automatic sheet mapping is unverified.
- No full DWG editor or engineering computation/automated AI changes. CADCraft was researched only; it is not embedded or required by this release.
- Browser progress shows record counts. It does not infer actual installed quantities/percent complete.
- Public localhost.run is a temporary option. DNS/provider/Internet/PC sleep can interrupt it; approval for one company does not transfer to another.
- Offline requires prepared, verified pack and compatible secure context. Storage eviction/device loss/URL rotation are real failure modes; manual exports required.
- Actual field tablet touch gestures, camera permissions, 4G latency, prolonged airplane mode and multi-person load require on-device acceptance. Desktop/browser and synthetic tests cannot establish these.
- Controller is Windows-only and uses port 42873. CLI host/port settings do not reconfigure Windows tooling.
- Local filesystem access by another Windows user/process may reveal private data. exFAT offers no promised per-file ACLs. Server auth does not secure unencrypted disk.
- No background account/model retraining or API access configured. ChatGPT Pro and API usage are separate products.

## Version 0.5.0 workspace extension

See [analysis, management, trial, and static hosting](workspaces.md) for the implemented endpoints, launcher/configuration changes, separate data stores, validation, and remaining limits.
