import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceAreas,areaViewBox} from '../client/machine-workspace.mjs';
test('area navigation preserves explicit zones and distinct reviewed landmarks without assigning membership',()=>{
 const zone={id:'z',viewId:'f',nameTh:'Source zone',polygon:[[.1,.1],[.3,.1],[.3,.3]]};
 const rows=[{id:'a',viewId:'f',category:'utility',sourceZh:'配电室',textTh:'Electrical room',anchor:[.2,.4],effectiveStatus:'draft-reviewed',reviewRequired:true},{id:'b',viewId:'f',category:'utility',sourceZh:'配电室',anchor:[.7,.4],effectiveStatus:'draft-reviewed'},{id:'fragment',viewId:'f',category:'label',sourceZh:'4女',textTh:'หลังคา',anchor:[.4,.2],effectiveStatus:'pending'},{id:'other',viewId:'else',category:'label',sourceZh:'仓储区',anchor:[.1,.1],effectiveStatus:'draft-reviewed'},{id:'machine',viewId:'f',category:'equipment',sourceZh:'车间设备',anchor:[.1,.1],effectiveStatus:'draft-reviewed'}];
 const actual=workspaceAreas([zone,{...zone,id:'else',viewId:'else'}],'f',rows);
 assert.deepEqual(actual.map(a=>a.id),['zone:z','text:a','text:b']);assert.equal(actual[1].reviewRequired,true);assert.equal(actual[1].zoneId,undefined);assert.equal(actual[1].polygon,undefined);assert.deepEqual(actual[0].polygon,zone.polygon);
});
test('area focus uses real normalized anchors, bounds edge landmarks, and full view fallback',()=>{
 assert.deepEqual(areaViewBox(),{x:0,y:0,w:1,h:1});
 assert.deepEqual(areaViewBox({kind:'landmark',anchor:[.99,.01]}),{x:.65,y:0,w:.35,h:.35});
 const b=areaViewBox({kind:'zone',polygon:[[.2,.3],[.4,.3],[.4,.5],[.2,.5]]});assert.ok(Math.abs(b.x-.14)<1e-10);assert.ok(Math.abs(b.y-.24)<1e-10);assert.ok(Math.abs(b.w-.32)<1e-10);
 assert.deepEqual(areaViewBox({kind:'landmark',anchor:[NaN,.3]}),{x:0,y:0,w:1,h:1});
});
