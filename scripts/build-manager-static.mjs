import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const target=path.resolve('dist/manager');
if(target!==path.join(process.cwd(),'dist','manager'))throw Error('Unexpected generated artifact path');
// Only this fixed, ignored build output is replaced; private data is elsewhere.
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
const shell=JSON.parse(fs.readFileSync('public/field/sw-shell.json','utf8'));
const release=crypto.createHash('sha256').update(shell.version).update(fs.readFileSync('scripts/build-manager-static.mjs')).digest('hex').slice(0,12);
const needed=new Set(['/field/manager.html','/field/sandbox.html','/field/assets/manager.css','/field/assets/sandbox.css']);
function visit(file){if(needed.has(file))return;needed.add(file);for(const m of fs.readFileSync('public'+file,'utf8').matchAll(/["'](\.\/[^"']+\.js)["']/g))visit(path.posix.join(path.posix.dirname(file),m[1]))}
visit('/field/assets/manager.js');visit('/field/assets/sandbox.js');
const files=[...needed];
for(const file of [...files,'/field/sw.js','/field/sw-shell.json']){
 if(!/^\/field\/(?:[\w.-]+\.html|sw\.js|sw-shell\.json|assets\/[\w.-]+\.(?:js|css))$/.test(file))throw Error('Unexpected shell asset');
 const out=path.join(target,file);fs.mkdirSync(path.dirname(out),{recursive:true});let content=fs.readFileSync('public'+file);
 if(['/field/manager.html','/field/sandbox.html'].includes(file))content=Buffer.from(content.toString('utf8').replace('<html lang="en">','<html lang="en" data-mode="snapshot-only">').replace(/assets\/(manager|sandbox)\.(js|css)(\?v=[a-f0-9]+)?/g,(_,entry,ext)=>'assets/'+entry+'.'+ext+'?release='+release));
 // Give dependency requests a release-specific cache key too. A CDN can retain a
 // negative response even after the new static files have been published.
 if(file.endsWith('.js'))content=Buffer.from(content.toString('utf8')
  .replace(/(["'])(\.\/[^"']+\.js)\1/g,(_,quote,spec)=>quote+spec+'?release='+release+quote)
  .replace(/(["'])(sandbox\.html|manager\.html|\/field\/sw\.js|\/field\/sw-shell\.json)\1/g,(_,quote,spec)=>quote+spec+'?release='+release+quote));
 fs.writeFileSync(out,content);
}
const digest=crypto.createHash('sha256');for(const file of files)digest.update(file).update(fs.readFileSync(path.join(target,file)));const version=digest.digest('hex').slice(0,12);
fs.writeFileSync(path.join(target,'field/sw-shell.json'),JSON.stringify({version,files:files.map(file=>file+'?release='+release)}));
const worker=path.join(target,'field/sw.js');fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace(/^const BUILD='[a-f0-9]+';/,"const BUILD='"+version+"';"));
fs.writeFileSync(path.join(target,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=field/manager.html"><title>ITCAD Management Viewer</title></head><body><a href="field/manager.html">Open management viewer</a></body></html>');
fs.writeFileSync(path.join(target,'_headers'),'/field/*\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n');
console.log(JSON.stringify({target,mode:'snapshot-only',companyDataIncluded:false,files:files.length+3,note:'Code-only artifact. Hosting is not deployed by this command.'}));
