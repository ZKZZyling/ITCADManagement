import test from 'node:test';import assert from 'node:assert/strict';import {adviceFor} from '../client/assistant-state.mjs';
test('assistant prioritizes real errors, work in flight and conflicts over ordinary selection',()=>{
 assert.equal(adviceFor('field',{error:'401',hasSelection:true,pendingCount:3}).id,'error');
 assert.equal(adviceFor('analysis',{busy:true,resultReady:true}).target,'jobs');
 assert.equal(adviceFor('offline',{conflictCount:1,hasSelection:true,online:false,pendingCount:1}).id,'conflict');
 assert.equal(adviceFor('offline',{online:false,pendingCount:2}).id,'offline-pending');
});
test('assistant follows focused controls and never certifies engineering or synchronizes trials',()=>{
 assert.equal(adviceFor('manager',{hasData:false},'').id,'import');
 assert.equal(adviceFor('field',{hasData:true,hasSelection:true},'search').id,'search');
 assert.equal(adviceFor('field',{hasData:true,hasSelection:false},'checks').id,'sheet');
 assert.equal(adviceFor('offline',{hasData:false}).id,'prepare');
 assert.equal(adviceFor('field',{readyBlocked:true,hasData:true}).id,'blocked');
 const state=Object.freeze({hasData:true,hasSelection:true,privateNotes:'sensitive'});const advice=adviceFor('sandbox',state);assert.equal(advice.id,'inspect');assert.ok(!JSON.stringify(advice).includes('sensitive'));assert.match(advice.body,/ผลทดลองไม่รวมงานจริง/);
});
