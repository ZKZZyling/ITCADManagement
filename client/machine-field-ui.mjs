export function centerPoint(box,view){
 const point=[box.x+box.w/2,box.y+box.h/2],bottom=(view.drawableHeight||view.height)/view.height;
 return point.every(Number.isFinite)&&point[0]>=0&&point[0]<=1&&point[1]>=0&&point[1]<=bottom?point:null;
}
export function nudgePoint(point,dxMm,dyMm,view,scale){
 const sx=scale?.mmPerPixelX||scale?.mmPerPixel,sy=scale?.mmPerPixelY||scale?.mmPerPixel;
 if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||![dxMm,dyMm,view.width,view.height,sx,sy].every(Number.isFinite)||view.width<=0||view.height<=0||sx<=0||sy<=0)return null;
 const next=[point[0]+dxMm/(view.width*sx),point[1]+dyMm/(view.height*sy)],bottom=(view.drawableHeight||view.height)/view.height;
 return next[0]>=0&&next[0]<=1&&next[1]>=0&&next[1]<=bottom?next:null;
}
export function pinchViewBox(box,startDistance,distance){
 if(!(startDistance>0&&distance>0))return box;
 const w=Math.max(.1,Math.min(1,box.w*startDistance/distance));
 return{x:Math.max(0,Math.min(1-w,box.x+(box.w-w)/2)),y:Math.max(0,Math.min(1-w,box.y+(box.h-w)/2)),w,h:w};
}

export function localFieldDate(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
