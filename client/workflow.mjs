export function preferenceKey(drawing){return 'itfield-view:'+drawing.sourceSHA256+':'+(drawing.datasetId||'')}
export function resumeView(drawing,saved){return drawing.views.find(v=>v.id===saved)?.id||drawing.views.find(v=>v.title?.includes('一层视频监控'))?.id||drawing.views[0]?.id||''}
export function validAnchor(anchor){return Array.isArray(anchor)&&anchor.length===2&&anchor.every(Number.isFinite)}
// Prevent duplicate operations, including two clicks before React renders disabled state.
export function singleFlight(){let running=false;return async operation=>{if(running)return {skipped:true};running=true;try{return await operation()}finally{running=false}}}
export function pendingForRecord(pending,id){return pending.filter(item=>item.id===id)}
