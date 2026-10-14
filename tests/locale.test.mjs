import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
import {t,setLocale,getLocale,messageText,recordsForDrawing,progressSummary} from '../client/locale.mjs';import {sheetTitle} from '../client/language.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../client/translations.json',import.meta.url),'utf8'));
test('UI catalogs cover source labels; drawing evidence remains original',()=>{
 for(const row of Object.values(catalog)){assert.ok(row.en);assert.ok(row['zh-CN']);assert.ok(!/[\u0e00-\u0e7f]/.test(row.en+row['zh-CN']))}
 const drawingText='一层视频监控平面图 / CCTV-01 / 230 V';assert.equal(t(drawingText,'en'),drawingText);assert.equal(t(drawingText,'zh-CN'),drawingText);
 setLocale('zh-CN');assert.equal(t('บันทึกผลตรวจ'),'保存检查结果');assert.equal(sheetTitle('一层视频监控平面图'),'一层视频监控平面图');
 setLocale('en');assert.equal(sheetTitle('一层视频监控平面图'),'CCTV plan · Floor 1');setLocale('invalid');assert.equal(getLocale(),'th');
 for(const file of ['main.jsx','WorkflowGuide.jsx','OfflineApp.jsx','AnalysisApp.jsx','ManagerApp.jsx','SandboxApp.jsx','WorkspaceHelp.jsx']){const code=fs.readFileSync(new URL('../client/'+file,import.meta.url),'utf8'),f=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
 function check(n){if(file==='WorkspaceHelp.jsx'&&ts.isStringLiteral(n)&&/[\u0e00-\u0e7f]/.test(n.text))assert.ok(catalog[n.text],'Missing guide translation: '+n.text);if(ts.isJsxText(n)&&n.text.trim()!=='ไทย')assert.ok(!/[\u0e00-\u0e7f]/.test(n.text),'Unlocalized JSX text: '+n.text);if(ts.isCallExpression(n)&&n.expression.getText(f)==='t'&&ts.isStringLiteral(n.arguments[0])&&/[\u0e00-\u0e7f]/.test(n.arguments[0].text))assert.ok(catalog[n.arguments[0].text.trim()],'Missing catalog: '+n.arguments[0].text);ts.forEachChild(n,check)}check(f);}
});
test('Progress does not mix datasets or invent completion percentage',()=>{
 const drawing={sourceSHA256:'abc',datasetId:'rev2'},records=[{id:'abc-rev2-point1',sourceSHA256:'abc',status:'installed',updated:'2026-10-13T00:00:00Z'},{id:'abc-rev1-point2',sourceSHA256:'abc',status:'accepted'},{id:'xyz-rev2-point3',sourceSHA256:'xyz',status:'failed'}];
 assert.equal(recordsForDrawing(records,drawing).length,1);const summary=progressSummary(records,drawing);assert.equal(summary.total,1);assert.equal(summary.counts.installed,1);assert.equal(summary.counts.accepted,0);assert.equal(summary.percentage,undefined);assert.equal(summary.lastUpdated,'2026-10-13T00:00:00Z');assert.equal(recordsForDrawing(records,null).length,0);
});
test('Changing language translates an existing status without changing drawing text',()=>{const key='เปิดข้อมูลสำหรับตรวจทานแล้ว • ตรวจสอบรุ่นแบบก่อนใช้หน้างาน';assert.equal(messageText(t(key,'zh-CN'),'th'),key);assert.equal(messageText(t(key,'en'),'zh-CN'),t(key,'zh-CN'));assert.equal(messageText('2-01机柜：18U壁挂机柜，就近取电','en'),'2-01机柜：18U壁挂机柜，就近取电')});
