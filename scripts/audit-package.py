"""Audit region coverage using actual exported source frame entities."""
import argparse,json,collections
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--root',required=True);ap.add_argument('--native',required=True);args=ap.parse_args();root=Path(args.root);native=Path(args.native)
meta=json.loads((root/'drawing.json').read_text(encoding='utf-8'));full=next(v for v in meta['views'] if v['id']=='full-model');raw=json.loads((root/'views'/full['file']).read_text(encoding='utf-8'));objects=raw if isinstance(raw,list) else [o for part in raw['parts'] for o in json.loads((root/'views'/part).read_text(encoding='utf-8'))]
frames=[]
for line in (native/'entities.jsonl').read_text(encoding='utf-8-sig').splitlines():
 e=json.loads(line)
 if e.get('scope')!='layout:Model' or e['type']!='LWPOLYLINE' or not e.get('closed') or e['layer'] not in ('PUB_TITLE','ANNO-TTLB','外框','TEL_TITLE','WIRE-照明_ZT'):continue
 ps=e['vertices'];xs=[p[0] for p in ps];ys=[p[1] for p in ps];b=[min(xs),min(ys),max(xs),max(ys)]
 rectangular=len(ps) in (4,5) and all(min(abs(p[0]-b[0]),abs(p[0]-b[2]))<.01 and min(abs(p[1]-b[1]),abs(p[1]-b[3]))<.01 for p in ps)
 if rectangular and b[2]-b[0]>50000 and b[3]-b[1]>50000:frames.append({'handle':e['handle'],'bounds':b,'layer':e['layer']})
byid={o['id']:o for o in objects};index=[]
for o in objects:
 ps=o.get('points') or [o['anchor']];index.append((o,[min(p[0] for p in ps),min(p[1] for p in ps),max(p[0] for p in ps),max(p[1] for p in ps)]))
matched=0
for view in meta['views']:
 if view['id']=='full-model':continue
 title=byid.get(view['id']);b=view['bounds']
 anchor=title['anchor'] if title else ([view['center'][0],view['center'][1]-26000] if 'center' in view else [(b[0]+b[2])/2,(b[1]+b[3])/2])
 candidates=[f for f in frames if f['bounds'][0]<=anchor[0]<=f['bounds'][2] and f['bounds'][1]<=anchor[1]<=f['bounds'][3]]
 if candidates:
  named=[f for f in candidates if f['layer']!='WIRE-照明_ZT'];frame=(max(named,key=lambda f:(f['bounds'][2]-f['bounds'][0])*(f['bounds'][3]-f['bounds'][1])) if named else min(candidates,key=lambda f:(f['bounds'][2]-f['bounds'][0])*(f['bounds'][3]-f['bounds'][1])));view['previousBounds']=view.get('previousBounds',view['bounds']);view['bounds']=frame['bounds'];view['frameHandle']=frame['handle'];view['frameLayer']=frame['layer'];view['boundaryStatus']='Source rectangular frame matched; sheet association requires approval';matched+=1
 b=view['bounds'];subset=[o for o,bb in index if not(bb[2]<b[0] or bb[0]>b[2] or bb[3]<b[1] or bb[1]>b[3])];view['objectCount']=len(subset)
 (root/'views'/view['file']).write_text(json.dumps(subset,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
coverage=sum(1 for _,bb in index if any(not(bb[2]<v['bounds'][0] or bb[0]>v['bounds'][2] or bb[3]<v['bounds'][1] or bb[1]>v['bounds'][3]) for v in meta['views'] if v['id']!='full-model'))
meta['metrics'].update({'sourceRectangularFrames':len(frames),'matchedFrameViews':matched,'outsideReviewedRegions':len(objects)-coverage,'sourceHiddenObjects':sum(bool(o.get('sourceHidden')) for o in objects),'systemCounts':dict(collections.Counter(o['system'] for o in objects))})
meta['datasetId']=meta.get('datasetId','review-v2-frame-audit');meta['fieldReadiness']['status']='blocked';meta['fieldReadiness']['reasons']=['ยังไม่มีหลักฐานอนุมัติ revision และ legend','ต้องตรวจฟอนต์และภาพ native AutoCAD โดยละเอียด','กรอบที่ตรวจพบต้องยืนยันการจับคู่กับชื่อแผ่น','ภาพกรอง geometry มีวัตถุและรูปแบบข้อความที่ไม่รองรับ']
if matched<len(meta['views'])-1:meta['fieldReadiness']['reasons'].append('ยังมีพื้นที่ที่ไม่พบกรอบต้นฉบับ')
for o in meta['assets']:o['viewIds']=[v['id'] for v in meta['views'] if v['id']!='full-model' and v['bounds'][0]<=o['anchor'][0]<=v['bounds'][2] and v['bounds'][1]<=o['anchor'][1]<=v['bounds'][3]]
(root/'drawing.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(root/'quality-audit.json').write_text(json.dumps({'metrics':meta['metrics'],'fieldReadiness':meta['fieldReadiness'],'geometryFidelity':meta['geometryFidelity'],'frames':frames},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'sourceFrames':len(frames),'matchedViews':matched,'uncoveredObjects':len(objects)-coverage,'status':'blocked_pending_review'}))
