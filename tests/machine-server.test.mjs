import http from 'node:http';import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import {once} from 'node:events';
test('private adapter rejects forwarded/foreign requests and unlisted package paths',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'itcad-machine-test-'));
 const port=43921;fs.writeFileSync(path.join(dir,'plan.png'),'synthetic');fs.writeFileSync(path.join(dir,'secret.txt'),'not allowed');fs.writeFileSync(path.join(dir,'dataset.json'),JSON.stringify({id:'fixture',sourceSHA256:'a'.repeat(64),assets:[{id:'1',photos:[]}],views:[{id:'f1',image:'plan.png'}]}));
 const child=spawn(process.execPath,['server/machine-planner.mjs'],{env:{...process.env,ITCAD_MACHINE_DATASET:path.join(dir,'dataset.json'),ITCAD_MACHINE_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 try{await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited')}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),5000);timer.unref()})]);
 const base=`http://127.0.0.1:${port}`;
 assert.equal((await fetch(base+'/api/machines')).status,200);
 assert.equal(await (await fetch(base+'/api/machine-file?path=plan.png')).text(),'synthetic');
 assert.equal((await fetch(base+'/api/machine-file?path=secret.txt')).status,404);
 assert.equal((await fetch(base+'/api/machine-file?path=../dataset.json')).status,404);
 assert.equal((await fetch(base+'/api/machines',{headers:{'x-forwarded-for':'203.0.113.1'}})).status,403);
 assert.equal(await new Promise((resolve,reject)=>{http.get(base+'/api/machines',{headers:{Host:'foreign.example'}},res=>{res.resume();resolve(res.statusCode)}).on('error',reject)}),403);
 assert.equal((await fetch(base+'/api/machines',{headers:{Origin:'https://foreign.example'}})).status,403);
 assert.equal((await fetch(base+'/api/machines',{method:'POST'})).status,405);
 }finally{child.kill();await once(child,'exit');fs.rmSync(dir,{recursive:true,force:true});}
});
