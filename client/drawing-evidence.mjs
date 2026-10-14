// Local terminology and traceable candidate classification; no connectivity inference.
import {segmentDistance} from './model.mjs';
export const TERMS=[
 ['rack',/弱电机柜|弱电间\/机柜|机柜|\brack\b/i,'data','ตู้แร็ก / ตู้ระบบสื่อสาร','机柜','Rack / communications cabinet'],
 ['switch',/交换机|\bswitch\b/i,'data','สวิตช์เครือข่าย','网络交换机','Network switch'],
 ['patch',/配线架|patch\s*panel|RJ45/i,'data','แผงกระจายสาย / จุดต่อ RJ45','配线架 / RJ45连接','Patch panel / RJ45 connection'],
 ['fiber',/光纤|\bfib(?:er|re)\b|LC跳线/i,'data','สายใยแก้ว / จุดต่อใยแก้ว','光纤 / 光纤连接','Fiber / fiber connection'],
 ['copper',/CAT\s*[5678]|六类|六配|网线/i,'data','สายสัญญาณเครือข่าย','网络线缆','Network cabling'],
 ['ap',/无线AP|无线网桥|\baccess\s*point\b|\bWAP\b/i,'data','จุดกระจายสัญญาณ / สะพานไร้สาย','无线AP / 无线网桥','Wireless access point / bridge'],
 ['outlet',/信息出线口|信息插座|data\s*outlet/i,'data','จุดต่อเครือข่าย','信息插座','Data outlet'],
 ['camera',/摄像机|摄像头|\bcamera\b|CCTV/i,'cctv','กล้องวงจรปิด','摄像机','CCTV camera'],
 ['recorder',/\bNVR\b|\bDVR\b|录像机|视频监控/i,'cctv','เครื่องบันทึก / ระบบภาพวงจรปิด','录像机 / 视频监控','Recorder / surveillance system'],
 ['access',/门禁|读卡器|电锁|access\s*control/i,'access','ระบบควบคุมการเข้าออก','门禁系统','Access control'],
 ['pathway',/线槽|桥架|JDG\d*|线管|conduit|cable\s*tray/i,'pathway','รางสาย / ท่อร้อยสาย','线槽 / 桥架 / 线管','Cable tray / conduit'],
 ['power',/\bPDU\b|\bUPS\b|取电|电源|接地|grounding/i,'power','ไฟเลี้ยง / PDU / งานประสานไฟฟ้า','供电 / PDU / 电气协调','Power / PDU / electrical coordination'],
 ['room',/机房|弱电间|工作站|工作区|电梯井|门卫|厂房|楼层|屋顶|^\d+F$/i,'coordination','ห้อง / พื้นที่ / ชั้น / งานประสาน','房间 / 区域 / 楼层协调','Room / area / floor coordination'],
];
const ROLE_LABELS={geometry:['เรขาคณิต / ยังไม่ระบุหน้าที่','几何 / 用途未确认','Geometry / purpose unresolved'],annotation:['ข้อความทั่วไป / ยังไม่มีคำแปลเฉพาะ','一般文字 / 专业译文待确认','General annotation / specific translation pending'],symbol:['สัญลักษณ์จากกลุ่มต้นฉบับ','原始对象组符号','Symbol from source group'],'rack-enclosure':['กรอบตู้จากข้อความภายใน · ต้องยืนยัน','依据内部文字识别的机柜框 · 待确认','Rack enclosure from contained label / review required'],'route-unverified':['แนวเส้น · ประเภทสายยังไม่ยืนยัน','线段 / 线缆类型待确认','Linework / cable type unresolved'],'route-candidate':['แนวสายข้อมูลจากข้อความใกล้เส้น · ต้องยืนยัน','邻近文字提示的数据线段 · 待确认','Data route from nearby label / review required']};
const EVIDENCE_LABELS={'source-text':['ข้อความต้นฉบับตรงคำศัพท์','原文术语匹配','Direct source terminology'],'same-source-handle':['ข้อความในกลุ่ม handle เดียวกัน','同一源handle的文字','Text within the same source handle'],'existing-layer-candidate':['หมวดเดิมจาก layer · ต้องทบทวน','原图层分类 · 待复核','Original layer category / review required'],'enclosed-rack-label-candidate':['ข้อความตู้ภายในกรอบ · ความสัมพันธ์เชิงพื้นที่','框内机柜文字 / 空间关系','Contained rack label / spatial association'],'near-cable-label-not-connectivity':['ข้อความสายใกล้เส้น · ไม่ยืนยันการต่อกัน','邻近线缆文字 / 不确认连通','Nearby cable label / connectivity not confirmed']};
export function roleLabel(role,locale='en'){const a=ROLE_LABELS[role];if(a)return a[locale==='th'?0:locale==='zh-CN'?1:2];return TERMS.find(r=>r[0]===role)?.[locale==='th'?3:locale==='zh-CN'?4:5]||role}
export function evidenceLabel(code,locale='en'){const a=EVIDENCE_LABELS[code];return a?.[locale==='th'?0:locale==='zh-CN'?1:2]||code}
export function describeText(text,locale='en'){
 const pick=(th,zh,en)=>locale==='th'?th:locale==='zh-CN'?zh:en,s=String(text||''),out=[];
 const ports=s.match(/(\d+)口/),cores=s.match(/(\d+)芯/),rack=s.match(/(\d+)U\b/i),quantity=s.match(/\*(\d+)\s*$/),cat=s.match(/CAT\s*([5678])/i);
 if(ports)out.push(pick(`ต้นฉบับระบุ ${ports[1]} พอร์ต`,`原文标注 ${ports[1]} 口`,`Source states ${ports[1]} ports`));
 if(cores)out.push(pick(`ต้นฉบับระบุใยแก้ว ${cores[1]} คอร์`,`原文标注 ${cores[1]} 芯`,`Source states ${cores[1]} fiber cores`));
 if(rack)out.push(pick(`ต้นฉบับระบุขนาดตู้ ${rack[1]}U`,`原文标注机柜 ${rack[1]}U`,`Source states a ${rack[1]}U cabinet`));
 if(cat)out.push(pick(`ต้นฉบับระบุสาย CAT${cat[1]}`,`原文标注 CAT${cat[1]} 线缆`,`Source states CAT${cat[1]} cabling`));
 if(/POE/i.test(s))out.push(pick('PoE คือการจ่ายไฟผ่านสายเครือข่าย ต้องตรวจรุ่นอุปกรณ์และงบกำลังไฟ','PoE通过网络线缆供电，需核对型号和功率预算','PoE supplies power over network cabling; verify equipment model and power budget'));
 if(/单模/.test(s))out.push(pick('ต้นฉบับระบุใยแก้วชนิด single-mode','原文标注单模光纤','Source specifies single-mode fiber'));
 if(/就近取电/.test(s))out.push(pick('ต้นฉบับระบุรับไฟจากจุดใกล้เคียง ยังต้องยืนยันวงจรและผู้รับผิดชอบ','原文要求就近取电，电路及责任人待确认','Source requests nearby power; circuit and responsible trade still need confirmation'));
 if(quantity)out.push(pick(`มีตัวคูณ *${quantity[1]} ในต้นฉบับ ไม่ใช่ยอดอุปกรณ์ติดตั้งที่ตรวจนับแล้ว`,`原文乘数 *${quantity[1]}，并非已核实的安装数量`,`Source multiplier *${quantity[1]}; not a verified installed quantity`));
 return out;
}
export function explainText(text){
 const matches=TERMS.filter(r=>r[1].test(text||''));
 return {matches:matches.map(([code,,system,th,zh,en])=>({code,system,labels:{th,'zh-CN':zh,en}})),numbers:[...String(text||'').matchAll(/\d+(?:\.\d+)?(?:U|口|芯|路|\*CAT\d|\*\d+)?/gi)].map(x=>x[0])};
}
export function enrichScene(input){
 const notes=input.filter(o=>o.kind==='text'&&!o.sourceHidden),groups=new Map();
 const rackLabels=notes.filter(n=>/弱电机柜[:：]|\brack\b/i.test(n.text));
 const cableGrid=new Map();for(const n of notes.filter(n=>/CAT\s*[5678]|光纤/.test(n.text))){const key=[Math.floor(n.anchor[0]/10000),Math.floor(n.anchor[1]/10000)].join(',');const cell=cableGrid.get(key)||[];cell.push(n);cableGrid.set(key,cell)}
 for(const n of notes){const xs=groups.get(n.sourceHandle)||[];xs.push(n);groups.set(n.sourceHandle,xs)}
 return input.map(o=>{
  const own=explainText(o.text),same=groups.get(o.sourceHandle)||[];
  const candidates=own.matches.length?own.matches:same.flatMap(n=>explainText(n.text).matches);
  const systems=[...new Set(candidates.map(x=>x.system))];
  // Multiple systems in the same placed group must not recolor every child.
  let system=own.matches[0]?.system||(systems.length===1?systems[0]:o.system)||'unknown';
  let role=o.kind==='text'?(own.matches[0]?.code||'annotation'):(systems.length===1?'symbol':'geometry');
  let evidence=o.kind==='text'&&own.matches.length?'source-text':systems.length===1?'same-source-handle':'existing-layer-candidate';
  let linked=same.filter(n=>n.id!==o.id&&explainText(n.text).matches.length).slice(0,10).map(n=>({id:n.id,text:n.text,sourceHandle:n.sourceHandle,relation:'same-source-handle'}));
  if(o.kind==='path'&&o.points?.length===5&&o.points[0][0]===o.points[4][0]&&o.points[0][1]===o.points[4][1]){
   const xs=o.points.map(p=>p[0]),ys=o.points.map(p=>p[1]),b=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],w=b[2]-b[0],h=b[3]-b[1];
   const label=rackLabels.find(n=>n.anchor[0]>=b[0]&&n.anchor[0]<=b[2]&&n.anchor[1]>=b[3]-h*.22&&n.anchor[1]<=b[3]&&w>0&&h>0);
   if(label){system='data';role='rack-enclosure';evidence='enclosed-rack-label-candidate';linked=[{id:label.id,text:label.text,sourceHandle:label.sourceHandle,relation:'enclosed-label-not-certified'}]}
  }
  if(o.kind==='path'&&role==='geometry'&&/WIRE|线|cable/i.test(o.layer||''))role='route-unverified';
  if(role==='route-unverified'&&o.points.length<=20&&!(o.points[0][0]===o.points.at(-1)[0]&&o.points[0][1]===o.points.at(-1)[1])){
   let near=null,best=Infinity;for(let i=1;i<o.points.length;i++){const a=o.points[i-1],b=o.points[i],x0=Math.floor((Math.min(a[0],b[0])-1200)/10000),x1=Math.floor((Math.max(a[0],b[0])+1200)/10000),y0=Math.floor((Math.min(a[1],b[1])-1200)/10000),y1=Math.floor((Math.max(a[1],b[1])+1200)/10000);if((x1-x0+1)*(y1-y0+1)>100)continue;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const n of cableGrid.get(x+','+y)||[]){const d=segmentDistance(n.anchor,a,b);if(d<=Math.min(1200,n.height*3)&&d<best){near=n;best=d}}}
   if(near){system='data';role='route-candidate';evidence='near-cable-label-not-connectivity';linked=[{id:near.id,text:near.text,sourceHandle:near.sourceHandle,relation:'spatial-label-candidate'}]}
  }
  return {...o,originalSystem:o.system,system,semantic:{role,evidence,explanations:own.matches,linked,reviewRequired:true}};
 });
}
// Screen-space text hit region matches the approximate rendered font and rotation.
export function textHit(o,p,x,y){
 const sx=p.w/(p.b[2]-p.b[0]),sy=p.h/(p.b[3]-p.b[1]),a=[(o.anchor[0]-p.b[0])*sx,(p.b[3]-o.anchor[1])*sy];
 const f=Math.max(3,Math.min(72,o.height*sy)),theta=(o.rotation||0)*Math.PI/180,dx=x-a[0],dy=y-a[1];
 const u=dx*Math.cos(theta)-dy*Math.sin(theta),v=dx*Math.sin(theta)+dy*Math.cos(theta);
 const lines=String(o.text||'').split('\n'),width=Math.max(...lines.map(s=>[...s].reduce((n,c)=>n+(/[\u2e80-\u9fff]/.test(c)?1:.62),0)))*f;
 return u>=-3&&u<=width+3&&v>=-f-3&&v<=(lines.length-1)*f*1.2+3?Math.abs(v)/Math.max(f,1):null;
}
