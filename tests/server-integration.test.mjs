import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('isolated server: pairing, source, preview, save/retry/conflict, photos and release block',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'itcad-release-test-'));let child;
 try{
  for(const folder of ['server','client','lib','scripts','public'])fs.cpSync(path.join(source,folder),path.join(temp,folder),{recursive:true});
  // No hardlinks/symlinks: use installed package resolution without copying dependency binaries.
  fs.mkdirSync(path.join(temp,'node_modules'),{recursive:true});
  for(const dep of ['sharp','@img','detect-libc','semver']){
   const input=path.join(source,'node_modules',dep);if(fs.existsSync(input))fs.cpSync(input,path.join(temp,'node_modules',dep),{recursive:true});
  }
  execFileSync(process.execPath,['scripts/create-demo.mjs'],{cwd:temp});
  // Reserve a free loopback port without touching the live factory server.
  const net=await import('node:net');const reserved=net.createServer();reserved.listen(0,'127.0.0.1');await once(reserved,'listening');const port=reserved.address().port;await new Promise(resolve=>reserved.close(resolve));
  child=spawn(process.execPath,['server/local.mjs','--itfield-port='+port],{cwd:temp,env:{...process.env,ITFIELD_HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
  let logs='';child.stderr.on('data',x=>{logs+=x});const base='http://127.0.0.1:'+port;
  let ready=false;for(let n=0;n<100;n++){try{ready=(await fetch(base+'/api/health')).ok;if(ready)break}catch{};await new Promise(r=>setTimeout(r,50))}assert.ok(ready,logs);
  assert.equal((await fetch(base+'/api/drawing')).status,401);assert.equal((await fetch(base+'/%63ad/drawing.json')).status,401);
  const token=fs.readFileSync(path.join(temp,'data/pair-token'),'utf8');
  // Trusted tunnel canonical HTTPS must accept real browser Origin and issue Secure cookies.
  const tunnelOrigin='https://pair-test.lhr.life';
  fs.writeFileSync(path.join(temp,'data/team-origin'),tunnelOrigin,'utf8');
  const tunnelPair=origin=>new Promise((resolve,reject)=>{const req=http.request(base+'/api/pair',{method:'POST',headers:{host:'pair-test.lhr.life',origin,'x-forwarded-proto':'http','content-type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res))});req.on('error',reject);req.end(JSON.stringify({token}))});
  const tunneled=await tunnelPair(tunnelOrigin);
  assert.equal(tunneled.statusCode,200);assert.match(tunneled.headers['set-cookie'][0],/; Secure/);assert.match(tunneled.headers['set-cookie'][0],/SameSite=Strict/);
  const denied=await tunnelPair('https://unrelated.invalid');
  assert.equal(denied.statusCode,403);assert.equal(denied.headers['set-cookie'],undefined);
  assert.equal((await fetch(base+'/api/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:'0'.repeat(48)})})).status,401);
  const pair=await fetch(base+'/api/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});assert.equal(pair.status,200);assert.match(pair.headers.get('set-cookie'),/HttpOnly/);const cookie=pair.headers.get('set-cookie').split(';')[0],headers={cookie,'content-type':'application/json'};
  const drawing=await (await fetch(base+'/api/drawing',{headers})).json();assert.equal(drawing.datasetId,'synthetic-demo-v1');assert.equal(drawing.fieldReadiness.status,'blocked');
  const info=await (await fetch(base+'/api/scene-info?view=demo-plan',{headers})).json();assert.equal(info.total,5);
  const image=await fetch(base+'/api/reference.png?view=demo-plan',{headers});assert.equal(image.status,200);assert.equal(Buffer.from(await image.arrayBuffer()).subarray(1,4).toString(),'PNG');
  const pdf=await fetch(base+'/api/reference.pdf?view=demo-plan',{headers});assert.equal(pdf.status,200);assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
  const raster=await fetch(base+'/api/viewport.png?view=demo-plan&b=-500,-500,12500,8500&w=1000&h=700',{headers});assert.equal(raster.status,200);assert.equal(raster.headers.get('x-object-count'),'5');
  assert.equal((await fetch(base+'/api/viewport.png?view=demo-plan&b=0,0,1,1&w=2000&h=700',{headers})).status,400);
  const id=drawing.sourceSHA256+'-synthetic-demo-v1-DEMO:0',record={id,opId:crypto.randomUUID(),sourceSHA256:drawing.sourceSHA256,title:'Synthetic QA',status:'installed',version:0,notes:'Training only',checks:[{id:'loc',label:'location',result:'pass'}],photos:[]};
  const post=x=>fetch(base+'/api/records',{method:'POST',headers,body:JSON.stringify(x)});
  assert.equal((await post({...record,trial:true})).status,422);assert.equal((await post(record)).status,200);assert.equal((await post(record)).status,200);
  assert.equal((await post({...record,opId:crypto.randomUUID()})).status,409);
  assert.equal((await post({...record,opId:crypto.randomUUID(),version:1,status:'accepted'})).status,422);
  assert.equal((await fetch(base+'/api/records',{method:'POST',headers:{...headers,origin:'https://evil.invalid'},body:JSON.stringify(record)})).status,403);
  const all=await (await fetch(base+'/api/records',{headers})).json();assert.equal(all.records.length,1);
  const png=fs.readFileSync(path.join(temp,'data/native-references',drawing.sourceSHA256,'demo-plan.png'));
  const photo=await fetch(base+'/api/photos',{method:'POST',headers:{cookie,'content-type':'image/png'},body:png});assert.equal(photo.status,200);const photoId=(await photo.json()).id;assert.deepEqual(Buffer.from(await (await fetch(base+'/api/photos/'+photoId,{headers})).arrayBuffer()),png);
  assert.equal((await fetch(base+'/api/photos',{method:'POST',headers:{cookie,'content-type':'text/html'},body:'bad'})).status,415);
  assert.equal((await post({...record,opId:crypto.randomUUID(),version:1,photos:[photoId]})).status,200);
  const old=fs.readFileSync(path.join(temp,'data/active-package'),'utf8');execFileSync(process.execPath,['scripts/create-demo.mjs'],{cwd:temp});assert.equal(fs.readFileSync(path.join(temp,'data/active-package'),'utf8'),old);
  const viewerToken=fs.readFileSync(path.join(temp,'data/viewer-token'),'utf8');
  const viewerPair=await fetch(base+'/api/pair-viewer',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({token:viewerToken})});assert.equal(viewerPair.status,200);
  const viewerCookie=viewerPair.headers.get('set-cookie').split(';')[0],viewerHeaders={cookie:viewerCookie,'content-type':'application/json'};
  const manager=await fetch(base+'/api/manager',{headers:viewerHeaders});assert.equal(manager.status,200);assert.equal((await manager.json()).role,'viewer');
  assert.equal((await fetch(base+'/api/records',{method:'POST',headers:viewerHeaders,body:JSON.stringify(record)})).status,403);
  assert.equal((await fetch(base+'/api/photos',{method:'POST',headers:{cookie:viewerCookie,'content-type':'image/png'},body:png})).status,403);
  assert.equal((await fetch(base+'/api/server-info',{headers:viewerHeaders})).status,403);
  assert.equal((await fetch(base+'/api/reference.png?view=demo-plan',{headers:viewerHeaders})).status,200);
  const {exportPresentation}=await import('../server/presentation-export.mjs');const exported=exportPresentation(path.join(temp,'data'));assert.equal(exported.p.records.length,1);assert.equal(exported.p.images.length,1);assert.equal(exported.p.photos.length,1);assert.ok(!exported.text.includes(token));assert.ok(!exported.text.includes(viewerToken));assert.ok(!exported.text.includes(temp));
 }finally{if(child&&child.exitCode===null){child.kill();await once(child,'exit')}fs.rmSync(temp,{recursive:true,force:true})}
});
