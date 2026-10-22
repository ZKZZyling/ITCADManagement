import crypto from 'node:crypto';
import {validatePlan,planScope} from '../lib/readiness.mjs';

// This store is deliberately separate from production inspection records.
export class ReadinessStore {
 constructor(db){this.db=db;db.exec('CREATE TABLE IF NOT EXISTS readiness_plans(scope TEXT PRIMARY KEY,payload TEXT NOT NULL,version INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS readiness_operations(op_id TEXT PRIMARY KEY,scope TEXT NOT NULL,fingerprint TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS readiness_audit(id TEXT PRIMARY KEY,scope TEXT NOT NULL,payload TEXT NOT NULL,updated TEXT NOT NULL);');}
 get(drawing){const row=this.db.prepare('SELECT payload FROM readiness_plans WHERE scope=?').get(planScope(drawing));return row?JSON.parse(row.payload):null;}
 save(raw,drawing){
  if(!raw||typeof raw.opId!=='string'||!/^[-a-zA-Z0-9]{16,100}$/.test(raw.opId)||raw.trial===true)throw Error('Invalid planning operation');
  const plan=validatePlan(raw.plan,drawing),scope=planScope(drawing),fingerprint=crypto.createHash('sha256').update(JSON.stringify(plan)).digest('hex');
  const prior=this.db.prepare('SELECT * FROM readiness_operations WHERE op_id=?').get(raw.opId);
  if(prior){if(prior.scope!==scope||prior.fingerprint!==fingerprint){const e=Error('Planning operation conflict');e.status=409;throw e;}return JSON.parse(prior.payload);}
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const old=this.db.prepare('SELECT version FROM readiness_plans WHERE scope=?').get(scope);
   if((old?.version||0)!==plan.version){const e=Error('Planning version conflict. Export or keep your local draft before reloading.');e.status=409;throw e;}
   const saved={...plan,version:plan.version+1,updatedAt:new Date().toISOString()},text=JSON.stringify(saved);
   this.db.prepare('INSERT INTO readiness_plans VALUES(?,?,?) ON CONFLICT(scope) DO UPDATE SET payload=excluded.payload,version=excluded.version').run(scope,text,saved.version);
   this.db.prepare('INSERT INTO readiness_operations VALUES(?,?,?,?)').run(raw.opId,scope,fingerprint,text);
   this.db.prepare('INSERT INTO readiness_audit VALUES(?,?,?,?)').run(crypto.randomUUID(),scope,text,saved.updatedAt);
   this.db.exec('COMMIT');return saved;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
}
