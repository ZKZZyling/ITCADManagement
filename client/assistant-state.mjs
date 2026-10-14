// Advice uses application state only. No drawing text, credentials or remote AI.
const hint=(id,title,body,target)=>({id,title,body,target});
export function adviceFor(mode,state={},focus=''){
 if(state.error)return hint('error','ต้องตรวจปัญหานี้ก่อน','อ่านข้อความผิดพลาดและตรวจชนิดไฟล์ สิทธิ์หรือการเชื่อมต่อ ข้อมูลเดิมยังไม่ควรถูกล้าง','error');
 if(state.busy)return hint('busy','กำลังทำงานให้คุณ','รอขั้นตอนปัจจุบันให้เสร็จ ไม่ต้องกดซ้ำ คุณยังดูข้อมูลเดิมได้',mode==='analysis'?'jobs':'progress');
 if(state.conflictCount>0)return hint('conflict','มีผลตรวจที่ต้องเทียบกัน','เก็บหลักฐานและส่งออกสำรองก่อน ตรวจรุ่นที่ต่างกัน ห้ามส่งซ้ำเพื่อเขียนทับอัตโนมัติ','sync');
 if(state.online===false&&state.pendingCount>0)return hint('offline-pending','ผลตรวจยังอยู่ในเครื่อง','ตอนนี้ไม่ได้เชื่อมต่อ ส่งออกสำรองไว้ แล้วกลับมาส่งผ่านลิงก์เดิมเมื่อเซิร์ฟเวอร์พร้อม','export');
 if(focus==='import'||!state.hasData&&['manager','sandbox'].includes(mode))return hint('import','เริ่มจากชุดนำเสนอที่เตรียมแล้ว','เลือก ITCAD-presentation JSON ไม่ใช่ DWG ไฟล์เปิดในเบราว์เซอร์และไม่อัปโหลดเพื่อวิเคราะห์ใหม่','import');
 if(focus==='search')return hint('search','ค้นจากรหัสหรือข้อความต้นฉบับ','ลอง tag ตู้ ชั้นหรือข้อความจีน รายการอาจมาจากหลายแผ่น ให้เทียบกับภาพก่อนเลือกจุด','search');
 if(focus==='sync')return hint('sync','ส่งผลตรวจอย่างตรวจสอบได้','เชื่อมต่อเซิร์ฟเวอร์เดิม กดส่งแล้วตรวจรายการรอส่งและ conflict อย่าล้างข้อมูลที่ยังส่งไม่ครบ','sync');
 if(focus==='export')return hint('backup','เก็บชุดสำรองที่ตรวจย้อนกลับได้','ไฟล์ส่งออกมีข้อมูลบริษัท เก็บในที่อนุญาต Snapshot แสดงเฉพาะข้อมูล ณ เวลาส่งออก','export');
 if(state.hasSelection)return hint('inspect','ตรวจรายการนี้ตามหลักฐาน','ตอบ checklist แนบหลักฐานตามเกณฑ์ และบันทึกเมื่อพร้อม ผลทดลองไม่รวมงานจริง ส่วนผลจริงยังต้องส่งเซิร์ฟเวอร์','checks');
 if(state.pendingCount>0)return hint('pending','มีรายการที่ยังรอส่ง','บันทึกในเครื่องแล้วไม่ได้แปลว่าส่งสำเร็จ ตรวจคิว ส่งข้อมูล และตรวจผลตอบกลับก่อนปิดงาน','sync');
 if(mode==='analysis'){
  if(state.resultReady)return hint('review-ready','ผลพร้อมให้ตรวจทาน','ตรวจคำเตือนและหลักฐานก่อนเปิดใช้ การตรวจไฟล์ผ่านไม่ได้อนุมัติแบบก่อสร้าง','jobs');
  return hint('source','เลือกต้นฉบับหรือชุดแบบเดิม','DWG ใหม่ต้องมีตัวแปลงพร้อมใช้งาน ถ้าจะตรวจชุดเดิม เลือกตรวจความครบถ้วนได้โดยไม่เปิด AutoCAD','source');
 }
 if(mode==='offline'&&(!state.hasData||focus==='prepare'))return hint('prepare','เตรียมก่อนออกหน้างาน','ขณะออนไลน์เลือกแผ่นที่จำเป็น เตรียมชุดออฟไลน์ แล้วทดสอบเปิดซ้ำหลังตัดเน็ตก่อนเดินทาง','prepare');
 if(state.readyBlocked)return hint('blocked','ตรวจทานได้ แต่ยังไม่ใช่ตรวจรับ','แบบยังไม่ผ่านเกณฑ์ตรวจรับ ไม่ใช่โปรแกรมเสีย เลือกพื้นที่และตรวจข้อสังเกตได้โดยคงคำเตือนไว้','sheet');
 return hint('sheet','เลือกพื้นที่ที่กำลังทำงาน','เลือกแผ่นและหมวดก่อนค้นจุดตรวจ เปลี่ยนภาษาได้โดยไม่เปลี่ยนข้อความหรือหน่วยในแบบ','sheet');
}
