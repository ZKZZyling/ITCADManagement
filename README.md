# ITCAD Management · IT Field Rayong

**พื้นที่ทำงานตรวจทานแบบและบันทึกงานหน้างานสำหรับ IT / LAN / Fiber / CCTV / Access / งานประสานไฟฟ้า** รองรับไทย จีนตัวย่อ และอังกฤษ มีเว็บออนไลน์ที่รันจากเครื่องผู้ดูแล และหน้าต่างออฟไลน์แยกสำหรับเตรียมแบบก่อนออกตรวจ

> สถานะ: **0.4.0 · review workspace / pilot** ไม่ใช่เครื่องมืออนุมัติทางวิศวกรรม ไม่ใช่ AutoCAD ที่แก้ DWG ได้เต็มรูปแบบ ข้อมูลสาธิตเป็นภาพและอุปกรณ์สมมติทั้งหมด การตรวจรับยังถูกบล็อกจนมีหลักฐาน revision และเกณฑ์โครงการที่ตรวจสอบได้

**English:** A self-hosted CAD review and field inspection workspace with multilingual UI, traceable source references, server-side previews, and explicitly prepared offline packs. This repository contains application source and synthetic training data generation, not factory drawings or inspection databases.

**中文:** 面向 IT、网络、光纤、监控及电气协调工作的图纸审阅和现场检查工具。支持简体中文、泰语及英语；可提前准备离线图纸并记录检查结果。演示数据全部为虚构，不可用于施工或工程验收。

![หน้าสาธิตภาษาจีน — ข้อมูลสมมติ ไม่มีแบบโรงงาน](docs/images/synthetic-demo-zh.png)

## เริ่มต้นใช้งานบน Windows

