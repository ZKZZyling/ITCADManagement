import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createPlan} from '../lib/readiness.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('readiness HTTP isolation, permissions, conflicts and durable planning storage', {timeout:30000}, async t=>{
 const tempBase=path.resolve(os.tmpdir()),data=fs.mkdtempSync(path.join(tempBase,'itcad-readiness-http-'));let child;
 const drawing={drawing:'Synthetic readiness integration fixture',sourceSHA256:'e'.repeat(64),datasetId:'synthetic-readiness-a',fieldReadiness:{status:'blocked'},views:[],assets:[],warnings:[]};
 const active=crypto.randomUUID(),packet=path.join(data,'packets',active);fs.mkdirSync(packet,{recursive:true});fs.writeFileSync(path.join(data,'active-package'),active,'utf8');
 const writeDrawing=d=>fs.writeFileSync(path.join(packet,'drawing.json'),JSON.stringify(d),'utf8');writeDrawing(drawing);
 const reserved=net.createServer();reserved.listen(0,'127.0.0.1');await once(reserved,'listening');const port=reserved.address().port;await new Promise(resolve=>reserved.close(resolve));
 const base='http://127.0.0.1:'+port;
 async function start(){
  child=spawn(process.execPath,['server/local.mjs','--itfield-port='+port],{cwd:root,env:{...process.env,ITFIELD_DATA_DIR:data,ITFIELD_HOST:'127.0.0.1'},stdio:['ignore','ignore','pipe']});
  // Drain output without exposing pairing information or unrelated diagnostics.
  child.stderr.resume();
  for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error('Isolated readiness server exited during startup');try{if((await fetch(base+'/api/health')).ok)return;}catch{}await pause(25);}throw Error('Isolated readiness server did not start');
 }
 async function stop(){if(child&&child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}child=null;}
 const jsonHeaders={'content-type':'application/json'};let operator,viewer,saved;
 const get=(url,headers={})=>fetch(base+url,{headers});
 const post=(url,value,headers=operator)=>fetch(base+url,{method:'POST',headers:{...jsonHeaders,...headers},body:JSON.stringify(value)});
 try{
  await start();
  await t.test('unauthenticated access is denied and operator pairing opens an empty scoped plan',async()=>{
   assert.equal((await get('/api/readiness')).status,401);assert.equal((await post('/api/readiness',{},{ })).status,401);
   const token=fs.readFileSync(path.join(data,'pair-token'),'utf8').trim(),paired=await post('/api/pair',{token},{});assert.equal(paired.status,200);operator={cookie:paired.headers.get('set-cookie').split(';')[0]};
   const response=await get('/api/readiness',operator);assert.equal(response.status,200);assert.deepEqual(await response.json(),{plan:null,role:'operator'});
  });
  const plan=createPlan(drawing),opId=crypto.randomUUID(),operation={opId,plan};
  await t.test('create and identical retry return one stable server version',async()=>{
   const response=await post('/api/readiness',operation);assert.equal(response.status,200);saved=await response.json();assert.equal(saved.version,1);assert.ok(saved.updatedAt);assert.equal(saved.sourceSHA256,drawing.sourceSHA256);
   const retry=await post('/api/readiness',operation);assert.equal(retry.status,200);assert.deepEqual(await retry.json(),saved);
   assert.deepEqual((await (await get('/api/readiness',operator)).json()).plan,saved);
  });
  await t.test('changed operation ID payload and stale versions fail without overwriting the plan',async()=>{
   const changed=structuredClone(operation);changed.plan.context.name='Changed retry';assert.equal((await post('/api/readiness',changed)).status,409);
   assert.equal((await post('/api/readiness',{opId:crypto.randomUUID(),plan})).status,409);
   assert.deepEqual((await (await get('/api/readiness',operator)).json()).plan,saved);
  });
  await t.test('wrong primary scope, trial operation and unsupported evidence claims are rejected',async()=>{
   for(const change of [p=>p.sourceSHA256='f'.repeat(64),p=>p.datasetId='other-dataset',p=>p.requirements[0].status='evidence-recorded']){const p=structuredClone(saved);change(p);assert.equal((await post('/api/readiness',{opId:crypto.randomUUID(),plan:p})).status,422);}
   assert.equal((await post('/api/readiness',{opId:crypto.randomUUID(),trial:true,plan:saved})).status,422);
   assert.deepEqual((await (await get('/api/readiness',operator)).json()).plan,saved);
  });
  await t.test('viewer can read the plan but cannot post; foreign origins are rejected',async()=>{
   const token=fs.readFileSync(path.join(data,'viewer-token'),'utf8').trim(),paired=await post('/api/pair-viewer',{token},{});assert.equal(paired.status,200);viewer={cookie:paired.headers.get('set-cookie').split(';')[0]};
   const read=await get('/api/readiness',viewer);assert.equal(read.status,200);const value=await read.json();assert.equal(value.role,'viewer');assert.deepEqual(value.plan,saved);
   assert.equal((await post('/api/readiness',{opId:crypto.randomUUID(),plan:saved},viewer)).status,403);
   assert.equal((await post('/api/readiness',{opId:crypto.randomUUID(),plan:saved},{...operator,origin:'https://foreign.invalid'})).status,403);
  });
  await t.test('active dataset switching isolates GET and rejects old-scope saves',async()=>{
   const other={...drawing,datasetId:'synthetic-readiness-b'};writeDrawing(other);
   assert.equal((await (await get('/api/readiness',operator)).json()).plan,null);
   assert.equal((await (await get('/api/readiness',viewer)).json()).plan,null);
   assert.equal((await post('/api/readiness',{opId:crypto.randomUUID(),plan:saved})).status,422);
   const otherSaved=await post('/api/readiness',{opId:crypto.randomUUID(),plan:createPlan(other)});assert.equal(otherSaved.status,200);assert.equal((await otherSaved.json()).datasetId,other.datasetId);
   writeDrawing(drawing);assert.deepEqual((await (await get('/api/readiness',operator)).json()).plan,saved);
  });
  await t.test('planning does not populate inspection records or grant engineering acceptance',async()=>{
   assert.deepEqual((await (await get('/api/records',operator)).json()).records,[]);
   assert.equal((await (await get('/api/drawing',operator)).json()).fieldReadiness.status,'blocked');
   const record={id:drawing.sourceSHA256+'-'+drawing.datasetId+'-synthetic-point',opId:crypto.randomUUID(),sourceSHA256:drawing.sourceSHA256,title:'Synthetic acceptance probe',version:0,status:'accepted',notes:'Synthetic test only',checks:[{id:'test',label:'Synthetic checklist',result:'pass'}],photos:[]};
   assert.equal((await post('/api/records',record)).status,422);assert.deepEqual((await (await get('/api/records',operator)).json()).records,[]);
  });
  await t.test('readiness plan and operation retry survive server restart',async()=>{
   await stop();await start();assert.deepEqual((await (await get('/api/readiness',operator)).json()).plan,saved);
   const retry=await post('/api/readiness',operation);assert.equal(retry.status,200);assert.deepEqual(await retry.json(),saved);
  });
 }finally{
  await stop();
  // Delete only the unique directory created by this test, never application data.
  if(path.dirname(data)!==tempBase||!path.basename(data).startsWith('itcad-readiness-http-'))throw Error('Unexpected readiness test cleanup path');
  fs.rmSync(data,{recursive:true,force:true});
 }
});
