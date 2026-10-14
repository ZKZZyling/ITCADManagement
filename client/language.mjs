import {getLocale,t} from './locale.mjs';
// UI translations never replace source drawing evidence.
export function sheetTitle(source,locale=getLocale()){
 if(source==='Model — ทั้งพื้นที่ที่สกัดได้')return t(source,locale);
 if(locale==='zh-CN')return source;
 if(locale==='en'){
  if(source==='总平面图')return 'Site plan';if(source==='室外监控布置平面图')return 'Outdoor CCTV plan';
  const m=source.match(/^(一层|二层|三层|四层|屋顶)?(消防报警|应急照明|视频监控|综合布线|停车场)(平面图|系统图)$/);
  if(!m)return source;
  return ({'消防报警':'Fire alarm','应急照明':'Emergency lighting','视频监控':'CCTV','综合布线':'Structured cabling','停车场':'Parking'}[m[2]])+' '+(m[3]==='系统图'?'diagram':'plan')+(m[1]?' · '+({'一层':'Floor 1','二层':'Floor 2','三层':'Floor 3','四层':'Floor 4','屋顶':'Roof'}[m[1]]):'');
 }
 const systems={'消防报警':'ระบบแจ้งเหตุเพลิงไหม้','应急照明':'ไฟฉุกเฉิน','视频监控':'กล้อง CCTV','综合布线':'ระบบสายสื่อสาร','停车场':'ระบบลานจอดรถ'};
 if(source==='总平面图')return 'ผังบริเวณรวม';
 if(source==='室外监控布置平面图')return 'ผังกล้อง CCTV ภายนอกอาคาร';
 const m=source.match(/^(一层|二层|三层|四层|屋顶)?(消防报警|应急照明|视频监控|综合布线|停车场)(平面图|系统图)$/);
 if(!m)return source;
 return (m[3]==='系统图'?'แผนผัง':'ผัง')+' '+systems[m[2]]+(m[1]?' · '+({'一层':'ชั้น 1','二层':'ชั้น 2','三层':'ชั้น 3','四层':'ชั้น 4','屋顶':'หลังคา'}[m[1]]):'');
}
export function userError(error,hostname=globalThis.location?.hostname||''){
 const s=String(error?.message||error||'');
 if(/Authentication required|Unauthorized|Not authenticated/i.test(s)&&!hostname.endsWith('.chatgpt.site'))return 'ยังไม่ได้จับคู่เครื่องนี้ กรุณาเปิดลิงก์สำหรับทีมจากเครื่องเซิร์ฟเวอร์ที่มี #pair=… ท้ายลิงก์ · ไม่ต้องล็อกอิน ChatGPT';
 const rules=[[/Viewport too dense/i,'พื้นที่นี้มีวัตถุมาก กรุณาเปิดภาพอ้างอิง AutoCAD หรือซูมเข้า ระบบไม่ได้ตัดวัตถุออกเพื่อให้แสดงเร็ว'],[/Renderer busy/i,'เซิร์ฟเวอร์กำลังสร้างภาพ กรุณารอสักครู่แล้วลองอีกครั้ง'],[/Authentication required|Unauthorized|Not authenticated/i,'ต้องเปิดลิงก์จับคู่จากเครื่องเซิร์ฟเวอร์ หรือเข้าสู่ระบบสำหรับเว็บออนไลน์'],[/Version conflict|Revision conflict|Concurrent update conflict/i,'ข้อมูลต่างรุ่นกัน ข้อมูลในเครื่องยังเก็บไว้ กรุณาตรวจเทียบก่อนส่งอีกครั้ง'],[/Complete every checklist/i,'กรุณาตรวจทุกรายการก่อนเลือกผ่านตรวจ'],[/Explain not-applicable/i,'กรุณาระบุเหตุผลสำหรับรายการที่ไม่เกี่ยวข้อง'],[/Failed to fetch|NetworkError|fetch failed/i,'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจเครือข่ายและสถานะเซิร์ฟเวอร์'],[/Request too large/i,'ข้อมูลใหญ่เกินขนาดที่เซิร์ฟเวอร์รับได้'],[/Field release blocked/i,'ชุดแบบยังไม่ผ่านการตรวจพร้อมหน้างาน จึงยังลงผลผ่านตรวจรับไม่ได้'],[/Invalid pairing token/i,'รหัสจับคู่ไม่ถูกต้อง ใช้ลิงก์จากเครื่องเซิร์ฟเวอร์อีกครั้ง']];
 return rules.find(([re])=>re.test(s))?.[1]||s;
}
export function readiness(drawing){return drawing?.fieldReadiness?.status==='approved';}
