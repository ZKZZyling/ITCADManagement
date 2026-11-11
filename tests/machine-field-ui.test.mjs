import test from 'node:test';import assert from 'node:assert/strict';
import {centerPoint,nudgePoint,pinchViewBox} from '../client/machine-field-ui.mjs';
test('center capture rejects non-drawing footer and nudge uses both calibrated axes without moving input',()=>{
 const view={width:1000,height:2000,drawableHeight:1800},point=[.5,.5];
 assert.deepEqual(centerPoint({x:0,y:0,w:1,h:1},view),point);
 assert.equal(centerPoint({x:0,y:.85,w:.2,h:.2},view),null);
 assert.deepEqual(nudgePoint(point,100,100,view,{mmPerPixelX:2,mmPerPixelY:4}),[.55,.5125]);
 assert.deepEqual(point,[.5,.5]);assert.equal(nudgePoint(point,100,0,view,null),null);
 assert.equal(nudgePoint([.99,.5],100,0,view,{mmPerPixel:2}),null);
});
test('pinch changes viewport only, keeps center and clamps bounds',()=>{
 assert.deepEqual(pinchViewBox({x:0,y:0,w:1,h:1},100,200),{x:.25,y:.25,w:.5,h:.5});
 assert.deepEqual(pinchViewBox({x:.8,y:.8,w:.2,h:.2},100,10),{x:0,y:0,w:1,h:1});
 const original={x:0,y:0,w:1,h:1};assert.equal(pinchViewBox(original,0,20),original);
});

import {localFieldDate} from '../client/machine-field-ui.mjs';
test('field date uses local calendar before UTC midnight',()=>{const local=new Date(2026,10,11,0,30);assert.equal(localFieldDate(local),'2026-11-11');assert.equal(localFieldDate(new Date(2026,0,2,23,59)),'2026-01-02')});
import {comparisonContext} from '../client/machine-field-ui.mjs';
test('comparison context expires on point, source, baseline and datum changes',()=>{
 const d={id:'d1',sourceSHA256:'sha1',views:[{id:'v1',image:'one',sourceImageSHA256:'img1'}]},p={viewId:'v1',anchor:[.3,.4],status:'proposed'},j={surveyBaselines:{v1:{a:[0,0],b:[1,0]}},calibrations:{v1:{mmPerPixel:10}},machineDetails:{u1:{reference:{datum:'center',pointType:'machine-center'}}}};
 const original=comparisonContext(d,j,'u1',p);
 assert.notEqual(comparisonContext(d,j,'u1',{...p,anchor:[.31,.4]}),original);
 assert.notEqual(comparisonContext({...d,sourceSHA256:'sha2'},j,'u1',p),original);
 assert.notEqual(comparisonContext(d,{...j,surveyBaselines:{v1:{a:[0,0],b:[.9,0]}}},'u1',p),original);
 assert.notEqual(comparisonContext(d,{...j,machineDetails:{u1:{reference:{datum:'corner'}}}},'u1',p),original);
 assert.equal(comparisonContext(d,structuredClone(j),'u1',structuredClone(p)),original);
});
