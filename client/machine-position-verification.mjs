import {validateFieldEvidence} from './machine-field-records.mjs';
import {validateBaseline,measurePlanPoint} from './machine-survey.mjs';
import {validateExtras} from './machine-geometry.mjs';
import {areaReferenceEvidenceBlockers} from './machine-area-reference.mjs';

const units={mm:1,cm:10,m:1000};
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const copy=v=>JSON.parse(JSON.stringify(v??null));
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
const same=(a,b)=>canonical(a)===canonical(b);
const unique=values=>[...new Set(values)];
const checkNames={door:'ประตูและช่องเปิด',path:'เส้นทางเคลื่อนย้าย',headroom:'ความสูงเหนือเครื่อง',load:'น้ำหนักพื้นและการยก'};

function siteInputs(d,j,id,p,e){
 const blockers=[],comparisons=[],unit=j.instances?.[id],view=d.views?.find(v=>v.id===p?.viewId),detail=j.machineDetails?.[id],baseline=j.surveyBaselines?.[p?.viewId],cal=j.calibrations?.[p?.viewId];let expected=null,toleranceMm=null,binding=null,positionComparison=null;
 if(!unit||!d.assets?.some(a=>a.id===unit.assetId&&!a.instanceOf)||!nonempty(unit.serial)||!nonempty(unit.label))blockers.push('เลือกเครื่องจริงที่มีป้ายหรือ Serial ก่อนตรวจจุด');
 if(!p||!view||view.kind!=='floor-plan')blockers.push('บันทึกจุดเสนอในภาพแปลนก่อนตรวจจุดจริง');
 if(!nonempty(d.id)||!nonempty(d.sourceSHA256)||!nonempty(view?.sourceImageSHA256))blockers.push('รุ่นต้นฉบับหรือภาพอ้างอิงไม่ครบ');
 if(!nonempty(detail?.reference?.datum))blockers.push('ระบุ Datum ของเครื่องที่ตรวจจริงในข้อมูลขนาดและจุดอ้างอิง');
 if(detail?.reference?.pointType!=='machine-center')blockers.push('ยืนยันว่าจุด P คือกึ่งกลางกรอบเครื่อง รุ่นนี้ยังไม่คำนวณจุดมุมหรือรูยึดแทนกึ่งกลาง');
 if(!baseline)blockers.push('ตั้งแนวอ้างอิง A/B ที่วัดจริงของชั้นนี้ก่อน');
 if(!cal)blockers.push('ยังไม่มีสเกลจากแนว A/B ที่วัดจริง');
 if(view&&baseline&&cal){try{
  validateBaseline(view,baseline);validateExtras({calibrations:{[view.id]:cal}},d);
  if(!same(cal.a,baseline.a)||!same(cal.b,baseline.b)||cal.mm!==baseline.distanceMm||Math.abs(cal.mmPerPixel-baseline.mmPerPixel)>1e-8)throw Error('สเกลกับแนว A/B ไม่ตรงกัน ต้องตั้งแนวอ้างอิงใหม่');
  if(baseline.nameA.trim().toLowerCase()===baseline.nameB.trim().toLowerCase())throw Error('ชื่อจุด A และ B ต้องต่างกันและชี้จุดจริงได้');
  expected=measurePlanPoint(view,baseline,p?.anchor);
  const sideRoundoff=Number.EPSILON*Math.max(1,expected.distanceAMm,expected.distanceBMm,baseline.distanceMm)*32;
  if(Math.abs(expected.leftMm)<=sideRoundoff)expected={...expected,side:'on-baseline',leftMm:0};
 }catch(error){blockers.push(error.message);}}
 try{validateFieldEvidence(e);}catch(error){blockers.push(error.message);}
 const t=e?.tolerance;
 if(!t||typeof t.value!=='number'||!Number.isFinite(t.value)||t.value<0||!Object.hasOwn(units,t.unit)||!nonempty(t.basis)||!nonempty(t.issuer))blockers.push('ระบุค่าคลาดเคลื่อนที่ยอมรับ หน่วย เอกสารที่มา และผู้กำหนด โดยไม่ใช้ค่าเริ่มต้น');
 else {toleranceMm=t.value*units[t.unit];if(!Number.isFinite(toleranceMm)){toleranceMm=null;blockers.push('ค่าคลาดเคลื่อนอยู่นอกช่วงคำนวณ');}}
 if(!['left','right','on-baseline'].includes(e?.observedSide))blockers.push('เลือกด้านของจุดจริงเมื่อมอง A ไป B ด้วยตนเอง');
 else if(expected&&e.observedSide!==expected.side)blockers.push('ด้านของจุดจริงไม่ตรงกับจุดเป้าหมายเมื่อมอง A ไป B');
 const readings=Array.isArray(e?.readings)?e.readings:[];
 if(readings.length!==2||['A','B'].some(key=>readings.filter(r=>r.referenceKey===key).length!==1))blockers.push('ใช้ระยะจริง AP และ BP อย่างละหนึ่งรายการ ผูกกับจุด A/B ปัจจุบัน');
 for(const key of ['A','B']){
  const r=readings.find(r=>r.referenceKey===key),reference=baseline?.['name'+key],expectedMm=expected?.['distance'+key+'Mm'];
  if(!r)continue;
  if(r.reference!==reference||r.label!==key+'P')blockers.push(`ระยะ ${key}P ต้องอ้างจุด ${key} ชื่อเดียวกับแนว A/B ปัจจุบัน`);
  if(typeof r.value!=='number'||!Number.isFinite(r.value)||r.value<=0||!Object.hasOwn(units,r.unit))continue;
  const measuredMm=r.value*units[r.unit];if(!Number.isFinite(measuredMm)){blockers.push(`ระยะ ${key}P อยู่นอกช่วงคำนวณ`);continue;}
  if(Number.isFinite(expectedMm)&&toleranceMm!==null){const residualMm=measuredMm-expectedMm,roundoff=Number.EPSILON*Math.max(1,Math.abs(expectedMm),Math.abs(measuredMm),toleranceMm)*16,withinTolerance=Math.abs(residualMm)<=toleranceMm+roundoff;comparisons.push({key,reference,expectedMm,measuredMm,residualMm,toleranceMm,withinTolerance});if(!withinTolerance)blockers.push(`ระยะ ${key}P ต่างจากเป้าหมายเกินค่าคลาดเคลื่อนที่ระบุ`);}
 }
 if(comparisons.length===2&&baseline){const ap=comparisons.find(r=>r.key==='A').measuredMm,bp=comparisons.find(r=>r.key==='B').measuredMm,ab=baseline.distanceMm,roundoff=Number.EPSILON*Math.max(1,ap,bp,ab)*16;if(ap+bp<ab-roundoff||Math.abs(ap-bp)>ab+roundoff)blockers.push('ระยะ AP/BP จริงไม่สามารถเกิดร่วมกับแนว AB ได้ แม้อยู่ในค่าคลาดเคลื่อนที่กรอก');}
 if(comparisons.length===2&&baseline&&expected&&['left','right','on-baseline'].includes(e?.observedSide)){
  const ap=comparisons.find(r=>r.key==='A').measuredMm,bp=comparisons.find(r=>r.key==='B').measuredMm,ab=baseline.distanceMm;
  const alongMm=(ap*ap-bp*bp+ab*ab)/(2*ab),heightSquared=ap*ap-alongMm*alongMm,roundoff=Number.EPSILON*Math.max(1,ap*ap,alongMm*alongMm)*32;
  if(Number.isFinite(alongMm)&&Number.isFinite(heightSquared)&&heightSquared>=-roundoff){
   const height=Math.sqrt(Math.max(0,heightSquared)),leftMm=e.observedSide==='right'?-height:height;
   if(e.observedSide==='on-baseline'&&heightSquared>roundoff)blockers.push('ระยะจริงไม่ใช่จุดบนแนว A/B ตามด้านที่เลือก');
   const displacementMm=Math.hypot(alongMm-expected.alongMm,leftMm-expected.leftMm),epsilon=Number.EPSILON*Math.max(1,ap,bp,ab,toleranceMm)*32,withinTolerance=displacementMm<=toleranceMm+epsilon;
   const dx=(baseline.b[0]-baseline.a[0])*view.width,dy=(baseline.b[1]-baseline.a[1])*view.height,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,scale=baseline.mmPerPixel;
   const measuredAnchor=[baseline.a[0]+(alongMm*ux+leftMm*uy)/scale/view.width,baseline.a[1]+(alongMm*uy-leftMm*ux)/scale/view.height];
   positionComparison={displacementMm,toleranceMm,withinTolerance,measuredAnchor,alongMm,leftMm};
   if(!withinTolerance)blockers.push('ตำแหน่งที่คำนวณจาก AP/BP จริงห่างจากเป้าหมายเกินค่าคลาดเคลื่อนที่ระบุ');
  }else blockers.push('ระยะจริงไม่สามารถคำนวณตำแหน่งที่จำกัดได้');
 }
 if(unit&&view&&baseline&&cal&&expected&&nonempty(detail?.reference?.datum))binding={datasetId:d.id,sourceSHA256:d.sourceSHA256,sourceDXFSHA256:d.sourceDXFSHA256||null,workbookSHA256:d.sourceWorkbookSHA256||d.inventorySHA256||null,view:{id:view.id,kind:view.kind,imageSHA256:view.sourceImageSHA256,width:view.width,height:view.height,drawableHeight:view.drawableHeight||view.height,worldBounds:copy(view.worldBounds)},unit:{id,assetId:unit.assetId,label:unit.label,serial:unit.serial},anchor:copy(p.anchor),baseline:copy(baseline),calibration:copy(cal),machineReference:copy(detail.reference),machineFootprint:copy(detail.footprint)};
 return {blockers:unique(blockers),comparisons,positionComparison,expected,expectedSide:expected?.side??null,toleranceMm,binding};
}

