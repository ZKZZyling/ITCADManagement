import {identity,emptyJournal,validateJournal} from './machine-model.mjs';
import {readMachineJournalState,writeMachineJournal,readMachineSnapshotRecords,readRawMachineJournal} from './machine-db.mjs';
export const MAX_MACHINE_JOURNAL_BYTES=64*1024*1024;
const sizeError=()=>Object.assign(new Error('ข้อมูลเกิน 64 MiB ไม่สามารถบันทึก ส่งออก หรือนำเข้าในรุ่นนี้ได้'),{code:'JOURNAL_SIZE_LIMIT'});
const bytes=text=>new TextEncoder().encode(text).byteLength;
export function serializeMachineJournal(journal,d){validateJournal(journal,d);const text=JSON.stringify(journal);if(bytes(text)>MAX_MACHINE_JOURNAL_BYTES)throw sizeError();return text;}
export function parseMachineJournal(text,d){if(typeof text!=='string')throw Error('ไฟล์สำรองต้องเป็นข้อความ JSON');if(bytes(text)>MAX_MACHINE_JOURNAL_BYTES)throw sizeError();const journal=validateJournal(JSON.parse(text),d);serializeMachineJournal(journal,d);return journal;}
export async function loadMachineJournal(d,{legacyText}={}){
 const state=await readMachineJournalState(identity(d));
 if(state.journal!==undefined){validateJournal(state.journal,d);return {...state,recoveredLegacy:false};}
 if(legacyText!==undefined&&legacyText!==null){const journal=parseMachineJournal(legacyText,d);return {...await saveMachineJournal(d,journal,{expectedRevision:0,reason:'migration'}),recoveredLegacy:true};}
 return {...state,journal:emptyJournal(d),recoveredLegacy:false};
}
export async function saveMachineJournal(d,next,options){const journal=parseMachineJournal(serializeMachineJournal(next,d),d);return writeMachineJournal(identity(d),journal,options);}
export async function listMachineSnapshots(d){const records=await readMachineSnapshotRecords(identity(d));return records.map(({revision,savedAt,replacedAt,reason})=>({revision,savedAt,replacedAt,reason})).reverse();}
export async function readMachineSnapshot(d,revision){const records=await readMachineSnapshotRecords(identity(d)),record=records.find(r=>r.revision===revision);if(!record)throw Error('ไม่พบรุ่นกู้คืน อาจถูกแทนที่ตามขีดจำกัดสองรุ่นล่าสุด');return validateJournal(record.journal,d);}

// Explicit recovery is separate from normal load: corrupt current data never becomes an empty editable journal.
export async function readMachineRecoveryState(d){const {revision,lastSavedAt}=await readMachineJournalState(identity(d));return {revision,lastSavedAt};}
export async function readRawMachineRecoveryJournal(d){return readRawMachineJournal(identity(d));}
// Caller retains its captured revision and performs the live source gate before restoring confirmations.
export async function restoreMachineSnapshot(d,snapshotRevision,{expectedRevision}={}){const journal=await readMachineSnapshot(d,snapshotRevision);return saveMachineJournal(d,journal,{expectedRevision,reason:'restore'});}
