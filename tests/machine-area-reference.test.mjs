import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyJournal,place,validateJournal} from '../client/machine-model.mjs';
import {makeBaseline} from '../client/machine-survey.mjs';
import {calibration} from '../client/machine-geometry.mjs';
import {createAreaReference,areaReferenceAssessment,activateAreaReference,toleranceFromAreaReference} from '../client/machine-area-reference.mjs';
import {confirmationAssessment,createPositionVerification} from '../client/machine-position-verification.mjs';
import {buildUnitTasks} from '../client/machine-field-tasks.mjs';
function setup(){
 const v={id:'f',kind:'floor-plan',width:1000,height:1000,sourceImageSHA256:'b'.repeat(64)},d={id:'synthetic-area',sourceSHA256:'a'.repeat(64),assets:[{id:'r'}],views:[v],zones:[{id:'z',viewId:'f',polygon:[[0,0],[1,0],[1,1],[0,1]]}]};
 const b=makeBaseline(v,{a:[.1,.5],b:[.7,.5],distance:6000,unit:'mm',nameA:'A column',nameB:'B column',by:'Synthetic surveyor',instrument:'Synthetic laser',instrumentReference:'rear',horizontalConfirmed:true,source:'Synthetic datum'});
 const id='unit-a',p={viewId:'f',zoneId:'z',anchor:[.4,.1],status:'proposed',note:'Synthetic',by:'Surveyor'},j={...emptyJournal(d),instances:{[id]:{id,assetId:'r',label:'Synthetic unit',serial:'S-1',createdAt:'2026-11-11'}},placements:{[id]:p},surveyBaselines:{f:b},calibrations:{f:calibration(b.a,b.b,6000,v,'Surveyor','Synthetic')},machineDetails:{[id]:{reference:{datum:'center',pointType:'machine-center'}}}};
 const input={id:'area-test',viewId:'f',zoneId:'z',label:'Synthetic area',confirmedBy:'Area lead',confirmedAt:'2026-11-11',evidence:'Synthetic approval',tolerance:{value:5,unit:'mm',basis:'Synthetic both radial and positional criterion',issuer:'Synthetic engineer'}},profile=createAreaReference(d,j,input);j.areaReferences={[profile.id]:profile};
 const e={reference:'A/B',measurement:'Actual horizontal measurements',evidence:'Synthetic photo',participants:'Inspector',date:'2026-11-11',basis:'Synthetic drawing',actualObserved:true,observedSide:'left',readings:[{referenceKey:'A',reference:'A column',label:'AP',value:5000,unit:'mm',method:'laser'},{referenceKey:'B',reference:'B column',label:'BP',value:5000,unit:'mm',method:'laser'}],...toleranceFromAreaReference(d,j,profile,id,{confirmed:true})};
 return {v,d,j,id,p,e,profile,input};
}
test('area profile is explicit source/scope-bound reuse with no mutation or default criterion',()=>{
 const f=setup(),before=JSON.stringify(f.j);assert.equal(areaReferenceAssessment(f.d,f.j,f.profile,{viewId:'f',zoneId:'z'}).current,true);
 assert.throws(()=>toleranceFromAreaReference(f.d,f.j,f.profile,f.id,{}),/ยืนยัน/);assert.equal(JSON.stringify(f.j),before);
 for(const input of [{...f.input,tolerance:undefined},{...f.input,zoneId:'unknown'},{...f.input,confirmedBy:''}])assert.throws(()=>createAreaReference(f.d,f.j,input));
 assert.equal(areaReferenceAssessment(f.d,f.j,f.profile,{viewId:'f',zoneId:'elsewhere'}).compatible,false);
 assert.throws(()=>activateAreaReference(f.d,f.j,f.profile,{confirmed:false,by:'Lead',date:'2026-11-11'}));
 assert.doesNotThrow(()=>validateJournal(JSON.parse(JSON.stringify(f.j)),f.d));
});
test('creating a new area profile does not require the secure-context randomUUID API',()=>{
 const f=setup(),descriptor=Object.getOwnPropertyDescriptor(globalThis.crypto,'randomUUID');
 Object.defineProperty(globalThis.crypto,'randomUUID',{value:undefined,configurable:true});
 try{const profile=createAreaReference(f.d,f.j,{...f.input,id:undefined});assert.match(profile.id,/^area-[a-f0-9-]+$/);assert.equal(profile.revision,1);}finally{if(descriptor)Object.defineProperty(globalThis.crypto,'randomUUID',descriptor);else delete globalThis.crypto.randomUUID;}
});
test('changed profile revision invalidates an existing confirmation and preserves its historical data',()=>{
 const f=setup(),checked={...f.p,status:'site-checked',fieldEvidence:f.e,positionVerification:createPositionVerification(f.d,f.j,f.id,f.p,f.e)},j=place(f.j,f.d,f.id,checked);
 assert.equal(confirmationAssessment(f.d,j,f.id).verificationCurrent,true);
 const revised=createAreaReference(f.d,j,{...f.input,tolerance:{...f.input.tolerance,value:2}}),next={...j,areaReferences:{[revised.id]:revised}};
 assert.equal(confirmationAssessment(f.d,next,f.id).effectiveStatus,'needs-recheck');assert.deepEqual(next.placements,j.placements);assert.doesNotThrow(()=>validateJournal(next,f.d));
 assert.throws(()=>place(next,f.d,f.id,{...checked,status:'installation-confirmed',siteCheckSnapshot:f.e,installationEvidence:'Synthetic'}));
});
test('activation requires current saved profile and exposes affected checked units',()=>{
 const f=setup(),checked={...f.p,status:'site-checked',fieldEvidence:f.e,positionVerification:createPositionVerification(f.d,f.j,f.id,f.p,f.e)},j=place(f.j,f.d,f.id,checked);
 const changed={...j,surveyBaselines:{f:{...j.surveyBaselines.f,nameA:'New column A'}}};
 assert.equal(areaReferenceAssessment(f.d,changed,f.profile,{viewId:'f',zoneId:'z'}).current,false);
 assert.throws(()=>toleranceFromAreaReference(f.d,changed,f.profile,f.id,{confirmed:true}));
 const restored=activateAreaReference(f.d,changed,f.profile,{confirmed:true,by:'Lead',date:'2026-11-11'});assert.deepEqual(restored.surveyBaselines.f,f.profile.baseline);assert.equal(restored.areaReferenceActivations.length,1);
 assert.throws(()=>activateAreaReference(f.d,j,{...f.profile,label:'Not saved'},{confirmed:true,by:'Lead',date:'2026-11-11'}));
});
test('preview allows coherent out-of-tolerance displacement but rejects misleading observations',()=>{
 const f=setup();assert.equal(confirmationAssessment(f.d,f.j,f.id,f.p,f.e).canPreviewPosition,true);
 const e={...f.e,readings:f.e.readings.map(r=>({...r,value:5010}))};const a=confirmationAssessment(f.d,f.j,f.id,f.p,e);assert.equal(a.canConfirmSite,false);assert.equal(a.canPreviewPosition,true);
 assert.equal(confirmationAssessment(f.d,f.j,f.id,f.p,{...e,observedSide:'right'}).canPreviewPosition,false);
 assert.equal(confirmationAssessment(f.d,f.j,f.id,f.p,{...e,readings:e.readings.map(r=>({...r,value:1}))}).canPreviewPosition,false);
});
test('pending queue excludes a current installation but brings stale installation back for recheck',()=>{
 const f=setup();f.j.machineDetails[f.id].footprint={origin:'center',lengthMm:1000,widthMm:500,heightMm:1200,rotationDeg:0,source:'Synthetic dimensions',by:'Surveyor'};
 f.j.machineDetails[f.id].installChecks=Object.fromEntries(['door','path','headroom','load'].map(key=>[key,{status:'reviewed',evidence:'Synthetic '+key}]));
 const p={...f.p,status:'site-checked',fieldEvidence:f.e,positionVerification:createPositionVerification(f.d,f.j,f.id,f.p,f.e)},checked=place(f.j,f.d,f.id,p);
 const installed=place(checked,f.d,f.id,{...p,status:'installation-confirmed',siteCheckSnapshot:f.e,installationEvidence:'Synthetic only'});
 assert.equal(buildUnitTasks(f.d,installed,{stage:'pending'}).length,0);assert.equal(buildUnitTasks(f.d,installed,{stage:'complete'}).length,1);
 const stale={...installed,surveyBaselines:{f:{...installed.surveyBaselines.f,nameA:'Changed A'}}};assert.equal(buildUnitTasks(f.d,stale,{stage:'pending'})[0].stage,'recheck');
});
