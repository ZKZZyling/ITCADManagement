const nonempty=value=>typeof value==='string'&&value.trim().length>0;
export function numericTokens(value){return (String(value||'').normalize('NFKC').match(/[+-]?\d+(?:[.,]\d+)?/g)||[]).sort();}
function chineseInteger(text){const digits={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9},units={十:10,百:100,千:1000};if(!/^[零〇一二两三四五六七八九十百千]+$/.test(text))return null;if(!/[十百千]/.test(text))return Number([...text].map(c=>digits[c]).join(''));let total=0,current=0;for(const c of text){if(c in digits)current=digits[c];else {total+=(current||1)*units[c];current=0}}return total+current;}
export function translationNumberCheck(source,translated,mappings=[]){const expected=numericTokens(source);for(const map of mappings){if(map?.reviewed!==true||!nonempty(map.source)||!String(source).includes(map.source)||!/^\d+$/.test(String(map.target))||chineseInteger(map.source)!==Number(map.target))return false;expected.push(String(map.target));}return JSON.stringify(expected.sort())===JSON.stringify(numericTokens(translated));}
export function prohibitionReviewNeeded(source,translated){return /不得|禁止|不允许|不可/.test(source)&&!/(ห้าม|ไม่อนุญาต|ต้องไม่|มิให้|ไม่สามารถ|ไม่ให้|อย่า)/.test(translated||'');}
export function textTranslationsForView(dataset,viewId){
 const view=dataset.views.find(v=>v.id===viewId),all=Array.isArray(dataset.drawingTextTranslations)?dataset.drawingTextTranslations:[],rows=[],rejected=[];
 const glossary=Array.isArray(dataset.drawingTextTranslationEntries)?dataset.drawingTextTranslationEntries:[],entryCounts=new Map(),entries=new Map();for(const entry of glossary){entries.set(entry?.id,entry);entryCounts.set(entry?.id,(entryCounts.get(entry?.id)||0)+1);}
 const counts=new Map();for(const row of all)counts.set(row?.id,(counts.get(row?.id)||0)+1);
 for(const occurrence of all.filter(row=>row?.viewId===viewId)){
  const entry=entries.get(occurrence.entryId);
  const row=occurrence.entryId?{...occurrence,...entry,id:occurrence.id,entryId:occurrence.entryId,viewId:occurrence.viewId,anchor:occurrence.anchor,worldAnchor:occurrence.worldAnchor,sourceHandle:occurrence.sourceHandle,entityType:occurrence.entityType,layer:occurrence.layer,instancePath:occurrence.instancePath,evidence:occurrence.evidence,sourceRaw:occurrence.sourceRaw??entry?.sourceRaw}:occurrence;
  let reason='';
  if(occurrence.entryId&&entryCounts.get(occurrence.entryId)!==1){rejected.push({id:occurrence.id,sourceHandle:occurrence.sourceHandle,reason:'ไม่มีคำศัพท์อ้างอิงหรือรหัสคำศัพท์ซ้ำ'});continue;}
  if(occurrence.entryId&&(!nonempty(occurrence.sourceZh)||occurrence.sourceZh!==entries.get(occurrence.entryId)?.sourceZh)){rejected.push({id:occurrence.id,sourceHandle:occurrence.sourceHandle,reason:'ข้อความต้นฉบับไม่ตรงกับคำศัพท์ที่อ้างอิง'});continue;}
  if(!view||!nonempty(row.id)||counts.get(row.id)!==1||!nonempty(row.sourceHandle)||!nonempty(row.sourceZh)||row.sourceZh.length>40000||row.textTh!=null&&typeof row.textTh!=='string'||typeof row.textTh==='string'&&row.textTh.length>40000||!['pending','draft-reviewed'].includes(row.status))reason='ข้อมูลข้อความ/รหัสไม่ครบหรือซ้ำ';
  else if(!nonempty(dataset.sourceSHA256)||row.evidence?.sourceSHA256!==dataset.sourceSHA256||!nonempty(view.sourceImageSHA256)||row.evidence?.sourceImageSHA256!==view.sourceImageSHA256||dataset.sourceDXFSHA256&&row.evidence?.sourceDXFSHA256!==dataset.sourceDXFSHA256)reason='รุ่นต้นฉบับหรือภาพไม่ตรง';
  else if(!Array.isArray(row.anchor)||row.anchor.length!==2||!row.anchor.every(n=>Number.isFinite(n)&&n>=0&&n<=1)||row.anchor[1]>(view.drawableHeight||view.height)/view.height)reason='ตำแหน่งข้อความอยู่นอกภาพแปลน';
  if(!reason&&row.worldAnchor!=null){const bounds=view.worldBounds;if(!Array.isArray(row.worldAnchor)||row.worldAnchor.length<2||!row.worldAnchor.slice(0,2).every(Number.isFinite)||!Array.isArray(bounds)||bounds.length!==4||!bounds.every(Number.isFinite)||bounds[2]<=bounds[0]||bounds[3]<=bounds[1]||!(view.width>0&&view.height>0))reason='พิกัดต้นฉบับหรือขอบเขตภาพไม่ถูกต้อง';else {const expected=[(row.worldAnchor[0]-bounds[0])/(bounds[2]-bounds[0]),(bounds[3]-row.worldAnchor[1])/(bounds[3]-bounds[1])*(view.drawableHeight||view.height)/view.height];if(Math.abs(expected[0]-row.anchor[0])*view.width>1||Math.abs(expected[1]-row.anchor[1])*view.height>1)reason='ตำแหน่งข้อความไม่ตรงกับพิกัดต้นฉบับในกรอบภาพ';}}
  if(reason){rejected.push({id:row?.id,sourceHandle:row?.sourceHandle,reason});continue;}
  rows.push(decorateTranslation(row));
 }
 return {rows,rejected,total:rows.length+rejected.length};
}
export function searchTranslations(rows,query='',category='all',status='all'){
 const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');const q=normalize(query);
 return rows.filter(row=>(category==='all'||(row.category||'other')===category)&&(status==='all'||(status==='review'?row.reviewRequired:row.effectiveStatus===status))&&(!q||normalize([row.sourceZh,row.textTh,row.sourceHandle,row.notesTh,row.category,row.searchHandles].join(' ')).includes(q)));
}
export function viewportTranslations(rows,box){return rows.filter(row=>row.anchor[0]>=box.x&&row.anchor[0]<=box.x+box.w&&row.anchor[1]>=box.y&&row.anchor[1]<=box.y+box.h);}

