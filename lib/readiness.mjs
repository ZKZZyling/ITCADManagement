// Planning only. Evidence recorded here does not grant engineering approval.
export const FORMAT='itcad-readiness-v1';
export const MAX_IMPORT_BYTES=2*1024*1024;
export const STATUS=Object.freeze(['unconfirmed','planned','evidence-recorded','blocked']);
const label=(th,zh,en)=>({th,zh,en});
export const CATEGORIES=Object.freeze({
 room:label('ห้องและตู้แร็ก','机房与机柜','Room and racks'),
 power:label('ไฟฟ้าและ UPS','供电与UPS','Power and UPS'),
 environment:label('สภาพแวดล้อมและความปลอดภัย','环境与安全','Environment and safety'),
 pathway:label('ท่อและรางสาย','管线与桥架','Cable pathways'),
 cabling:label('สายทองแดงและใยแก้ว','铜缆与光纤','Copper and fiber'),
 network:label('เครือข่ายและ Wi-Fi','网络与无线','Network and Wi-Fi'),
 erp:label('ERP จีนและระบบเชื่อมต่อ','中国ERP与系统接口','China ERP and interfaces'),
 operations:label('การทดสอบและดูแลระบบ','测试与运维','Testing and operations'),
});
export const PHASES=Object.freeze({
 structure:label('โครงสร้างและเตรียมงาน','主体结构与准备','Structure and preparation'),
 'rough-in':label('ประสานงานก่อนปิดงานซ่อน','隐蔽工程封闭前协调','Before concealed works close'),
 installation:label('ติดตั้งห้องและระบบสาย','机房与布线安装','Room and cabling installation'),
 commissioning:label('ตั้งค่าและทดสอบระบบร่วมกัน','配置与联调','Configuration and commissioning'),
 handover:label('ส่งมอบและดูแลระบบ','交付与运维','Handover and operations'),
});
// Public-safe prompts, not factory quantities, settings or approved design values.
const catalogue=[
 ['room-location','room','structure','ยืนยันพื้นที่ห้อง IT','确认IT机房位置','Confirm IT room location','ระบุห้องจากแบบล่าสุด ประสานเจ้าของพื้นที่และการเข้าถึง','依据最新版图纸确认房间、责任方及进出条件','Confirm the room, responsible party and access against current drawings'],
 ['rack-space','room','structure','พื้นที่และทางขนย้ายตู้','机柜空间与搬运通道','Rack space and delivery access','ยืนยันขนาดตู้ ระยะใช้งานและเส้นทางขนย้ายกับผู้ออกแบบ','与设计方确认机柜尺寸、操作空间及搬运路线','Agree rack dimensions, working clearance and delivery route with the designer'],
 ['rack-layout','room','installation','ผังตู้และตำแหน่งอุปกรณ์','机柜布局与设备位置','Rack and equipment layout','จัดผัง U พร้อมน้ำหนักและช่องว่างตามข้อมูลอุปกรณ์จริง','根据设备资料编制U位、重量及预留空间表','Prepare U positions, weights and spare space from actual equipment data'],
 ['room-openings','room','rough-in','ช่องเปิดและงานกันน้ำ','预留孔洞与防水协调','Openings and water protection','ประสานช่องเปิด จุดผ่านผนังและความเสี่ยงน้ำก่อนปิดงาน','封闭前协调预留孔洞、穿墙位置及水侵风险','Coordinate penetrations and water risks before closing works'],
 ['power-circuit','power','rough-in','วงจรไฟเลี้ยง IT','IT供电回路','IT power circuit','ยืนยันว่าสายและวงจรไฟรองรับรายการโหลดโดยฝ่ายไฟฟ้า','由电气专业确认供电回路与线缆满足设备负载清单','Have the electrical discipline verify circuits and cabling against the load register'],
 ['load-register','power','structure','บัญชีโหลดอุปกรณ์','设备负载清单','Equipment load register','บันทึกกำลังไฟสูงสุดตามป้ายหรือเอกสารพร้อมรายการที่ยังไม่ทราบ','按铭牌或资料记录最大功率，并列出未知项','Record maximum rated power from equipment documentation and list unknowns'],
 ['ups-design','power','installation','ข้อกำหนด UPS','UPS需求','UPS requirements','ให้ผู้รับผิดชอบกำหนดโหลดสำคัญ เวลาสำรองและการบำรุงรักษา','由责任方确认关键负载、后备时间及维护方式','Have the responsible designer specify critical loads, runtime and maintenance'],
 ['pdu-circuit','power','installation','PDU และการจัดวงจร','PDU与回路分配','PDU and circuit allocation','ตรวจพิกัด PDU ปลั๊กและการระบุวงจรกับรายการอุปกรณ์','按设备清单核对PDU额定值、插座与回路标识','Check PDU ratings, connectors and circuit labels against equipment'],
 ['earthing','power','installation','การต่อลงดินและบอนดิ้ง','接地与等电位连接','Earthing and bonding','ขอแบบและผลทดสอบจากผู้รับผิดชอบไฟฟ้า เกณฑ์ตามแบบที่อนุมัติ','取得电气责任方的图纸与测试记录，判据以批准文件为准','Obtain electrical drawings and test records against approved criteria'],
 ['cooling','environment','structure','การระบายความร้อนห้อง IT','机房散热与空调','IT room cooling','ส่งโหลดความร้อนและเวลาทำงานให้ฝ่ายเครื่องกลยืนยันระบบ','提交散热负荷与运行时间，由暖通专业确认方案','Submit heat loads and operating hours for mechanical design confirmation'],
 ['environment-monitor','environment','commissioning','ติดตามสภาพห้อง','机房环境监测','Room environment monitoring','กำหนดจุดตรวจและผู้รับแจ้งอุณหภูมิ ความชื้นและน้ำรั่วตามความเสี่ยง','按风险确定温湿度、漏水监测点及告警责任人','Define risk-based temperature, humidity and leak monitoring and alert owners'],
 ['fire-interface','environment','rough-in','ประสานระบบอัคคีภัย','消防系统协调','Fire system coordination','ให้ฝ่ายอัคคีภัยยืนยันเงื่อนไขและจุดเชื่อมต่อก่อนติดตั้ง','安装前由消防专业确认要求与接口','Obtain fire discipline confirmation of requirements and interfaces before installation'],
 ['room-access','environment','installation','สิทธิและความปลอดภัยห้อง','机房访问与安全','Room access and security','กำหนดผู้เข้าห้อง การเก็บกุญแจและการตอบสนองเหตุ','明确机房访问权限、钥匙管理及事件响应','Define room access, key control and incident response'],
 ['main-pathway','pathway','structure','แนวท่อและรางหลัก','主干管线与桥架','Main pathways','เชื่อมโยงแนวสายระหว่างอาคารกับแบบรวมระบบและผู้รับผิดชอบ','将楼间路由与综合管线图及责任方对应','Coordinate inter-building pathways with combined services drawings and owners'],
 ['sleeves','pathway','rough-in','ปลอกท่อและช่องผ่านโครงสร้าง','套管与结构穿越','Sleeves and structural crossings','ยืนยันตำแหน่งก่อนเทหรือปิดงานโดยผู้รับผิดชอบโครงสร้าง','浇筑或封闭前由结构责任方确认位置','Obtain structural confirmation before pouring or concealment'],
 ['service-separation','pathway','rough-in','ประสานระยะห่างระบบอื่น','与其他专业间距协调','Separation from other services','ให้ผู้ออกแบบยืนยันการแยกไฟฟ้า น้ำและสัญญาณตามแบบรวมระบบ','依据综合管线图，由设计方确认强电、给排水与信号线的分隔','Have designers confirm separation of power, water and data in coordinated drawings'],
 ['pathway-capacity','pathway','rough-in','ความจุรางและการบำรุงรักษา','桥架容量与维护空间','Pathway capacity and access','ตรวจชนิดสาย จำนวนสายและพื้นที่สำรองกับแบบรายละเอียด','按深化图核对线缆类型、数量及预留空间','Check cable types, quantities and reserve against detailed design'],
 ['copper-schedule','cabling','installation','ตารางสายทองแดงและพอร์ต','铜缆与端口表','Copper cable and port schedule','บันทึกต้นทาง ปลายทาง ประเภทสายและป้ายจากแบบที่ยืนยัน','按确认图纸记录起点、终点、线缆类型与标签','Register confirmed endpoints, cable types and labels'],
 ['fiber-schedule','cabling','installation','จำนวนและการจัดสรรแกนใยแก้ว','光纤与纤芯表','Fiber and core schedule','ยืนยันชนิด จำนวนและการจัดสรรแกนใยแก้ว หัวต่อและอุปกรณ์แปลงสัญญาณ','确认光纤类型、芯数、连接器及光模块','Confirm fiber type, core allocation, connectors and transceivers'],
 ['cabling-tests','cabling','commissioning','ทดสอบและระบุสาย','布线测试与标识','Cable testing and identification','เก็บผลทดสอบที่ผูกกับหมายเลขสายและเกณฑ์ที่ตกลง','保存与线缆编号及约定判据对应的测试记录','Retain tests linked to cable IDs and agreed criteria'],
 ['cable-records','cabling','handover','แบบสายตามติดตั้งจริง','布线竣工资料','As-built cabling records','รับตารางพอร์ต ตารางแกนใยแก้ว รูปและแบบตามติดตั้งจริง','接收端口表、纤芯表、照片与竣工图','Collect port and core schedules, photographs and as-built drawings'],
 ['network-zones','network','structure','แบ่งกลุ่มระบบเครือข่าย','网络分区','Network zones','ตกลงการแยกระบบสำนักงาน ERP กล้องและอุปกรณ์ผลิตตามความเสี่ยง','按风险商定办公、ERP、视频监控与生产设备的网络分区','Agree risk-based zones for office, ERP, CCTV and production equipment'],
 ['network-config','network','commissioning','แผน IP และพอร์ตเครือข่าย','IP与交换机端口规划','IP and switch port plan','ยืนยัน IP VLAN พอร์ตและผู้เปลี่ยนค่ากับเจ้าของระบบ','与系统责任方确认IP、VLAN、端口及变更权限','Confirm IPs, VLANs, ports and change ownership with system owners'],
 ['poe-budget','network','installation','งบกำลังไฟ PoE','PoE功率预算','PoE power budget','เทียบโหลดปลายทางกับงบกำลังไฟและข้อจำกัดสวิตช์จริง','按实际交换机功率预算与限制核对终端负载','Compare endpoint demand against actual switch PoE limits'],
 ['wifi-survey','network','commissioning','สำรวจ Wi-Fi หน้างาน','现场无线勘测','On-site Wi-Fi survey','ยืนยันตำแหน่ง AP และทดสอบกับเครื่องจริงเมื่อสภาพอาคารเหมาะสม','在建筑条件适合时确认AP位置并用实际终端测试','Confirm AP locations and test real devices when building conditions permit'],
 ['uplink-failover','network','commissioning','ลิงก์หลักและการกู้คืน','上联与故障恢复','Uplinks and recovery','ทดสอบเส้นทางหลักและการกู้คืนตามแบบและวิธีที่เจ้าของอนุมัติ','按业主批准的方案与方法测试主链路及恢复','Test primary links and recovery using owner-approved design and methods'],
 ['china-route','erp','structure','เส้นทางไป ERP จีน','至中国ERP的连接路径','Path to China ERP','ให้ทีมจีนและไทยยืนยันเส้นทาง สิทธิและข้อกำหนดการเชื่อมต่อ','由中泰团队确认连接路径、权限与接入要求','Have China and Thailand owners confirm routing, access and connection requirements'],
 ['erp-environment','erp','commissioning','สภาพแวดล้อมและสิทธิ ERP','ERP环境与权限','ERP environment and access','ใช้บัญชีและสภาพแวดล้อมทดสอบที่เจ้าของจัดให้ แยกสิทธิ ERP กับระบบอื่น','使用责任方提供的测试账号与环境，区分ERP及其他系统权限','Use owner-provided test accounts and environment; distinguish ERP and other system permissions'],
 ['erp-real-device','erp','commissioning','ทดสอบธุรกรรมบนเครื่องจริง','实际终端业务测试','Real-device business tests','ทดสอบลำดับงานที่ตกลงด้วยข้อมูลทดสอบและผู้ใช้ที่รับผิดชอบ','由责任用户使用测试数据验证约定业务流程','Have responsible users exercise agreed workflows with test data'],
 ['printing','erp','commissioning','ระบบพิมพ์และป้าย','打印与标签','Printing and labels','ยืนยัน Print Client การเชื่อม Message Service และแม่แบบจากทีมจีน','由中国团队确认Print Client、Message Service连接及模板','Confirm Print Client, Message Service connection and templates with the China team'],
 ['pda-interface','erp','commissioning','PDA และเครื่องหน้างาน','PDA与现场终端','PDA and field terminals','ตรวจรุ่น ระบบเครือข่าย การสแกนและผลข้อมูลย้อนกลับด้วยเครื่องจริง','用实际终端核对型号、网络、扫码及数据回传','Use real terminals to verify models, network, scanning and returned data'],
 ['production-interface','erp','structure','การเชื่อมเครื่องจักรและ MES','设备与MES接口','Machine and MES interfaces','ขอเจ้าของข้อมูล โปรโตคอลและขอบเขตเชื่อมต่อ ห้ามอนุมานจากสาย','明确数据责任方、协议与接口范围，不依据线缆推定接口','Define data owners, protocols and interface scope; do not infer interfaces from cabling'],
 ['backup-recovery','operations','handover','สำรองและกู้คืนการตั้งค่า','配置备份与恢复','Configuration backup and recovery','กำหนดผู้สำรอง ขอบเขตและทดสอบกู้คืนตามสิทธิที่ได้รับ','明确备份责任、范围，并在授权下验证恢复','Assign backup scope and owners and verify authorized recovery'],
 ['handover-owners','operations','handover','เอกสารและผู้รับผิดชอบ','资料移交与责任人','Documentation and owners','ส่งมอบแบบ ตารางสาย ค่าอนุมัติและรายชื่อผู้ดูแลโดยไม่เก็บรหัสผ่านในแผน','移交图纸、线缆表、批准配置及维护联系人，计划中不存密码','Handover drawings, schedules, approved configurations and contacts without passwords in the plan'],
 ['incident-runbook','operations','handover','แนวทางเมื่อระบบขัดข้อง','故障处理流程','Incident runbook','กำหนดวิธีตรวจเบื้องต้น การส่งต่อจีนและวิธีทำงานเมื่อ ERP ใช้ไม่ได้','明确初步排查、向中国团队升级及ERP中断时的业务安排','Define first checks, China escalation and business arrangements during ERP outage'],
 ['change-control','operations','handover','การเปลี่ยนแปลงและทบทวน','变更与复核','Change control and review','บันทึกผู้อนุมัติ การเปลี่ยนแบบและผลทดสอบหลังเปลี่ยน','记录批准人、图纸变更与变更后测试结果','Record approvers, drawing changes and post-change tests'],
];
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function text(x,max=2000,optional=false){if(optional&&x===undefined)return '';if(typeof x!=='string'||x.length>max)throw Error('Invalid text');return x;}
function id(x){const v=text(x,100);if(!/^[-a-zA-Z0-9_:]+$/.test(v))throw Error('Invalid ID');return v;}
function number(x){if(x===null)return null;if(typeof x!=='number'||!Number.isFinite(x)||x<0)throw Error('Invalid nonnegative quantity');return x;}
function choice(x,values){if(!values.includes(x))throw Error('Invalid status or enum');return x;}
function list(x,max){if(!Array.isArray(x)||x.length>max)throw Error('Invalid array limit');return x;}
function safeObject(x,keys){if(!object(x))throw Error('Invalid object');for(const key of ['accepted','approved','engineeringApproval','engineeringApproved'])if(key in x)throw Error('Engineering approval is outside readiness planning');if(keys&&Object.keys(x).some(k=>!keys.includes(k)))throw Error('Unsupported object field');return x;}
function translated(x){safeObject(x,['th','zh','en']);return {th:text(x.th,2000),zh:text(x.zh,2000),en:text(x.en,2000)};}
function identity(x){if(!hex(x.sourceSHA256)||typeof x.datasetId!=='string'||!/^[-\w]{1,80}$/.test(x.datasetId))throw Error('Invalid drawing identity');return {sourceSHA256:x.sourceSHA256,datasetId:x.datasetId};}
export function planScope(drawing){const d=identity(drawing);return d.sourceSHA256+':'+d.datasetId;}
function evidence(raw){return list(raw,100).map(x=>{safeObject(x,['sourceSHA256','datasetId','sourceHandle','layer','viewId','sourceText','basis','reference']);return {...identity(x),sourceHandle:text(x.sourceHandle,200),layer:text(x.layer,500),viewId:text(x.viewId,200),sourceText:text(x.sourceText,12000),basis:choice(x.basis,['drawing','user','proposed','test']),...(x.reference===undefined?{}:{reference:text(x.reference,2000)})};});}
function unique(rows,seen=new Set()){for(const x of rows){if(seen.has(x.id))throw Error('Duplicate ID');seen.add(x.id);}return seen;}
function requireEvidence(rows){
 for(const row of rows){
  const meaningful=e=>e.sourceText.trim()||e.reference?.trim();
  if(row.status==='evidence-recorded'&&!row.evidence.some(meaningful))throw Error('Evidence-recorded status requires meaningful evidence');
  if(row.status==='drawing-observed'&&!row.evidence.some(e=>e.basis==='drawing'&&hex(e.sourceSHA256)&&e.sourceHandle.trim()&&meaningful(e)))throw Error('Drawing-observed status requires traceable drawing evidence');
  if(row.status==='test-recorded'&&!row.evidence.some(e=>e.basis==='test'&&meaningful(e)))throw Error('Test-recorded status requires meaningful user-recorded test evidence');
 }
}
export function createPlan(drawing){
 const scope=identity(drawing);
 return {format:FORMAT,schemaVersion:1,...scope,planId:'plan-'+scope.sourceSHA256.slice(0,12)+'-'+scope.datasetId,version:0,updatedAt:null,context:{hosting:'undecided',projectStage:'structure',name:''},requirements:catalogue.map(([id,category,phase,th,zh,en,cth,czh,cen])=>({id,category,phase,title:label(th,zh,en),criterion:label(cth,czh,cen),owner:'',status:'unconfirmed',notes:'',evidence:[]})),rooms:[],equipment:[],links:[],services:[],decisions:[]};
}
export function validatePlan(raw,drawing){
 let value=raw;if(typeof raw==='string'){if(new TextEncoder().encode(raw).length>MAX_IMPORT_BYTES)throw Error('Plan exceeds 2 MB');value=JSON.parse(raw);}
 safeObject(value,['format','schemaVersion','sourceSHA256','datasetId','planId','version','updatedAt','context','requirements','rooms','equipment','links','services','decisions']);let json;try{json=JSON.stringify(value);}catch{throw Error('Invalid JSON plan');}if(new TextEncoder().encode(json).length>MAX_IMPORT_BYTES)throw Error('Plan exceeds 2 MB');
 if(value.format!==FORMAT||value.schemaVersion!==1)throw Error('Unsupported readiness format');const scope=identity(value);if(drawing&&planScope(scope)!==planScope(drawing))throw Error('Readiness drawing identity mismatch');
 if(!Number.isSafeInteger(value.version)||value.version<0)throw Error('Invalid version');if(value.updatedAt!==null&&(typeof value.updatedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.updatedAt)||!Number.isFinite(Date.parse(value.updatedAt))||new Date(value.updatedAt).toISOString()!==value.updatedAt))throw Error('Invalid update time');
 const c=safeObject(value.context,['hosting','projectStage','name']);const context={hosting:choice(c.hosting,['china-shared','local','undecided']),projectStage:choice(c.projectStage,Object.keys(PHASES)),name:text(c.name,500)};
 const requirements=list(value.requirements,200).map(x=>{safeObject(x,['id', 'category', 'phase', 'title', 'criterion', 'owner', 'status', 'notes', 'evidence']);return {id:id(x.id),category:choice(x.category,Object.keys(CATEGORIES)),phase:choice(x.phase,Object.keys(PHASES)),title:translated(x.title),criterion:translated(x.criterion),owner:text(x.owner,500),status:choice(x.status,STATUS),notes:text(x.notes,12000),evidence:evidence(x.evidence)};});unique(requirements);
 const rooms=list(value.rooms,100).map(x=>{safeObject(x,['id', 'name', 'rackU', 'powerCircuit', 'cooling', 'ups', 'notes', 'evidence']);return {id:id(x.id),name:text(x.name,500),rackU:number(x.rackU),powerCircuit:text(x.powerCircuit,2000),cooling:text(x.cooling,2000),ups:text(x.ups,2000),notes:text(x.notes,12000),evidence:evidence(x.evidence)};});const roomIds=unique(rooms);
 const equipment=list(value.equipment,500).map(x=>{safeObject(x,['id', 'name', 'role', 'roomId', 'rackId', 'maxWatts', 'U', 'poeWatts', 'quantity', 'status', 'evidence']);if(!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>100000)throw Error('Invalid equipment quantity');const roomId=text(x.roomId,100),rackId=text(x.rackId,100);if(roomId&&!roomIds.has(roomId))throw Error('Unknown equipment room');return {id:id(x.id),name:text(x.name,500),role:text(x.role,200),roomId,rackId,maxWatts:number(x.maxWatts),U:number(x.U),poeWatts:number(x.poeWatts),quantity:x.quantity,status:choice(x.status,['unconfirmed','proposed','drawing-observed','test-recorded']),evidence:evidence(x.evidence)};});
 const endpoints=unique(equipment,new Set(roomIds));const equipmentIds=new Set(equipment.map(x=>x.id));for(const x of equipment)if(x.rackId&&(!equipmentIds.has(x.rackId)||x.rackId===x.id))throw Error('Unknown or self rack reference');
 const links=list(value.links,1000).map(x=>{safeObject(x,['id', 'from', 'to', 'medium', 'system', 'status', 'sourcePort', 'targetPort', 'lengthM', 'notes', 'evidence']);const from=id(x.from),to=id(x.to);if(!endpoints.has(from)||!endpoints.has(to)||from===to)throw Error('Invalid link endpoint');return {id:id(x.id),from,to,medium:text(x.medium,200),system:text(x.system,200),status:choice(x.status,['unconfirmed','proposed','drawing-observed','test-recorded']),sourcePort:text(x.sourcePort,200),targetPort:text(x.targetPort,200),lengthM:number(x.lengthM),notes:text(x.notes,12000),evidence:evidence(x.evidence)};});unique(links);
 const services=list(value.services,200).map(x=>{safeObject(x,['id', 'name', 'endpoint', 'protocol', 'port', 'owner', 'status', 'notes', 'evidence']);return {id:id(x.id),name:text(x.name,500),endpoint:text(x.endpoint,2000),protocol:text(x.protocol,100),port:text(x.port,100),owner:text(x.owner,500),status:choice(x.status,STATUS),notes:text(x.notes,12000),evidence:evidence(x.evidence)};});unique(services);
 const decisions=list(value.decisions,200).map(x=>{safeObject(x,['id', 'title', 'owner', 'status', 'notes']);return {id:id(x.id),title:text(x.title,1000),owner:text(x.owner,500),status:choice(x.status,STATUS),notes:text(x.notes,12000)};});unique(decisions);
 requireEvidence([...requirements,...equipment,...links,...services]);
 return {format:FORMAT,schemaVersion:1,...scope,planId:id(value.planId),version:value.version,updatedAt:value.updatedAt,context,requirements,rooms,equipment,links,services,decisions};
}
// Counts describe recorded planning evidence, never engineering acceptance.
export function summary(plan){const p=validatePlan(plan),counts=Object.fromEntries(STATUS.map(x=>[x,0])),unresolvedByCategory=Object.fromEntries(Object.keys(CATEGORIES).map(x=>[x,0]));for(const x of p.requirements){counts[x.status]++;if(x.status!=='evidence-recorded')unresolvedByCategory[x.category]++;}return {total:p.requirements.length,counts,unresolvedByCategory};}
export function calculateCapacity(equipment){
 const result={maxWatts:0,U:0,poeWatts:0,missing:{maxWatts:0,U:0,poeWatts:0},equipmentCount:0,quantity:0};
 for(const x of list(equipment,500)){safeObject(x);if(!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>100000)throw Error('Invalid equipment quantity');result.equipmentCount++;result.quantity+=x.quantity;for(const key of ['maxWatts','U','poeWatts']){const n=number(x[key]);if(n===null)result.missing[key]+=x.quantity;else {result[key]+=n*x.quantity;if(!Number.isFinite(result[key]))throw Error('Capacity overflow');}}}return result;
}
