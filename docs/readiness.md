# IT and ERP Implementation Readiness Planner

**Purpose:** organize the information and decisions needed to prepare an IT room, pathways, structured cabling, network services, and client connectivity to an ERP hosted in China. The planner is a project-readiness workspace. It does not configure devices, inspect a construction site, test a cable, size engineering systems, or grant engineering approval.

## What the current module does

The application exposes the planner at `/field/readiness.html`. It is available in Thai, Simplified Chinese, and English. Its current implementation is in `client/ReadinessApp.jsx`, `lib/readiness.mjs`, `server/readiness-store.mjs`, and the `/api/readiness` handlers in `server/local.mjs`.

The planner provides five views:

- **Overview:** project name, hosting choice (undecided, shared China, or local), current project phase, requirement counts, and category summaries. Counts are not construction-completion percentages.
- **Requirements:** a multilingual checklist organized into eight categories and five phases. Each requirement has a responsible owner, planning status, notes, and references to evidence.
- **Rooms and equipment:** room/rack register and equipment list with quantity, role, room/rack association, rated watts, rack units, and PoE watts. Totals include only entered values and show missing-value counts. They are not UPS, PDU, cooling, generator, or rack-design calculations. Do not add PoE twice if device watts already include it.
- **Cabling and topology:** record explicit room/equipment links, medium, system, source and destination ports, length, status, notes, and evidence. The map visualizes saved links only. It never infers a connection from objects being close together in a CAD drawing; map placement is not installation geometry.
- **ERP and decisions:** record service name, endpoint, protocol, port, owner, status and notes, plus open decisions. Enter only information approved for this workspace; do not put passwords, tokens, private keys, or other secrets in notes or evidence.

Evidence can refer to a drawing object using drawing identity, source handle, layer, view and source text, or be recorded as user confirmation, a proposal, or a user-entered test record. Those labels describe the evidence basis; the application does not independently verify the truth of an entered field test.

Requirement statuses are **unconfirmed**, **planned**, **evidence-recorded**, and **blocked**. Asset/link statuses include **unconfirmed**, **proposed**, **drawing-observed**, and **test-recorded**. A drawing-observed or test-recorded entry is traceability information, not approval or automated field acceptance.

## Data scope, saving and access

A plan is scoped to a drawing's source SHA-256 and dataset ID. This prevents a plan from silently attaching to a different drawing package or dataset. The readiness plan is stored separately from production inspection records.

An operator can edit and save through the authenticated `/api/readiness` endpoint. The server validates the schema, records a new version and update time, and writes an audit entry. Saves use optimistic version checking: when a different version was saved first, the server returns a conflict and retains the user's local draft rather than overwriting the newer plan. Compare/export the draft before loading a server version.

The browser keeps a local draft in IndexedDB for the current browser origin and drawing scope. Draft data is not a backup and can be lost if browser storage is cleared or evicted. **Export plan JSON** creates a portable plan file (maximum accepted import size: 2 MiB). **Import plan** validates format and drawing identity, then presents the imported plan as a candidate; the operator must confirm replacement of the current draft. Import does not itself save the plan to the server. The **reload** action fetches the server plan as a candidate and likewise requires confirmation before replacing the draft. The print action prints the current planner view/summary.

A read-only viewer can retrieve the readiness plan but cannot save it. The viewer role is application-level read-only access, not enterprise identity, per-person permissions, or tenant isolation. Do not treat a shared viewer link as a company document-control system.

## Using the planner to prepare the project

The seeded checklist is a prompt for owners to gather requirements. It is not a complete project-specific work specification. Start with the latest approved drawing revisions and owner assignments; replace unknowns with explicit questions instead of assumptions.

