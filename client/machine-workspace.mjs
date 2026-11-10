export function workspaceAreas(zones,viewId,textRows=[]){
 const areas=(zones||[]).filter(z=>z.viewId===viewId).map(z=>({id:'zone:'+z.id,kind:'zone',zoneId:z.id,nameTh:z.nameTh||z.nameZh,nameZh:z.nameZh||'',polygon:z.polygon}));
 for(const row of textRows){if(row.effectiveStatus==='pending'||row.viewId!==viewId||!Array.isArray(row.anchor)||!['label','utility'].includes(row.category)||!/(室|区|厅|井|仓|库|车间|屋面|上空|楼梯|平台|ห้อง|พื้นที่|คลัง|หลังคา|ช่องเปิด)/.test(row.sourceZh+' '+(row.textTh||'')))continue;areas.push({id:'text:'+row.id,kind:'landmark',textId:row.id,nameTh:row.textTh||row.sourceZh,nameZh:row.sourceZh,anchor:row.anchor,reviewRequired:row.reviewRequired,status:row.effectiveStatus});}
 return areas;
}
export function areaViewBox(area){
 if(!area)return{x:0,y:0,w:1,h:1};let points=area.kind==='zone'?area.polygon:area.anchor?[area.anchor]:[];
 if(!Array.isArray(points)||!points.length||points.some(p=>!Array.isArray(p)||!p.every(Number.isFinite)))return{x:0,y:0,w:1,h:1};
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,w=area.kind==='landmark'?.35:Math.min(1,Math.max(.15,Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))+.12));
 return{x:Math.max(0,Math.min(1-w,cx-w/2)),y:Math.max(0,Math.min(1-w,cy-w/2)),w,h:w};
}
