export function previewRevisionMigration(old,d){
 const contracts=[d.previousRevision,...(Array.isArray(d.previousRevisions)?d.previousRevisions:[])].filter(Boolean);
 const matches=contracts.filter(previous=>previous.identity===old?.identity);
 if(matches.length!==1)throw Error('ไม่พบข้อมูลเทียบรุ่นที่ตรงและไม่ซ้ำกับไฟล์สำรอง');
 const prev=matches[0];
 if(!prev||prev.coordinateFrameVerified!==true||old?.identity!==prev.identity||old.schemaVersion!==1)throw Error('ยังไม่มีหลักฐานกรอบพิกัดรุ่นเก่าที่ตรวจแล้ว จึงไม่ย้ายจุดอัตโนมัติ');
 const candidates=[],skipped=[];
 for(const [id,p] of Object.entries(old.placements||{})){
  const a=prev.views?.find(v=>v.id===p.viewId),b=d.views.find(v=>v.id===p.viewId),known=d.assets.some(a=>a.id===id)||old.instances?.[id];
  if(!known||!a||!b||(Array.isArray(prev.verifiedViewIds)&&!prev.verifiedViewIds.includes(p.viewId))||b.kind==='schematic-reference'||!Array.isArray(p.anchor)||p.anchor.length!==2||!p.anchor.every(Number.isFinite)||![a,b].every(v=>Array.isArray(v.worldBounds)&&v.worldBounds.length===4&&v.worldBounds.every(Number.isFinite)&&v.worldBounds[2]>v.worldBounds[0]&&v.worldBounds[3]>v.worldBounds[1]&&v.height>0&&v.drawableHeight>0&&v.drawableHeight<=v.height)||p.anchor[0]<0||p.anchor[0]>1||p.anchor[1]<0||p.anchor[1]>a.drawableHeight/a.height){skipped.push(id);continue;}
  const [ax,ay,ax2,ay2]=a.worldBounds,[bx,by,bx2,by2]=b.worldBounds;
  const world=[ax+p.anchor[0]*(ax2-ax),ay2-p.anchor[1]*a.height/a.drawableHeight*(ay2-ay)];
  const anchor=[(world[0]-bx)/(bx2-bx),(by2-world[1])/(by2-by)*b.drawableHeight/b.height];
  if(anchor[0]<0||anchor[0]>1||anchor[1]<0||anchor[1]>b.drawableHeight/b.height){skipped.push(id);continue;}
  candidates.push({id,placement:{viewId:b.id,anchor,status:'proposed',note:'NEEDS_RECHECK · ย้ายจากรุ่นก่อน ต้องตรวจจุด/มิติจริงใหม่',by:'',updatedAt:new Date().toISOString(),migration:{status:'NEEDS_RECHECK',sourceIdentity:old.identity,originalPlacement:p,world}}});
 }
 return {candidates,skipped};
}
export function applyRevisionMigration(old,d,current){
 if(Object.keys(current.placements||{}).length||Object.keys(current.instances||{}).length||(current.photos||[]).length||Object.keys(current.machineDetails||{}).length||Object.keys(current.calibrations||{}).length||Object.keys(current.surveyBaselines||{}).length||Object.keys(current.relationships||{}).length||current.history?.length||current.migrationProvenance)throw Error('รุ่นปัจจุบันมีงานอยู่แล้ว ไม่แทนที่ข้อมูลเดิม กรุณาเก็บสำรองทั้งสองรุ่น');
 const preview=previewRevisionMigration(old,d);
 return {...current,instances:old.instances||{},machineDetails:Object.fromEntries(Object.entries(old.machineDetails||{}).map(([id,detail])=>[id,{...detail,installChecks:Object.fromEntries(Object.entries(detail.installChecks||{}).map(([key,check])=>[key,{status:'pending',evidence:'NEEDS_RECHECK · หลักฐานรุ่นก่อน: '+(check.evidence||'')}]))}])),photos:old.photos||[],placements:Object.fromEntries(preview.candidates.map(c=>[c.id,c.placement])),history:[],calibrations:{},surveyBaselines:{},relationships:{},migrationProvenance:{sourceIdentity:old.identity,at:new Date().toISOString(),skipped:preview.skipped,status:'NEEDS_RECHECK'}};
}
