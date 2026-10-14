# Publication and update workflow

English is the primary language for all GitHub-facing documentation and change descriptions. The owner has authorized automatic commit and normal push after completed, verified project updates. [AGENTS.md](../AGENTS.md) records the persistent project policy.

This authorization applies to ITCADManagement source updates only. It does not publish private operational data or authorize uploads to other services. It is followed during active maintenance work; there is no unattended watcher, scheduled task, or automatic push on every file save.

## Standard update sequence

1. Inspect the branch/upstream and working tree, finish the requested change, and update English documentation and CHANGELOG.
2. Run meaningful verification. The standard helper runs build, Node tests, PowerShell syntax/state/origin checks, and the release scan. CAD changes also require the Python regression and appropriate reference checks.
3. Review the exact staged diff and the permitted publication paths. Commit unrelated changes separately; never include private/company data.
4. Write a clear English commit subject and body, then push to the authorized origin without force. Authentication or upstream conflicts must be resolved explicitly.
5. Compare the remote commit with the local commit and inspect GitHub CI for that exact SHA. A successful push alone does not establish that CI passed.

## Windows helper

```powershell
# Inspect changes first; paths below are an example, not a blanket staging rule.
./scripts/publish.ps1 -Paths README.md,docs,CHANGELOG.md `
  -Title 'docs: clarify offline preparation and recovery' `
  -Body 'Explain the required preflight checks and cross-origin recovery workflow.'
```

Use `-CheckOnly` to run the gates and review staging without committing or pushing. The helper refuses an unexpected repository destination, a detached HEAD, a branch without `origin` upstream, a remote branch that is ahead, or staged files outside the explicitly selected paths. If build changes tracked HTML/service-worker files, include those files explicitly after reviewing them.

The helper does not install dependencies, start application services, mutate company DNS/VPN, merge upstream changes, publish a release, or wait for remote CI. The maintainer must complete the final GitHub CI check before reporting the update as verified. For a failed gate, inspect the result and fix the cause; do not bypass it to satisfy automatic publication.

## Commit body example

```text
docs: make repository guidance English-first

Replace Thai-primary setup and field guides with English instructions so
international contributors can install, operate, and maintain the project.
Preserve multilingual application behavior and original drawing evidence.

Validation:
- Documentation links and language checks passed.
- Build and relevant tests passed.
- Staged source reviewed; release scan passed.

Limitations:
- No new field-device or engineering-approval evidence was established.
```

Only list checks that actually ran. Keep commit subjects concise, use bodies for rationale and evidence, and preserve technical names. A Conventional Commits prefix such as `docs:`, `fix:`, or `feat:` is recommended, not a claim that a new version has been released.

## Changelog and release notes

Record user-visible changes under `Unreleased` until a version is intentionally released. Describe the final behavior, relevant checks, and material limits in English. Do not fabricate old release notes or rewrite already-published commit messages solely for language consistency. Historical public commit subjects in this repository already use English.

GitHub Desktop can manage the same local repository and origin. Do not clone private factory runtime data into a public source branch. The source tree and its Git history are the publishable project; generated `data/` belongs to the local deployment.
