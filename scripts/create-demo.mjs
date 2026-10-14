import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const data='data';fs.mkdirSync(data,{recursive:true});
function syntheticPDF(file){
 const stream='BT /F1 18 Tf 40 850 Td (SYNTHETIC DEMO - NOT A CONSTRUCTION DRAWING) Tj ET\n100 100 1100 700 re S\n200 250 m 650 250 l 650 650 l S\nBT /F1 24 Tf 200 300 Td (LAN-DEMO-01) Tj ET\nBT /F1 24 Tf 600 480 Td (CCTV-DEMO-01) Tj ET\nBT /F1 24 Tf 850 640 Td (UPS-DEMO-01) Tj ET\n';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1300 900] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'];
 let text='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(text));text+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const start=Buffer.byteLength(text);text+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';fs.writeFileSync(file,text);
}
if(fs.existsSync(path.join(data,'active-package'))){
 const key=fs.readFileSync(path.join(data,'active-package'),'utf8').trim();if(/^[-a-f0-9]{36}$/.test(key)){const d=JSON.parse(fs.readFileSync(path.join(data,'packets',key,'drawing.json'),'utf8'));const file=path.join(data,'native-references',d.sourceSHA256,'demo-plan.pdf');if(d.datasetId==='synthetic-demo-v1'&&!fs.existsSync(file))syntheticPDF(file)}
 console.log('Active package exists; demo did not replace it.');process.exit(0)
}
const key=crypto.randomUUID(),root=path.join(data,'packets',key);fs.mkdirSync(path.join(root,'views'),{recursive:true});
const sourceSHA256=crypto.createHash('sha256').update('ITCAD synthetic training geometry v1; no factory source').digest('hex');
const objects=[{id:'DEMO:wall',sourceHandle:'DEMOwall',system:'context',layer:'DEMO-WALL',kind:'path',points:[[0,0],[12000,0],[12000,8000],[0,8000],[0,0]]},{id:'DEMO:cable',sourceHandle:'DEMOcable',system:'data',layer:'DEMO-DATA',kind:'path',points:[[1500,1500],[6000,1500],[6000,6000]]},...['LAN-DEMO-01','CCTV-DEMO-01','UPS-DEMO-01'].map((text,i)=>({id:'DEMO:'+i,sourceHandle:'DEMO'+i,system:['data','cctv','power'][i],layer:'DEMO-'+i,kind:'text',text,anchor:[1500+i*3000,2500+i*1500],height:240}))];
const view={id:'demo-plan',sourceHandle:'DEMOFRAME',title:'DEMO / แบบสมมติ / 演示平面图',bounds:[-500,-500,12500,8500],center:[6000,4000],objectCount:objects.length,file:'demo-plan.json',boundaryStatus:'Synthetic training boundary'};
const drawing={schemaVersion:1,project:'ITCAD · SYNTHETIC TRAINING ONLY',drawing:'synthetic-demo.dxf',sourceSHA256,datasetId:'synthetic-demo-v1',units:'mm',revisionStatus:'SYNTHETIC DEMO — not construction evidence',objects:[],views:[view],layers:objects.map(o=>({name:o.layer,system:o.system,off:false,frozen:false})),assets:objects.filter(o=>o.kind==='text').map(o=>({...o,title:o.text,classification:'Synthetic training asset'})),warnings:['SYNTHETIC DEMO. No factory drawing, engineering approval or genuine source-file hash.','Reference image was generated for training; it is not an AutoCAD plot.'],skips:{},metrics:{objectCount:objects.length,sourceBytes:0,layerDefinitions:objects.length},tiled:true,nativeReferenceAvailable:true,fieldReadiness:{status:'blocked',reasons:['Synthetic training only; no AFC, SPEC or ITP'],releaseApproval:null},geometryFidelity:{status:'synthetic'}};
fs.writeFileSync(path.join(root,'drawing.json'),JSON.stringify(drawing));fs.writeFileSync(path.join(root,'views',view.file),JSON.stringify(objects));
const pairs=[0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1027',9,'$INSUNITS',70,4,0,'ENDSEC',0,'SECTION',2,'ENTITIES'];
for(const o of objects){if(o.kind==='path'){for(let i=1;i<o.points.length;i++)pairs.push(0,'LINE',8,o.layer,10,o.points[i-1][0],20,o.points[i-1][1],30,0,11,o.points[i][0],21,o.points[i][1],31,0)}else pairs.push(0,'TEXT',8,o.layer,10,o.anchor[0],20,o.anchor[1],30,0,40,o.height,1,o.text)}
pairs.push(0,'ENDSEC',0,'EOF');fs.writeFileSync(path.join(root,'views','demo-plan.dxf'),pairs.join('\n')+'\n');
const refs=path.join(data,'native-references',sourceSHA256);fs.mkdirSync(refs,{recursive:true});
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1300" height="900"><rect width="100%" height="100%" fill="#f4f7f8"/><text x="50" y="50" font-size="25">SYNTHETIC DEMO - NOT A CONSTRUCTION DRAWING</text><rect x="100" y="100" width="1100" height="700" fill="none" stroke="#555" stroke-width="3"/><path d="M200 650H650V250" fill="none" stroke="#167f9c" stroke-width="6"/><text x="200" y="600" font-size="24">LAN-DEMO-01</text><text x="600" y="420" font-size="24">CCTV-DEMO-01</text><text x="850" y="260" font-size="24">UPS-DEMO-01</text></svg>';
await sharp(Buffer.from(svg)).png().toFile(path.join(refs,'demo-plan.png'));
syntheticPDF(path.join(refs,'demo-plan.pdf'));
fs.writeFileSync(path.join(refs,'reference-index.json'),JSON.stringify({source_sha256:sourceSHA256,source_unchanged:true,referenceQuality:'Synthetic training image — NOT a native CAD plot',boundary_status:'Synthetic',views:[{view:view.id,status:'synthetic',png:'demo-plan.png',file:'demo-plan.pdf',visualStatus:'synthetic',referenceQuality:'Synthetic training only'}]}));
fs.writeFileSync(path.join(data,'active-package'),key);console.log('Synthetic demo prepared. Engineering acceptance remains blocked.');
