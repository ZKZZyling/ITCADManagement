import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {AnalysisJobs} from './analysis-jobs.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),data=path.resolve(process.env.ITFIELD_DATA_DIR||path.join(root,'data'));fs.mkdirSync(data,{recursive:true});
const sourceRoot=path.resolve(process.env.ITCAD_SOURCE_ROOT||path.join(data,'sources'));fs.mkdirSync(sourceRoot,{recursive:true});
const port=Number(process.env.ITCAD_ANALYSIS_PORT||42875);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid analysis port');
const instance=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
const dataInstance=crypto.createHash('sha256').update(data.toLowerCase()).digest('hex').slice(0,16);
const tokenFile=path.join(data,'analysis-token');if(!fs.existsSync(tokenFile))fs.writeFileSync(tokenFile,crypto.randomBytes(24).toString('hex'));const token=fs.readFileSync(tokenFile,'utf8').trim();
const sign=s=>crypto.createHmac('sha256',token).update(s).digest('hex');
const lock=path.join(data,'analysis.lock');if(fs.existsSync(lock)){const old=JSON.parse(fs.readFileSync(lock,'utf8'));let alive=false;try{process.kill(old.pid,0);alive=true}catch{}if(alive)throw Error('An analysis service already owns this deployment; no process replaced');fs.unlinkSync(lock)}
fs.writeFileSync(lock,JSON.stringify({pid:process.pid,instance}),{flag:'wx'});
const venv=path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');const python=process.env.ITCAD_PYTHON||(fs.existsSync(venv)?venv:'python');
const jobs=new AnalysisJobs({root,sourceRoot,python,data});jobs.pump();
function authenticated(req){const value=req.headers.cookie?.match(/(?:^|;\s*)itcad_analysis=([^;]+)/)?.[1]||'';const [time,signature]=value.split('.');if(!/^\d+$/.test(time||'')||Date.now()-Number(time)>86400000||Number(time)>Date.now())return false;const expected=sign(time);return signature?.length===expected.length&&crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected))}
function send(res,value,status=200,headers={}){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers});res.end(JSON.stringify(value))}
async function body(req){const parts=[];let length=0;for await(const b of req){length+=b.length;if(length>8192)throw Error('Request too large');parts.push(b)}return JSON.parse(Buffer.concat(parts).toString('utf8'))}
function catalog(){const entries=[];function walk(folder,depth){if(depth>15||entries.length>=2500)return;for(const f of fs.readdirSync(folder,{withFileTypes:true})){if(entries.length>=2500)break;if(f.isSymbolicLink())continue;const full=path.join(folder,f.name);if(f.isDirectory())walk(full,depth+1);else if(f.isFile()&&/\.(dwg|dxf)$/i.test(f.name))entries.push({relative:path.relative(sourceRoot,full),bytes:fs.statSync(full).size})}}walk(sourceRoot,0);return entries}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
 const origin='http://'+req.headers.host,u=new URL(req.url,origin);
 if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers['x-forwarded-host']||req.headers['x-forwarded-for'])return send(res,{error:'Local administrator service only'},403);
 if(req.method!=='GET'&&req.method!=='HEAD'&&req.headers.origin!==origin)return send(res,{error:'Origin required and must match'},403);
 if(u.pathname==='/admin/health')return send(res,{service:'itcad-analysis',instance,dataInstance});
 if(u.pathname==='/admin/pair'&&req.method==='POST'){const x=await body(req);if(x.token!==token)return send(res,{error:'Invalid administrator token'},401);const time=String(Date.now());return send(res,{paired:true},200,{'set-cookie':`itcad_analysis=${time}.${sign(time)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`})}
 if(u.pathname.startsWith('/admin/')){
  if(!authenticated(req))return send(res,{error:'Open Analysis from the local launcher first'},401);
  if(u.pathname==='/admin/state'&&req.method==='GET'){
   const folder=path.join(data,'packets');const packages=fs.existsSync(folder)?fs.readdirSync(folder).filter(id=>/^[a-f0-9-]{36}$/.test(id)&&fs.existsSync(path.join(folder,id,'drawing.json'))).map(id=>{try{const d=JSON.parse(fs.readFileSync(path.join(folder,id,'drawing.json'),'utf8'));return {id,drawing:d.drawing,views:d.views?.length,source:d.sourceSHA256?.slice(0,12),datasetId:d.datasetId}}catch{return {id,error:'Invalid manifest'}}}):[];
   return send(res,{sourceRoot,sources:catalog(),packages,jobs:jobs.list(),activePackage:fs.existsSync(path.join(data,'active-package'))?fs.readFileSync(path.join(data,'active-package'),'utf8').trim():null,python,limits:{concurrency:1,stageTimeoutMinutes:10}})
  }
  if(u.pathname==='/admin/jobs'&&req.method==='POST')return send(res,jobs.enqueue(await body(req)),202);
  const match=u.pathname.match(/^\/admin\/jobs\/([a-f0-9-]{36})\/(cancel|retry|activate|log)$/);
  if(match){const [,id,action]=match;if(action==='log'&&req.method==='GET'){jobs.get(id);const file=path.join(jobs.folder,id+'.log');const text=fs.existsSync(file)?fs.readFileSync(file,'utf8').slice(-12000):'No worker output yet';return send(res,{text})}
   if(req.method==='POST'){const x=await body(req);return send(res,action==='activate'?await jobs.activate(id,x.acknowledgeReviewOnly):action==='cancel'?jobs.cancel(id):jobs.retry(id))}}
  if(u.pathname==='/admin/shutdown'&&req.method==='POST'){send(res,{stopping:true});setImmediate(shutdown);return}
  return send(res,{error:'Not found'},404);
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,{error:'Method not allowed'},405);
 const name=u.pathname==='/'?'/analysis/index.html':u.pathname;
 if(!name.startsWith('/analysis/')&&!name.startsWith('/field/assets/'))return send(res,{error:'Not found'},404);
 const publicRoot=path.join(root,'public'),file=path.resolve(publicRoot,'.'+decodeURIComponent(name));if(!file.startsWith(publicRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,{error:'Not found'},404);
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache','referrer-policy':'no-referrer'});fs.createReadStream(file).pipe(res);
 }catch(e){send(res,{error:e.message},400)}});
let stopping=false;async function shutdown(){if(stopping)return;stopping=true;await jobs.stop();server.close(()=>{if(fs.existsSync(lock)&&JSON.parse(fs.readFileSync(lock,'utf8')).pid===process.pid)fs.unlinkSync(lock);process.exit(0)});server.closeIdleConnections()}
server.on('error',e=>{if(fs.existsSync(lock)&&JSON.parse(fs.readFileSync(lock,'utf8')).pid===process.pid)fs.unlinkSync(lock);console.error(e.message);process.exit(1)});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({service:'itcad-analysis',port,instance,pid:process.pid})));process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
