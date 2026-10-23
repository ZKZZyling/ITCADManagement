import React,{useState} from 'react';
import {t} from './locale.mjs';
export const accessMessages={
 AUTH_REQUIRED:'เครื่องนี้ยังไม่มีสิทธิ์เข้าเว็บนี้ วางลิงก์เชิญล่าสุดเพื่อจับคู่ ไม่ต้องล็อกอิน ChatGPT',
 PAIR_INPUT:'วางลิงก์เชิญฉบับเต็มที่มี #pair= หรือรหัสจับคู่ 48 ตัว',
 PAIR_INVALID:'รหัสจับคู่ไม่ถูกต้อง ขอลิงก์เชิญล่าสุดจากผู้ดูแลเครื่องเซิร์ฟเวอร์',
 PAIR_ORIGIN:'ลิงก์หรือช่องทางไม่ตรงกับเว็บนี้ เปิดลิงก์ล่าสุดทั้งลิงก์ หากยังผิดพลาดให้ผู้ดูแลตรวจ Tunnel',
 PAIR_COOKIE:'เซิร์ฟเวอร์รับรหัสแล้ว แต่ Chrome ยังไม่ส่งสิทธิ์กลับ เปิดใน Chrome โดยตรงและอนุญาตคุกกี้ของเว็บนี้',
 NETWORK:'ติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตและใช้ลิงก์ล่าสุด ไม่ต้องเปลี่ยน DNS หรือ VPN อัตโนมัติ',
 HTTP_ERROR:'เซิร์ฟเวอร์หรือลิงก์ชั่วคราวยังไม่พร้อม ลองอีกครั้งหรือขอลิงก์ล่าสุด'
};
export function PairingPanel({code,busy,onPair,onRetry,onClose}){
 const [input,setInput]=useState('');
 return <section className="pairing-panel" aria-label={t('เชื่อมต่ออุปกรณ์')}>
  <div className="pairing-heading"><h2>{t('เชื่อมต่ออุปกรณ์')}</h2>{onClose&&<button type="button" onClick={onClose} aria-label={t('ปิด')}>×</button>}</div>
  <p role="status">{t(accessMessages[code]||accessMessages.AUTH_REQUIRED)}</p>
  <form onSubmit={e=>{e.preventDefault();onPair(input)}}>
   <label htmlFor="pair-invitation">{t('ลิงก์เชิญหรือรหัสจับคู่')}</label>
   <input id="pair-invitation" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={input} onChange={e=>setInput(e.target.value)} disabled={busy} placeholder={t('วางลิงก์ที่ผู้ดูแลส่งให้')} />
   <button className="primary" disabled={busy||!input.trim()} aria-busy={busy}>{busy?t('กำลังตรวจสิทธิ์…'):t('จับคู่และเปิดแบบ')}</button>
  </form>
  <button type="button" className="soft" disabled={busy} onClick={onRetry}>{t('ตรวจการเชื่อมต่ออีกครั้ง')}</button>
  <details><summary>{t('ต้องใช้เครือข่ายแบบไหน?')}</summary>
   <p>{t('ลิงก์ HTTPS ภายนอกใช้เน็ตทั่วไปได้ ไม่ต้องอยู่ Wi-Fi โรงงาน และแอพไม่บังคับ VPN หรือซิมไทย')}</p>
   <p>{t('การเข้าถึงจากจีนขึ้นกับเครือข่ายและบริการ Tunnel ที่ใช้ หากเข้าไม่ได้ให้ใช้เครือข่ายที่บริษัทอนุญาต')}</p>
   <p>{t('ชื่อเว็บชั่วคราวอาจเปลี่ยน สิทธิ์และข้อมูลออฟไลน์อยู่แยกตามชื่อเว็บ เก็บสำรองก่อนเปลี่ยนลิงก์')}</p>
  </details>
  <p className="pairing-note">{t('ไม่ล้างผลตรวจเดิม รหัสไม่ถูกเก็บในโปรแกรม ผู้มีลิงก์มีสิทธิ์เข้าถึงงาน ส่งให้เฉพาะผู้ได้รับอนุญาต')}</p>
  <a href="/field/offline.html">{t('ตรวจออฟไลน์')}</a>
 </section>;
}