| Construction phase | Planner focus | Evidence to prepare before advancing |
|---|---|---|
| **1. Structure and preparation** | Confirm the intended IT room and responsible owners; identify access and equipment delivery constraints; start the equipment/load register; reserve main pathways; identify China ERP and network owners. | Current coordinated drawings and revision register; room/rack layout inputs; equipment list with source for each known value; open decisions and named owners. No room dimensions or structural capacity are prescribed by this planner. |
| **2. Before concealed works close** | Coordinate sleeves, penetrations, pathways, tray routes and crossings with structural, electrical, mechanical, water and fire disciplines; identify endpoints and capacity assumptions. | Approved coordinated/shop drawings; inspection records and dated photographs before pour or concealment; signed deviation/RFI closure. A CAD line or note alone is not proof of field route or clash-free design. |
| **3. Room and cabling installation** | Record racks, equipment, circuits, endpoint IDs, copper/fiber media, ports and explicit links. Keep planned, drawing-observed and tested statuses distinct. | Approved equipment and port schedules; installer labels at both ends; as-built route/port/core schedule; per-link test files against the contractually selected category/class, test model and limits. A basic continuity check or successful ping is not standards-based cable certification. |
| **4. Configuration and commissioning** | Record approved network zones, IP/VLAN assignments, switch ports, WAN path, ERP services, printer path and each device/interface owner. Execute only change-authorized tests. | Approved source/destination/protocol/port matrix; results from actual Thai user/device network segments; ERP owner-confirmed login and workflow; end-to-end print test through the approved Message Service/Print Client arrangement; PDA and MES/interface test where applicable; issue, rollback and escalation records. |
| **5. Handover and operations** | Close outstanding decisions, assign operating owners, document support/escalation and change review, retain as-built and test evidence. | Signed owner acceptance; final drawings and revision; asset, endpoint and port records; copper/fiber reports; electrical/HVAC commissioning records; approved network-flow matrix; open defects and maintenance responsibilities. |

### Server room: inventory first, design by responsible disciplines

The planner can collect room/rack labels and equipment counts, watts, U-space and PoE inputs. These fields help expose missing data and support a design conversation. They do **not** calculate circuit ratings, UPS capacity/runtime, battery autonomy, heat rejection, air-conditioning capacity, rack loading or redundancy. The module does not assume an ERP server belongs in the Thailand room. If the ERP is shared from China, use the room register for the local network/client/print equipment that is actually assigned to that room; get the hosting decision and equipment list from the system owner.

Before procurement, obtain the real equipment models and vendor input requirements, expected and measured loads where available, critical-load and shutdown objectives, and local electrical supply characteristics. The Thai electrical and mechanical designers and equipment vendors must approve circuits, grounding/bonding, UPS and bypass design, cooling, environmental limits and monitoring. No generic room temperature, UPS rating, reserve percentage, or runtime is prescribed here. Use each equipment manufacturer's requirements and the approved project design.

### Pathways, endpoints and cable acceptance

Create a unique cable/link schedule that connects **endpoint → room/rack → panel/switch port → device/service**. For copper, record the selected cable category/class, permanent-link or channel test model, identifier and tester report for each link under the approved contract/design limits. For fiber, record fiber type, core allocation, connector/polarity, length and insertion-loss result against the approved link budget; add OTDR traces when the approved specification calls for them. OTDR is complementary and does not replace insertion-loss measurement. Retain native test files, instrument identification/calibration evidence, failed results and retests. Confirm labeling matches both ends and as-built drawings.

The application can draw explicit recorded relationships and preserve evidence references. It cannot measure a cable, validate a link budget, determine tray fill or separation, certify fire stopping, or establish that a CAD route was installed as drawn. These acceptance decisions belong to the project specification and responsible installation/engineering parties.

### Network separation and shared China ERP dependencies

Use a communication-flow register before configuring routes or firewall policies. For every requested flow, record: source zone/device, destination service, direction, protocol and port, business purpose, application/system owner, China/Thailand network approver, security control, test result, change ticket and review/expiry date. Leave unknown endpoints and ports unresolved until the China ERP/application/network owner confirms them. Do not infer ports from an application name or open broad access as a troubleshooting shortcut.

Assess office/user devices, ERP clients, print services/printers, Wi-Fi, CCTV/access-control, building/fire systems, and production OT according to their owners, risk and required communication. Define zones and explicitly permitted conduits with the network and OT/security owners. Use appropriate segmentation and monitored control points; do not place unrelated systems on a flat trusted network. Any connection to safety or production control systems requires the relevant operational and safety-owner approval.

For the China-hosted ERP path, obtain the vendor-supported client architecture, endpoint names/IPs, protocols/ports, traffic direction, DNS/time/certificate/proxy requirements, sanctioned WAN/VPN path, performance limits, support window and escalation process. Confirm where the ERP client, Message Service and Thailand Print Client are installed and how they are configured. The server location and print-service placement are owner-confirmation items. Prove connectivity from the actual Thai user/device segments and test a complete authorized workflow, not merely ICMP reachability. Test each printer queue, driver and label format used in operations. Test PDA scanning and every approved MES/API/file interface with reconciled source and result records. Keep credentials out of the planner and test logs.

## Evidence and acceptance record

