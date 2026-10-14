"""Split large scene files and make bounded IT-focused DXFs for tablets."""
import json,math,argparse
from pathlib import Path
import ezdxf
ap=argparse.ArgumentParser();ap.add_argument('--root',default='public/cad');args=ap.parse_args();root=Path(args.root);meta=json.loads((root/'drawing.json').read_text(encoding='utf-8'));total=0
for view in meta['views']:
    file=root/'views'/view['file'];objects=json.loads(file.read_text(encoding='utf-8'))
    if isinstance(objects,dict):
        objects=[o for p in objects['parts'] for o in json.loads((file.parent/p).read_text(encoding='utf-8'))]
    parts=[];chunk=[];size=0
    for o in objects:
        n=len(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode('utf-8'))+1
        if chunk and size+n>4*1024*1024:
            name=file.stem+'-part'+str(len(parts))+'.json';(file.parent/name).write_text(json.dumps(chunk,ensure_ascii=False,separators=(',',':')),encoding='utf-8');parts.append(name);chunk=[];size=0
        chunk.append(o);size+=n
    if parts:
        name=file.stem+'-part'+str(len(parts))+'.json';(file.parent/name).write_text(json.dumps(chunk,ensure_ascii=False,separators=(',',':')),encoding='utf-8');parts.append(name)
        file.write_text(json.dumps({'parts':parts,'objectCount':len(objects)}),encoding='utf-8')
    doc=ezdxf.new('R2013');doc.units=4 if meta['units']=='mm' else 0;msp=doc.modelspace();export_skips={};exported=0
    important=[o for o in objects if o['system'] not in ('context','unknown') or o['kind']=='text']
    background=[o for o in objects if o['system'] in ('context','unknown') and o['kind']!='text']
    stride=max(1,math.ceil(len(background)/4000));subset=important+background[::stride]
    for o in subset:
        lname=o['layer']
        if lname not in doc.layers:doc.layers.new(lname)
        try:
            if o['kind']=='path':msp.add_lwpolyline(o['points'],dxfattribs={'layer':lname})
            else:msp.add_text(o['text'].replace('\n',' '),dxfattribs={'layer':lname,'height':max(50,min(o['height'],3000)),'insert':o['anchor']})
            exported+=1
        except Exception as e:export_skips[type(e).__name__]=export_skips.get(type(e).__name__,0)+1
    doc.saveas(file.with_suffix('.dxf'));view['engineSubsetCount']=exported;view['engineExportSkips']=export_skips;view['engineBackgroundSimplified']=stride>1;total+=len(objects)
warning='CAD engine uses IT-focused geometry with simplified background. Inspection canvas retains the full available scene for each provisional region.'
if warning not in meta['warnings']:meta['warnings'].append(warning)
(root/'drawing.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'status':'optimized','sceneObjectsIncludingOverlap':total,'views':len(meta['views']),'maximumAssetBytes':max(f.stat().st_size for f in root.rglob('*') if f.is_file())}))
