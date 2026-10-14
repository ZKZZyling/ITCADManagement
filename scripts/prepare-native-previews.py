"""Pre-render AutoCAD PDF windows on the server; never claims drawing approval."""
import argparse,json,shutil
from pathlib import Path
import pymupdf
from PIL import Image,ImageDraw,ImageChops
ap=argparse.ArgumentParser();ap.add_argument('--input',required=True);ap.add_argument('--out',required=True);a=ap.parse_args();source=Path(a.input);out=Path(a.out);out.mkdir(parents=True,exist_ok=True);index=json.loads((source/'reference-index.json').read_text(encoding='utf-8-sig'));thumbs=[]
if not index['source_unchanged'] or not index['views'] or any(row['status']=='failed' for row in index['views']):raise RuntimeError('Native reference integrity or completeness failed; release not activated')
for row in index['views']:
 if row['status']=='failed':continue
 pdf=source/row['file'];doc=pymupdf.open(pdf);page=doc[0];row['pageCount']=len(doc);row['textCharacters']=len(page.get_text());row['vectorPaths']=len(page.get_drawings());row['visualStatus']='pending';png=row['file'].replace('.pdf','.png');page.get_pixmap(matrix=pymupdf.Matrix(4,4)).save(out/png);row['png']=png;row['imageBytes']=(out/png).stat().st_size;shutil.copy2(pdf,out/pdf.name)
 im=Image.open(out/png).convert('RGB');bbox=ImageChops.difference(im,Image.new('RGB',im.size,'white')).getbbox();row['nativePagePixelSize']=list(im.size);row['whiteMarginCrop']=bbox;row['blank']=bbox is None
 if not bbox:raise RuntimeError('Blank native preview: '+row['view'])
 im=im.crop(bbox);im.save(out/png);row['imageBytes']=(out/png).stat().st_size
 im.thumbnail((360,260));card=Image.new('RGB',(380,300),'#edf2f4');card.paste(im,((380-im.width)//2,25));ImageDraw.Draw(card).text((10,280),row['view'],fill='black');thumbs.append(card)
grid=Image.new('RGB',(380*5,300*((len(thumbs)+4)//5)),'white')
for i,im in enumerate(thumbs):grid.paste(im,((i%5)*380,(i//5)*300))
grid.save(out/'contact-sheet.png');index['referenceQuality']='Native engine output, source fonts and approved sheet/revision comparison still required';(out/'reference-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'nativeWindows':len(thumbs),'sourceUnchanged':index['source_unchanged'],'totalPNGBytes':sum(r.get('imageBytes',0) for r in index['views'])}))
