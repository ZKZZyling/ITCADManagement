import * as store from './storage.mjs';
import {validateRecord} from '../lib/validation.mjs';
import {uid} from './model.mjs';
export const packKey=d=>'offline-pack:'+d.sourceSHA256+':'+(d.datasetId||'');
export function validatePack(p){
 if(p?.format!=='itfield-offline-v1'||!/^\w{64}$/.test(p.drawing?.sourceSHA256||'')||!/^[a-f0-9]{64}$/i.test(p.drawing.sourceSHA256))throw Error('Invalid offline source');
 if(!Array.isArray(p.drawing.views)||!p.drawing.views.length||p.drawing.views.length>25||!Array.isArray(p.drawing.assets)||p.drawing.assets.length>10000)throw Error('Invalid offline manifest');
 const ids=new Set();for(const v of p.drawing.views){if(typeof v.id!=='string'||ids.has(v.id)||typeof v.title!=='string')throw Error('Invalid offline sheet');ids.add(v.id)}
 if(typeof p.drawing.datasetId!=='string'||!/^[-\w]{0,80}$/.test(p.drawing.datasetId))throw Error('Invalid dataset');
 for(const a of p.drawing.assets)if(!a||typeof a.id!=='string'||!/^[-\w:]{1,100}$/.test(a.id)||typeof a.title!=='string'||a.title.length>2000||typeof a.layer!=='string'||typeof a.sourceHandle!=='string')throw Error('Invalid asset evidence');
 if(!Array.isArray(p.images)||p.images.length!==ids.size)throw Error('Incomplete offline images');
 const imageIds=new Set();for(const image of p.images){if(!ids.has(image.viewId)||imageIds.has(image.viewId)||!/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(image.url)||!/^[a-f0-9]{64}$/.test(image.sha256))throw Error('Invalid offline image');imageIds.add(image.viewId)}
 if(JSON.stringify(p).length>80*1024*1024)throw Error('Offline pack exceeds 80 MB');return p;
}
export async function verifyPack(p){validatePack(p);for(const image of p.images){const bytes=Uint8Array.from(atob(image.url.split(',')[1]),c=>c.charCodeAt(0));if(![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))throw Error('Invalid PNG signature');if(await digest(bytes)!==image.sha256)throw Error('Offline image checksum mismatch');if(typeof createImageBitmap==='function'){const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));if(!bitmap.width||!bitmap.height)throw Error('Invalid image size');bitmap.close()}}return p}
async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function dataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
export async function ensureOfflineShell(){
 if(!isSecureContext||!('serviceWorker'in navigator))throw Error('Offline requires HTTPS or localhost');
 const registration=await navigator.serviceWorker.register('/field/sw.js',{scope:'/field/'});await registration.update();await navigator.serviceWorker.ready;
 const shell=await (await fetch('/field/sw-shell.json',{cache:'no-store'})).json();const cache=await caches.open('itfield-shell-v3-'+shell.version);await cache.addAll(shell.files.map(file=>new Request(file,{cache:'reload'})));
}
export async function savePack(p){await verifyPack(p);await ensureOfflineShell();await store.put('cache',p,packKey(p.drawing));await store.put('cache',packKey(p.drawing),'offline-latest');return p}
export async function latestPack(){const key=await store.get('cache','offline-latest');const p=key&&await store.get('cache',key);return p?verifyPack(p):null}
export async function preparePack(d,ids,onProgress){
 if(!isSecureContext||!('serviceWorker'in navigator))throw Error('Offline requires HTTPS or localhost');
 const views=d.views.filter(v=>ids.includes(v.id));if(views.length!==ids.length||!views.length)throw Error('Select prepared sheets');
 const images=[];for(const view of views){const r=await fetch('/api/reference.png?view='+encodeURIComponent(view.id));if(!r.ok)throw Error('Reference download failed: '+r.status);const blob=await r.blob();const bytes=new Uint8Array(await blob.arrayBuffer());images.push({viewId:view.id,url:await dataURL(blob),sha256:await digest(bytes),bytes:bytes.length});onProgress?.(images.length,views.length)}
 const p={format:'itfield-offline-v1',preparedAt:new Date().toISOString(),drawing:{sourceSHA256:d.sourceSHA256,datasetId:d.datasetId||'',drawing:d.drawing,units:d.units,fieldReadiness:d.fieldReadiness,views,assets:d.assets},images};
 return savePack(p);
}
export async function exportResults(d){const prefix=d.sourceSHA256+'-'+(d.datasetId?d.datasetId+'-':'');const records=(await store.all('records')).filter(r=>r.sourceSHA256===d.sourceSHA256&&r.id.startsWith(prefix));const ids=new Set(records.flatMap(r=>r.photos));const photos=[];for(const id of ids){const p=await store.get('photos',id);if(!p?.blob)throw Error('Missing local photo: '+id);photos.push({id,url:await dataURL(p.blob)})}return {format:'itfield-results-v1',sourceSHA256:d.sourceSHA256,datasetId:d.datasetId||'',exportedAt:new Date().toISOString(),records,photos}}
export async function importResults(value,d){
 if(value.format!=='itfield-results-v1'||value.sourceSHA256!==d.sourceSHA256||value.datasetId!==(d.datasetId||'')||!Array.isArray(value.records)||value.records.length>10000||!Array.isArray(value.photos))throw Error('Results do not match this drawing package');
 const prefix=d.sourceSHA256+'-'+(d.datasetId?d.datasetId+'-':'');const checked=value.records.map(r=>{const x=validateRecord({...r,opId:uid()});if(!x.id.startsWith(prefix)||x.sourceSHA256!==d.sourceSHA256||x.status==='accepted')throw Error('Invalid or unapproved result');return x});
 if(value.photos.length>5000)throw Error('Too many imported photos');const photos=new Map();for(const p of value.photos){if(!/^[-a-zA-Z0-9]{20,100}$/.test(p.id)||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(p.url)||photos.has(p.id))throw Error('Invalid photo');const b=atob(p.url.split(',')[1]);if(b.charCodeAt(0)!==255||b.charCodeAt(1)!==216)throw Error('Invalid JPEG signature');photos.set(p.id,p)}
 for(const r of checked)for(const id of r.photos)if(!photos.has(id)&&!await store.get('photos',id))throw Error('Missing imported photo');
 // Never overwrite an existing local record; conflicting imports remain in the original export.
 let imported=0,skipped=0;for(const r of checked){if(await store.get('records',r.id)){skipped++;continue}for(const id of r.photos){const p=photos.get(id);if(p){const blob=await (await fetch(p.url)).blob();await store.put('photos',{id,blob,synced:false})}}await store.saveDraft(r);imported++}return {imported,skipped};
}
