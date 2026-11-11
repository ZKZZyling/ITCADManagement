import test from 'node:test';
import assert from 'node:assert/strict';
import {buildUnitTasks,nextUnitTask} from '../client/machine-field-tasks.mjs';
test('field backlog includes actual units only and separates inventory hints from saved locations',()=>{
 const d={id:'synthetic',sourceSHA256:'a',assets:[{id:'r1',placement:{viewId:'f1',zoneId:'z1'}},{id:'r2',placement:{viewId:'f2'}},{id:'r3'}],views:[{id:'f1',kind:'floor-plan'},{id:'f2',kind:'floor-plan'}]};
 const j={placements:{},instances:Object.fromEntries(['r1','r2','r3'].map((id,i)=>['unit-'+i,{id:'unit-'+i,assetId:id,label:'Machine '+i,serial:'S'+i}]))};
 const rows=buildUnitTasks(d,j,{viewId:'f1',zoneId:'z1'});assert.deepEqual(rows.map(r=>r.id),['unit-0','unit-2']);assert.equal(rows[0].locationSource,'inventory-reference');assert.equal(rows[0].placement,undefined);assert.equal(rows[0].stage,'unplaced');
 assert.deepEqual(buildUnitTasks(d,j,{viewId:'f1',includeUnassigned:false}).map(r=>r.id),['unit-0']);
 j.placements['unit-0']={viewId:'f2',anchor:[.2,.2],status:'proposed'};
 assert.equal(buildUnitTasks(d,j,{viewId:'f1',includeUnassigned:false}).length,0);assert.equal(buildUnitTasks(d,j,{query:'S0'})[0].locationSource,'saved');
});
test('next unfinished skips complete/current units and wraps without creating assignments',()=>{
 const rows=[{id:'a',stage:'measure'},{id:'b',stage:'complete'},{id:'c',stage:'recheck'}];
 assert.equal(nextUnitTask(rows,'a').id,'c');assert.equal(nextUnitTask(rows,'c').id,'a');assert.equal(nextUnitTask(rows,'unknown').id,'a');assert.equal(nextUnitTask([rows[0]],'a'),null);assert.equal(nextUnitTask([],''),null);
});