function installationReadiness(j,id){
 const detail=j.machineDetails?.[id],f=detail?.footprint,missing=[];
 const dimensions=!!f&&f.origin==='center'&&[f.lengthMm,f.widthMm,f.heightMm].every(v=>Number.isFinite(v)&&v>0)&&Number.isFinite(f.rotationDeg)&&f.rotationDeg>=0&&f.rotationDeg<360&&nonempty(f.source)&&nonempty(f.by);
 if(!dimensions)missing.push('ขนาดเครื่องจริง ยาว/กว้าง/สูง มุม ผู้ให้ข้อมูล และหลักฐานขนาดยังไม่ครบ');
 const checks={};for(const [key,label] of Object.entries(checkNames)){const c=detail?.installChecks?.[key];checks[key]=c?.status==='reviewed'&&nonempty(c.evidence);if(!checks[key])missing.push('ยังไม่มีหลักฐานตรวจ'+label);}
 return {dimensions,checks,missing};
}

export function createPositionVerification(d,j,id,p,evidence=p?.fieldEvidence){
 const assessment=siteInputs(d,j,id,p,evidence);assessment.blockers.push(...areaReferenceEvidenceBlockers(d,j,id,p,evidence));if(assessment.blockers.length)throw Error(assessment.blockers.join(' · '));
 return {schemaVersion:1,binding:assessment.binding,evidenceSnapshot:copy(evidence),comparisons:assessment.comparisons,positionComparison:assessment.positionComparison,expectedSide:assessment.expectedSide,toleranceMm:assessment.toleranceMm};
}

