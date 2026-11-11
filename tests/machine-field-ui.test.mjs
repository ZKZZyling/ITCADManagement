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
