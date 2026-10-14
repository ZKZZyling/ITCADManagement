import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const target=path.resolve('dist/manager');fs.mkdirSync(target,{recursive:true});
const shell=JSON.parse(fs.readFileSync('public/field/sw-shell.json','utf8'));
for(const file of [...shell.files,'/field/sw.js','/field/sw-shell.json']){
 if(!/^\/field\/(?:[\w.-]+\.html|sw\.js|sw-shell\.json|assets\/[\w.-]+\.(?:js|css))$/.test(file))throw Error('Unexpected shell asset');
 const out=path.join(target,file);fs.mkdirSync(path.dirname(out),{recursive:true});let content=fs.readFileSync('public'+file);
 if(['/field/manager.html','/field/sandbox.html'].includes(file))content=Buffer.from(content.toString('utf8').replace('<html lang="en">','<html lang="en" data-mode="snapshot-only">'));
 fs.writeFileSync(out,content);
}
const digest=crypto.createHash('sha256');for(const file of shell.files)digest.update(file).update(fs.readFileSync(path.join(target,file)));const version=digest.digest('hex').slice(0,12);
fs.writeFileSync(path.join(target,'field/sw-shell.json'),JSON.stringify({...shell,version}));
const worker=path.join(target,'field/sw.js');fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace(/^const BUILD='[a-f0-9]+';/,"const BUILD='"+version+"';"));
fs.writeFileSync(path.join(target,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=field/manager.html"><title>ITCAD Management Viewer</title></head><body><a href="field/manager.html">Open management viewer</a></body></html>');
fs.writeFileSync(path.join(target,'_headers'),'/field/*\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n');
console.log(JSON.stringify({target,mode:'snapshot-only',companyDataIncluded:false,files:shell.files.length+3,note:'Code-only artifact. Hosting is not deployed by this command.'}));
