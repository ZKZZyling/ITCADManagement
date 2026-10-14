# ITCAD Management maintainer instructions

## Language

Use English as the primary language for README files, repository documentation, commit subjects and bodies, pull request titles/descriptions, issue templates, release notes, and other GitHub-facing descriptions. Explain the problem, resulting behavior, validation, and material limitations clearly. Preserve original drawing text, filenames, identifiers, and quoted evidence when needed. The application continues to support Thai, Simplified Chinese, and English. User-facing chat may remain in Thai.

## Authorized publication workflow

The project owner has authorized automatic commit and push to `https://github.com/ZKZZyling/ITCADManagement.git` after requested application fixes or improvements have been completed and verified. Do not request approval again for routine publication within this scope. This is a standing project instruction, not a background scheduler or a hook that pushes unfinished edits.

1. Inspect the current branch, working tree, upstream, and changed files. Preserve unrelated work. Do not publish from a private operational checkout or import its legacy Git history.
2. Complete the change, update relevant English documentation and CHANGELOG, and run appropriate build/tests. Use `scripts/publish.ps1` for the standard gated workflow, or perform its checks explicitly if the change requires a different test scope.
3. Review the exact staged diff and run the release scan. Never publish company drawings, Xrefs, PDFs, records, photos, private reports, runtime state, pairing URLs/tokens, credentials, or binaries. A pattern scan is supporting evidence, not proof that arbitrary sensitive content is absent.
4. Commit with a professional English subject and body describing the change, reason, actual validation, and known limits. Push normally to the authorized origin; never force-push, rewrite published history, automatically merge conflicts, or replace someone else's work.
5. Verify the remote commit and GitHub CI for that commit. Fix demonstrated CI failures and publish the repair. Report the commit/link, check results, and any pending or blocked work accurately.

Stop publication and report the concrete blocker if tests fail, private content is found, authentication is unavailable, upstream diverges, or the target/destination changes. Do not claim a successful push or completed CI without verification. New external data destinations or destructive operations are outside this authorization.

## Data and engineering boundaries

Keep engineering acceptance gates, source/dataset identity, offline recovery, version-conflict handling, and explicit warnings intact. Do not convert synthetic or desktop-only tests into claims of real-device field readiness or engineering approval. Keep private operational data outside the tracked source tree.
