import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const shaPattern=/^[a-f0-9]{64}$/i;
const stamp=s=>`${s.size}:${s.mtimeMs}:${s.ctimeMs}`;
export async function fileSHA256(file){
 const hash=crypto.createHash('sha256');
 for await(const chunk of fs.createReadStream(file))hash.update(chunk);
 return hash.digest('hex');
}
function inside(root,name){
 if(typeof name!=='string'||!name||path.isAbsolute(name))throw Error('Verified package file must use a relative path');
 const file=fs.realpathSync(path.resolve(root,name)),relative=path.relative(root,file);
 if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Verified file is outside package');
 return file;
}

// Verifies bytes and revision binding, not CAD geometry or engineering approval.
export async function createMachineSourceGuard(dataset,packageRoot){
 const config=dataset.sourceVerification;
 if(!config)return {checkLive:async()=>({state:'legacy-unverified'}),assertFile:async()=>{}};
 const root=fs.realpathSync(packageRoot),verified=new Map(),imageHashes=new Map();
 async function verify(file,expected){
  if(!shaPattern.test(expected||''))throw Error('Missing source verification hash');
  const before=fs.statSync(file);if(!before.isFile())throw Error('Verified source is not a file');
  const previous=verified.get(file);
  if(previous?.expected===expected.toLowerCase()&&previous.stamp===stamp(before))return;
  const actual=await fileSHA256(file),after=fs.statSync(file);
  if(stamp(before)!==stamp(after)||actual!==expected.toLowerCase())throw Error('Source or drawing image changed: rebuild and review this revision before use');
  verified.set(file,{expected:expected.toLowerCase(),stamp:stamp(after)});
 }
 const archive=config.archivedDrawing;
 if(!archive||archive.sha256?.toLowerCase()!==dataset.sourceSHA256)throw Error('Archived drawing does not match dataset revision');
 const archivePath=inside(root,archive.path);
 await verify(archivePath,archive.sha256);
 for(const view of dataset.views){await verify(inside(root,view.image),view.sourceImageSHA256);imageHashes.set(view.image,view.sourceImageSHA256);}
 const live=config.liveDrawing;
 if(live&&(!path.isAbsolute(live.path||'')||live.sha256?.toLowerCase()!==dataset.sourceSHA256))throw Error('Live drawing does not match dataset revision');
 async function checkLive(){
  await verify(archivePath,archive.sha256);
  if(!live)return {state:'archive-verified',sourceSHA256:dataset.sourceSHA256};
  try{await verify(live.path,live.sha256);return {state:'live-and-archive-verified',sourceSHA256:dataset.sourceSHA256};}
  catch(e){if(e.code==='ENOENT')return {state:'archive-verified-live-unavailable',sourceSHA256:dataset.sourceSHA256};throw e;}
 }
 await checkLive();
 return {checkLive,assertFile:async (file,name)=>{const expected=imageHashes.get(name)||verified.get(file)?.expected;if(expected)await verify(file,expected);}};
}
