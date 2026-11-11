import {expandInstances} from './machine-field-records.mjs';
import {confirmationAssessment} from './machine-position-verification.mjs';

export function buildUnitTasks(data,journal,{viewId='',zoneId='',stage='',query='',includeUnassigned=true}={}) {
 const d=expandInstances(data,journal), q=String(query).trim().toLowerCase();
 return d.assets.filter(a=>a.instanceOf).map(asset=>{
  const placement=journal.placements?.[asset.id],reference=d.assets.find(a=>a.id===asset.instanceOf)?.placement;
  const location=placement||reference,assessment=confirmationAssessment(d,journal,asset.id,placement),status=assessment.effectiveStatus;
  const stage=!placement?'unplaced':status==='needs-recheck'?'recheck':status==='installation-confirmed'?'complete':status==='site-checked'?'install':'measure';
  return {id:asset.id,asset,placement,assessment,status,stage,viewId:location?.viewId||'',zoneId:location?.zoneId||'',locationSource:placement?'saved':reference?'inventory-reference':'unassigned',nextAction:({unplaced:'place',recheck:'measure',measure:'measure',install:'install',complete:'review'})[stage]};
 }).filter(row=>(!viewId||row.viewId===viewId||includeUnassigned&&!row.viewId)&&(!zoneId||row.zoneId===zoneId||includeUnassigned&&!row.viewId)&&(!stage||stage==='all'||stage==='pending'&&row.stage!=='complete'||stage===row.stage)&&(!q||[row.asset.nameTh,row.asset.nameZh,row.asset.serial,row.asset.instanceLabel].join(' ').toLowerCase().includes(q)));
}

export function nextUnitTask(rows,currentId){
 const start=rows.findIndex(r=>r.id===currentId);
 for(let step=1;step<=rows.length;step++){const row=rows[(start+step+rows.length)%rows.length];if(row&&row.id!==currentId&&row.stage!=='complete')return row;}
 return null;
}
