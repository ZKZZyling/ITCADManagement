const BUILD='14a50657e018';
const PREFIX='itfield-shell-v3-';
self.addEventListener('install',e=>e.waitUntil((async()=>{const manifest=await (await fetch('/field/sw-shell.json',{cache:'no-store'})).json();if(manifest.version!==BUILD)throw Error('Shell version mismatch');const cache=await caches.open(PREFIX+manifest.version);await cache.addAll(manifest.files.map(file=>new Request(file,{cache:'reload'})));self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
// Company drawing data is cached only through explicit, verified offline packs.
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith('/field/'))return;const cached=async()=>await (await caches.open(PREFIX+BUILD)).match(e.request,{ignoreSearch:true});const fallback=async()=>await cached()||new Response('Offline resource not prepared',{status:503,headers:{'content-type':'text/plain'}});e.respondWith(fetch(e.request).then(async r=>r.status>=500?await cached()||r:r).catch(fallback))});
