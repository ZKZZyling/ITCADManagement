"""Read DXF or use a separately installed ODA converter; never launches AutoCAD."""
import argparse,hashlib,importlib.util,json,os,shutil,subprocess,time
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('input',type=Path);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args();src=a.input.resolve(strict=True);root=a.output.resolve();root.mkdir(parents=True,exist_ok=False)
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
summary={'status':'failed','source':str(src),'source_sha256':digest(src),'output':str(root),'reader':'ezdxf','autocad_invoked':False};start=time.monotonic()
try:
 if src.suffix.lower() not in ('.dwg','.dxf'):raise RuntimeError('Choose DWG or DXF')
 if src.suffix.lower()=='.dxf':shutil.copy2(src,root/'drawing.dxf');summary['converter']='none: DXF input'
 else:
  candidates=[Path(os.environ['ITFIELD_ODA_EXE'])] if os.environ.get('ITFIELD_ODA_EXE') else []
  for folder in ('C:/Program Files/ODA','C:/Program Files/Open Design Alliance','C:/Program Files (x86)/ODA'):
   if Path(folder).exists():candidates.extend(Path(folder).glob('*/ODAFileConverter.exe'))
  converter=next((p for p in candidates if p.is_file()),None)
  if not converter:raise RuntimeError('ODA File Converter not installed. Install the official converter or supply DXF and PDF from the drawing author. AutoCAD fallback is disabled.')
  incoming=root/'input';converted=root/'converted';incoming.mkdir();converted.mkdir();shutil.copy2(src,incoming/'input.dwg')
  result=subprocess.run([str(converter),str(incoming),str(converted),'ACAD2018','DXF','0','0','input.dwg'],capture_output=True,timeout=240)
  (root/'converter.log').write_bytes(result.stdout+b'\n'+result.stderr)
  dxf=converted/'input.dxf'
  if result.returncode!=0 or not dxf.is_file():raise RuntimeError('ODA conversion failed; inspect converter.log')
  shutil.copy2(dxf,root/'drawing.dxf');summary['converter']={'path':str(converter),'returncode':result.returncode,'audit_repair':False}
 # Reuse only the pure DXF reader, not native_export/main or COM.
 spec=importlib.util.spec_from_file_location('dxf_evidence_reader',str(Path(__file__).with_name('dxf-reader.py')));reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
 summary['drawing']=reader.extract(root/'drawing.dxf',root);summary['status']='passed_with_warnings' if summary['drawing']['extraction_warnings'] else 'passed'
except Exception as e:summary['error']=str(e)
finally:
 summary['source_unchanged']=digest(src)==summary['source_sha256'];summary['elapsed_seconds']=round(time.monotonic()-start,2)
 if not summary['source_unchanged']:summary.update(status='failed',error='Source changed during operation')
 (root/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':summary['status'],'autocad_invoked':False,'error':summary.get('error'),'output':str(root)}));raise SystemExit(1 if summary['status']=='failed' else 0)
