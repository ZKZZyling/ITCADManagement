import {validateBaseline} from './machine-survey.mjs';
import {validateExtras} from './machine-geometry.mjs';
const clone=v=>JSON.parse(JSON.stringify(v));
function canonical(v){return Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);}
const same=(a,b)=>canonical(a)===canonical(b);
const text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=5000;
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const factors={mm:1,cm:10,m:1000};
const newId=()=>{const bytes=new Uint32Array(4);globalThis.crypto.getRandomValues(bytes);return 'area-'+Array.from(bytes,n=>n.toString(16).padStart(8,'0')).join('-');};

export function validateAreaReference(profile,d){
 const view=d.views.find(v=>v.id===profile?.viewId);
 if(!profile||!/^area-[A-Za-z0-9_-]{1,100}$/.test(profile.id)||!Number.isSafeInteger(profile.revision)||profile.revision<1||!view||view.kind!=='floor-plan'||profile.datasetId!==d.id||profile.sourceSHA256!==d.sourceSHA256||profile.imageSHA256!==view.sourceImageSHA256||!text(profile.label)||!text(profile.confirmedBy)||!date(profile.confirmedAt)||!text(profile.evidence))throw Error('ชุดอ้างอิงพื้นที่หรือรุ่นต้นฉบับไม่ถูกต้อง');
 if(profile.zoneId&&!d.zones?.some(z=>z.id===profile.zoneId&&z.viewId===view.id))throw Error('ขอบเขตชุดอ้างอิงไม่ตรงพื้นที่ในชั้นนี้');
 validateBaseline(view,profile.baseline);validateExtras({calibrations:{[view.id]:profile.calibration}},d);
 const b=profile.baseline,c=profile.calibration,t=profile.tolerance;
 if(!same(b.a,c.a)||!same(b.b,c.b)||b.distanceMm!==c.mm||Math.abs(b.mmPerPixel-c.mmPerPixel)>1e-8)throw Error('แนว A/B และสเกลของชุดอ้างอิงไม่ตรงกัน');
 if(!t||typeof t.value!=='number'||!Number.isFinite(t.value)||t.value<0||!Object.hasOwn(factors,t.unit)||!Number.isFinite(t.value*factors[t.unit])||!text(t.basis)||!text(t.issuer))throw Error('ชุดอ้างอิงต้องมีเกณฑ์ระยะและตำแหน่งพร้อมผู้กำหนดและที่มา');
 return profile;
}
export function validateAreaReferences(j,d){
 if(j.areaReferences!=null&&(typeof j.areaReferences!=='object'||Array.isArray(j.areaReferences)))throw Error('รายการชุดอ้างอิงไม่ถูกต้อง');
 const entries=Object.entries(j.areaReferences||{});if(entries.length>200)throw Error('ชุดอ้างอิงเกิน 200 ชุด');
 for(const [id,p] of entries){if(id!==p?.id)throw Error('รหัสชุดอ้างอิงไม่ตรง');validateAreaReference(p,d);}return j;
}
export function createAreaReference(d,j,input){
 const view=d.views.find(v=>v.id===input.viewId),id=input.id||newId(),prior=j.areaReferences?.[id];
 const profile={id,revision:(prior?.revision||0)+1,datasetId:d.id,sourceSHA256:d.sourceSHA256,imageSHA256:view?.sourceImageSHA256,viewId:input.viewId,zoneId:input.zoneId||'',label:input.label,confirmedBy:input.confirmedBy,confirmedAt:input.confirmedAt,evidence:input.evidence,tolerance:input.tolerance,baseline:j.surveyBaselines?.[input.viewId],calibration:j.calibrations?.[input.viewId]};
 validateAreaReference(profile,d);return clone(profile);
}
export function areaReferenceAssessment(d,j,profile,{viewId=profile?.viewId,zoneId=''}={}){
 const blockers=[];try{validateAreaReference(profile,d);}catch(e){blockers.push(e.message);}
 const compatible=!!profile&&profile.viewId===viewId&&(!profile.zoneId||profile.zoneId===zoneId);
 if(!compatible)blockers.push('ชุดอ้างอิงไม่ตรงชั้นหรือขอบเขตพื้นที่ที่เลือก');
 const current=blockers.length===0&&same(j.surveyBaselines?.[viewId],profile.baseline)&&same(j.calibrations?.[viewId],profile.calibration)&&same(j.areaReferences?.[profile.id],profile);
 const affectedUnitIds=Object.entries(j.placements||{}).filter(([id,p])=>j.instances?.[id]&&p.viewId===profile?.viewId&&['site-checked','installation-confirmed','field-confirmed'].includes(p.status)&&(!same(p.positionVerification?.binding?.baseline,profile?.baseline)||!same(p.positionVerification?.binding?.calibration,profile?.calibration))).map(([id])=>id);
 return {compatible:compatible&&blockers.length===0,current,blockers,affectedUnitIds};
}
export function activateAreaReference(d,j,profile,{confirmed,by,date:at}={}){
 validateAreaReference(profile,d);
 if(!same(j.areaReferences?.[profile.id],profile))throw Error('ชุดอ้างอิงเปลี่ยนแล้ว กรุณาเลือกใหม่');
 if(confirmed!==true||!text(by)||!date(at))throw Error('ต้องยืนยันเลือกชุดอ้างอิง พร้อมผู้เลือกและวันที่');
 const event={profileId:profile.id,revision:profile.revision,by,at};
 return {...j,surveyBaselines:{...j.surveyBaselines,[profile.viewId]:clone(profile.baseline)},calibrations:{...j.calibrations,[profile.viewId]:clone(profile.calibration)},areaReferenceActivations:[...(j.areaReferenceActivations||[]),event].slice(-200)};
}
export function toleranceFromAreaReference(d,j,profile,unitId,{confirmed}={}){
 const p=j.placements?.[unitId];if(!j.instances?.[unitId]||!p||confirmed!==true)throw Error('เลือกเครื่องจริงที่มีหมุด แล้วกดยืนยันใช้เกณฑ์ชุดนี้');
 const assessment=areaReferenceAssessment(d,j,profile,{viewId:p.viewId,zoneId:p.zoneId||''});
 if(!assessment.current)throw Error(assessment.blockers.join(' · ')||'A/B สเกล หรือชุดอ้างอิงเปลี่ยน ต้องตรวจชุดนี้ใหม่');
 return {tolerance:clone(profile.tolerance),areaReference:{id:profile.id,revision:profile.revision}};
}
export function areaReferenceEvidenceBlockers(d,j,id,p,e){
 if(e?.areaReference==null)return [];
 const profile=j.areaReferences?.[e.areaReference.id];
 if(!profile||e.areaReference.revision!==profile.revision)return ['ชุดเกณฑ์พื้นที่เปลี่ยน ต้องเลือกและตรวจใหม่'];
 try{const current=toleranceFromAreaReference(d,j,profile,id,{confirmed:true});if(p?.viewId!==profile.viewId||(profile.zoneId&&p.zoneId!==profile.zoneId)||!same(current.tolerance,e.tolerance))throw Error('เกณฑ์หรือพื้นที่ไม่ตรงชุดที่เลือก');return [];}catch(err){return [err.message];}
}
