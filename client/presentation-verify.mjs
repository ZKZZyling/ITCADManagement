import {validatePresentation,MAX_BUNDLE_BYTES} from '../lib/presentation.mjs';
import {validateRecord} from '../lib/validation.mjs';
export async function verifyPresentation(p){
 validatePresentation(p);for(const r of p.records)validateRecord(r);
 for(const row of [...p.images,...p.photos]){const b=Uint8Array.from(atob(row.url.split(',')[1]),x=>x.charCodeAt(0)),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==row.sha256)throw Error('Image checksum mismatch');const bitmap=await createImageBitmap(new Blob([b]));bitmap.close()}return p;
}
export async function readPresentation(file){if(file.size>MAX_BUNDLE_BYTES)throw Error('Bundle exceeds 80 MB');return verifyPresentation(JSON.parse(await file.text()))}
