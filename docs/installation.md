# การติดตั้งและการเริ่มต้นใหม่

## Requirements

- Windows 10/11 สำหรับ controller / `.cmd`; Node core server ทดสอบอัตโนมัติได้บน Windows/Linux
- Node 22.13+ ต้องมี `node:sqlite`; ใช้รุ่น LTS ที่ยังได้รับ security updates และตรวจ `node --version`
- npm, Git, browser ที่รองรับ IndexedDB, Cache Storage, Service Workers และ Web Crypto
- Windows OpenSSH Client เมื่อต้องการ localhost.run; ไม่ต้องใส่ private SSH key ของบริษัท
- Python 3.11+ และ dependencies ใน `requirements.txt` เฉพาะเมื่อเตรียม CAD ไม่จำเป็นสำหรับดูชุดสาธิต
- ODA File Converter ติดตั้งแยกและตรวจสิทธิ์ใช้งานเฉพาะเมื่ออ่าน DWG; ไม่ bundle converter หรือ AutoCAD

## Install

Clone ลงโฟลเดอร์ที่เขียนได้ หลีกเลี่ยง network share ที่ไม่มีการทดสอบ SQLite locking โฟลเดอร์ที่มี space รองรับโดย Windows scripts ใช้ `Setup-ITField.cmd` หรือ `npm ci; npm run build; npm run demo` รันแต่ละคำสั่งและตรวจ exit code ก่อนคำสั่งถัดไป

Setup ไม่ติดตั้ง Node/Git/SSH ให้เอง และไม่มีสิทธิ์ administrator โดยอัตโนมัติ หาก PowerShell policy ของบริษัทห้าม scripts ให้ฝ่าย IT อนุมัติตามนโยบายบริษัท ไม่แก้ global execution policy

## Network / environment

Default Node bind คือ `127.0.0.1:42873`; controller ใช้ port 42873 ตายตัว การเปลี่ยน `ITFIELD_PORT` ใช้กับ CLI `npm start` เท่านั้นและต้องปรับ tooling ที่ผูก port ก่อนใช้ controller

```powershell
$env:ITFIELD_HOST='127.0.0.1'
$env:ITFIELD_PORT='42874'
npm start
```

`.env.example` เป็นตัวอย่าง; server ไม่โหลด `.env` อัตโนมัติ สำหรับ LAN ต้องตั้ง `ITFIELD_HOST=0.0.0.0` เองและกำหนด firewall ตาม policy การเปิดผ่าน LAN HTTP ใช้ Service Worker ออฟไลน์ไม่ได้ ยกเว้น localhost จึงควรใช้ HTTPS ที่ได้รับอนุญาตสำหรับ tablet

Controller สร้างไฟล์ส่วนตัวใน `data/`; cache/temp ของ launcher อยู่ `.runtime/temp` ไม่ย้าย Windows global TEMP หรือ app credential การติดตั้งบน removable SSD ต้องให้เจ้าของเครื่องตรวจ volume identity และพื้นที่ก่อนทุกครั้ง ตัว portable repo ไม่ผูก GUID ของ SSD เครื่องใดเครื่องหนึ่ง

## Upgrade

หยุด services ของโปรเจคก่อน; backup `data/` ทั้งชุดไปยังตำแหน่งที่บริษัทอนุญาต; เก็บ browser results export ของแต่ละอุปกรณ์; pull/update source; `npm ci`, build และทดสอบ ชุดสาธิตจะไม่แทนที่ active-package ที่มีอยู่ ตรวจ source/dataset เดิมก่อน sync หลัง update

ไม่มี automated rollback/migration recovery ทุกกรณี รุ่น IndexedDB ปัจจุบันคือ v2; SQLite schema เริ่มต้นสร้างด้วย `CREATE TABLE IF NOT EXISTS` ดู architecture ก่อนแก้ schema
