// Dedicated private adapter: never mount this package on the shared/tunnel server.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=process.env.ITCAD_MACHINE_DATASET;
if(!input)throw Error('Set ITCAD_MACHINE_DATASET to a private dataset.json outside the repository');
const source=fs.realpathSync(input), packageRoot=path.dirname(source);
if(source.startsWith(root+path.sep))throw Error('Private datasets must remain outside the source repository');
const dataset=JSON.parse(fs.readFileSync(source,'utf8'));
if(!/^[a-f0-9]{64}$/.test(dataset.sourceSHA256)||!Array.isArray(dataset.assets)||!Array.isArray(dataset.views))throw Error('Invalid machine dataset');
const port=Number(process.env.ITCAD_MACHINE_PORT||42881);
const allowed=new Set(dataset.views.map(v=>v.image).concat(dataset.assets.flatMap(a=>(a.photos||[]).map(p=>typeof p==='string'?p:p.path))));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer((req,res)=>{try{
  // Reject forwarded requests and foreign Host/Origin to prevent accidental tunnel exposure / DNS rebinding.
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers['x-forwarded-for']||req.headers['forwarded']||!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)||req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)){res.writeHead(403);return res.end('Local access only');}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const u=new URL(req.url,'http://127.0.0.1'), p=decodeURIComponent(u.pathname);
  const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
  if(p==='/api/machines'){res.writeHead(200,{...headers,'content-type':'application/json; charset=utf-8'});return res.end(JSON.stringify(dataset));}
  let file;
  if(p==='/api/machine-file'){
    const name=u.searchParams.get('path');if(!allowed.has(name))throw Error('File not listed in package');file=fs.realpathSync(path.resolve(packageRoot,name));if(!file.startsWith(packageRoot+path.sep))throw Error('File outside package');
  }else if(p==='/'||p==='/field/machines.html')file=path.join(root,'public/field/machines.html');
  else if(/^\/field\/assets\/[a-zA-Z0-9_.-]+$/.test(p))file=path.join(root,'public',p);
  else {res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{...headers,'content-type':mime[path.extname(file)]||'application/octet-stream'});if(req.method==='HEAD')return res.end();fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
}catch{res.writeHead(404);res.end('Unavailable');}}).listen(port,'127.0.0.1',()=>console.log(`Machine planner http://127.0.0.1:${port}/field/machines.html`));
