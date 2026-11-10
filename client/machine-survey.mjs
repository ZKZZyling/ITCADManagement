// Manual survey geometry. Image pixels, not unverified CAD units, define orientation.
const factors={mm:1,cm:10,m:1000};
const error=message=>{throw Error(message);};
export function parseSurveyLength(value,unit,decimalSeparator='.'){
 if(!Object.hasOwn(factors,unit)||!['.',','].includes(decimalSeparator))error('เลือกหน่วย mm, cm หรือ m และรูปแบบทศนิยมให้ชัดเจน');
 let n=value;
 if(typeof value==='string'){
  const text=value.trim(),pattern=decimalSeparator===','?/^\d+(?:,\d+)?$/:/^\d+(?:\.\d+)?$/;
  if(!pattern.test(text))error('ระยะต้องเป็นตัวเลขทศนิยม ไม่ใส่หลักพันหรือหน่วยในช่องตัวเลข');
  n=Number(text.replace(',','.'));
 }
 const mm=n*factors[unit];if(typeof n!=='number'||!Number.isFinite(n)||n<=0||!Number.isFinite(mm)||mm<=0)error('ระยะต้องมากกว่าศูนย์และเป็นค่าจำกัด');
 return mm;
}
export function formatSurveyLength(mm,unit='mm',decimals=1){
 if(!Object.hasOwn(factors,unit)||!Number.isFinite(mm)||!Number.isInteger(decimals)||decimals<0||decimals>6)error('รูปแบบหน่วยหรือทศนิยมไม่ถูกต้อง');
 return `${(mm/factors[unit]).toFixed(decimals)} ${unit}`;
}
function plan(view){
 if(view?.kind!=='floor-plan'||![view.width,view.height].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(view.drawableHeight||view.height)||(view.drawableHeight||view.height)<=0||(view.drawableHeight||view.height)>view.height||typeof view.id!=='string'||!view.id||!/^[a-f0-9]{64}$/i.test(view.sourceImageSHA256||''))error('ต้องเลือกภาพแปลนที่มีขนาดและรหัสภาพอ้างอิงครบ ไม่ใช่ผังระบบ');
}
function point(view,p){plan(view);if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>1||p[1]<0||p[1]>(view.drawableHeight||view.height)/view.height)error('จุดต้องอยู่ในภาพแปลน ไม่ใช่คำอธิบายใต้ภาพหรือพื้นที่นอกภาพ');return [p[0],p[1]];}
function binding(view){return {viewId:view.id,imageSHA256:view.sourceImageSHA256,imageWidth:view.width,imageHeight:view.height,drawableHeight:view.drawableHeight||view.height};}
function requiredText(s,label){if(typeof s!=='string'||!s.trim()||s.length>2000)error(`ระบุ${label}`);return s.trim();}
const pixel=(v,p)=>[p[0]*v.width,p[1]*v.height];
const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7+Math.max(Math.abs(a),Math.abs(b))*1e-10;
export function makeBaseline(view,input){
 plan(view);if(input.horizontalConfirmed!==true)error('ยืนยันว่าระยะอ้างอิงเป็นระยะแนวราบในระนาบเดียวกัน');const a=point(view,input.a),b=point(view,input.b),pixels=distance(pixel(view,a),pixel(view,b));
 if(pixels<=1e-9)error('จุด A และ B ต้องต่างกัน');
 const mm=parseSurveyLength(input.distance,input.unit,input.decimalSeparator||'.'),mmPerPixel=mm/pixels;
 if(!Number.isFinite(mmPerPixel)||mmPerPixel<=0)error('อัตราส่วนระยะอ้างอิงไม่ถูกต้อง');
 const at=input.at||new Date().toISOString();if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))error('วันที่วัดไม่ถูกต้อง');
 return {schemaVersion:1,...binding(view),a,b,distanceMm:mm,enteredDistance:{value:input.distance,unit:input.unit,decimalSeparator:input.decimalSeparator||'.'},nameA:requiredText(input.nameA,'ชื่อจุด A'),nameB:requiredText(input.nameB,'ชื่อจุด B'),by:requiredText(input.by,'ผู้วัด'),instrument:requiredText(input.instrument,'เครื่องมือหรือรหัสเครื่องมือ'),instrumentReference:requiredText(input.instrumentReference,'ด้านอ้างอิงเครื่องมือ เช่น หน้า/หลัง/ขาตั้ง'),horizontalConfirmed:true,source:requiredText(input.source,'หลักฐานและจุดอ้างอิง'),at,mmPerPixel};
}
export function validateBaseline(view,b){
 plan(view);if(!b||b.schemaVersion!==1)error('รุ่นข้อมูลระยะอ้างอิงไม่ถูกต้อง');
 for(const [key,value] of Object.entries(binding(view)))if(b[key]!==value)error('ระยะอ้างอิงไม่ตรงกับภาพหรือชั้นปัจจุบัน');
 const expected=makeBaseline(view,{...b,distance:b.enteredDistance?.value,unit:b.enteredDistance?.unit,decimalSeparator:b.enteredDistance?.decimalSeparator});
 if(!close(b.distanceMm,expected.distanceMm)||!close(b.mmPerPixel,expected.mmPerPixel))error('ระยะหรืออัตราส่วนที่บันทึกไม่ตรงกับข้อมูลวัด');
 return b;
}
function axes(view,b){validateBaseline(view,b);const a=pixel(view,b.a),z=pixel(view,b.b),dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy);return {a,ux:dx/len,uy:dy/len};}
function thirdCheck(view,b,anchor,c){
 if(c==null)return null;
 const cp=point(view,c.point),mm=parseSurveyLength(c.distance,c.unit,c.decimalSeparator||'.'),calculated=distance(pixel(view,cp),pixel(view,anchor))*b.mmPerPixel;
 return {point:cp,distanceMm:mm,calculatedMm:calculated,residualMm:calculated-mm};
}
export function solveLaserPoint(view,baseline,input){
 const {a,ux,uy}=axes(view,baseline);
 if(input.horizontalConfirmed!==true||input.instrumentReference!==baseline.instrumentReference)error('ยืนยันระยะในระนาบแนวราบเดียวกันและด้านอ้างอิงเครื่องมือให้ตรงกับ A–B');
 if(!['left','right'].includes(input.side))error('เลือกด้านซ้ายหรือขวาเมื่อมองจาก A ไป B ด้วยตนเอง');
 const ap=parseSurveyLength(input.distanceA,input.unit,input.decimalSeparator||'.'),bp=parseSurveyLength(input.distanceB,input.unit,input.decimalSeparator||'.'),ab=baseline.distanceMm;
 if(ap+bp<=ab||Math.abs(ap-bp)>=ab)error('ระยะ A–P, B–P และ A–B ไม่สร้างสามเหลี่ยมที่ใช้งานได้');
 const x=(ap*ap-bp*bp+ab*ab)/(2*ab),h2=ap*ap-x*x;
 if(!Number.isFinite(x)||!Number.isFinite(h2)||h2<=0)error('ระยะสามเหลี่ยมเสื่อมหรือเกินช่วงคำนวณ');
 const left=(input.side==='left'?1:-1)*Math.sqrt(h2),scale=baseline.mmPerPixel;
 // In image coordinates y grows down. Visual left of A->B is (uy,-ux).
 const anchor=point(view,[(a[0]+(x*ux+left*uy)/scale)/view.width,(a[1]+(x*uy-left*ux)/scale)/view.height]);
 return {anchor,source:'manual-laser',side:input.side,distanceAMm:ap,distanceBMm:bp,baselineMm:ab,alongMm:x,leftMm:left,mmPerPixel:scale,checkC:thirdCheck(view,baseline,anchor,input.checkC),unit:'mm'};
}
export function measurePlanPoint(view,baseline,p,checkC=null){
 const {a,ux,uy}=axes(view,baseline),anchor=point(view,p),q=pixel(view,anchor),b=pixel(view,baseline.b),dx=(q[0]-a[0])*baseline.mmPerPixel,dy=(q[1]-a[1])*baseline.mmPerPixel,left=dx*uy-dy*ux;
 return {anchor,source:'plan-derived',side:left===0?'on-baseline':left>0?'left':'right',distanceAMm:distance(a,q)*baseline.mmPerPixel,distanceBMm:distance(b,q)*baseline.mmPerPixel,baselineMm:baseline.distanceMm,alongMm:dx*ux+dy*uy,leftMm:left,mmPerPixel:baseline.mmPerPixel,checkC:thirdCheck(view,baseline,anchor,checkC),unit:'mm'};
}
export function validateSavedSurvey(view,survey){
 if(!survey||!['manual-laser','plan-target'].includes(survey.source)||!survey.entered||!survey.result)error('ข้อมูลชี้จุดด้วยระยะวัดไม่ครบ');
 validateBaseline(view,survey.baselineSnapshot);
 const expected=survey.source==='plan-target'?measurePlanPoint(view,survey.baselineSnapshot,survey.entered.targetAnchor):solveLaserPoint(view,survey.baselineSnapshot,survey.entered),r=survey.result;
 if(r.source!==expected.source||r.side!==expected.side||r.unit!=='mm'||!Array.isArray(r.anchor)||r.anchor.length!==2||!r.anchor.every((n,i)=>close(n,expected.anchor[i])))error('ผลพิกัดไม่ตรงกับระยะวัดที่บันทึก');
 for(const k of ['distanceAMm','distanceBMm','baselineMm','alongMm','leftMm','mmPerPixel'])if(!close(r[k],expected[k]))error('ผลระยะที่บันทึกไม่ตรงกับการคำนวณ');
 if(!!r.checkC!==!!expected.checkC)error('ข้อมูลจุดตรวจ C ไม่ตรงกัน');
 if(expected.checkC){for(const k of ['distanceMm','calculatedMm','residualMm'])if(!close(r.checkC[k],expected.checkC[k]))error('ผลตรวจระยะ C ไม่ตรงกับข้อมูลวัด');if(!Array.isArray(r.checkC.point)||r.checkC.point.length!==2||!r.checkC.point.every((n,i)=>close(n,expected.checkC.point[i])))error('จุดตรวจ C ไม่ตรงกัน');}
 return survey;
}
