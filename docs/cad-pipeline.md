# CAD preparation and quality gates

## Supported entry

Supply DWG/DXF from authorized sources. Original drawings are opened/read or copied to private staging; pipeline never saves over them. DXF goes directly through ezdxf; DWG requires separately installed official ODA File Converter. AutoCAD fallback and cracked-license operations are excluded from this public workflow.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# If needed, set the full path of a separately installed ODA converter:
$env:ITFIELD_ODA_EXE='C:/Program Files/ODA/ODAFileConverter/ODAFileConverter.exe'
.\Prepare-Drawing.cmd
```

Pipeline: `extract-independent.py` → `dxf-reader.py` evidence → `prepare-cad.py --full` → `audit-package.py` → `optimize-cad.py` → activate packet atomically only after success. Failure keeps the previous active package. New native/reference preparation is not automated in this portable release.

## Evidence outputs and limits

Reader writes summary.json, entities.jsonl and text.csv including layers, layouts, attributes, xref paths and font styles. Geometry expansion can skip unsupported items or point/depth limits; `skips`, warnings and metrics must remain visible. Layer/text keyword classification is provisional. Block definition counts are not installed device counts. Header extents may be stale.

Frame audit currently recognizes a limited set of rectangular title-frame layer names and size heuristics originating from the pilot. These are not universal sheet detection. Unsupported dimensions/layouts require manual adapter and visual verification. `audit-package.py` must not be generalized by lowering gates without new fixtures and review.

`optimize-cad.py` creates bounded DXF subsets and splits JSON for browser viewing. Simplified background is not complete construction evidence. Raster rendering fails for dense view rather than omitting objects invisibly.

## Author/native reference contract

Obtain author-approved PDF/PNG with fonts, Xrefs, plot style, legend, scale and revision preserved. Store private references under `data/native-references/<sourceSHA256>/reference-index.json` with per-view fields `view`, `status`, `png`, `file`, and root `source_sha256`, `source_unchanged`, `referenceQuality`, `boundary_status`. Images must have allowed base filenames. Preserve source hash association and audit how PDFs were created.

`scripts/prepare-native-previews.py --input <plot-folder> --out <private-output>` rasterizes an existing reference-index/PDF set and rejects blank/incomplete results; it does not itself produce native CAD plots. License conditions of PyMuPDF must be evaluated before redistribution (see notices). Demo images are synthetic, never marked as approved native plots.

## Production release checklist

1. Confirm AFC/revision and responsible engineer; collect legend, SPEC, ITP and IT/electrical boundaries.
2. Compare all sheet frames/title blocks, fonts and Chinese/Thai text to author output; check Xrefs, images, custom/proxy entities and skipped objects.
3. Validate scope classification, unit/scales and asset mapping; retain unknowns; verify installed count/takeoff against approved schedule/BOQ.
4. Test selected offline sheets on actual tablets/phones and network; review image legibility and evidence save/restore.
5. Record signed approval outside this pilot UI before accepting construction work. No automated validator replaces the responsible engineer.
