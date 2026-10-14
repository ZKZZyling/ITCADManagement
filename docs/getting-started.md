# Start here: choose the correct workspace

| Purpose | Where to open | Behavior |
|---|---|---|
| Actual inspection, photos and synchronization | Windows controller or authenticated field team link | Full field backend and actual records |
| Prepare or verify CAD | Analysis button on the server computer | Local worker queue; no Render DWG upload |
| Supervisor presentation | Static viewer or read-only manager link | Browser-local snapshot, or explicit live server read |
| Actual offline inspection | Offline button inside the field app | Prepared references, actual local checklists/photos, later synchronization |
| Demonstrate checklist entry | Sandbox link inside management | Separate trial database; never production progress |

`localhost` means the device opening the link. A server localhost address cannot reach that server from a tablet or from China. Use a verified paired team URL. A read-only manager link does not grant inspection writes. Static hosting does not host the CAD worker or live inspection database.

## Start on the existing Windows server

1. Connect the configured project drive and run `ITField-Control.cmd`. Choose **Start system and open local web**. The controller opens an authenticated page; its bare address in another browser may require pairing.
2. The full workspace normally runs at `http://localhost:42873/field/index.html`. Select language, verify revision warnings, choose a sheet/system and search a tag. Reopen the guide whenever needed.
3. For CAD preparation, open **Analysis** from the controller, choose a permitted source or existing package, review the queue/log and explicitly activate a verified review result. New binary DWG needs a working approved converter. Review activation is not engineering approval.
4. For supervisors, export a private presentation from the configured controller or `Export-Presentation.cmd`, then supply it through an approved private company channel. The hosted management viewer reads it locally in the browser; it does not upload it for analysis.
5. For field work, prepare offline sheets while online, test reopening without connectivity, inspect/save, export a backup, reconnect to the same origin and synchronize. Resolve pending/conflict items before clearing storage.

## File formats

- DWG/DXF: local analysis source, not a management snapshot.
- `ITCAD-presentation-*.json` (`itcad-presentation-v1`): supervisor overview, references and evidence, maximum 80 MiB. Check export time for freshness.
- `itfield-offline-v1`: actual offline reference pack. Actual results use the existing offline result format and explicit synchronization.
- `itcad-trial-v1`: isolated trial results, never production inspection evidence.

Names are hints; format and source identity are validated. Never edit JSON to bypass checksums or acceptance gates.

## Guidance and recovery

Open the floating paperclip assistant in any of the five workspaces. It follows the current page, focused control and application status. **Show me where** highlights the relevant control; **Full guide** provides steps, format guidance, startup, troubleshooting and accuracy/privacy notes in Thai, Simplified Chinese and English. Original drawing text and user evidence remain unchanged. See [assistant behavior and validation](field-assistant.md).

An empty management page needs a presentation file. A format/checksum/size failure needs a verified export. A 502 team link needs server/provider/current-link verification, not corporate DNS, VPN or ERP changes. Pending results stay local; conflicts require comparison. Back up before changing origins, devices or storage.

Readiness `blocked` is an engineering gate, not an application crash. Revision, legend, SPEC, ITP and native fidelity still require responsible-person verification. Browser tests do not establish physical device or mainland-China-network acceptance.
