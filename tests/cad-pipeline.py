"""Synthetic DXF regression. No company source or native CAD engine."""
import hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
import ezdxf
ROOT=Path(__file__).resolve().parents[1]
class Pipeline(unittest.TestCase):
 def test_no_title_fallback_preserves_source_and_remains_blocked(self):
  with tempfile.TemporaryDirectory(prefix='itcad-dxf-test-') as temporary:
   t=Path(temporary);source=t/'synthetic.dxf';doc=ezdxf.new('R2013');doc.units=4
   doc.modelspace().add_line((0,0),(10000,8000));doc.modelspace().add_text('SYNTHETIC TRAINING ONLY',dxfattribs={'height':100,'insert':(1000,2000)})
   doc.saveas(source);before=hashlib.sha256(source.read_bytes()).hexdigest();raw=t/'reader';prepared=t/'prepared'
   commands=[['extract-independent.py',str(source),'--output',str(raw)],['prepare-cad.py','--pilot',str(raw),'--out',str(prepared),'--full'],['audit-package.py','--root',str(prepared),'--native',str(raw)],['optimize-cad.py','--root',str(prepared)]]
   for args in commands:subprocess.run([sys.executable,'-X','utf8',str(ROOT/'scripts'/args[0]),*args[1:]],check=True,capture_output=True)
   manifest=json.loads((prepared/'drawing.json').read_text(encoding='utf-8'))
   self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),before)
   self.assertEqual(manifest['sourceSHA256'],before);self.assertEqual(manifest['fieldReadiness']['status'],'blocked')
   self.assertEqual(manifest['metrics']['matchedFrameViews'],0);self.assertIn('full-model',[v['id'] for v in manifest['views']])
if __name__=='__main__':unittest.main()
