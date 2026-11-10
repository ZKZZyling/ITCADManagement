import {validateBaseline,validateSavedSurvey} from './machine-survey.mjs';
import {pointInZone} from './machine-navigation.mjs';
import {validateExtras} from './machine-geometry.mjs';
export function pointInPlan(clientX, clientY, rect, viewBox, aspect=1) {
  const scale=Math.min(rect.width/viewBox.w,rect.height/(viewBox.h*aspect));
  const ox=(rect.width-viewBox.w*scale)/2, oy=(rect.height-viewBox.h*aspect*scale)/2;
  const px=clientX-rect.left-ox,py=clientY-rect.top-oy;
  if(px<0||py<0||px>viewBox.w*scale||py>viewBox.h*aspect*scale)return null;
  const point=[viewBox.x+px/scale,viewBox.y+py/scale/aspect];
  return point.every(n=>Number.isFinite(n)&&n>=0&&n<=1)?point:null;
}
export const identity=d=>`${d.id}:${d.sourceSHA256}:${d.sourceWorkbookSHA256||d.inventorySHA256||''}`;
export function emptyJournal(d){return {schemaVersion:1,identity:identity(d),placements:{},history:[]};}
export function validateJournal(raw,d){
  if(raw?.schemaVersion!==1||raw.identity!==identity(d)||!raw.placements||!Array.isArray(raw.history))throw Error('ไฟล์นี้ไม่ตรงกับแบบและรายการเครื่องจักรชุดปัจจุบัน');
  for(const [id,baseline] of Object.entries(raw.surveyBaselines||{})){const v=d.views.find(v=>v.id===id);if(!v)throw Error('แนว A/B ไม่ตรงกับภาพ');validateBaseline(v,baseline)}
  const ids=new Set(d.assets.map(a=>a.id)), views=new Set(d.views.map(v=>v.id));
  for(const [id,p] of Object.entries(raw.placements)){
    if(!ids.has(id)||!views.has(p.viewId)||!Array.isArray(p.anchor)||p.anchor.length!==2||!p.anchor.every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!['proposed','field-confirmed'].includes(p.status)||typeof p.note!=='string'||p.note.length>5000||typeof p.by!=='string'||(p.status==='field-confirmed'&&(!p.by.trim()||!p.note.trim())))throw Error('ข้อมูลตำแหน่งหรือผู้ยืนยันไม่ถูกต้อง');
    const view=d.views.find(v=>v.id===p.viewId);
    if(p.survey){if(typeof p.survey.by!=='string'||!p.survey.by.trim()||!Number.isFinite(Date.parse(p.survey.at||'')))throw Error('ระบุผู้วัดและวันเวลาของหลักฐานระยะ');validateSavedSurvey(view,p.survey);if(p.anchor.some((n,i)=>Math.abs(n-p.survey.result.anchor[i])>1e-9))throw Error('หมุดไม่ตรงกับผลระยะที่บันทึก');}
    if(p.zoneId){const zone=(d.zones||[]).find(z=>z.id===p.zoneId&&z.viewId===p.viewId);if(!zone||!pointInZone(p.anchor,zone.polygon))throw Error('โซนไม่ตรงกับภาพหรือตำแหน่งที่ระบุ');}
    if(view.kind==='schematic-reference'||(view.drawableHeight&&view.height&&p.anchor[1]>view.drawableHeight/view.height))throw Error('จุดติดตั้งต้องอยู่ในพื้นที่แปลน ไม่ใช่ผังระบบหรือคำอธิบายใต้ภาพ');
  }
  if(raw.history.length>10000)throw Error('ประวัติมีขนาดใหญ่เกินกำหนด');
  for(const h of raw.history){if(!h||!ids.has(h.id)||typeof h.at!=='string'||!h.after)throw Error('ประวัติไม่ถูกต้อง');for(const p of [h.before,h.after].filter(Boolean))validateJournal({...raw,placements:{[h.id]:p},history:[],photos:[],calibrations:{},machineDetails:{},surveyBaselines:{}},d);}
  return validateExtras(raw,d);
}
export function place(journal,d,id,p){const next={...journal,placements:{...journal.placements,[id]:p},history:[...journal.history,{id,before:journal.placements[id]||null,after:p,at:new Date().toISOString()}]};return validateJournal(next,d);}
export function undo(journal,d){if(!journal.history.length)return journal;const event=journal.history.at(-1);if(!d.assets.some(a=>a.id===event.id))throw Error('ประวัติไม่ตรงกับรายการ');const placements={...journal.placements};if(event.before)placements[event.id]=event.before;else delete placements[event.id];return validateJournal({...journal,placements,history:journal.history.slice(0,-1)},d);}

export function surveyIsStale(survey,baseline,calibration){return !!survey&&(!baseline||JSON.stringify(survey.baselineSnapshot)!==JSON.stringify(baseline)||calibration?.mmPerPixel!==baseline.mmPerPixel)}

export function retainSurveyEvidence(previous,next){return previous?.survey&&previous.viewId===next.viewId&&previous.anchor?.length===2&&previous.anchor.every((n,i)=>n===next.anchor?.[i])?{...next,survey:previous.survey}:next}
