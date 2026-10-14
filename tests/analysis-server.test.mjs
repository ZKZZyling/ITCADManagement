import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import net from 'node:net';import {spawn} from 'node:child_process';import {once} from 'node:events';import {fileURLToPath} from 'node:url';import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('local admin API requires separate token and exact Origin; verification is explicit and shutdown is graceful',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'itcad-admin-'));let child;
 try{
  fs.cpSync(path.join(root,'server'),path.join(temp,'server'),{recursive:true});fs.mkdirSync(path.join(temp,'data/sources'),{recursive:true});
  const packageId=crypto.randomUUID(),folder=path.join(temp,'data/packets',packageId);fs.mkdirSync(path.join(folder,'views'),{recursive:true});fs.writeFileSync(path.join(folder,'drawing.json'),JSON.stringify({sourceSHA256:'a'.repeat(64),datasetId:'synthetic',views:[{id:'one',file:'one.json'}],assets:[],fieldReadiness:{status:'blocked'}}));fs.writeFileSync(path.join(folder,'views/one.json'),'[]');
  const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
  child=spawn(process.execPath,['server/analysis-server.mjs'],{cwd:temp,env:{...process.env,ITFIELD_DATA_DIR:path.join(temp,'data'),ITCAD_ANALYSIS_PORT:String(port),ITCAD_SOURCE_ROOT:path.join(temp,'data/sources')},stdio:['ignore','pipe','pipe']});let log='';child.stderr.on('data',b=>log+=b);const base='http://127.0.0.1:'+port;
  let ready=false;for(let n=0;n<150;n++){try{ready=(await fetch(base+'/admin/health')).ok;if(ready)break}catch{}await new Promise(r=>setTimeout(r,20))}assert.ok(ready,log);
  assert.equal((await fetch(base+'/admin/state')).status,401);
  assert.equal((await fetch(base+'/admin/health',{headers:{'x-forwarded-for':'1.2.3.4'}})).status,403);
  const token=fs.readFileSync(path.join(temp,'data/analysis-token'),'utf8');assert.equal((await fetch(base+'/admin/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})})).status,403);
  const pair=await fetch(base+'/admin/pair',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({token})});assert.equal(pair.status,200);const cookie=pair.headers.get('set-cookie').split(';')[0],headers={cookie,origin:base,'content-type':'application/json'};
  const queue=await fetch(base+'/admin/jobs',{method:'POST',headers,body:JSON.stringify({kind:'verify',packageId})});assert.equal(queue.status,202);const job=await queue.json();let state;
  for(let n=0;n<100;n++){state=await (await fetch(base+'/admin/state',{headers})).json();if(state.jobs[0].status==='ready')break;await new Promise(r=>setTimeout(r,20))}assert.equal(state.jobs[0].status,'ready');assert.equal(state.activePackage,null);
  assert.equal((await fetch(base+'/admin/jobs/'+job.id+'/activate',{method:'POST',headers,body:'{}'})).status,400);
  assert.equal((await fetch(base+'/admin/jobs/'+job.id+'/activate',{method:'POST',headers,body:JSON.stringify({acknowledgeReviewOnly:true})})).status,200);
  assert.equal(fs.readFileSync(path.join(temp,'data/active-package'),'utf8'),packageId);
  assert.equal((await fetch(base+'/admin/jobs',{method:'POST',headers:{...headers,origin:'https://evil.invalid'},body:JSON.stringify({kind:'verify',packageId})})).status,403);
  assert.equal((await fetch(base+'/admin/shutdown',{method:'POST',headers,body:'{}'})).status,200);await once(child,'exit');assert.equal(fs.existsSync(path.join(temp,'data/analysis.lock')),false);
 }finally{if(child&&child.exitCode===null){child.kill();await once(child,'exit')}fs.rmSync(temp,{recursive:true,force:true})}
});
