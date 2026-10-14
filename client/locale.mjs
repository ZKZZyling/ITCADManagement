import catalog from './translations.json' with {type:'json'};
export const LOCALES=['th','zh-CN','en'];
let current='th';
try{const saved=globalThis.localStorage?.getItem('itfield-locale');if(LOCALES.includes(saved))current=saved}catch{}
export function getLocale(){return current}
export function setLocale(value){current=LOCALES.includes(value)?value:'th';try{globalThis.localStorage?.setItem('itfield-locale',current)}catch{};if(globalThis.document)document.documentElement.lang=current;return current}
export function t(value,locale=current){
 if(typeof value!=='string'||locale==='th')return value;
 const key=value.trim(),row=catalog[key];
 if(!row)return value;
 return value.match(/^\s*/)[0]+(row[locale]||key)+value.match(/\s*$/)[0];
}
export function messageText(value,locale=current){
 for(const [key,row] of Object.entries(catalog))if(value===row.en||value===row['zh-CN'])return t(key,locale);
 if(locale==='th')return value;
 const exact=t(value,locale);if(exact!==value)return exact;
 // This function is only for application status messages, never drawing text or user notes.
 return String(value).replace(/[\u0e00-\u0e7f][\u0e00-\u0e7f\s/·•:()—…-]*/g,s=>t(s,locale));
}
export function recordsForDrawing(records,drawing){
 if(!drawing)return [];
 const prefix=drawing.sourceSHA256+'-'+(drawing.datasetId?drawing.datasetId+'-':'');
 return records.filter(r=>r.sourceSHA256===drawing.sourceSHA256&&r.id.startsWith(prefix));
}
export function progressSummary(records,drawing){
 const scoped=recordsForDrawing(records,drawing),counts=Object.fromEntries(['planned','installed','tested','accepted','failed','blocked'].map(s=>[s,scoped.filter(r=>r.status===s).length]));
 return {total:scoped.length,counts,lastUpdated:scoped.map(r=>r.updated||r.localUpdated||'').sort().at(-1)||null,sourceSHA256:drawing?.sourceSHA256||null,datasetId:drawing?.datasetId||null};
}