For field handover, attach or reference records with these fields wherever relevant:

- Requirement ID and clear acceptance criterion from an approved drawing, specification, vendor document or approved decision.
- Site area, room, rack, cabinet, panel, cable ID, endpoint and port/core IDs.
- Drawing/specification number, revision, approval state and responsible designer.
- Contractor/vendor and responsible owner.
- Equipment make/model/version and actual declared/measured load where applicable.
- Test method and selected limit; instrument ID/calibration evidence; measured result, unit, date/time and operating condition.
- Photo or native result file path in approved company storage; result status; defect/RFI/change reference; retest outcome.
- Sign-off by the appropriate contractor, system owner and qualified discipline/authority as required by the project.

The application stores references and user-entered text. It does not enforce an external document-retention policy or prove the linked file exists, is approved, is current, or belongs to the stated test.

## Current implementation and work still required

**Implemented:** multilingual planning form; seeded categories and construction phases; room, equipment, explicit-link, service and decision registers; known-input totals with missing counts; evidence references; summary counts; print view; JSON export/import with size, schema and drawing-scope validation; server persistence with version conflict handling; local browser draft; and read-only viewing.

**Not implemented as field control:** live switch/firewall/ERP configuration; cable test equipment integration; automatic CAD route-to-link inference; device discovery or continuous monitoring; native photo/test-report file verification from external references; engineering calculations or design validation; electronic engineer/owner approval; construction inspection workflow; or live ERP login/print/PDA/MES acceptance. Those tasks require authorized personnel, current project specifications, supported vendor details and physical/network tests.

A feature named “evidence-recorded” or “test-recorded” means a record was entered in the planner. It does not mean that an independent person validated it. Do not use planner status alone as a construction completion, code-compliance, engineering approval, commissioning or go-live certificate.

## Open project inputs and governance

No project-approved Thai construction/ELV acceptance SOP, cable certification specification, electrical/HVAC commissioning procedure, or China ERP network/service matrix is included with this public-safe guide. The project owner should identify the controlled source, revision and approving authority for each before field use. Obtain the current China ERP vendor/network requirements and the Thai contractor's approved shop drawings and method statements. If no company procedure exists, the responsible owner should establish and approve one through the organization's normal engineering/change-control process.

## Primary references

These references support general planning categories; they do not approve this application's project data or substitute for Thai law, contract specifications, vendor manuals or professional design review.

- NIST, [SP 800-82 Rev. 3: Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), final 2023-09-28. NIST's publication page notes a Revision 4 draft process; Rev. 3 remains the cited final edition for this guide.
- NIST, [CSWP 28: Security Segmentation in a Small Manufacturing Environment](https://csrc.nist.gov/pubs/cswp/28/security-segmentation-in-a-small-manufacturing-env/final), final 2023-04-06. A small-manufacturer segmentation framework, not a prescribed factory topology.
- CISA/ICS-CERT, [Recommended Practice: Improving Industrial Control System Cybersecurity with Defense-in-Depth Strategies](https://www.cisa.gov/sites/default/files/2023-01/NCCIC_ICS-CERT_Defense_in_Depth_2016_S508C.pdf), 2016 practice hosted by CISA.
- Schneider Electric, [Practical Guide to Preparing Edge Sites and Installing Micro Data Centers](https://www.se.com/sg/en/download/document/SPD_WP288_EN/), V1, SPD_WP288_EN, 2020-09-09; small-site framework up to 10 kW IT load, not a design approval.
- Schneider Electric/APC, [Things to consider in sizing a UPS and load](https://www.se.com/in/en/faqs/FAQ000268376/), published 2024-07-23, modified 2026-07-13. Vendor guidance; size and runtime depend on the actual equipment and approved design.
- ASHRAE, [2023 Handbook, Chapter 20: Data Centers and Telecommunications Facilities](https://handbook.ashrae.org/Handbooks/A23/SI/A23_Ch20/a23_ch20_si.aspx). Environmental ranges depend on equipment class; recommended and allowable ranges have different meanings.
- Fluke Networks, [Verification, Qualification and Certification](https://www.flukenetworks.com/knowledge-base/cableiq/verification-qualification-and-certification). Select current standards and limits in the project specification; the article explains why simple verification differs from certification.
- Fluke Networks, [Architects, Consultants and Designers](https://www.flukenetworks.com/expertise/role/architects-consultants-and-designers). Fiber Tier 1 loss/length/polarity and complementary OTDR guidance.