export function confirmationAssessment(d,j,id,p=j.placements?.[id],evidence=p?.fieldEvidence){
 const input=siteInputs(d,j,id,p,evidence),readiness=installationReadiness(j,id);
 input.blockers.push(...areaReferenceEvidenceBlockers(d,j,id,p,evidence));
 const toleranceOnly=message=>/^ระยะ [AB]P ต่างจากเป้าหมายเกิน/.test(message)||message==='ตำแหน่งที่คำนวณจาก AP/BP จริงห่างจากเป้าหมายเกินค่าคลาดเคลื่อนที่ระบุ';
 const canPreviewPosition=!!input.positionComparison&&input.blockers.every(toleranceOnly);
 const wanted=input.blockers.length?null:{schemaVersion:1,binding:input.binding,evidenceSnapshot:copy(evidence),comparisons:input.comparisons,positionComparison:input.positionComparison,expectedSide:input.expectedSide,toleranceMm:input.toleranceMm};
 const verificationCurrent=!!wanted&&same(p?.positionVerification,wanted),checked=['site-checked','installation-confirmed'].includes(p?.status);
 const verificationBlockers=verificationCurrent?[]:[p?.positionVerification?'จุดหรือหลักฐานอ้างอิงเปลี่ยน ต้องตรวจจุดใหม่':'บันทึกเดิมยังไม่ได้ผูกหลักฐานตำแหน่งรุ่นนี้ ต้องตรวจจุดใหม่'];
 const installationBlockers=unique([...(p?.status==='site-checked'||p?.status==='installation-confirmed'?[]:['ต้องบันทึกตรวจจุดจริงก่อนบันทึกติดตั้ง']),...input.blockers,...verificationBlockers,...readiness.missing]);
 const effectiveStatus=checked&&(!verificationCurrent||p.status==='installation-confirmed'&&readiness.missing.length)?'needs-recheck':p?.status==='field-confirmed'?'needs-recheck':p?.status||'unplaced';
 return {effectiveStatus,verificationCurrent,canPreviewPosition,canConfirmSite:input.blockers.length===0,canConfirmInstallation:installationBlockers.length===0,siteBlockers:input.blockers,installationBlockers,blockers:unique([...input.blockers,...(checked?verificationBlockers:[]),...(p?.status==='installation-confirmed'?readiness.missing:[])]),comparisons:input.comparisons,positionComparison:input.positionComparison,expected:input.expected,expectedSide:input.expectedSide,toleranceMm:input.toleranceMm,readiness};
}

