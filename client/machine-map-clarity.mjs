export function rasterSampling(view,natural,scale,dpr=1){
 if(natural?.error)return{state:'unavailable'};
 if(!natural||![natural.width,natural.height,view?.width,view?.height,scale,dpr].every(n=>Number.isFinite(n)&&n>0))return{state:'pending'};
 const metadataMatches=natural.width===view.width&&natural.height===view.height;
 if(!metadataMatches)return{state:'mismatch',width:natural.width,height:natural.height,metadataMatches:false};
 const x=scale*dpr/natural.width,y=scale*(view.height/view.width)*dpr/natural.height,ratio=Math.max(x,y);
 return{state:ratio>1+1e-8?'enlarged':'within-source',ratio,width:natural.width,height:natural.height,dpr,metadataMatches:true};
}
export function workAreaContext(view,area,zone){
 const floor=view?.titleTh||view?.titleZh||'ยังไม่ระบุชั้น';
 if(area?.kind==='landmark')return{floor,name:area.nameTh||area.nameZh,scope:'จุดข้อความ · ไม่มีขอบเขตห้อง',kind:'landmark'};
 if(area?.kind==='zone'||zone)return{floor,name:area?.nameTh||zone?.nameTh||zone?.nameZh||zone?.id,scope:'พื้นที่อ้างอิงโดยประมาณ',kind:'approximate'};
 return{floor,name:'ยังไม่เลือกห้อง/พื้นที่',scope:'ดูทั้งส่วนแบบนี้',kind:'none'};
}
