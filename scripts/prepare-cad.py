"""Create traceable 2D CAD review data. Never modifies source drawings."""
import argparse, json, math, csv, hashlib, time, itertools
from pathlib import Path
import ezdxf
from ezdxf import disassemble

def category(name, text=''):
    s=(name+' '+text).lower()
    if any(x in s for x in ('消防报警','火灾','fire alarm')): return 'coordination'
    if any(x in s for x in ('监控','cctv','摄像')): return 'cctv'
    if any(x in s for x in ('门禁','access','读卡')): return 'access'
    if any(x in s for x in ('桥架','线槽','管线','conduit','tray','套管')): return 'pathway'
    if any(x in s for x in ('配电','ups','不间断','接地','照明','power','插座')): return 'power'
    if any(x in s for x in ('网络','通讯','综合布线','光纤','data','弱电','001数据','机柜')): return 'data'
    if any(x in s for x in ('底图','axes','axis','墙','门窗','柱','grid','建筑')): return 'context'
    return 'unknown'

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--pilot',required=True); ap.add_argument('--out',required=True); ap.add_argument('--full',action='store_true')
    a=ap.parse_args(); root=Path(a.pilot); out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
    summary=json.loads((root/'summary.json').read_text(encoding='utf-8-sig'))
    doc=ezdxf.readfile(root/'drawing.dxf'); msp=doc.modelspace(); objects=[]; notes=[]; skips={}; traversed=0
    hidden={l.dxf.name for l in doc.layers if l.is_off() or l.is_frozen()}
    def add(e,parent='',layer_override='',depth=0):
        nonlocal traversed
        traversed+=1
        if (not a.full and traversed>60000 and depth>0) or depth>14:
            skips['traversal_limit']=skips.get('traversal_limit',0)+1; return
        typ=e.dxftype(); layer=e.dxf.get('layer','0'); layer=layer_override if layer=='0' and layer_override else layer
        handle=e.dxf.get('handle','') or ''; source=parent or handle
        if typ=='INSERT':
            try:
                inserts=e.multi_insert() if e.mcount>1 else [e]
                for insert in inserts:
                    for child in insert.virtual_entities(): add(child,source,layer,depth+1)
                    for att in insert.attribs: add(att,source,layer,depth+1)
            except Exception as exc: skips['INSERT:'+type(exc).__name__]=skips.get('INSERT:'+type(exc).__name__,0)+1
            return
        text=''; anchor=None
        if typ in ('TEXT','MTEXT','ATTRIB','ATTDEF'):
            try:
                text=e.plain_text() if callable(getattr(e,'plain_text',None)) else e.dxf.text
                p=e.dxf.insert; anchor=[round(p.x,3),round(p.y,3)]
                height=e.dxf.get('char_height',200) if typ=='MTEXT' else e.dxf.get('height',200)
                if text.strip(): objects.append({'id':f'{source}:{len(objects)}','sourceHandle':source,'layer':layer,'kind':'text','text':text,'anchor':anchor,'height':float(height),'rotation':float(e.dxf.get('rotation',0)), 'system':category(layer,text),'sourceHidden':layer in hidden})
            except Exception: skips[typ]=skips.get(typ,0)+1
            return
        if typ in ('XLINE','RAY','HATCH','IMAGE','ACAD_PROXY_ENTITY','OLE2FRAME','WIPEOUT'):
            skips[typ]=skips.get(typ,0)+1; return
        try:
            p=disassemble.make_primitive(e,max_flattening_distance=15)
            pts=[[round(v.x,3),round(v.y,3)] for v in itertools.islice(p.vertices(),1001)]
            if len(pts)<2: return
            if len(pts)>1000:
                # Never silently discard long paths to fit a mobile size limit.
                pts=[[round(v.x,3),round(v.y,3)] for v in itertools.islice(p.vertices(),50001)]
                if len(pts)>50000: skips['point_limit']=skips.get('point_limit',0)+1; return
            if any(not math.isfinite(v) or abs(v)>2e8 for xy in pts for v in xy):
                skips['outlier']=skips.get('outlier',0)+1; return
            objects.append({'id':f'{source}:{len(objects)}','sourceHandle':source,'layer':layer,'kind':'path','points':pts,'system':category(layer),'type':typ,'sourceHidden':layer in hidden})
        except Exception: skips[typ]=skips.get(typ,0)+1
    source_entities=list(msp)
    source_entities.sort(key=lambda e: -1 if e.dxftype() in ('TEXT','MTEXT','ATTRIB') else 0 if category(e.dxf.get('layer','0')) not in ('unknown','context') else 1)
    for e in source_entities: add(e)
    # Sheet headings provide navigable regions. Boundaries remain explicitly provisional.
    titles=[o for o in objects if o['kind']=='text' and ('平面图' in o['text'] or '系统图' in o['text']) and len(o['text'])<90]
    views=[]
    for t in titles:
        x,y=t['anchor']; views.append({'id':t['id'],'title':t['text'],'sourceHandle':t['sourceHandle'],'center':[x,y+26000],'bounds':[x-50000,y-10000,x+95000,y+100000],'boundaryStatus':'Provisional — review against sheet frame'})
    if not views:
        xs=[p[0] for o in objects for p in (o.get('points') or [o['anchor']])]; ys=[p[1] for o in objects for p in (o.get('points') or [o['anchor']])]
        views=[{'id':'all','title':'Model','bounds':[min(xs),min(ys),max(xs),max(ys)],'boundaryStatus':'Provisional'}]
    layers=[{'name':l.dxf.name,'system':category(l.dxf.name),'off':l.is_off(),'frozen':l.is_frozen()} for l in doc.layers]
    assets=[]
    for o in objects:
        if o['kind']=='text' and any(x in o['text'] for x in ('机柜','配线架','光纤','AP','CAT6')):
            assets.append({'id':o['id'],'title':o['text'][:160],'sourceHandle':o['sourceHandle'],'layer':o['layer'],'anchor':o['anchor'],'system':o['system'],'classification':'Candidate — needs legend confirmation'})
    warnings=['Native font warnings exist. Browser text is a substitute, not a verified native plot.','Sheet boundaries and system mapping are provisional.','2D geometry is not installed cable length.','Nested geometry may have skipped entities; review source evidence.']
    payload={'schemaVersion':1,'project':'โรงงานระยอง • IT Field','drawing':Path(summary['source']).name,'sourceSHA256':summary['source_sha256'],'units':'mm' if doc.units==4 else 'unverified','revisionStatus':'Unapproved source revision','objects':objects,'views':views,'layers':layers,'assets':assets,'warnings':warnings,'skips':skips,'metrics':{'traversed':traversed,'objectCount':len(objects),'layerDefinitions':len(layers),'sourceBytes':Path(summary['source']).stat().st_size},'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%S')}
    if a.full:
        views_dir=out/'views';views_dir.mkdir(exist_ok=True)
        def obounds(o):
            ps=o.get('points') or [o['anchor']]
            return [min(p[0] for p in ps),min(p[1] for p in ps),max(p[0] for p in ps),max(p[1] for p in ps)]
        indexed=[(o,obounds(o)) for o in objects]
        extent=[min(bb[0] for _,bb in indexed),min(bb[1] for _,bb in indexed),max(bb[2] for _,bb in indexed),max(bb[3] for _,bb in indexed)]
        outside=sum(1 for _,bb in indexed if not any(not(bb[2]<v['bounds'][0] or bb[0]>v['bounds'][2] or bb[3]<v['bounds'][1] or bb[1]>v['bounds'][3]) for v in views))
        payload['metrics']['outsideProvisionalViews']=outside
        views.append({'id':'full-model','title':'Model — ทั้งพื้นที่ที่สกัดได้','bounds':extent,'boundaryStatus':'Derived model bounds; not an approved sheet','objectCount':len(objects)})
        for view in views:
            b=view['bounds'];subset=[o for o,bb in indexed if not(bb[2]<b[0] or bb[0]>b[2] or bb[3]<b[1] or bb[1]>b[3])]
            view['objectCount']=len(subset);view['file']=view['id'].replace(':','-')+'.json'
            (views_dir/view['file']).write_text(json.dumps(subset,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
            small=ezdxf.new('R2013');small.units=4;sm=small.modelspace()
            for o in subset:
                lname=o['layer']
                if lname not in small.layers:small.layers.new(lname)
                try:
                    if o['kind']=='path':sm.add_lwpolyline(o['points'],dxfattribs={'layer':lname})
                    else:sm.add_text(o['text'].replace('\n',' '),dxfattribs={'layer':lname,'height':max(50,min(o['height'],3000)),'insert':o['anchor']})
                except Exception:pass
            small.saveas(views_dir/(view['file'].replace('.json','.dxf')))
        payload['objects']=[];payload['tiled']=True
    payload['fieldReadiness']={'status':'blocked','reasons':['ยังไม่ได้รับรอง revision และ legend','ยังไม่ได้ตรวจเทียบภาพ native AutoCAD ทุกแผ่น','ขอบเขตแผ่นยังเป็นค่าประมาณ','มีวัตถุหรือรูปแบบข้อความที่ต้องตรวจเพิ่ม'],'sourceUnchanged':summary.get('source_unchanged') is True,'releaseApproval':None}
    payload['geometryFidelity']={'source':'native DXF expanded into review geometry','nativePlotVerified':False,'linetypeAndLineweightPreserved':False,'textAlignmentAndFontsVerified':False,'skipped':skips,'fullModelAvailable':bool(a.full)}
    (out/'drawing.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (out/'preparation-report.json').write_text(json.dumps({k:v for k,v in payload.items() if k not in ('objects','assets','layers')},ensure_ascii=False,indent=2),encoding='utf-8')
    # Small DXF for the embedded CAD engine: preserve native 2D coordinates and source IDs.
    clean=ezdxf.new('R2013'); clean.units=4; cm=clean.modelspace()
    for o in ([] if a.full else objects):
        lname=o['layer']
        if lname not in clean.layers: clean.layers.new(lname)
        try:
            if o['kind']=='path': cm.add_lwpolyline(o['points'],dxfattribs={'layer':lname})
            else: cm.add_text(o['text'].replace('\n',' '),dxfattribs={'layer':lname,'height':max(50,min(o['height'],3000)),'insert':o['anchor']})
        except Exception: pass
    clean.saveas(out/'review.dxf')
    print(json.dumps({'status':'prepared_review_only','objects':len(objects),'views':len(views),'assets':len(assets),'skips':skips,'jsonBytes':(out/'drawing.json').stat().st_size}))

if __name__=='__main__': main()
