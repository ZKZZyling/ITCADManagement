import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {spawn,execFile} from 'node:child_process';

export function atomicJSON(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file+'.tmp',JSON.stringify(value,null,2),'utf8');fs.renameSync(file+'.tmp',file);
}
export async function shaFile(file){
 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');
}
function inside(root,file){const relative=path.relative(root,file);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)}
export function sourceFile(root,relative){
 if(typeof relative!=='string'||relative.length>1000||path.isAbsolute(relative))throw Error('Choose a catalog source');
 const base=fs.realpathSync(root),file=fs.realpathSync(path.resolve(base,relative));
 if(!inside(base,file)||!fs.statSync(file).isFile()||!['.dwg','.dxf'].includes(path.extname(file).toLowerCase()))throw Error('Source outside configured CAD folder');return file;
}
const idOK=id=>/^[a-f0-9-]{36}$/.test(id);
const terminal=new Set(['ready','failed','cancelled','interrupted']);
export class AnalysisJobs{
 constructor({root,sourceRoot,python,runner,data}){
  this.root=root;this.data=data||path.join(root,'data');this.sourceRoot=sourceRoot;this.python=python;this.runner=runner||this.pipeline.bind(this);this.folder=path.join(this.data,'analysis/jobs');this.jobs=new Map();this.current=null;this.stopping=false;
  fs.mkdirSync(this.folder,{recursive:true});
  for(const name of fs.readdirSync(this.folder).filter(n=>/^[a-f0-9-]{36}\.json$/.test(n))){
   const j=JSON.parse(fs.readFileSync(path.join(this.folder,name),'utf8'));
   if(!idOK(j.id)||!['analyze','verify'].includes(j.kind))throw Error('Invalid persisted analysis job');
   if(!terminal.has(j.status)){j.status='interrupted';j.error='Service restarted before completion. Previous active package preserved.';atomicJSON(path.join(this.folder,name),j)}this.jobs.set(j.id,j);
  }
 }
 save(j){j.updatedAt=new Date().toISOString();atomicJSON(path.join(this.folder,j.id+'.json'),j)}
 list(){return [...this.jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
 get(id){const j=this.jobs.get(id);if(!j)throw Error('Job not found');return j}
 enqueue({kind,source,packageId}){
  if(this.stopping)throw Error('Service stopping');if(this.jobs.size>=1000)throw Error('Job catalog limit reached; archive explicitly before more jobs');
  if(kind==='analyze'){sourceFile(this.sourceRoot,source)}else if(kind==='verify'){if(!idOK(packageId)||!fs.existsSync(path.join(this.data,'packets',packageId,'drawing.json')))throw Error('Package not found')}else throw Error('Invalid job kind');
  const j={id:crypto.randomUUID(),kind,source:kind==='analyze'?source:undefined,packageId:kind==='verify'?packageId:undefined,status:'queued',stage:'queued',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};this.jobs.set(j.id,j);this.save(j);this.pump();return j;
 }
 async pump(){
  if(this.current||this.stopping)return;const j=[...this.jobs.values()].find(x=>x.status==='queued');if(!j)return;
  const controller=new AbortController();this.current={job:j,controller};j.status='running';this.save(j);
  const progress=stage=>{j.stage=stage;this.save(j)};
  try{const result=await this.runner(j,{signal:controller.signal,progress});if(controller.signal.aborted)throw Error('Cancelled');j.result=result;j.packageId=result.packageId;j.status='ready';j.stage='ready_for_review';}
  catch(e){j.status=controller.signal.aborted?'cancelled':'failed';j.error=String(e.message).slice(0,3000);j.stage=j.status;}
  finally{this.save(j);this.current=null;queueMicrotask(()=>this.pump())}
 }
 cancel(id){const j=this.get(id);if(j.status==='queued'){j.status='cancelled';j.stage='cancelled';this.save(j)}else if(this.current?.job.id===id){j.stage='cancelling';this.save(j);this.current.controller.abort()}else throw Error('Only queued or running jobs can be cancelled');return j}
 retry(id){const old=this.get(id);if(!['failed','cancelled','interrupted'].includes(old.status))throw Error('Only unsuccessful jobs can be retried');return this.enqueue(old)}
 async stop(){this.stopping=true;if(this.current)this.current.controller.abort();while(this.current)await new Promise(r=>setTimeout(r,50))}
 async command(j,script,args,{signal,progress},stage){
  if(signal.aborted)throw Error('Cancelled');progress(stage);
  const log=fs.createWriteStream(path.join(this.folder,j.id+'.log'),{flags:'a'});
  await new Promise((resolve,reject)=>{
   const child=spawn(this.python,['-X','utf8',path.join(this.root,'scripts',script),...args],{cwd:this.root,env:{...process.env,PYTHONUTF8:'1'},windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
   if(child.pid)try{os.setPriority(child.pid,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
   j.workerPid=child.pid;this.save(j);child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
   let timedOut=false;const kill=()=>{if(child.exitCode!==null)return;if(process.platform==='win32'&&child.pid)execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else if(child.pid){try{process.kill(-child.pid,'SIGTERM')}catch{}}};
   const timer=setTimeout(()=>{timedOut=true;kill()},10*60*1000);signal.addEventListener('abort',kill,{once:true});
   const finish=()=>{clearTimeout(timer);signal.removeEventListener('abort',kill);delete j.workerPid;log.end()};
   child.once('error',e=>{finish();reject(e)});child.once('close',code=>{finish();if(signal.aborted)reject(Error('Cancelled'));else if(timedOut)reject(Error('Stage timed out; inspect the job log'));else if(code!==0)reject(Error(stage+' failed; inspect the job log'));else resolve()});
  });
 }
 async pipeline(j,ctx){
  if(j.kind==='verify'){ctx.progress('verifying_existing_package');return this.verify(j.packageId,ctx.signal)}
  const input=sourceFile(this.sourceRoot,j.source),before=await shaFile(input);ctx.progress('preflight');
  const raw=path.join(this.data,'native',j.id),output=path.join(this.data,'packets',j.id);fs.mkdirSync(path.dirname(raw),{recursive:true});
  await this.command(j,'extract-independent.py',[input,'--output',raw],ctx,'extracting');
  await this.command(j,'prepare-cad.py',['--pilot',raw,'--out',output,'--full'],ctx,'preparing');
  await this.command(j,'audit-package.py',['--root',output,'--native',raw],ctx,'auditing');
  await this.command(j,'optimize-cad.py',['--root',output],ctx,'optimizing');
  if(await shaFile(input)!==before)throw Error('Original source changed during processing; package not activated');
  const manifest=JSON.parse(fs.readFileSync(path.join(output,'drawing.json'),'utf8'));manifest.datasetId='review-'+j.id.slice(0,8);manifest.sourceVerification='original-hash-checked';atomicJSON(path.join(output,'drawing.json'),manifest);
  const result=await this.verify(j.id,ctx.signal);if(result.sourceSHA256!==before)throw Error('Prepared source hash mismatch');return {...result,sourceVerification:'original-hash-checked'};
 }
 async verify(packageId,signal){
  if(!idOK(packageId))throw Error('Invalid package');const folder=path.join(this.data,'packets',packageId),d=JSON.parse(fs.readFileSync(path.join(folder,'drawing.json'),'utf8'));
  if(!/^[a-f0-9]{64}$/.test(d.sourceSHA256)||!Array.isArray(d.views)||!d.views.length||!Array.isArray(d.assets)||d.fieldReadiness?.status!=='blocked')throw Error('Unsupported or invalid review manifest');
  const files=new Set();for(const v of d.views){if(!/^[\w.-]+\.json$/.test(v.file||'')||v.file.includes('..'))throw Error('Invalid view file');files.add('views/'+v.file)}
  const hashes={};for(const name of files){if(signal?.aborted)throw Error('Cancelled');const file=path.join(folder,name);hashes[name]=await shaFile(file);
   if(fs.statSync(file).size>32*1024*1024)throw Error('Scene file exceeds 32 MB; optimize into bounded parts first');
   const raw=JSON.parse(fs.readFileSync(file,'utf8'));const check=rows=>{if(!Array.isArray(rows))throw Error('Invalid scene array');for(const o of rows){if(!o||!['path','text'].includes(o.kind)||typeof o.id!=='string'||typeof o.layer!=='string')throw Error('Invalid scene object');const points=o.kind==='path'?o.points:[o.anchor];if(!Array.isArray(points)||!points.length||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n))))throw Error('Invalid scene coordinates');if(o.kind==='text'&&(typeof o.text!=='string'||!Number.isFinite(o.height)))throw Error('Invalid text evidence');if(o.fillRings!==undefined){if(o.kind!=='path'||!Array.isArray(o.fillRings)||!o.fillRings.length||typeof o.solidFill!=='boolean'||o.fillRings.flat().length>50000||o.fillRings.some(r=>!Array.isArray(r)||r.length<3||r.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)))))throw Error('Invalid hatch boundaries')}if(o.pointMarker!==undefined&&(o.kind!=='path'||o.pointMarker!==true))throw Error('Invalid native marker')}};
   if(Array.isArray(raw))check(raw);else{if(!Array.isArray(raw.parts)||raw.parts.length>1000)throw Error('Invalid part catalog');for(const part of raw.parts){if(signal?.aborted)throw Error('Cancelled');if(!/^[\w.-]+\.json$/.test(part)||part.includes('..'))throw Error('Invalid scene part');const partFile=path.join(folder,'views',part);if(fs.statSync(partFile).size>32*1024*1024)throw Error('Scene part exceeds 32 MB');hashes['views/'+part]=await shaFile(partFile);check(JSON.parse(fs.readFileSync(partFile,'utf8')))}}
  }
  hashes['drawing.json']=await shaFile(path.join(folder,'drawing.json'));
  return {packageId,sourceSHA256:d.sourceSHA256,datasetId:d.datasetId,views:d.views.length,candidateAssets:d.assets.length,engineeringAcceptance:'blocked',sourceVerification:d.sourceVerification||'prepared-package-only',hashes,verifiedAt:new Date().toISOString()};
 }
 async activate(id,acknowledge){
  if(acknowledge!==true)throw Error('Acknowledge review-only use before activating');const j=this.get(id);if(j.status!=='ready')throw Error('Job is not ready');
  const result=await this.verify(j.packageId);if(JSON.stringify(result.hashes)!==JSON.stringify(j.result.hashes))throw Error('Package changed after verification; verify it again');
  const file=path.join(this.data,'active-package');fs.writeFileSync(file+'.tmp',j.packageId,'utf8');fs.renameSync(file+'.tmp',file);j.activatedAt=new Date().toISOString();this.save(j);return j;
 }
}
