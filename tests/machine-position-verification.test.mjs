import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyJournal,place,validateJournal} from '../client/machine-model.mjs';
import {makeBaseline} from '../client/machine-survey.mjs';
import {calibration} from '../client/machine-geometry.mjs';
import {confirmationAssessment,createPositionVerification} from '../client/machine-position-verification.mjs';

function fixture(){
 const view={id:'floor',kind:'floor-plan',width:1000,height:1000,drawableHeight:1000,sourceImageSHA256:'b'.repeat(64)},d={id:'synthetic-verification',sourceSHA256:'a'.repeat(64),sourceWorkbookSHA256:'c'.repeat(64),assets:[{id:'row'}],views:[view]},id='unit-test';
 const baseline=makeBaseline(view,{a:[.1,.5],b:[.7,.5],distance:6000,unit:'mm',nameA:'Column A',nameB:'Column B',by:'Synthetic surveyor',instrument:'Synthetic laser',instrumentReference:'rear',horizontalConfirmed:true,source:'Synthetic datum control',at:'2026-11-11T00:00:00Z'});
 const j={...emptyJournal(d),instances:{[id]:{id,assetId:'row',label:'Synthetic unit',serial:'SYNTHETIC-1',createdAt:'2026-11-11T00:00:00Z'}},surveyBaselines:{floor:baseline},calibrations:{floor:calibration(baseline.a,baseline.b,6000,view,'Synthetic surveyor','Synthetic datum control')},machineDetails:{[id]:{reference:{datum:'D0',pointType:'machine-center'},footprint:{origin:'center',lengthMm:1000,widthMm:500,heightMm:1500,rotationDeg:0,source:'Synthetic vendor drawing',by:'Synthetic equipment lead'},installChecks:Object.fromEntries(['door','path','headroom','load'].map(k=>[k,{status:'reviewed',evidence:'Synthetic check '+k}]))}}};
 // Independent analytic 3-4-5 triangle: horizontal offsets 3000mm and height4000mm.
 const p={viewId:'floor',anchor:[.4,.1],status:'proposed',note:'Synthetic only',by:'Synthetic surveyor'};
 const e={reference:'D0 / Column A / Column B',measurement:'Two actual horizontal readings',evidence:'Synthetic photo reference',participants:'Synthetic inspector',date:'2026-11-11',basis:'Synthetic dimension reference',actualObserved:true,observedSide:'left',tolerance:{value:5,unit:'mm',basis:'SYNTHETIC-REV tolerance control',issuer:'Synthetic responsible person'},readings:[{referenceKey:'A',reference:'Column A',label:'AP',value:5,unit:'m',method:'laser'},{referenceKey:'B',reference:'Column B',label:'BP',value:5000,unit:'mm',method:'laser'}]};
 return {d,j,id,p,e,view,baseline};
}
function checked(f){const p={...f.p,status:'site-checked',fieldEvidence:f.e,positionVerification:createPositionVerification(f.d,f.j,f.id,f.p,f.e)};return {p,j:place(f.j,f.d,f.id,p)};}

test('new confirmation reconciles mixed mm/m readings against independent 3-4-5 target and survives roundtrip',()=>{
 const f=fixture(),before=JSON.stringify(f),proof=createPositionVerification(f.d,f.j,f.id,f.p,f.e);
 assert.deepEqual(proof.comparisons.map(r=>r.expectedMm),[5000,5000]);assert.deepEqual(proof.comparisons.map(r=>r.measuredMm),[5000,5000]);assert.equal(proof.expectedSide,'left');assert.equal(JSON.stringify(f),before);
 const c=checked(f),round=validateJournal(JSON.parse(JSON.stringify(c.j)),f.d),a=confirmationAssessment(f.d,round,f.id);
 assert.equal(a.effectiveStatus,'site-checked');assert.equal(a.verificationCurrent,true);assert.equal(a.canConfirmInstallation,true);
 const installed=place(round,f.d,f.id,{...c.p,status:'installation-confirmed',siteCheckSnapshot:f.e,installationEvidence:'Synthetic installation record'});
 assert.equal(confirmationAssessment(f.d,installed,f.id).effectiveStatus,'installation-confirmed');
});

test('original contradictory 0.001/999999 readings and impossible triangle cannot become a new checked point',()=>{
 const f=fixture(),bad=structuredClone(f.e);bad.readings[0]={...bad.readings[0],value:.001,unit:'mm'};bad.readings[1].value=999999;
 assert.throws(()=>createPositionVerification(f.d,f.j,f.id,f.p,bad),/เกินค่าคลาดเคลื่อน/);
 assert.throws(()=>place(f.j,f.d,f.id,{...f.p,status:'site-checked',fieldEvidence:bad}),/เกินค่าคลาดเคลื่อน/);
 bad.tolerance.value=1e9;bad.readings[0].value=1000;bad.readings[1].value=1000;
 assert.throws(()=>createPositionVerification(f.d,f.j,f.id,f.p,bad),/ไม่สามารถเกิดร่วม/);
});

