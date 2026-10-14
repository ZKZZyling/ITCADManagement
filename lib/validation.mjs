export const STATUSES=['planned','installed','tested','accepted','failed','blocked'];
export function validateRecord(x) {
  if(!x||typeof x!=='object'||typeof x.id!=='string'||!/^[-a-zA-Z0-9_:]{1,180}$/.test(x.id)) throw new Error('Invalid record ID');
  if(typeof x.opId!=='string'||!/^[-a-zA-Z0-9]{16,100}$/.test(x.opId)) throw new Error('Invalid operation ID');
  if(!STATUSES.includes(x.status)||!Number.isInteger(x.version)||x.version<0) throw new Error('Invalid status/version');
  if(typeof x.sourceSHA256!=='string'||!/^[a-fA-F0-9]{64}$/.test(x.sourceSHA256)) throw new Error('Invalid drawing reference');
  if(typeof x.notes!=='string'||x.notes.length>12000||!Array.isArray(x.checks)||x.checks.length>30) throw new Error('Invalid inspection');
  if(x.checks.some(c=>!c||typeof c.id!=='string'||typeof c.label!=='string'||!['unchecked','pass','fail','na'].includes(c.result)))throw new Error('Invalid checklist answer');
  if(x.status==='accepted'&&(!x.checks.length||x.checks.some(c=>!['pass','na'].includes(c.result))))throw new Error('Complete every checklist item before acceptance');
  if(x.checks.some(c=>c.result==='na')&&!x.notes.trim())throw new Error('Explain not-applicable answers in notes');
  if(!Array.isArray(x.photos)||x.photos.length>30||x.photos.some(p=>typeof p!=='string'||!/^[-a-zA-Z0-9]{20,100}$/.test(p))) throw new Error('Invalid photo references');
  if(x.anchor&&(!Array.isArray(x.anchor)||x.anchor.length!==2||x.anchor.some(n=>!Number.isFinite(n)))) throw new Error('Invalid coordinates');
  if(x.geometryMark&&(!Array.isArray(x.geometryMark)||x.geometryMark.length>1000||x.geometryMark.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)))))throw new Error('Invalid markup geometry');
  return {...x,title:String(x.title||'').slice(0,500),sourceHandle:String(x.sourceHandle||'').slice(0,200)};
}
export function json(data,status=200,extra={}) {return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra}})}
