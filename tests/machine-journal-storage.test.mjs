import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyJournal} from '../client/machine-model.mjs';
import {serializeMachineJournal,parseMachineJournal,MAX_MACHINE_JOURNAL_BYTES,loadMachineJournal,saveMachineJournal} from '../client/machine-journal-storage.mjs';
const d={id:'storage-synthetic',sourceSHA256:'a'.repeat(64),assets:[{id:'row'}],views:[{id:'floor'}]};
test('export and import share compact UTF8 size limit including a formerly rejected valid photo/history journal',()=>{
 const j=emptyJournal(d),dataUrl='data:image/png;base64,'+'A'.repeat(5590000);
 j.photos=Array.from({length:5},(_,i)=>({id:'photo'+i,assetId:'row',kind:'site',caption:'Synthetic encoded bytes, not a rendered image',dataUrl}));
 const p={viewId:'floor',anchor:[.3,.4],status:'proposed',by:'Synthetic operator',note:'n'.repeat(5000)};
 j.history=Array.from({length:1100},()=>({id:'row',at:'2026-11-11',before:null,after:p}));
 const text=serializeMachineJournal(j,d);assert.ok(new TextEncoder().encode(text).length>32e6);assert.ok(text.length<MAX_MACHINE_JOURNAL_BYTES);
 const imported=parseMachineJournal(text,d);assert.equal(imported.history.length,1100);assert.equal(imported.photos[4].dataUrl,dataUrl);assert.equal(serializeMachineJournal(imported,d),text);
});
test('UTF8 boundary is inclusive and both directions reject the same oversize payload',()=>{
 const j={...emptyJournal(d),extension:''},base=serializeMachineJournal(j,d).length;
 j.extension='x'.repeat(MAX_MACHINE_JOURNAL_BYTES-base);const exact=serializeMachineJournal(j,d);assert.equal(new TextEncoder().encode(exact).length,MAX_MACHINE_JOURNAL_BYTES);assert.equal(parseMachineJournal(exact,d).extension.length,j.extension.length);
 j.extension+='x';assert.throws(()=>serializeMachineJournal(j,d),{code:'JOURNAL_SIZE_LIMIT'});assert.throws(()=>parseMachineJournal(JSON.stringify(j),d),{code:'JOURNAL_SIZE_LIMIT'});
 const thai={...emptyJournal(d),extension:'ก'.repeat(100)};assert.equal(new TextEncoder().encode(serializeMachineJournal(thai,d)).length,JSON.stringify(thai).length+200);
});
test('malformed and wrong-source imports reject rather than replacing a journal with empty data',()=>{
 assert.throws(()=>parseMachineJournal('{',d));assert.throws(()=>parseMachineJournal(JSON.stringify(emptyJournal({...d,sourceSHA256:'other'})),d));
});
test('storage open failure propagates; no editable empty load or successful save is returned',async()=>{
 const prior=globalThis.indexedDB;globalThis.indexedDB={open(){throw new Error('Synthetic database unavailable');}};
 try{await assert.rejects(loadMachineJournal(d),/Synthetic database unavailable/);await assert.rejects(saveMachineJournal(d,emptyJournal(d),{expectedRevision:0}),/Synthetic database unavailable/);}finally{if(prior===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=prior;}
});