test('declared tolerance boundary is inclusive, unsupported/missing basis fails and no default tolerance exists',()=>{
 const f=fixture(),e=structuredClone(f.e);e.readings[0].value=5.005;e.readings[1]={...e.readings[1],value:Math.hypot(2997,4004)/10,unit:'cm'};
 const boundary=createPositionVerification(f.d,f.j,f.id,f.p,e);assert.equal(boundary.comparisons[0].residualMm,5);assert.ok(Math.abs(boundary.positionComparison.displacementMm-5)<1e-8);
 e.readings[0].value=5.005001;assert.throws(()=>createPositionVerification(f.d,f.j,f.id,f.p,e),/เกินค่าคลาดเคลื่อน/);
 const amplified=structuredClone(f.e);amplified.readings[0].value=5.005;amplified.readings[1].value=4995;const radial=confirmationAssessment(f.d,f.j,f.id,f.p,amplified);assert.ok(radial.comparisons.every(r=>r.withinTolerance));assert.equal(radial.positionComparison.withinTolerance,false);
 for(const tolerance of [undefined,{...f.e.tolerance,value:NaN},{...f.e.tolerance,value:-1},{...f.e.tolerance,unit:'px'},{...f.e.tolerance,basis:''},{...f.e.tolerance,issuer:''}])assert.equal(confirmationAssessment(f.d,f.j,f.id,f.p,{...f.e,tolerance}).canConfirmSite,false);
 assert.equal(createPositionVerification(f.d,f.j,f.id,f.p,{...f.e,tolerance:{...f.e.tolerance,value:0}}).toleranceMm,0);
 const incomplete=confirmationAssessment(f.d,f.j,f.id,f.p,{});assert.equal(incomplete.expected.distanceAMm,5000);assert.equal(incomplete.expected.distanceBMm,5000);assert.equal(incomplete.toleranceMm,null);
});

test('actual side and exact directed A/B references reject mirror positions and ambiguous datum points',()=>{
 const f=fixture();for(const observedSide of [undefined,'right','on-baseline'])assert.throws(()=>createPositionVerification(f.d,f.j,f.id,f.p,{...f.e,observedSide}),/ด้าน/);
 const mirror={...f.p,anchor:[.4,.9]};assert.throws(()=>createPositionVerification(f.d,f.j,f.id,mirror,f.e),/ด้าน/);assert.equal(createPositionVerification(f.d,f.j,f.id,mirror,{...f.e,observedSide:'right'}).expectedSide,'right');
 const bad=structuredClone(f.e);bad.readings[0].reference='Another A';assert.throws(()=>createPositionVerification(f.d,f.j,f.id,f.p,bad),/ชื่อเดียว/);
 bad.readings[0]={...f.e.readings[0],referenceKey:'B'};assert.throws(()=>createPositionVerification(f.d,f.j,f.id,f.p,bad),/อย่างละหนึ่ง/);
 for(const reference of [{datum:'D0'}, {datum:'D0',pointType:'corner'},{datum:'',pointType:'machine-center'}]){const j=structuredClone(f.j);j.machineDetails[f.id].reference=reference;assert.equal(confirmationAssessment(f.d,j,f.id,f.p,f.e).canConfirmSite,false);}
});

test('basis changes invalidate effective confirmation without mutating or losing historical journals',()=>{
 const f=fixture(),c=checked(f);
 for(const mutate of [q=>q.d.sourceSHA256='z'.repeat(64),q=>q.d.views[0].sourceImageSHA256='e'.repeat(64),q=>q.j.instances[q.id].serial='Different unit',q=>q.p.anchor=[.41,.1],q=>q.j.machineDetails[q.id].reference.datum='New datum',q=>q.j.machineDetails[q.id].footprint.rotationDeg=90,q=>q.p.fieldEvidence.tolerance.issuer='Different issuer']){
  const q=structuredClone({...f,j:c.j,p:c.p});mutate(q);const a=confirmationAssessment(q.d,q.j,q.id,q.p);assert.equal(a.verificationCurrent,false);assert.equal(a.effectiveStatus,'needs-recheck');assert.equal(a.canConfirmInstallation,false);
 }
 const changed=makeBaseline(f.view,{...f.baseline,a:[.2,.5],b:[.8,.5],distance:6000,unit:'mm'}),j=structuredClone(c.j);
 j.surveyBaselines.floor=changed;j.calibrations.floor=calibration(changed.a,changed.b,6000,f.view,'Synthetic surveyor','New reference');
 const before=JSON.stringify(j),loaded=validateJournal(j,f.d);assert.equal(JSON.stringify(loaded),before);assert.equal(confirmationAssessment(f.d,loaded,f.id).effectiveStatus,'needs-recheck');
 assert.throws(()=>place(j,f.d,f.id,{...c.p,status:'installation-confirmed',siteCheckSnapshot:f.e,installationEvidence:'Synthetic'}));
 const legacy=structuredClone(c.j);delete legacy.placements[f.id].positionVerification;const backup=JSON.stringify(legacy);assert.equal(JSON.stringify(validateJournal(JSON.parse(backup),f.d)),backup);assert.equal(confirmationAssessment(f.d,legacy,f.id).effectiveStatus,'needs-recheck');
});

