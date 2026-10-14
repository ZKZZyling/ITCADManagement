# Tests and release gates

## Portable verification

```powershell
npm ci
npm run build
npm test
git add .
npm run check:release
```

Unit tests cover geometry/filtering, checklist/NA rules, CSV injection escaping, language coverage/source-text preservation, scoped progress, workflow single-flight, offline pack signatures/hashes, sync scoping and trusted proxy origins. Server integration starts a **temporary isolated copy on an OS-assigned loopback port**, generates synthetic data and removes only its own temp directory afterward; it never writes QA records to a running factory server.

Release scan checks staged filenames, size and known secret/data indicators. It cannot detect every confidential string. Review `git diff --cached` and complete tree manually before push. Generated runtime data and assets stay ignored.

CI runs install/build/tests/release scan on Windows and Linux with Node 22 and 24. Windows additionally parses PowerShell files and runs controller-state and team-origin parsing tests. CI does not start external tunnels, operate AutoCAD or inspect private factory files. A configured workflow is not evidence of a successful GitHub run; verify run status after push.

## Manual acceptance before deployment

1. Clean Windows clone: setup, controller start, repeated start, local paired browsing, stop and repeated stop; another service occupying port must be preserved.
2. Real tablet/phone: portrait/landscape, language switch, legible prepared reference, tag search, checklist, real camera photo and exported recovery.
3. Prepare pack online, airplane-mode reload, save/reload results, reconnect and explicit sync; inspect server record/photos and conflicts.
4. Approved tunnel: pairing Secure cookie, protected drawing without cookie=401, exact Origin guard, URL rotation, laptop sleep/restart; user verifies ERP session works.
5. Engineer verifies approved references, scale/fonts/Xrefs/legend and every warning; sign release independently. Do not edit fieldReadiness to bypass this.
