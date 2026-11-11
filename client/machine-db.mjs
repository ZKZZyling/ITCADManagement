const DB_NAME='itcad-machine-field-v2';
export const MACHINE_SNAPSHOT_RETENTION=2;
const failure=(code,message,extra={})=>Object.assign(new Error(message),{code,...extra});
const open=()=>new Promise((resolve,reject)=>{
 let blocked=false;const r=indexedDB.open(DB_NAME,2);
 r.onupgradeneeded=()=>{for(const name of ['journals','journalMeta','journalSnapshots'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name);};
 r.onsuccess=()=>{const db=r.result;if(blocked){db.close();return;}db.onversionchange=()=>db.close();resolve(db);};
 r.onerror=()=>reject(r.error);r.onblocked=()=>{blocked=true;reject(failure('JOURNAL_UPGRADE_BLOCKED','ปิดแท็บรุ่นเก่าก่อนเปิดพื้นที่บันทึกใหม่'));};
});
function transaction(db,stores,mode,work){return new Promise((resolve,reject)=>{
 let result,error,tx;try{tx=db.transaction(stores,mode);}catch(e){db.close();reject(e);return;}
 const fail=e=>{error=e;try{tx.abort();}catch{}};
 tx.oncomplete=()=>{db.close();resolve(result);};
 tx.onerror=()=>{error??=tx.error;};
 tx.onabort=()=>{db.close();reject(error||tx.error||failure('JOURNAL_ABORTED','ธุรกรรมบันทึกถูกยกเลิก ข้อมูลเดิมยังคงอยู่'));};
 try{work(tx,v=>{result=v;},fail);}catch(e){fail(e);}
});}
function metadata(raw,journal){
 if(raw===undefined)return {revision:0,lastSavedAt:null};
 if(journal===undefined||!Number.isSafeInteger(raw.revision)||raw.revision<1||typeof raw.lastSavedAt!=='string'||!Number.isFinite(Date.parse(raw.lastSavedAt)))throw failure('JOURNAL_METADATA_INVALID','ข้อมูลรุ่นการบันทึกไม่ถูกต้อง ต้องกู้ข้อมูลก่อนแก้ไข');
 return raw;
}
export async function readMachineJournalState(key){const db=await open();return transaction(db,['journals','journalMeta'],'readonly',(tx,done,fail)=>{
 const jr=tx.objectStore('journals').get(key),mr=tx.objectStore('journalMeta').get(key);let count=0;
 const loaded=()=>{if(++count!==2)return;try{done({journal:jr.result,...metadata(mr.result,jr.result)});}catch(e){fail(e);}};jr.onsuccess=loaded;mr.onsuccess=loaded;
});}
export async function readMachineJournal(key){return (await readMachineJournalState(key)).journal;}
export async function writeMachineJournal(key,value,{expectedRevision,reason='edit'}={}){
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw failure('JOURNAL_REVISION_REQUIRED','ต้องโหลดรุ่นข้อมูลก่อนบันทึก');
 if(!['edit','import','restore','migration'].includes(reason))throw Error('Invalid journal save reason');
 const snapshot=structuredClone(value),db=await open();
 return transaction(db,['journals','journalMeta','journalSnapshots'],'readwrite',(tx,done,fail)=>{
  const journals=tx.objectStore('journals'),meta=tx.objectStore('journalMeta'),snapshots=tx.objectStore('journalSnapshots');
  const jr=journals.get(key),mr=meta.get(key),sr=snapshots.get(key);let count=0;
  const loaded=()=>{if(++count!==3)return;try{
   const prior=metadata(mr.result,jr.result);
   if(prior.revision!==expectedRevision)throw failure('JOURNAL_CONFLICT','แท็บอื่นบันทึกรุ่นใหม่แล้ว เก็บงานที่ยังไม่บันทึกและโหลดรุ่นล่าสุดก่อนทำต่อ',{actualRevision:prior.revision,expectedRevision});
   if(prior.revision>=Number.MAX_SAFE_INTEGER)throw failure('JOURNAL_REVISION_INVALID','เลขรุ่นข้อมูลเกินช่วงที่รองรับ');
   const lastSavedAt=new Date().toISOString(),revision=prior.revision+1;
   if(sr.result!==undefined&&!Array.isArray(sr.result))throw failure('JOURNAL_SNAPSHOT_INVALID','รายการกู้คืนเสียหาย ไม่เขียนทับข้อมูลเดิม');
   const history=sr.result||[];
   if(jr.result!==undefined)history.push({revision:prior.revision,savedAt:prior.lastSavedAt,replacedAt:lastSavedAt,reason,journal:jr.result});
   snapshots.put(history.slice(-MACHINE_SNAPSHOT_RETENTION),key);journals.put(snapshot,key);meta.put({revision,lastSavedAt},key);
   done({journal:snapshot,revision,lastSavedAt});
  }catch(e){fail(e);}};jr.onsuccess=loaded;mr.onsuccess=loaded;sr.onsuccess=loaded;
 });
}
export async function listMachineJournals(){const db=await open();return transaction(db,['journals'],'readonly',(tx,done)=>{tx.objectStore('journals').getAllKeys().onsuccess=e=>done(e.target.result);});}
export async function readMachineSnapshotRecords(key){const db=await open();return transaction(db,['journalSnapshots'],'readonly',(tx,done,fail)=>{tx.objectStore('journalSnapshots').get(key).onsuccess=e=>{const value=e.target.result;if(value!==undefined&&!Array.isArray(value))return fail(failure('JOURNAL_SNAPSHOT_INVALID','รายการกู้คืนเสียหาย'));done(value||[]);};});}

// Recovery download deliberately bypasses journal/metadata validation; never use as editable state.
export async function readRawMachineJournal(key){const db=await open();return transaction(db,['journals'],'readonly',(tx,done)=>{tx.objectStore('journals').get(key).onsuccess=e=>done(e.target.result);});}
