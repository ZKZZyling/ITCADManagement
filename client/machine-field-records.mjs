const text = (v, max=5000) => typeof v==='string' && v.trim().length>0 && v.length<=max;
export function expandInstances(d,j={}) {
 const base=d.assets.filter(a=>!a.instanceOf);
 return {...d,assets:[...base,...Object.values(j.instances||{}).map(i=>{const a=base.find(a=>a.id===i.assetId);return {...a,id:i.id,instanceOf:i.assetId,instanceLabel:i.label,serial:i.serial,nameTh:`${a?.nameTh||a?.nameZh||''} · ${i.label}`,placement:null,quantityRaw:'1 เครื่องที่ระบุตัวตน',photos:a?.photos||[]}})]};
}
export const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function validateFieldEvidence(e){
 if(!e||!['reference','measurement','evidence','participants','basis'].every(k=>text(e[k]))||!validDate(e.date)||e.actualObserved!==true)throw Error('ต้องระบุจุดอ้างอิงจริง ระยะที่วัด หลักฐาน ผู้ร่วมตรวจ วันที่ และที่มามิติครบถ้วน');
 if(!Array.isArray(e.readings)||e.readings.length<2||e.readings.length>20||e.readings.some(r=>!text(r.reference,200)||!text(r.label,100)||!Number.isFinite(r.value)||r.value<=0||!['mm','cm','m'].includes(r.unit)||!['laser','tape','other'].includes(r.method)))throw Error('ต้องมีระยะวัดจริงอย่างน้อยสองระยะ พร้อมจุดอ้างอิง ตัวเลขบวก หน่วย และวิธีวัด');
 if(new Set(e.readings.map(r=>r.reference.trim().toLowerCase())).size<2)throw Error('ต้องมีจุดอ้างอิงจริงอย่างน้อยสองจุดที่ต่างกัน');
 return e;
}
export function validateFieldRecords(j,d){
 const base=d.assets.filter(a=>!a.instanceOf), seen=new Set(base.map(a=>a.id));
 for(const [key,i] of Object.entries(j.instances||{})){
  if(key!==i.id||seen.has(key)||!/^unit-[A-Za-z0-9_-]{1,100}$/.test(key)||!base.some(a=>a.id===i.assetId)||!text(i.label,120)||!text(i.serial,200)||!Number.isFinite(Date.parse(i.createdAt)))throw Error('ตัวตนเครื่องจริงไม่ถูกต้อง ต้องมีรหัส/ป้ายและอ้างรายการบัญชี');
  if(Object.values(j.instances||{}).some(other=>other.id!==key&&other.assetId===i.assetId&&other.serial.trim().toLowerCase()===i.serial.trim().toLowerCase()))throw Error('ป้าย/Serial นี้มีอยู่ในรายการเดียวกันแล้ว');
  seen.add(key);
 }
 if(seen.size-base.length>2000)throw Error('จำนวนเครื่องที่เพิ่มเกินขอบเขต');
 for(const [key,r] of Object.entries(j.relationships||{}))if(key!==r.id||!j.instances?.[r.from]||!j.instances?.[r.to]||r.from===r.to||!['process','utility','control'].includes(r.kind)||!text(r.evidence)||!text(r.participants)||!validDate(r.date))throw Error('ความสัมพันธ์ต้องระบุต้นทาง ปลายทาง ชนิด หลักฐาน ผู้ตรวจและวันที่');
 return j;
}
export function makeInstance(d,j,{label,serial},id){
 if(!d.assets.some(a=>a.id===id&&!a.instanceOf))throw Error('เลือกแถวบัญชีก่อนเพิ่มเครื่องจริง');
 const values=new Uint32Array(3);globalThis.crypto.getRandomValues(values);const key='unit-'+Array.from(values,n=>n.toString(16)).join('-');
 const next={...j,instances:{...j.instances,[key]:{id:key,assetId:id,label:label.trim(),serial:serial.trim(),createdAt:new Date().toISOString()}}};validateFieldRecords(next,d);return {journal:next,id:key};
}
export function fieldPlacement(previous,next){
 const same=previous?.viewId===next.viewId&&previous.anchor?.every((n,i)=>n===next.anchor?.[i]);
 if(!same)return {...next,status:'proposed',fieldEvidence:undefined};
 return next;
}
export function relationshipContext(relation,d,journal,viewId){
 const from=d.assets.find(a=>a.id===relation.from),to=d.assets.find(a=>a.id===relation.to),a=journal.placements?.[relation.from],b=journal.placements?.[relation.to];
 return {...relation,fromAsset:from,toAsset:to,a,b,mapState:!a?.anchor||!b?.anchor?'unplaced':a.viewId!==b.viewId?'cross-floor':a.viewId===viewId?'visible':'other-view'};
}
