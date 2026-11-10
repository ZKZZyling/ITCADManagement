import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'machine-server-'));
const source=path.join(fixture,'dataset.json');
fs.writeFileSync(path.join(fixture,'plan.png'),'fixture-image');
fs.writeFileSync(source,JSON.stringify({id:'synthetic',sourceSHA256:'a'.repeat(64),sourceWorkbookSHA256:'b'.repeat(64),views:[{id:'v',image:'plan.png'}],assets:[]}));
const port=42981,base=`http://127.0.0.1:${port}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const request=(url,options={})=>globalThis.fetch(url,{...options,headers:{Connection:'close',...options.headers},signal:AbortSignal.timeout(10000)});
let child;
async function launch(){child=spawn(process.execPath,[path.join(repo,'server/machine-planner.mjs')],{env:{...process.env,ITCAD_MACHINE_DATASET:source,ITCAD_MACHINE_PORT:String(port)},stdio:'ignore'});for(let i=0;i<60;i++){try{const r=await request(base+'/api/machine-server/status');if(r.ok)return r.json();}catch{}await sleep(50);}throw Error('startup timeout');}
async function post(url,body,management,origin=new URL(url).origin,extra={}){return request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(management?{'X-Machine-Management':management}:{}),...extra},body:JSON.stringify(body)});}
test('actual private server: source identity, management authorization, LAN pairing and file guards',async t=>{
 const status=await launch();t.after(()=>{child.kill();});
 assert.equal(status.identity.sourceSHA256,'a'.repeat(64));assert.match(status.identity.datasetSHA256,/^[a-f0-9]{64}$/);
 assert.equal((await request(base+'/api/machines')).status,200);
 assert.equal((await post(base+'/api/machine-server/stop',{},null)).status,403);
 assert.equal((await post(base+'/api/machine-server/stop',{},status.managementToken,'http://foreign.invalid')).status,403);
 assert.equal((await request(base+'/api/machines',{headers:{'X-Forwarded-Host':'public.invalid'}})).status,403);
 assert.equal((await request(base+'/api/machine-file?path=../dataset.json')).status,404);
 assert.equal(await new Promise(resolve=>{http.get(base+'/api/machines',{headers:{Host:'attacker.invalid'}},r=>{r.resume();resolve(r.statusCode);});}),403);
 const bad=await post(base+'/api/machine-server/lan',{enabled:true,address:'0.0.0.0'},status.managementToken);assert.equal(bad.status,400);
 const addresses=status.lanAddresses;
 if(addresses.length){
  const enable=await post(base+'/api/machine-server/lan',{enabled:true,address:addresses[0].address},status.managementToken);assert.equal(enable.status,200);const lan=await enable.json();const lanBase=new URL(lan.lanUrl).origin;
  assert.equal((await request(lanBase+'/api/machines')).status,403);
  assert.equal((await request(lanBase+'/api/machine-file?path=plan.png')).status,403);
  assert.equal((await request(lanBase+'/field/machines.html')).status,200);
  assert.equal((await post(lanBase+'/api/machine-server/pair',{token:'wrong'},null)).status,403);
  const pair=await post(lanBase+'/api/machine-server/pair',{token:new URL(lan.pairUrl).hash.slice(6)},null);assert.equal(pair.status,200);
  const cookie=pair.headers.get('set-cookie').split(';')[0];assert.match(pair.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const opts={headers:{Cookie:cookie}};assert.equal((await request(lanBase+'/api/machines',opts)).status,200);assert.equal(await(await request(lanBase+'/api/machine-file?path=plan.png',opts)).text(),'fixture-image');
  const remoteStatus=await(await request(lanBase+'/api/machine-server/status',opts)).json();assert.equal(remoteStatus.managementToken,undefined);assert.equal(remoteStatus.pairUrl,undefined);
  assert.equal((await post(lanBase+'/api/machine-server/stop',{},status.managementToken,lanBase,{Cookie:cookie})).status,403);
  assert.equal((await request(lanBase+'/api/machines',{headers:{Cookie:cookie,Forwarded:'for=public'}})).status,403);
  assert.equal((await post(base+'/api/machine-server/lan',{enabled:false},status.managementToken)).status,200);
 }else t.diagnostic('LAN socket checks not run: no physical private IPv4 adapter');
 assert.equal((await post(base+'/api/machine-server/stop',{},status.managementToken)).status,200);
 await new Promise(resolve=>child.once('exit',resolve));
});
test('Windows launcher starts/reuses/restarts/stops only owned process; stale package restarts', {skip:process.platform!=='win32'}, async t=>{
 const script=path.join(repo,'scripts/machine-launcher.ps1'),lp=42982,lb=`http://127.0.0.1:${lp}`;
 const run=action=>spawnSync('powershell.exe',['-NoProfile','-File',script,'-Dataset',source,'-Action',action,'-Port',String(lp),'-NoBrowser'],{encoding:'utf8',timeout:25000});
 let r=run('Start');assert.equal(r.status,0,r.stderr);const h1=await(await request(lb+'/api/machine-server/health')).json();
 t.after(async()=>{run('Stop');});
 r=run('Start');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/Reused/);const h2=await(await request(lb+'/api/machine-server/health')).json();assert.equal(h1.instanceId,h2.instanceId);
 const other=fs.mkdtempSync(path.join(os.tmpdir(),'machine-other-')),otherSource=path.join(other,'dataset.json');fs.copyFileSync(source,otherSource);fs.writeFileSync(path.join(other,'plan.png'),'different-image');
 const mismatch=spawnSync('powershell.exe',['-NoProfile','-File',script,'-Dataset',otherSource,'-Action','Start','-Port',String(lp),'-NoBrowser'],{encoding:'utf8',timeout:25000});assert.notEqual(mismatch.status,0);assert.equal((await(await request(lb+'/api/machine-server/health')).json()).instanceId,h2.instanceId);
 const d=JSON.parse(fs.readFileSync(source));d.title='Updated package';fs.writeFileSync(source,JSON.stringify(d));r=run('Start');assert.equal(r.status,0,r.stderr);const h3=await(await request(lb+'/api/machine-server/health')).json();assert.notEqual(h3.instanceId,h2.instanceId);assert.notEqual(h3.identity.datasetSHA256,h2.identity.datasetSHA256);
 r=run('Restart');assert.equal(r.status,0,r.stderr);const h4=await(await request(lb+'/api/machine-server/health')).json();assert.notEqual(h4.instanceId,h3.instanceId);
 r=run('Stop');assert.equal(r.status,0,r.stderr);await assert.rejects(request(lb+'/api/machine-server/health'));
 const foreign=http.createServer((req,res)=>res.end('unrelated'));await new Promise(resolve=>foreign.listen(lp,'127.0.0.1',resolve));t.after(()=>foreign.close());
 // Async PowerShell lets this test's unrelated HTTP listener keep answering health probes.
 const result=await new Promise(resolve=>{const p=spawn('powershell.exe',['-NoProfile','-File',script,'-Dataset',source,'-Action','Start','-Port',String(lp),'-NoBrowser']);let err='';p.stderr.on('data',b=>err+=b);p.on('exit',code=>resolve({code,err}));});
 assert.notEqual(result.code,0);assert.equal(await(await request(lb)).text(),'unrelated');
});
