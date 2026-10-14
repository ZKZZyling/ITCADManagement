# Installation and upgrades

## Requirements

- Windows 10/11 for the controller and `.cmd` launchers. Core server CI runs on Windows and Linux.
- Node.js 22.13+ with `node:sqlite`. Use a supported LTS release and verify `node --version`.
- npm, Git, and a browser supporting IndexedDB, Cache Storage, Service Workers, and Web Crypto.
- Windows OpenSSH Client for localhost.run. Company private SSH keys are not required.
- Python 3.11+ and `requirements.txt` only for CAD preparation; not required for the demo viewer.
- Separately installed ODA File Converter, with appropriate usage rights, for DWG conversion. Neither ODA nor AutoCAD is bundled.

## Install

Clone into a writable directory. Avoid network shares with unverified SQLite locking. Windows scripts quote project paths to accommodate spaces. Run `Setup-ITField.cmd`, or run `npm ci`, `npm run build`, and `npm run demo` individually, checking each exit code.

Setup does not install Node, Git, or SSH, or grant administrator privileges. If company policy blocks PowerShell scripts, request approval through the company's normal process; do not weaken global execution policy.

## Network and environment

The default bind address is `127.0.0.1:42873`. The Windows controller uses port 42873. `ITFIELD_PORT` changes only the CLI server; adapt port-bound launcher/tunnel tooling before using a different port with the controller.

```powershell
$env:ITFIELD_HOST='127.0.0.1'
$env:ITFIELD_PORT='42874'
npm start
```

`.env.example` is a reference; the server does not load `.env` automatically. LAN access requires an explicit `ITFIELD_HOST=0.0.0.0` setting and company-approved firewall rules. LAN HTTP generally cannot provide Service Worker offline support; use approved HTTPS for tablets. Localhost is a secure-context exception.

Private runtime files are stored in `data/`; launcher temporary files use `.runtime/temp`. Windows global TEMP and application credentials are not relocated. For removable storage, verify drive identity and available space before use. The portable repository is not tied to one workstation's SSD volume GUID.

## Upgrade

Stop the project services before replacing dependencies. Back up the entire `data/` directory to an authorized destination and export unsynchronized browser results from each device. Update source, run `npm ci`, build, and verify. Demo setup preserves an existing active package. Check source and dataset identity before synchronizing after an upgrade.

There is no universal automatic rollback or migration recovery. IndexedDB currently uses schema v2; SQLite initialization uses `CREATE TABLE IF NOT EXISTS`. Review the architecture before changing schemas.
