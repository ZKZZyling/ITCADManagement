import test from 'node:test';import assert from 'node:assert/strict';
import {pointInPlan,emptyJournal,validateJournal,place,undo} from '../client/machine-model.mjs';
const d={id:'test',sourceSHA256:'a'.repeat(64),inventorySHA256:'b'.repeat(64),assets:[{id:'1'},{id:'2'}],views:[{id:'floor1'},{id:'floor2'}]};
const p={viewId:'floor1',anchor:[.3,.7],status:'proposed',note:'column B3',by:''};
test('coordinate mapping preserves center, pan/zoom and rejects letterbox',()=>{
 const r={left:10,top:20,width:800,height:600};
 assert.deepEqual(pointInPlan(410,320,r,{x:0,y:0,w:1,h:1},.5),[.5,.5]);
 assert.deepEqual(pointInPlan(410,320,r,{x:.2,y:.4,w:.4,h:.4},.5),[.4,.6000000000000001]);
 assert.equal(pointInPlan(410,30,r,{x:.2,y:.4,w:.4,h:.4},.5),null);
 assert.equal(pointInPlan(9,320,r,{x:0,y:0,w:1,h:1},.5),null);
});
test('save/JSON reload/undo preserve independent assets and exact prior point',()=>{
 let j=place(emptyJournal(d),d,'1',p);j=place(j,d,'2',{...p,anchor:[.8,.1]});j=place(j,d,'1',{...p,anchor:[.9,.9]});
 j=validateJournal(JSON.parse(JSON.stringify(j)),d);j=undo(j,d);assert.deepEqual(j.placements['1'].anchor,[.3,.7]);assert.deepEqual(j.placements['2'].anchor,[.8,.1]);
 j=undo(j,d);assert.equal(j.placements['2'],undefined);j=undo(j,d);assert.deepEqual(j.placements,{});
});
test('import rejects source, inventory, unknown assets/views and malformed history atomically',()=>{
 const j=place(emptyJournal(d),d,'1',p),before=JSON.stringify(j);
 for(const other of [{...d,sourceSHA256:'c'.repeat(64)},{...d,inventorySHA256:'d'.repeat(64)}])assert.throws(()=>validateJournal(j,other));
 assert.throws(()=>validateJournal(j,{...d,sourceWorkbookSHA256:'e'.repeat(64)}));
 for(const bad of [{...p,viewId:'wrong'},{...p,anchor:[-1,.4]},{...p,status:'field-confirmed',by:''}])assert.throws(()=>place(j,d,'1',bad));
 assert.throws(()=>place(j,d,'unknown',p));assert.throws(()=>validateJournal({...j,history:[{id:'1',at:'now',after:{...p,viewId:'wrong'}}]},d));assert.equal(JSON.stringify(j),before);
 assert.equal(place(j,d,'1',{...p,status:'field-confirmed',by:'Reviewer',note:'Field column B3'}).placements['1'].status,'field-confirmed');
});

test('import rejects schematic and footer placements including history',()=>{
 const data={...d,views:[{id:'floor1',height:1000,drawableHeight:900},{id:'floor2',kind:'schematic-reference'}]};
 const j=emptyJournal(data);assert.throws(()=>place(j,data,'1',{...p,viewId:'floor2'}));assert.throws(()=>place(j,data,'1',{...p,anchor:[.3,.95]}));assert.equal(place(j,data,'1',{...p,anchor:[.3,.85]}).placements['1'].viewId,'floor1');
 assert.throws(()=>validateJournal({...j,history:[{id:'1',at:'now',after:{...p,viewId:'floor2'}}]},data));
});