test('installation cannot introduce a different valid point proof without a separately recorded site check',()=>{
 const f=fixture(),c=checked(f),q={...c.p,anchor:[.4,.9]},e={...f.e,observedSide:'right'},proof=createPositionVerification(f.d,c.j,f.id,q,e);
 assert.throws(()=>place(c.j,f.d,f.id,{...q,status:'installation-confirmed',fieldEvidence:e,positionVerification:proof,siteCheckSnapshot:e,installationEvidence:'Synthetic'}),/เปลี่ยนหลังตรวจจุด/);
 const qChecked=place(c.j,f.d,f.id,{...q,status:'site-checked',fieldEvidence:e,positionVerification:proof});
 assert.equal(place(qChecked,f.d,f.id,{...qChecked.placements[f.id],status:'installation-confirmed',siteCheckSnapshot:e,installationEvidence:'Synthetic'}).placements[f.id].status,'installation-confirmed');
});

test('installation readiness remains pending for absent actual dimensions, provenance or movement checks',()=>{
 for(const change of [detail=>delete detail.footprint,detail=>delete detail.footprint.heightMm,detail=>detail.footprint.source='',detail=>detail.installChecks.path={status:'pending',evidence:''},detail=>delete detail.installChecks.load]){
  const f=fixture();change(f.j.machineDetails[f.id]);
  // Missing provenance is a profile validation error as well as a readiness gap.
  const proof=createPositionVerification(f.d,f.j,f.id,f.p,f.e),p={...f.p,status:'site-checked',fieldEvidence:f.e,positionVerification:proof},j={...f.j,placements:{[f.id]:p}};
  const a=confirmationAssessment(f.d,j,f.id);assert.equal(a.verificationCurrent,true);assert.equal(a.canConfirmInstallation,false);assert.ok(a.readiness.missing.length>0);
  assert.throws(()=>place(j,f.d,f.id,{...p,status:'installation-confirmed',siteCheckSnapshot:f.e,installationEvidence:'Synthetic'}));
 }
});


test('near-baseline radial tolerance cannot conceal amplified positional displacement',()=>{
 const f=fixture(),p={...f.p,anchor:[.4,.49]},e=structuredClone(f.e),target=Math.hypot(3000,100);
 e.readings=[{...e.readings[0],value:(target+5)/1000},{...e.readings[1],value:target+5}];
 const a=confirmationAssessment(f.d,f.j,f.id,p,e);assert.ok(a.comparisons.every(r=>r.withinTolerance));assert.ok(a.positionComparison.displacementMm>100);assert.equal(a.canConfirmSite,false);
 const actual=Math.hypot(3000,4005);e.readings=[{...e.readings[0],value:actual/1000},{...e.readings[1],value:actual}];const boundary=createPositionVerification(f.d,f.j,f.id,f.p,e);assert.ok(Math.abs(boundary.positionComparison.displacementMm-5)<1e-8);
});


test('rotated exact baseline midpoint uses numerical roundoff only for on-baseline side',()=>{
 const f=fixture(),old=f.j.surveyBaselines.floor,b=makeBaseline(f.d.views[0],{...old,a:[.13,.27],b:[.71,.83],distance:6000,unit:'mm'});
 f.j.surveyBaselines.floor=b;f.j.calibrations.floor=calibration(b.a,b.b,6000,f.d.views[0],'Synthetic surveyor','Synthetic datum control');
 const p={...f.p,anchor:[.42,.55]},e={...f.e,observedSide:'on-baseline',readings:f.e.readings.map(r=>({...r,value:3000,unit:'mm'}))};
 const proof=createPositionVerification(f.d,f.j,f.id,p,e);assert.equal(proof.expectedSide,'on-baseline');assert.ok(proof.positionComparison.displacementMm<1e-8);
});
