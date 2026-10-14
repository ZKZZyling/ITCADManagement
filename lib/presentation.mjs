export const MAX_BUNDLE_BYTES=80*1024*1024;
export const hex64=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function scoped(records,d){const prefix=d.sourceSHA256+'-'+(d.datasetId?d.datasetId+'-':'');return records.filter(r=>r.sourceSHA256===d.sourceSHA256&&r.id.startsWith(prefix))}
export function summary(records,d){const rows=scoped(records,d),counts={planned:0,installed:0,tested:0,accepted:0,failed:0,blocked:0};for(const r of rows)if(r.status in counts)counts[r.status]++;return {total:rows.length,counts,lastUpdated:rows.reduce((n,r)=>r.updated>n?r.updated:n,'')||null}}
export function validatePresentation(p){
 if(p?.format!=='itcad-presentation-v1'||!hex64(p.drawing?.sourceSHA256)||typeof p.drawing.datasetId!=='string'||!/^[-\w]{1,80}$/.test(p.drawing.datasetId))throw Error('Invalid presentation identity');
 if(!Array.isArray(p.drawing.views)||p.drawing.views.length>25||!p.drawing.views.length||!Array.isArray(p.drawing.assets)||p.drawing.assets.length>10000||!Array.isArray(p.records)||p.records.length>10000||!Array.isArray(p.images)||p.images.length!==p.drawing.views.length||!Array.isArray(p.photos)||p.photos.length>5000)throw Error('Invalid presentation limits');
 const views=new Set();for(const v of p.drawing.views){if(typeof v.id!=='string'||views.has(v.id)||typeof v.title!=='string')throw Error('Invalid presentation view');views.add(v.id)}
 const seen=new Set();for(const image of p.images){if(!views.has(image.viewId)||seen.has(image.viewId)||!hex64(image.sha256)||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image.url))throw Error('Incomplete or invalid reference image');seen.add(image.viewId)}
 for(const a of p.drawing.assets)if(typeof a.id!=='string'||typeof a.title!=='string'||typeof a.layer!=='string'||typeof a.sourceHandle!=='string')throw Error('Invalid asset evidence');
 if(scoped(p.records,p.drawing).length!==p.records.length)throw Error('Mixed inspection datasets');
 const photos=new Set();for(const photo of p.photos){if(!/^[-a-zA-Z0-9]{20,100}$/.test(photo.id)||photos.has(photo.id)||!hex64(photo.sha256)||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo.url))throw Error('Invalid presentation photo');photos.add(photo.id)}
 for(const r of p.records)if(!Array.isArray(r.photos)||r.photos.some(id=>!photos.has(id)))throw Error('Missing inspection photo');
 return p;
}
