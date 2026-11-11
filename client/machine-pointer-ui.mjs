export function acceptsMapPointer(event){return event?.button===0}
export function zoomAtMapPoint(box,point,factor){
 if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||!(factor>0&&Number.isFinite(factor)))return box;
 const w=Math.max(.1,Math.min(1,box.w*factor)),h=w;
 return{x:Math.max(0,Math.min(1-w,point[0]-(point[0]-box.x)/box.w*w)),y:Math.max(0,Math.min(1-h,point[1]-(point[1]-box.y)/box.h*h)),w,h};
}
export function markerPixels(scale){if(!(Number.isFinite(scale)&&scale>0))return null;return{body:14/scale,ring:21/scale,hit:22/scale,stroke:2/scale,font:11/scale}}
