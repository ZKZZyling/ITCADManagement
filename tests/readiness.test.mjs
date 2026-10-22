import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMAT,STATUS,CATEGORIES,PHASES,createPlan,validatePlan,planScope,summary,calculateCapacity,MAX_IMPORT_BYTES} from '../lib/readiness.mjs';
const drawing={sourceSHA256:'a'.repeat(64),datasetId:'test-dataset'};
const room={id:'room1',name:'IT',rackU:null,powerCircuit:'',cooling:'',ups:'',notes:'',evidence:[]};
const eq=(id,extra={})=>({id,name:id,role:'switch',roomId:'room1',rackId:'',maxWatts:null,U:null,poeWatts:null,quantity:1,status:'unconfirmed',evidence:[],...extra});
const evidence={...drawing,sourceHandle:'A1',layer:'DATA',viewId:'v1',sourceText:'Original source',basis:'drawing'};
const link={id:'l1',from:'switch1',to:'room1',medium:'fiber',system:'data',status:'proposed',sourcePort:'1',targetPort:'2',lengthM:null,notes:'',evidence:[evidence]};
test('generic catalogue round-trips with five phases and full trilingual prompts',()=>{
 const plan=createPlan(drawing);assert.equal(plan.format,FORMAT);assert.ok(plan.requirements.length>=30&&plan.requirements.length<=40);assert.equal(Object.keys(PHASES).length,5);assert.equal(new Set(plan.requirements.map(x=>x.phase)).size,5);
 for(const r of plan.requirements){assert.ok(CATEGORIES[r.category]);assert.ok(PHASES[r.phase]);for(const locale of ['th','zh','en']){assert.ok(r.title[locale]);assert.ok(r.criterion[locale]);}assert.equal(r.status,'unconfirmed');}
 assert.deepEqual(validatePlan(JSON.stringify(plan),drawing),plan);assert.equal(planScope(drawing),'a'.repeat(64)+':test-dataset');assert.equal(summary(plan).counts.unconfirmed,plan.requirements.length);assert.equal('percentage' in summary(plan),false);
});
test('scope requires primary source and dataset; multiple explicitly referenced sources are retained',()=>{
 const plan=createPlan(drawing);plan.requirements[0].evidence=[{...evidence,sourceSHA256:'b'.repeat(64),datasetId:'other',basis:'test'}];assert.equal(validatePlan(plan,drawing).requirements[0].evidence[0].basis,'test');
 assert.throws(()=>validatePlan(plan,{...drawing,datasetId:'other'}),/identity/);assert.throws(()=>validatePlan(plan,{...drawing,sourceSHA256:'b'.repeat(64)}),/identity/);assert.throws(()=>createPlan({...drawing,datasetId:'../other'}),/identity/);
});
test('numeric zero remains distinct from unknown and capacity includes quantity and missing counts',()=>{
 const plan=createPlan(drawing);plan.rooms=[{...room,rackU:0}];plan.equipment=[eq('switch1',{maxWatts:0,U:1,quantity:2}),eq('switch2',{maxWatts:100,U:null,poeWatts:0,quantity:3})];plan.links=[{...link,lengthM:0}];const p=validatePlan(plan);assert.equal(p.rooms[0].rackU,0);assert.equal(p.links[0].lengthM,0);assert.equal(p.equipment[0].poeWatts,null);
 assert.deepEqual(calculateCapacity(p.equipment),{maxWatts:300,U:2,poeWatts:0,missing:{maxWatts:0,U:3,poeWatts:2},equipmentCount:2,quantity:5});assert.equal('runtime' in calculateCapacity(p.equipment),false);
 for(const n of [-1,Infinity,NaN,'0',undefined])assert.throws(()=>calculateCapacity([eq('bad',{maxWatts:n})]));
});
test('duplicate IDs, dangling room/rack/link references and self links are rejected',()=>{
 const p=createPlan(drawing);p.rooms=[room];p.equipment=[eq('switch1')];p.links=[link];assert.doesNotThrow(()=>validatePlan(p));
 for(const edit of [p=>p.requirements.push(p.requirements[0]),p=>p.rooms.push(room),p=>p.equipment.push(eq('switch1')),p=>p.equipment[0].roomId='missing',p=>p.equipment[0].rackId='missing',p=>p.links[0].to='missing',p=>p.links[0].to='switch1',p=>p.equipment[0].id='room1',p=>p.links.push(link)]){const bad=structuredClone(p);edit(bad);assert.throws(()=>validatePlan(bad));}
});
test('format, bounded input, invalid nested values and approval statuses fail closed',()=>{
 assert.throws(()=>validatePlan('{'));assert.throws(()=>validatePlan(' '.repeat(MAX_IMPORT_BYTES+1)),/2 MB/);
 for(const edit of [p=>p.format='v2',p=>p.schemaVersion=2,p=>p.updatedAt='not-a-date',p=>p.version=-1,p=>p.context.hosting='local-auto',p=>p.requirements[0].status='accepted',p=>p.requirements[0].evidence=[{...evidence,basis:'certified'}],p=>p.rooms=new Array(101).fill(room),p=>p.requirements[0].title.zh=null,p=>p.requirements[0].notes='x'.repeat(12001),p=>p.approved=true,p=>p.requirements[0].engineeringApproval=true]){const bad=createPlan(drawing);edit(bad);assert.throws(()=>validatePlan(bad));}
 assert.ok(!STATUS.includes('accepted'));assert.ok(!STATUS.includes('approved'));
});
test('unsupported fields reject and validated exports do not share input references',()=>{
 const p=createPlan(drawing);p.requirements[0].evidence=[evidence];const out=validatePlan(p);out.requirements[0].title.en='changed';assert.notEqual(p.requirements[0].title.en,'changed');
 for(const edit of [p=>p.password='not-allowed',p=>p.context.privateExtra='drop',p=>p.requirements[0].privateExtra='drop',p=>p.requirements[0].evidence=[{...evidence,password:'not-allowed'}]]){const bad=createPlan(drawing);edit(bad);assert.throws(()=>validatePlan(bad),/Unsupported/);}
});
test('rooms, topology, services and decisions round-trip without creating verification',()=>{
 const p=createPlan(drawing);p.rooms=[{...room,evidence:[evidence]}];p.equipment=[eq('rack',{role:'rack',U:0}),eq('switch1',{rackId:'rack',status:'drawing-observed',evidence:[evidence]})];p.links=[link];p.services=[{id:'erp',name:'ERP',endpoint:'example.invalid',protocol:'HTTPS',port:'443',owner:'',status:'unconfirmed',notes:'',evidence:[]}];p.decisions=[{id:'d1',title:'Choose route',owner:'',status:'blocked',notes:''}];p.updatedAt='2026-10-22T00:00:00.000Z';
 assert.deepEqual(validatePlan(JSON.stringify(p)),p);assert.equal(summary(p).counts['evidence-recorded'],0);
 for(const edit of [p=>p.links[0].status='connected',p=>p.equipment[0].status='accepted',p=>p.services[0].password='not-allowed',p=>p.decisions[0].status='approved',p=>p.updatedAt='2026-02-31T00:00:00.000Z']){const bad=structuredClone(p);edit(bad);assert.throws(()=>validatePlan(bad));}
});
test('recorded requirement and service states need meaningful evidence',()=>{
 for(const collection of ['requirements','services']){
  const p=createPlan(drawing);if(collection==='services')p.services=[{id:'s1',name:'ERP',endpoint:'',protocol:'',port:'',owner:'',status:'unconfirmed',notes:'',evidence:[]}];
  const row=p[collection][0];row.status='evidence-recorded';assert.throws(()=>validatePlan(p),/meaningful evidence/);
  row.evidence=[{...evidence,sourceText:'  ',reference:'\t'}];assert.throws(()=>validatePlan(p),/meaningful evidence/);
  row.evidence=[{...evidence,basis:'user',sourceText:'',reference:'Record 123'}];assert.doesNotThrow(()=>validatePlan(p));
 }
});
test('observed topology needs traceable drawing evidence and test states need user test evidence',()=>{
 for(const collection of ['equipment','links']){
  const p=createPlan(drawing);p.rooms=[room];p.equipment=[eq('switch1')];p.links=[link];const row=p[collection][0];
  row.status='drawing-observed';row.evidence=[];assert.throws(()=>validatePlan(p),/drawing evidence/);
  row.evidence=[{...evidence,basis:'proposed'}];assert.throws(()=>validatePlan(p),/drawing evidence/);
  row.evidence=[{...evidence,sourceHandle:' '}];assert.throws(()=>validatePlan(p),/drawing evidence/);
  row.evidence=[{...evidence,sourceText:' ',reference:' '}];assert.throws(()=>validatePlan(p),/drawing evidence/);
  row.evidence=[{...evidence,sourceSHA256:'invalid'}];assert.throws(()=>validatePlan(p),/identity/);
  row.evidence=[evidence];assert.doesNotThrow(()=>validatePlan(p));
  row.status='test-recorded';assert.throws(()=>validatePlan(p),/test evidence/);
  row.evidence=[{...evidence,basis:'test',sourceText:' ',reference:' '}];assert.throws(()=>validatePlan(p),/test evidence/);
  row.evidence=[{...evidence,basis:'test',sourceText:'User recorded result'}];assert.doesNotThrow(()=>validatePlan(p));
 }
});
