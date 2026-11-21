// TVF Thời tiết · R11 service worker: lets the app open without signal on site.
// Network-first for the app shell; Supabase, login and Open-Meteo requests are never touched.
const CACHE='tvf-weather-shell-r11';
const SHELL=['/','/index.html','/manifest.webmanifest','/tvf-logo.png','/icon-192.png','/favicon-32.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tvf-weather-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  const isPage=req.mode==='navigate';
  if(!isPage&&!url.pathname.startsWith('/assets/')&&!SHELL.includes(url.pathname))return;
  e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(isPage?'/index.html':req,copy))}return res}).catch(()=>caches.match(isPage?'/index.html':req,{ignoreSearch:!isPage}).then(r=>r||Response.error())));
});