export function validateConfirmedTransition(d,j,id,p){
 if(!['site-checked','installation-confirmed'].includes(p?.status))return;
 const assessment=confirmationAssessment(d,j,id,p);
 if(!assessment.canConfirmSite||!assessment.verificationCurrent)throw Error(unique([...assessment.siteBlockers,...(assessment.verificationCurrent?[]:['ต้องตรวจจุดใหม่และผูกหลักฐานกับตำแหน่งปัจจุบัน'])]).join(' · '));
 if(p.status==='installation-confirmed'){
  const previous=j.placements?.[id],prior=confirmationAssessment(d,j,id,previous);
  if(!previous||!['site-checked','installation-confirmed'].includes(previous.status)||!prior.verificationCurrent)throw Error('ต้องบันทึกตรวจจุดจริงด้วยหลักฐานปัจจุบันก่อนบันทึกติดตั้ง');
  if(!same(p.positionVerification,previous.positionVerification))throw Error('ตำแหน่งหรือหลักฐานเปลี่ยนหลังตรวจจุด ต้องบันทึกตรวจจุดใหม่นี้ก่อนติดตั้ง');
  if(!assessment.canConfirmInstallation)throw Error(assessment.installationBlockers.join(' · '));
  if(!same(p.siteCheckSnapshot,p.fieldEvidence))throw Error('หลักฐานตรวจจุดที่แนบต้องตรงกับหลักฐานตำแหน่งที่ยืนยัน');
  if(!nonempty(p.installationEvidence))throw Error('ระบุหลักฐานติดตั้งแล้ว');
 }
}
