import {ObjectEvidence} from './ObjectEvidence.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {t} from './locale.mjs';import {WorkspaceHelp,guides} from './WorkspaceHelp.jsx';import {adviceFor} from './assistant-state.mjs';import './assistant.css';

function Clip(){return <svg viewBox="0 0 64 76" aria-hidden="true"><path d="M45 24V52c0 13-25 16-25 1V18C20 3 51 3 51 20v31c0 24-39 23-39 1V25" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/><path d="M45 24V51c0 7-12 8-12 0V24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><ellipse cx="27" cy="27" rx="7" ry="9" fill="white"/><ellipse cx="43" cy="27" rx="7" ry="9" fill="white"/><circle cx="29" cy="29" r="2.5" fill="#163744"/><circle cx="41" cy="29" r="2.5" fill="#163744"/><path d="M29 42q7 6 13-1" fill="none" stroke="#163744" strokeWidth="2.5" strokeLinecap="round"/></svg>}

export function FieldAssistant({mode,state={},staticMode=false,open:controlled,onOpenChange,avoidRight=false,onNavigate,contextKey}){
 const [localOpen,setLocalOpen]=useState(false),[focus,setFocus]=useState(''),[located,setLocated]=useState(false),[guide,setGuide]=useState(false);
 const open=controlled??localOpen,panel=useRef(null),launcher=useRef(null),highlight=useRef(null),frames=useRef([]);
 const setOpen=value=>{onOpenChange?onOpenChange(value):setLocalOpen(value)};
 useEffect(()=>{setFocus('')},[contextKey]);
 const advice=adviceFor(mode,state,focus);
 function clearHighlight(){frames.current.forEach(cancelAnimationFrame);frames.current=[];highlight.current?.classList.remove('assistant-target');highlight.current=null;setLocated(false)}
 useEffect(()=>{const focusIn=e=>{if(e.target.closest?.('.field-assistant'))return;const context=e.target.closest?.('[data-assist]')?.getAttribute('data-assist');if(context)setFocus(context)};document.addEventListener('focusin',focusIn);document.addEventListener('pointerup',focusIn);return()=>{document.removeEventListener('focusin',focusIn);document.removeEventListener('pointerup',focusIn)}},[]);
 useEffect(()=>{clearHighlight()},[advice.id]);
 useEffect(()=>{if(!open){clearHighlight();return;}const key=e=>{if(e.key==='Escape'){setOpen(false);launcher.current?.focus()}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[open]);
 useEffect(()=>()=>{frames.current.forEach(cancelAnimationFrame);highlight.current?.classList.remove('assistant-target')},[]);
 function locate(){clearHighlight();const key=advice.target;
  const point=()=>{const target=[...document.querySelectorAll('[data-assist="'+key+'"]')].find(el=>el.getClientRects().length&&!el.disabled);if(!target)return false;highlight.current=target;target.classList.add('assistant-target');target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});target.focus?.({preventScroll:true});setLocated(true);return true};
  if(point())return;
  if(onNavigate){onNavigate(key);frames.current.push(requestAnimationFrame(()=>frames.current.push(requestAnimationFrame(()=>{if(!point())setGuide(true)}))))}else setGuide(true);
 }
 function toggle(){if(open)clearHighlight();setOpen(!open)}
 return <div className={'field-assistant'+(avoidRight?' assistant-left':'')}>
  {open&&<section ref={panel} className="assistant-panel" role="region" aria-label={t('ผู้ช่วยหน้างาน')}>
   <header><div><strong>{t('ผู้ช่วยหน้างาน')}</strong><small>{t(guides[mode].name)}</small></div><button type="button" onClick={toggle} aria-label={t('ย่อผู้ช่วย')}>×</button></header>
   <div className="assistant-advice" aria-live="polite" aria-atomic="true"><b>{t(advice.title)}</b><p>{t(advice.body)}</p></div>
   <ObjectEvidence object={state.evidence} units={state.units}/><div className="assistant-actions"><button type="button" onClick={locate}>{located?t('ชี้ตำแหน่งแล้ว'):t('ชี้ให้ดู')}</button><button type="button" onClick={()=>setGuide(!guide)} aria-expanded={guide}>{t('คู่มือเต็ม')}</button></div>
   {guide&&<WorkspaceHelp mode={mode} staticMode={staticMode} initialOpen/>}
   <p className="assistant-privacy">{t('คำแนะนำจากสถานะในเครื่อง ไม่ส่งข้อมูล ไม่บันทึกหรืออนุมัติงานแทนคุณ')}</p>
  </section>}
  <button ref={launcher} type="button" className="assistant-launcher" title={t(advice.title)} onClick={toggle} aria-expanded={!!open} aria-label={t('เปิดหรือย่อผู้ช่วยหน้างาน')}><Clip/><span>{t('ช่วยแนะนำ')}</span>{(state.error||state.pendingCount>0||state.conflictCount>0)&&<i aria-label={t('มีเรื่องให้ตรวจสอบ')}>!</i>}</button>
 </div>;
}