export function translationLabels(rows,selected,box,scale,aspect,mode){const visible=viewportTranslations(rows,box);const selectedVisible=selected&&visible.some(row=>row.id===selected.id)?selected:null;if(mode==='selected')return {rows:selectedVisible?[selectedVisible]:[],visibleCount:visible.length};const occupied=new Set(),result=[];for(const row of [...(selectedVisible?[selectedVisible]:[]),...visible.filter(r=>r.id!==selected?.id)]){const key=Math.floor((row.anchor[0]-box.x)*scale/190)+':'+Math.floor((row.anchor[1]-box.y)*aspect*scale/65);if(!occupied.has(key)){occupied.add(key);result.push(row)}}return {rows:result,visibleCount:visible.length};}

function decorateTranslation(row){
  const pending=row.status==='pending'||!nonempty(row.textTh),numbersMatch=pending?null:translationNumberCheck(row.sourceZh,row.textTh,Array.isArray(row.numeralMappings)?row.numeralMappings:[]),prohibitionNeedsReview=!pending&&prohibitionReviewNeeded(row.sourceZh,row.textTh);
  return {...row,effectiveStatus:pending?'pending':numbersMatch&&!prohibitionNeedsReview?'draft-reviewed':'needs-review',numbersMatch,prohibitionNeedsReview,reviewRequired:row.reviewRequired===true||numbersMatch===false||prohibitionNeedsReview};
}

export function translationCatalogue(dataset){
 const groups=new Map();for(const view of dataset.views)for(const row of textTranslationsForView(dataset,view.id).rows){const key=row.entryId||row.sourceZh;let group=groups.get(key);if(!group){group={...row,occurrences:[],searchHandles:[]};groups.set(key,group)}group.occurrences.push(row);group.searchHandles.push(row.sourceHandle);}
 return [...groups.values()];
}
export function globalTextTranslations(dataset){
 const entries=Array.isArray(dataset.drawingTextTranslationEntries)?dataset.drawingTextTranslationEntries:[],rows=[],rejected=[];
 for(const ref of (Array.isArray(dataset.drawingTextGlobalReferences)?dataset.drawingTextGlobalReferences:[])){if(!ref||typeof ref!=='object'){rejected.push({reason:'ข้อมูลหมายเหตุไม่ถูกต้อง'});continue;}const matches=entries.filter(e=>e?.id===ref.entryId),row={...ref,...matches[0],id:'global:'+ref.entryId+':'+ref.sourceHandle,entryId:ref.entryId,sourceHandle:ref.sourceHandle,sourceScope:ref.sourceScope,locationStatus:ref.locationStatus,evidence:ref.evidence,sourceRaw:ref.sourceRaw??matches[0]?.sourceRaw};
  if(matches.length!==1||ref.sourceZh!=null&&ref.sourceZh!==matches[0]?.sourceZh||!nonempty(row.sourceZh)||row.sourceZh.length>40000||row.textTh!=null&&typeof row.textTh!=='string'||typeof row.textTh==='string'&&row.textTh.length>40000||!['pending','draft-reviewed'].includes(row.status)||!nonempty(ref.sourceHandle)||!nonempty(ref.sourceScope)||ref.locationStatus!=='outside-current-views'||ref.anchor||ref.viewId||!nonempty(dataset.sourceSHA256)||ref.evidence?.sourceSHA256!==dataset.sourceSHA256||dataset.sourceDXFSHA256&&ref.evidence?.sourceDXFSHA256!==dataset.sourceDXFSHA256){rejected.push({sourceHandle:ref.sourceHandle,reason:'ข้อมูลหมายเหตุ/รุ่นต้นฉบับ/ขอบเขตอ้างอิงไม่ผ่านตรวจ'});continue;}
  rows.push(decorateTranslation(row));
 }
 return {rows,rejected,total:rows.length+rejected.length};
}

export function compactTranslationLabel(value,limit=26){const text=String(value||'').replace(/\s+/g,' ').trim();const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('th',{granularity:'grapheme'}).segment(text)].map(p=>p.segment):Array.from(text).reduce((out,c)=>{if(/\p{Mark}/u.test(c)&&out.length)out[out.length-1]+=c;else out.push(c);return out},[]);return parts.length>limit?parts.slice(0,limit).join('')+'…':text;}
