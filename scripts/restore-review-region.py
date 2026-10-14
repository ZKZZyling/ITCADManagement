"""Create a separate review package; retain IDs and never modify DWG or input package."""
import argparse,collections,hashlib,json,shutil,math
from pathlib import Path
import ezdxf
from cad_primitives import supplemental_geometry

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def intersects(points,b):return bool(points) and not(max(p[0] for p in points)<b[0] or min(p[0] for p in points)>b[2] or max(p[1] for p in points)<b[1] or min(p[1] for p in points)>b[3])
def main():
    p=argparse.ArgumentParser();p.add_argument('--pilot',required=True);p.add_argument('--package',required=True);p.add_argument('--out',required=True);p.add_argument('--views',required=True);a=p.parse_args()
    pilot=Path(a.pilot).resolve();root=Path(a.package).resolve();out=Path(a.out).resolve()
    if out.exists() or root==out or root in out.parents:raise ValueError('Use a new separate output directory')
    summary=json.loads((pilot/'summary.json').read_text(encoding='utf8'));meta=json.loads((root/'drawing.json').read_text(encoding='utf8'));source=Path(summary['source']);before=digest(source)
    if before!=summary['source_sha256'] or before!=meta['sourceSHA256']:raise ValueError('Source identity mismatch')
    wanted=set(a.views.split(','));views=[v for v in meta['views'] if v['id'] in wanted]
    if len(views)!=len(wanted):raise ValueError('Unknown view')
    originals={v['id']:json.loads((root/'views'/v['file']).read_text(encoding='utf8')) for v in views}
    if any(not isinstance(rows,list) for rows in originals.values()):raise ValueError('Use bounded region arrays; full-model repair requires separate processing')
    handles={o['sourceHandle'] for rows in originals.values() for o in rows};doc=ezdxf.readfile(pilot/'drawing.dxf');groups={};extras=[];patches=collections.defaultdict(list);skipped=collections.Counter();sequence=collections.Counter()
    hidden={layer.dxf.name for layer in doc.layers if layer.is_off() or layer.is_frozen()}
    def walk(e,source_handle,layer_override=None,depth=0):
        if depth>14:skipped['nesting-limit']+=1;return
        typ=e.dxftype();layer=e.dxf.get('layer','0');layer=layer_override if layer=='0' and layer_override else layer
        if typ=='INSERT':
            try:
                for insert in (e.multi_insert() if e.mcount>1 else [e]):
                    for child in insert.virtual_entities():walk(child,source_handle,layer,depth+1)
                    for child in insert.attribs:walk(child,source_handle,layer,depth+1)
            except Exception as exc:skipped['INSERT:'+type(exc).__name__]+=1
        elif typ in ('POINT','HATCH'):
            try:
                o=supplemental_geometry(e);sequence[source_handle]+=1
                if not any(intersects(o['points'],v['bounds']) for v in views):return
                same=next((x for rows in originals.values() for x in rows if x['sourceHandle']==source_handle),None)
                o.update(id=f'{source_handle}:native-{typ}-{sequence[source_handle]}',sourceHandle=source_handle,layer=layer,system=same['system'] if same else 'unknown',sourceHidden=layer in hidden or bool(e.dxf.get('invisible',0)),nativeSupplement=True)
                extras.append(o)
            except Exception as exc:skipped[typ+':'+type(exc).__name__]+=1
        elif typ in ('TEXT','MTEXT','ATTRIB','ATTDEF'):
            text=e.plain_text() if callable(getattr(e,'plain_text',None)) else e.dxf.text
            at=e.dxf.insert;halign=e.dxf.get('halign',0);valign=e.dxf.get('valign',0)
            anchor=e.dxf.get('align_point',at) if halign or valign else at
            patches[source_handle].append({'text':text,'oldAnchor':[round(at.x,3),round(at.y,3)],'anchor':[round(anchor.x,3),round(anchor.y,3)],'textAlign':'middle' if halign==1 else 'end' if halign==2 else 'start','textBaseline':'middle' if valign==2 else 'hanging' if valign==3 else 'auto','alignmentVerified':halign in (0,1,2) and valign in (0,1,2,3)})
    for e in doc.modelspace():
        h=e.dxf.handle
        if h in handles or e.dxftype() in ('HATCH','POINT'):
            if e.dxftype()=='INSERT':groups[h]={'name':e.dxf.name,'sourceType':'INSERT'}
            walk(e,h)
    report={'sourceSHA256':before,'nativeDXFSHA256':digest(pilot/'drawing.dxf'),'sourceUnchanged':True,'skippedSupplement':dict(skipped),'views':[],'engineeringApproval':'blocked','limits':['Pattern hatches show boundaries only; fonts, linetypes, wipeouts and cross-sheet completeness remain unverified.','POINT is a native marker, not a device quantity.','Only listed review regions were supplemented; legacy full-model geometry is retained.']}
    shutil.copytree(root,out)
    for v in views:
        rows=originals[v['id']];old_ids={x['id'] for x in rows};alignments=0
        for o in rows:
            if o['sourceHandle'] in groups:o['sourceGroup']=groups[o['sourceHandle']]
            if o['kind']=='text':
                match=next((x for x in patches[o['sourceHandle']] if x['text']==o['text'] and x['oldAnchor']==o['anchor']),None)
                if match and match['alignmentVerified']:
                    o.update(anchor=match['anchor'],textAlign=match['textAlign'],textBaseline=match['textBaseline']);alignments+=1
        added=[dict(o,sourceGroup=groups.get(o['sourceHandle'])) for o in extras if intersects(o['points'],v['bounds'])]
        rows.extend(added)
        if len({o['id'] for o in rows})!=len(rows):raise ValueError('Duplicate review identity')
        (out/'views'/v['file']).write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')),encoding='utf8')
        v.update(objectCount=len(rows),geometryReviewRevision='native-supplement-v1')
        report['views'].append({'id':v['id'],'originalObjects':len(old_ids),'retainedOriginalIDs':len(old_ids & {o['id'] for o in rows}),'added':dict(collections.Counter(o['type'] for o in added)),'textAlignments':alignments,'sourceGroups':len(groups)})
    if digest(source)!=before:raise ValueError('Original source changed')
    meta['geometryReviewRevision']='native-supplement-v1';meta['sourceVerification']='original-hash-checked';meta['fieldReadiness']['status']='blocked';meta['warnings'].append('Listed regions include native HATCH/POINT supplements and source text alignment. Other regions retain prior geometry; compare native reference.')
    (out/'drawing.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf8');(out/'native-supplement-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=True))
if __name__=='__main__':main()
