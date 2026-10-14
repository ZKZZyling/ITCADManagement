# Offline workspace

เปิด `/field/offline.html` เป็นหน้าต่างแยกได้จากเว็บหลัก ใช้ IndexedDB เดียวกับเว็บหลักเมื่อ origin เดียวกัน ต้องเตรียมผ่าน HTTPS หรือ localhost ขณะยังต่อ server อยู่

## ขั้นตอน

1. เลือกแผ่น (สูงสุด 25 แผ่น) แล้วเตรียม pack; ดาวน์โหลด PNG ทุกแผ่น, ตรวจ PNG signature, SHA-256 และ decode รูป
2. Cache shell ของ build ปัจจุบัน และบันทึก pack ใน IndexedDB; อย่าออกหน้างานหากยังเตรียมไม่ครบ
3. ปิดเน็ตแล้ว reload offline page; ต้องเห็นรูปและรายการก่อนถือว่าพร้อมในอุปกรณ์นั้น
4. บันทึก checklist/notes/status และรูป; ภาพถูกย่อเป็น JPEG สูงสุดด้านละ 1600 px; บันทึก record+outbox แบบ atomic ใน browser
5. Export pack และ results (รวมรูป) ไปเก็บที่ได้รับอนุญาต แล้วส่งข้อมูลเมื่อพร้อมออนไลน์; sync เฉพาะ source/dataset ปัจจุบัน

## ขอบเขตข้อมูล

- pack JSON จำกัด 80 MB; ไม่ใช่ raw DWG และไม่ได้ย่อ CAD ทั้งโรงงานลงมือถือ
- เก็บ asset text list ทั้งหมด เพราะความสัมพันธ์ asset↔frame ยังไม่ยืนยัน จึงอาจมีรายการที่อยู่คนละแผ่น
- การใช้ IndexedDB ไม่เท่ากับ backup; private browsing, browser eviction, Clear Data และอุปกรณ์เสียอาจทำให้สูญหาย
- Service Worker ใช้ network-first สำหรับ GET `/field/` และ fallback cache build ปัจจุบันบน network error/5xx; ไม่ cache API/CAD ทุกอย่างโดยปริยาย
- ไม่มี automatic background sync; ผู้ใช้กดส่งเองและตรวจ pending/conflicts
- dynamic CAD engine ไม่อยู่ใน offline shell; offline เป็นภาพอ้างอิงและ checklist ไม่ใช่ DWG editor

## ลิงก์เปลี่ยน / ย้ายอุปกรณ์

Origin ใหม่มี IndexedDB คนละชุด ต้องเปิด origin เก่าเพื่อ export pack+results แล้ว import ที่ origin ใหม่ซึ่งจับคู่แล้ว Source SHA และ dataset ต้องตรง; existing record ไม่ถูก overwrite; accepted results ไม่รับ import ใน workflow นี้ หลัง import ให้ตรวจครบแล้ว sync เอง อย่าคาดว่าฟรี tunnel เดิมจะย้อนกลับมาได้เสมอ จึงควร export ก่อน URL เปลี่ยน

Pack และ results เป็นข้อมูลบริษัท อ่านได้จาก JSON ผู้ถือไฟล์เข้าถึงเนื้อหาได้; ไม่มี encryption at rest ของ export ในรุ่นนี้ ควรใช้ที่เก็บและสิทธิ์ตามบริษัท
