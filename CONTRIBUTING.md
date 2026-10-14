# Contributing

Use a feature branch, meaningful commits and a pull request explaining the user-visible problem, final behavior and verification. Default assistant branch prefix is `codex/`. Never upload private drawings as tests; create synthetic fixtures with explicit labels. Keep original evidence text and identifiers unchanged; translations belong in the locale catalog.

Before changes: read architecture and limitations; run baseline build/tests. After changes: add meaningful regression tests for demonstrated risk, run build/tests and release scan, update docs and changelog. Do not write assertions that merely restate implementation or claim real field acceptance from mocks.

UI translation sources are `client/translations.tsv` and `offline-translations.tsv`; generated `translations.json` is consumed by `locale.mjs`. Run `npm run locales`, rebuild and run locale tests after source changes. Notes and drawing text must not be silently translated.

Preserve blocked acceptance gates, source/dataset scope, atomic browser save, version conflicts and no silent geometry truncation. Changes to schema/security/references require review and recovery plan. Do not commit generated bundles, private reports, `.openai`, pairing links, database or node_modules.

Issue template requests reproduction, version, Node/browser/OS, local vs tunnel vs offline, sanitized errors and expected result. Never attach company source or credentials. MIT applies to contributions only if you have rights to submit them; third-party licenses remain their own.
