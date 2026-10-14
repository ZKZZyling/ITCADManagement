"""Synthetic preservation regression; no company files or CAD executable."""
import unittest,tempfile,sys,json,hashlib,subprocess
from pathlib import Path
import ezdxf
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from cad_primitives import supplemental_geometry
class Primitives(unittest.TestCase):
 def test_hatch_holes_and_native_point_remain_separate(self):
  doc=ezdxf.new('R2013');h=doc.modelspace().add_hatch();h.paths.add_polyline_path([(0,0),(100,0),(100,100),(0,100)]);h.paths.add_polyline_path([(20,20),(80,20),(80,80),(20,80)])
  o=supplemental_geometry(h);self.assertTrue(o['solidFill']);self.assertEqual(len(o['fillRings']),2);self.assertEqual(o['fillRings'][0][0],o['fillRings'][0][-1]);p=supplemental_geometry(doc.modelspace().add_point((5,7)));self.assertTrue(p['pointMarker']);self.assertEqual(p['points'],[[5,7],[5,7]])
 def test_restoration_keeps_source_and_original_identity(self):
  with tempfile.TemporaryDirectory(prefix='itcad-native-restore-') as tmp:
   t=Path(tmp);doc=ezdxf.new('R2013');block=doc.blocks.new('SYNTHETIC');block.add_point((2,2));h=block.add_hatch();h.paths.add_polyline_path([(0,0),(4,0),(4,4),(0,4)]);e=doc.modelspace().add_blockref('SYNTHETIC',(10,10));source=t/'source.dxf';doc.saveas(source);sha=hashlib.sha256(source.read_bytes()).hexdigest()
   pilot=t/'pilot';pilot.mkdir();(pilot/'drawing.dxf').write_bytes(source.read_bytes());(pilot/'summary.json').write_text(json.dumps({'source':str(source),'source_sha256':sha}),encoding='utf8');packet=t/'packet';(packet/'views').mkdir(parents=True)
   original=[{'id':'stable-id','sourceHandle':e.dxf.handle,'kind':'path','points':[[10,10],[14,10]],'layer':'0','system':'unknown'}];(packet/'views/a.json').write_text(json.dumps(original),encoding='utf8');(packet/'drawing.json').write_text(json.dumps({'sourceSHA256':sha,'assets':[],'warnings':[],'fieldReadiness':{'status':'blocked'},'views':[{'id':'v','file':'a.json','bounds':[0,0,100,100],'objectCount':1}]}),encoding='utf8')
   out=t/'repaired';subprocess.run([sys.executable,str(ROOT/'scripts/restore-review-region.py'),'--pilot',str(pilot),'--package',str(packet),'--out',str(out),'--views','v'],check=True,capture_output=True)
   self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),sha);self.assertEqual(json.loads((packet/'views/a.json').read_text()),original);rows=json.loads((out/'views/a.json').read_text());self.assertEqual(len(rows),3);self.assertEqual(rows[0]['id'],'stable-id');self.assertEqual(rows[0]['sourceGroup']['name'],'SYNTHETIC');self.assertEqual(json.loads((out/'drawing.json').read_text())['fieldReadiness']['status'],'blocked')
   prepared=t/'prepared';subprocess.run([sys.executable,str(ROOT/'scripts/prepare-cad.py'),'--pilot',str(pilot),'--out',str(prepared),'--full'],check=True,capture_output=True);m=json.loads((prepared/'drawing.json').read_text());rows=json.loads((prepared/'views'/m['views'][0]['file']).read_text());self.assertEqual({o['sourceGroup']['name'] for o in rows},{'SYNTHETIC'});self.assertEqual(m['datasetId'],'review-v3-native-primitives')
if __name__=='__main__':unittest.main()
