import test from 'node:test';import assert from 'node:assert/strict';
test('trial storage uses a separate database and refuses sync before any network access',async()=>{
 const oldLocation=globalThis.location,oldDB=globalThis.indexedDB,oldFetch=globalThis.fetch;let name,calls=0;
 try{globalThis.location={pathname:'/field/sandbox.html'};globalThis.fetch=()=>{calls++;throw Error('Unexpected network')};globalThis.indexedDB={open:(n)=>{name=n;const r={result:{}};queueMicrotask(()=>r.onsuccess());return r}};
 const store=await import('../client/storage.mjs?trial-test');assert.equal(store.sandboxMode,true);await store.openDB();assert.equal(name,'itcad-sandbox-v1');await assert.rejects(store.sync(),/cannot synchronize/);assert.equal(calls,0);
 }finally{globalThis.location=oldLocation;globalThis.indexedDB=oldDB;globalThis.fetch=oldFetch}
});
