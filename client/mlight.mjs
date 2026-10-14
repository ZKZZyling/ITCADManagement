let current;
export async function openCad(container,url='/cad/review.dxf'){
 const lib=await import('@mlightcad/cad-simple-viewer');
 const ui=await import('@mlightcad/cad-simple-ui-plugin');
 let dm;try{dm=lib.AcApDocManager.instance}catch{}
 if(!dm){lib.AcApDocManager.createInstance({container,autoResize:true,useMainThreadDraw:true,checkWorkersOnInit:false,disableExport:true,baseUrl:'/cad-resources/'});dm=lib.AcApDocManager.instance;
 const plugin=ui.acuiCreateSimpleUiPlugin({host:container,layout:'auto',toolbar:{placement:'bottom',collapsible:true,excludeItems:['annotation','export','open','new','undo','redo','delete']}});
 await dm.pluginManager.loadPlugin(plugin);
 }
 const r=await fetch(url);if(!r.ok)throw new Error('ไม่พบ DXF สำหรับ viewer');
 const ok=await dm.openDocument('IT-review.dxf',await r.arrayBuffer(),{drawNoPlotLayers:false,progressiveRendering:false,mode:lib.AcEdOpenMode.Read});
 if(ok===false)throw new Error('Viewer ปฏิเสธไฟล์');current=dm;return dm;
}
export function applyFilter(layers,system,context=true,unknown=true){if(!current?.curDocument)return;const service=current.curDocument.layerService;const on=[],off=[];for(const l of layers){const show=!l.off&&!l.frozen&&(context||l.system!=='context')&&(unknown||l.system!=='unknown')&&(system==='all'||l.system===system||(context&&l.system==='context')||(unknown&&l.system==='unknown'));(show?on:off).push(l.name)}service.setLayersVisibility(on,false);service.setLayersVisibility(off,true);}
