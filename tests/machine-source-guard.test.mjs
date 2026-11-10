import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {createMachineSourceGuard} from '../server/machine-source-guard.mjs';
import {startMachinePlanner} from '../server/machine-planner.mjs';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'source-guard-')),live=path.join(root,'live.dwg');
 fs.writeFileSync(path.join(root,'archive.dwg'),'drawing-v1');fs.writeFileSync(live,'drawing-v1');fs.writeFileSync(path.join(root,'map.png'),'image-v1');
 const data={id:'synthetic',sourceSHA256:hash('drawing-v1'),assets:[],views:[{id:'floor',image:'map.png',sourceImageSHA256:hash('image-v1')}],sourceVerification:{archivedDrawing:{path:'archive.dwg',sha256:hash('drawing-v1')},liveDrawing:{path:live,sha256:hash('drawing-v1')}}};
 return {root,live,data};
}
test('verified archived source supports disconnected original; changed original never silently rebinds',async()=>{
 const {root,live,data}=fixture(),guard=await createMachineSourceGuard(data,root);
 assert.equal((await guard.checkLive()).state,'live-and-archive-verified');
 fs.unlinkSync(live);assert.equal((await guard.checkLive()).state,'archive-verified-live-unavailable');
 fs.writeFileSync(live,'different-drawing-revision');await assert.rejects(guard.checkLive(),/changed/);
 assert.equal(data.sourceSHA256,hash('drawing-v1'));
});
test('rejects wrong archive, wrong image and escape even when dataset metadata claims current revision',async()=>{
 const a=fixture();fs.writeFileSync(path.join(a.root,'archive.dwg'),'wrong');await assert.rejects(createMachineSourceGuard(a.data,a.root),/changed/);
 const b=fixture();b.data.views[0].sourceImageSHA256=hash('unrelated-image');await assert.rejects(createMachineSourceGuard(b.data,b.root),/changed/);
 const c=fixture();c.data.sourceVerification.archivedDrawing.path=c.live;await assert.rejects(createMachineSourceGuard(c.data,c.root),/relative/);
 const d=fixture();d.data.sourceVerification.archivedDrawing.sha256=hash('different');await assert.rejects(createMachineSourceGuard(d.data,d.root),/revision/);
});
test('runtime image and archive changes are rejected; newly resolved image path still binds to requested name',async()=>{
 const {root,data}=fixture(),guard=await createMachineSourceGuard(data,root);
 const replacement=path.join(root,'replacement.png');fs.writeFileSync(replacement,'wrong-image');
 await assert.rejects(guard.assertFile(replacement,'map.png'),/changed/);
 fs.writeFileSync(path.join(root,'map.png'),'changed-image-with-other-size');await assert.rejects(guard.assertFile(path.join(root,'map.png'),'map.png'),/changed/);
 fs.writeFileSync(path.join(root,'archive.dwg'),'changed-archive-with-other-size');await assert.rejects(guard.checkLive(),/changed/);
});
test('real local server reports changed revision with409 and never serves archived DWG through asset route',async t=>{
 const {root,live,data}=fixture(),file=path.join(root,'dataset.json');fs.writeFileSync(file,JSON.stringify(data));
 const app=await startMachinePlanner({datasetPath:file,port:42983});t.after(()=>app.close());
 const get=p=>fetch('http://127.0.0.1:42983'+p,{headers:{Connection:'close'}});
 assert.equal((await get('/api/machine-source-status')).status,200);
 assert.equal((await get('/api/machine-file?path=archive.dwg')).status,404);
 fs.writeFileSync(live,'drawing-v2-longer');
 const result=await get('/api/machines');assert.equal(result.status,409);assert.equal((await result.json()).code,'SOURCE_REVISION_CHANGED');
 assert.equal((await get('/api/machine-file?path=map.png')).status,409);
 assert.equal((await get('/api/machine-source-status')).status,409);
});
