export function viewLocation(view){
 if(view.kind==='schematic-reference')return {building:'systems',buildingLabel:'ระบบประกอบ / 系统',floor:'schematic',floorLabel:'ผังระบบ (ไม่ใช่จุดติดตั้ง)'};
 const th=view.titleTh||'',zh=view.titleZh||'';
 const building=String(view.building??th.match(/อาคาร\s*([\dA-Za-z]+)/)?.[1]??zh.match(/(\d+)号厂房/)?.[1]??'unknown');
 const number=view.floor??th.match(/ชั้น\s*([\dA-Za-z]+)/)?.[1]??zh.match(/(\d+)层/)?.[1];
 const platform=th.match(/ระดับ\s*([\d.]+)\s*เมตร/)?.[1]??zh.match(/([\d.]+)米平台/)?.[1];
 return {building,buildingLabel:building==='unknown'?'อาคารไม่ระบุ':`อาคาร ${building} / ${building}号厂房`,floor:number!=null?String(number):platform?`platform:${platform}`:'other',floorLabel:number!=null?`ชั้น ${number} / ${number}层`:platform?`แพลตฟอร์ม ${platform} m`:'พื้นที่/ระดับอื่น'};
}
export function filterMachines(assets,placement,{viewId,line='',query='',scope='view',unresolved=false,zoneId=''}={}){
 const normalized=s=>String(s||'').toLowerCase().replace(/\s+/g,'');
 return assets.filter(a=>{const p=placement(a);return (!line||a.line===line)&&(!unresolved||!p)&&(unresolved||scope==='all'||p?.viewId===viewId)&&(!zoneId||p?.zoneId===zoneId)&&(!query||normalized([a.id,a.nameTh,a.nameZh,a.model,a.line,a.serial,a.instanceLabel].join(' ')).includes(normalized(query)))});
}
export function lineSummary(assets,placement,viewId){return [...new Set(assets.map(a=>a.line).filter(Boolean))].map(line=>{const rows=assets.filter(a=>a.line===line);return {line,total:rows.length,here:rows.filter(a=>placement(a)?.viewId===viewId).length,unplaced:rows.filter(a=>!placement(a)).length}})}
export function pointInZone(point,polygon){if(!Array.isArray(polygon)||polygon.length<3)return false;let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[j],b=polygon[i],cross=(point[0]-a[0])*(b[1]-a[1])-(point[1]-a[1])*(b[0]-a[0]);if(Math.abs(cross)<1e-10&&point[0]>=Math.min(a[0],b[0])-1e-10&&point[0]<=Math.max(a[0],b[0])+1e-10&&point[1]>=Math.min(a[1],b[1])-1e-10&&point[1]<=Math.max(a[1],b[1])+1e-10)return true;if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
export function zoneForPoint(zones,viewId,point,preferred=''){const matches=(zones||[]).filter(z=>z.viewId===viewId&&pointInZone(point,z.polygon));return matches.find(z=>z.id===preferred)?.id||(matches.length===1?matches[0].id:undefined)}
