import React,{useState} from 'react';
export default function MachineUnitMiniPlan({d,placement,onOpen}){
 const [failed,F]=useState(false),view=d.views.find(v=>v.id===placement?.viewId),point=placement?.anchor;
 if(!view||!point)return <div className="unit-mini-placeholder">ยังไม่มีจุดเครื่องจริงบนแบบ<br/><small>พื้นที่จากบัญชีไม่ใช่จุดติดตั้ง</small></div>;
 const w=view.width*.25,h=view.height*.25,x=Math.max(0,Math.min(view.width-w,point[0]*view.width-w/2)),y=Math.max(0,Math.min(view.height-h,point[1]*view.height-h/2));
 return <button className="unit-mini-plan" onClick={onOpen} aria-label="เปิดผังบริเวณเครื่องจริง"><span>บริเวณจุดเครื่องจริง · P</span>{failed?<small>โหลดภาพไม่ได้ เปิดผังเต็มเพื่อตรวจ</small>:<svg viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label="ผังย่อยจุดเครื่องจริง"><image href={'/api/machine-file?path='+encodeURIComponent(typeof view.image==='string'?view.image:view.image.path)} width={view.width} height={view.height} onError={()=>F(true)}/><circle cx={point[0]*view.width} cy={point[1]*view.height} r={w*.025} fill="#bc5221" stroke="white" strokeWidth={w*.008}/><text x={point[0]*view.width+w*.04} y={point[1]*view.height} fill="#bc5221" stroke="white" paintOrder="stroke" strokeWidth={w*.004} fontSize={w*.06}>P</text></svg>}<small>ขยายผัง · จุดบันทึก ไม่ใช่อนุมัติติดตั้ง</small></button>
}