1. ติดตั้ง [Node.js](https://nodejs.org/) รุ่น 22.13 ขึ้นไป และ Git แล้ว clone:

   ```powershell
   git clone https://github.com/ZKZZyling/ITCADManagement.git
   cd ITCADManagement
   ```

2. ดับเบิลคลิก **`Setup-ITField.cmd`** ครั้งแรก: ติดตั้งจาก lockfile, build UI และสร้างชุดสาธิต หากมีชุดแบบที่ใช้งานอยู่แล้ว ตัวสาธิตจะไม่แทนที่ชุดนั้น
3. ดับเบิลคลิก **`ITField-Control.cmd`** แล้วกดเริ่มเว็บในเครื่อง ใช้ port `42873` เครื่องมือจะเปิดลิงก์จับคู่ให้อัตโนมัติ
4. เลือกแผ่น → ค้น tag/อุปกรณ์ → เลือกรายการ → บันทึก checklist/สถานะ/รูป/หมายเหตุ กดส่งข้อมูลเมื่อพร้อม หากเกิด conflict ให้ตรวจรายการค้างก่อนส่งซ้ำ
5. สำหรับทีมภายนอก กดเปิดลิงก์ทีมชั่วคราว แล้วส่งลิงก์จับคู่ผ่านช่องทางบริษัทที่ได้รับอนุญาต เครื่องแม่ข่ายต้องเปิดอยู่ ดู [คู่มือหน้างาน](docs/field-guide.md) และ [ออฟไลน์](docs/offline.md)

```powershell
# ทางเลือกสำหรับผู้พัฒนา
npm ci
npm run build
npm run demo
npm test
npm start
```

`npm start` เปิดเซิร์ฟเวอร์อย่างเดียว ไม่เปิด browser/จับคู่อัตโนมัติ ใช้ launcher บน Windows หรือ POST token จาก `data/pair-token` ไป `/api/pair` ภายในเครื่องเพื่อทดสอบ ห้ามโพสต์ token ลง issue, screenshot หรือ Git

## ทำอะไรได้ในรุ่นนี้

| งาน | การทำงานปัจจุบัน | ขอบเขตที่ต้องเข้าใจ |
|---|---|---|
| เลือกและกรองแบบ | หมวด LAN/Fiber, CCTV, access, power, pathway และรายการไม่ทราบหมวด | การจัดหมวดอาศัย layer/ข้อความ ต้องเทียบ legend ไม่ใช่ AI ยืนยันชนิดอุปกรณ์ |
| ดูภาพอ้างอิง | โหลดภาพที่เตรียมบนเซิร์ฟเวอร์ เลือกแผ่นและซูม | ภาพสาธิตเป็นภาพสมมติ; production ต้องจัดเตรียมภาพ/PDF จากผู้เขียนแบบ |
| ดู geometry | server raster และ optional MLight DXF viewer | เป็นข้อมูล derived; ไม่รับรอง dynamic block, xrefs, font, hatch และ proxy entities ทุกชนิด |
| งานตรวจ | checklist, notes, ผู้รับผิดชอบ, รูป, local queue, version conflict | สถานะติดตั้ง/ทดสอบเป็นสิ่งที่ผู้ตรวจบันทึก ไม่ใช่ระบบพิสูจน์การติดตั้งจริง |
| ความคืบหน้า | นับสถานะตาม source SHA และ dataset | ไม่คำนวณเปอร์เซ็นต์งานก่อสร้างจากจำนวนรายการตรวจโดยไม่มี BOQ |
| ออฟไลน์ | เตรียมแผ่นและ shell ล่วงหน้า; เปิดหน้าต่างแยก; export/import และส่งภายหลัง | ต้อง HTTPS/localhost, browser เดิม, pack ครบ; URL เปลี่ยนต้องย้ายด้วย export/import |
| หลายภาษา | UI ไทย / 简体中文 / English | ข้อความจากแบบและหมายเหตุคงต้นฉบับ ไม่แปลแบบเงียบ ๆ |
| ลิงก์ทีม | localhost.run HTTPS ผ่าน Windows OpenSSH | บริการภายนอกเห็น traffic, URL อาจเปลี่ยน ไม่มี SLA; Cloudflare เป็นตัวเลือกที่ยังมีข้อจำกัด DNS |
| AI | export evidence JSON สำหรับให้ผู้เชี่ยวชาญ/ChatGPT ตรวจทาน | ยังไม่มี automatic AI API, DWG editing agent หรือ engineering approval; ChatGPT Pro ไม่ให้ API ฟรีโดยอัตโนมัติ |

## เอกสารตามบทบาท

| ผู้ใช้งาน | เริ่มอ่าน |
|---|---|
| ผู้ตรวจใหม่ | [ขั้นตอนหน้างาน](docs/field-guide.md), [เตรียมออฟไลน์](docs/offline.md) |
| ผู้ดูแลเครื่อง | [ติดตั้ง](docs/installation.md), [เปิด/ปิดและแก้ปัญหา](docs/operations.md), [ความปลอดภัย](SECURITY.md) |
| ผู้จัดการ / หัวหน้าจีน | [คู่มือความคืบหน้า](docs/field-guide.md#ผู้จัดการและหัวหน้าจีน), [ข้อจำกัด](docs/limitations.md) |
| ผู้เตรียม CAD | [pipeline และการตรวจคุณภาพ](docs/cad-pipeline.md) |
| นักพัฒนา | [architecture](docs/architecture.md), [API/data](docs/api-data.md), [tests](docs/testing.md), [CONTRIBUTING](CONTRIBUTING.md) |
| ผู้พิจารณาใช้จริง | [release evidence](docs/release-validation.md), [roadmap](docs/roadmap.md), [third-party notices](THIRD_PARTY_NOTICES.md) |

## โครงสร้าง repository

```text
client/                 React UI, locale, field workflow, offline packs / IndexedDB
server/                 local Node HTTP server, SQLite, raster and proxy-origin guard
lib/validation.mjs      shared record/checklist validation
scripts/                build, synthetic demo, Windows controller, CAD preparation
tests/                  portable unit tests and isolated server integration
public/field/           HTML, manifest, service worker source
docs/                   installation, operations, architecture and evidence
.github/workflows/      build/tests/release scan on Windows and Linux
data/                   private runtime storage — generated, NOT tracked
public/field/assets/    generated browser bundles — NOT tracked
```

## สิทธิ์และข้อมูลบริษัท

ซอร์สใช้ [MIT](LICENSE) ตามเจ้าของโปรเจค ข้อมูลแบบจริง, Xrefs, PDF, ภาพหน้างาน, ผลตรวจ, credentials และรหัสจับคู่ **ไม่ได้เป็นส่วนหนึ่งของ license ซอร์สและไม่อยู่ใน repository นี้** Dependencies และตัวแปลง CAD มี license ของตนเอง ดู [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)

ก่อนหน้างานจริง ผู้รับผิดชอบต้องตรวจ revision/AFC, legend, SPEC, ITP, font, ขอบเขตแผ่น และความครบถ้วนของ dependencies พร้อมทดลองอุปกรณ์และเครือข่ายจริง ดู [release checklist](docs/testing.md)
