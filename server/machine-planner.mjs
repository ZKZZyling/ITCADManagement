// Private package adapter. Loopback by default; explicitly paired LAN access only.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createMachineSourceGuard} from './machine-source-guard.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const loopback=a=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(a);
export function isPrivateIPv4(a){const p=a?.split('.').map(Number);return p?.length===4&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(p[0]===10||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]===192&&p[1]===168);}
const safeEqual=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const token=()=>crypto.randomBytes(32).toString('base64url');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf'};
export async function startMachinePlanner({datasetPath,port=42881,onStop=()=>{}}){
 const source=fs.realpathSync(datasetPath),packageRoot=path.dirname(source),relative=path.relative(root,source);
 if(relative&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))throw Error('Private datasets must remain outside the source repository');
 const bytes=fs.readFileSync(source),dataset=JSON.parse(bytes.toString('utf8'));
 if(!/^[a-f0-9]{64}$/.test(dataset.sourceSHA256)||!Array.isArray(dataset.assets)||!Array.isArray(dataset.views))throw Error('Invalid machine dataset');
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
 const identity={sourceSHA256:dataset.sourceSHA256,workbookSHA256:dataset.sourceWorkbookSHA256||'',datasetId:dataset.id||'',datasetSHA256:digest(bytes),packagePathSHA256:digest(source.toLowerCase())};
 for(const [env,key] of [['ITCAD_MACHINE_EXPECT_SOURCE','sourceSHA256'],['ITCAD_MACHINE_EXPECT_WORKBOOK','workbookSHA256']])if(process.env[env]&&process.env[env]!==identity[key])throw Error('Dataset identity mismatch');
 const serverCodeSHA256=digest(Buffer.concat([fs.readFileSync(fileURLToPath(import.meta.url)),fs.readFileSync(new URL('./machine-source-guard.mjs',import.meta.url))]));
 const sourceGuard=await createMachineSourceGuard(dataset,packageRoot);
 const instanceId=crypto.randomUUID(),managementToken=token(),sessions=new Map(),attempts=new Map();
 let lanServer=null,lanAddress=null,pairToken=null,pairExpiry=0,closing=false;
 const allowed=new Set(dataset.views.map(v=>v.image).concat(dataset.assets.flatMap(a=>(a.photos||[]).map(p=>typeof p==='string'?p:p.path)),(dataset.foundationReferences||[]).flatMap(r=>[r.file,r.preview]).filter(Boolean)));
 const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','content-security-policy':"frame-ancestors 'none'; base-uri 'self'; object-src 'none'"};
 const addresses=()=>Object.entries(os.networkInterfaces()).flatMap(([name,items])=>/vpn|tap|tun|virtual|vmware|vbox|npcap|loopback|docker|wsl|tailscale|zerotier/i.test(name)?[]:items.filter(i=>i.family==='IPv4'&&!i.internal&&isPrivateIPv4(i.address)).map(i=>({name,address:i.address})));
 const json=(res,code,value,extra={})=>{res.writeHead(code,{...headers,'content-type':'application/json; charset=utf-8',...extra});res.end(JSON.stringify(value));};
 const health=()=>({application:'itcad-private-machine-planner',protocolVersion:1,serverCodeSHA256,instanceId,pid:process.pid,identity,port,serverPath:fileURLToPath(import.meta.url)});
 const status=local=>({...health(),mode:lanServer?'lan':'local',localUrl:`http://127.0.0.1:${port}/field/machines.html`,lanUrl:lanAddress?`http://${lanAddress}:${port}/field/machines.html`:null,...(local?{managementToken,lanAddresses:addresses(),pairUrl:pairToken&&Date.now()<pairExpiry?`http://${lanAddress}:${port}/field/machines.html#pair=${pairToken}`:null,pairExpiresAt:pairExpiry||null}:{})});
 const readBody=async req=>{let s='';for await(const b of req){s+=b;if(Buffer.byteLength(s)>4096)throw Error('Body too large');}return JSON.parse(s||'{}');};
 const closeLan=async()=>{const old=lanServer;lanServer=null;lanAddress=null;pairToken=null;pairExpiry=0;sessions.clear();if(old)await new Promise(resolve=>{old.close(resolve);old.closeAllConnections();});};
 const main=http.createServer(handler);
 async function close(){if(closing)return;closing=true;await closeLan();await new Promise(resolve=>{main.close(resolve);main.closeAllConnections();});}
 async function handler(req,res){try{
  const local=loopback(req.socket.remoteAddress),remote=req.socket.remoteAddress?.replace(/^::ffff:/,'');
  const hosts=[`127.0.0.1:${port}`,`localhost:${port}`,...(lanAddress?[`${lanAddress}:${port}`]:[])];
  const origin=`http://${req.headers.host}`;
  if(Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-'))||!hosts.includes(req.headers.host)||(!local&&(!lanServer||!isPrivateIPv4(remote)||req.headers.host!==`${lanAddress}:${port}`))||(req.headers.origin&&req.headers.origin!==origin))return json(res,403,{error:'Access denied'});
  const u=new URL(req.url,origin),p=decodeURIComponent(u.pathname);
  if(req.method==='POST'&&req.headers.origin!==origin)return json(res,403,{error:'Same-origin POST required'});
  const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('machine_session='))?.slice(16);
  const authenticated=local||!!(cookie&&sessions.get(cookie)>Date.now());
  if(p==='/api/machine-server/pair'&&req.method==='POST'){
   if(local)return json(res,200,{ok:true});
   const now=Date.now(),rate=attempts.get(remote);if(rate&&now-rate.at<60000&&rate.count>=8)return json(res,429,{error:'Retry pairing later'});
   attempts.set(remote,{at:rate&&now-rate.at<60000?rate.at:now,count:rate&&now-rate.at<60000?rate.count+1:1});
   const body=await readBody(req);if(!pairToken||now>pairExpiry||!safeEqual(body.token,pairToken))return json(res,403,{error:'Pairing link invalid or expired'});
   const session=token();sessions.set(session,now+8*60*60*1000);return json(res,200,{ok:true},{'set-cookie':`machine_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`});
  }
  if(p==='/api/machine-server/health'&&req.method==='GET')return local?json(res,200,health()):json(res,403,{error:'Local management only'});
  if(p==='/api/machine-server/status'&&req.method==='GET')return authenticated?json(res,200,status(local)):json(res,403,{error:'Pair this device first'});
  if(['/api/machine-server/lan','/api/machine-server/stop'].includes(p)&&req.method==='POST'){
   if(!local||!safeEqual(req.headers['x-machine-management'],managementToken))return json(res,403,{error:'Local management authorization required'});
   const body=await readBody(req);
   if(p.endsWith('/stop')){json(res,200,{ok:true});setTimeout(()=>close().then(onStop),50);return;}
   if(typeof body.enabled!=='boolean')return json(res,400,{error:'enabled must be boolean'});
   if(!body.enabled){await closeLan();return json(res,200,status(true));}
   const list=addresses(),address=body.address||list[0]?.address;
   if(!list.some(a=>a.address===address))return json(res,400,{error:'Choose an available private physical adapter'});
   await closeLan();const next=http.createServer(handler);
   await new Promise((resolve,reject)=>{next.once('error',reject);next.listen(port,address,resolve);});
   lanAddress=address;lanServer=next;pairToken=token();pairExpiry=Date.now()+10*60*1000;return json(res,200,status(true));
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
  if(p.startsWith('/api/')&&!authenticated)return json(res,403,{error:'Pair this device first'});
  if(p==='/api/machine-source-status'){
   try{return json(res,200,{...await sourceGuard.checkLive(),datasetId:dataset.id});}
   catch(e){return json(res,409,{error:e.message,code:'SOURCE_REVISION_CHANGED'});}
  }
  if(p==='/api/machines'){
   try{return json(res,200,{...dataset,sourceVerificationStatus:await sourceGuard.checkLive()});}
   catch(e){return json(res,409,{error:e.message,code:'SOURCE_REVISION_CHANGED'});}
  }
  let file;
  if(p==='/api/machine-file'){
   const name=u.searchParams.get('path');if(!allowed.has(name))return json(res,404,{error:'File not listed'});
   file=fs.realpathSync(path.resolve(packageRoot,name));const rel=path.relative(packageRoot,file);if(!rel||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))return json(res,404,{error:'File outside package'});
   try{await sourceGuard.checkLive();await sourceGuard.assertFile(file,name);}catch(e){return json(res,409,{error:e.message,code:'SOURCE_REVISION_CHANGED'});}
  }else if(p==='/'||p==='/field/machines.html')file=path.join(root,'public/field/machines.html');
  else if(/^\/field\/assets\/[a-zA-Z0-9_.-]+$/.test(p))file=path.join(root,'public',p);
  else return json(res,404,{error:'Not found'});
  const stat=fs.statSync(file);if(!stat.isFile())return json(res,404,{error:'Unavailable'});
  res.writeHead(200,{...headers,'content-type':mime[path.extname(file)]||'application/octet-stream','content-length':stat.size});if(req.method==='HEAD')return res.end();fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch{if(!res.headersSent)json(res,400,{error:'Request unavailable'});else res.destroy();}}
 await new Promise((resolve,reject)=>{main.once('error',reject);main.listen(port,'127.0.0.1',resolve);});
 return {close,identity,instanceId,port};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.env.ITCAD_MACHINE_DATASET)throw Error('Set ITCAD_MACHINE_DATASET to a private dataset outside this repository');
 const app=await startMachinePlanner({datasetPath:process.env.ITCAD_MACHINE_DATASET,port:Number(process.env.ITCAD_MACHINE_PORT||42881),onStop:()=>process.exit(0)});
 console.log(`Machine planner http://127.0.0.1:${app.port}/field/machines.html`);
 process.on('SIGTERM',()=>app.close().then(()=>process.exit(0)));process.on('SIGINT',()=>app.close().then(()=>process.exit(0)));
}
