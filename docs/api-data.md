# Local HTTP API and data formats

Default root `http://127.0.0.1:42873`. API JSON is UTF-8 with `no-store`. Pair token is random 24-byte hex in ignored `data/pair-token`. POST pairing returns an HMAC-authenticated HttpOnly, SameSite=Strict cookie valid 30 days; HTTPS trusted tunnel adds Secure. Pair token must remain private. No individual user identity.

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | public service/runtime identity, no drawing data |
| `/api/pair` | POST | `{token}` (max 4096 bytes), set session cookie |
| `/api/drawing` | GET | protected active drawing manifest and paths |
| `/api/reference-info?view=` | GET | prepared reference metadata |
| `/api/reference.png?view=` / `.pdf` | GET | private prepared image/document if supplied |
| `/api/viewport.png` | GET | `view,b=x0,y0,x1,y1,w,h,system,context,unknown` |
| `/api/pick` | GET | same viewport plus screen `x,y`; derived object selection |
| `/api/cad/views/<file>` | GET | validated packet JSON/DXF filename |
| `/api/records` | GET/POST | all shared records / optimistic version save |
| `/api/photos` | POST | JPEG/PNG/WebP max 6 MB; optional `x-photo-id` |
| `/api/photos/<id>` | GET | stored private image |
| `/api/server-info` | GET | protected local/LAN/team links; treat response as secret |

Mutating requests with a supplied mismatched Origin are rejected. Loopback+exact registered team hostname are prerequisites for localhost.run canonical HTTPS reconstruction. The guard does not implement per-user authorization or generalized reverse-proxy trust.

## Record example (synthetic)

```json
{
  "id": "<sourceSHA256>-synthetic-demo-v1-DEMO:0",
  "opId": "<new-uuid-per-operation>",
  "sourceSHA256": "<64-hex-source-hash>",
  "sourceHandle": "DEMO0",
  "title": "LAN-DEMO-01",
  "status": "planned",
  "version": 0,
  "assignee": "Demo inspector",
  "notes": "Training only",
  "checks": [{"id": "location", "label": "Check location", "result": "unchecked"}],
  "photos": []
}
```

Statuses: planned, installed, tested, accepted, failed, blocked. Checklist answers: unchecked, pass, fail, na. NA requires notes. Accepted requires all checks pass/na plus server manifest `fieldReadiness.status=approved` and matching source SHA. Current importer/preparer deliberately leaves release blocked; changing JSON is not an authorized engineering approval workflow.

JSON request limits: records 100000 bytes; general/photo read 6 MB. Errors are JSON with error text and HTTP 400/401/403/409/415/422 as appropriate; some preparation/render errors currently use 400 instead of specialized status codes. clients retain local draft/queue on failure.

`itfield-offline-v1`: drawing source/dataset, selected views, assets, images with data URL/SHA/bytes/preparedAt. `itfield-results-v1`: source/dataset, records, JPEG data URLs, exportedAt. Server does not import files automatically. Validator is executable source of truth; see `lib/validation.mjs` and `client/offline-pack.mjs`.
