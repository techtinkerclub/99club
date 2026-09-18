/* 99 Club Studio PWA service worker v1.0.4 */
'use strict';

const CACHE_PREFIX='tt99-studio-';
const CACHE_NAME=CACHE_PREFIX+'v1.0.4';
const SCOPE_PATH='/tools/99-club/';
const CORE_PAGES=[
  '/tools/99-club/',
  '/tools/99-club/games/',
  '/tools/99-club/games/play/',
  '/tools/99-club/games/help/',
  '/tools/99-club/custom/'
];
const CORE_FILES=[
  '/tools/99-club/manifest.webmanifest',
  '/assets/99club/pwa/icon-192.png',
  '/assets/99club/pwa/icon-512.svg',
  '/assets/99club/pwa/pwa.css?v=4',
  '/assets/99club/pwa/pwa-register.js?v=4'
];

function sameOriginAsset(ref){
  try{
    const u=new URL(ref,self.location.origin);
    if(u.origin!==self.location.origin)return null;
    if(u.pathname.startsWith('/assets/99club/')||u.pathname==='/assets/css/custom.css')return u.pathname+u.search;
  }catch(e){}
  return null;
}

async function putIfOk(cache,url,init){
  try{
    const response=await fetch(url,init);
    if(response&&response.ok){await cache.put(url,response.clone());return response;}
  }catch(e){}
  return null;
}

async function cachePageAndAssets(cache,pageUrl){
  const response=await putIfOk(cache,pageUrl,{cache:'reload'});
  if(!response)return;
  let html='';
  try{html=await response.clone().text();}catch(e){return;}
  const refs=new Set();
  const re=/(?:src|href)=["']([^"']+)["']/gi;
  let match;
  while((match=re.exec(html))!==null){const asset=sameOriginAsset(match[1]);if(asset)refs.add(asset);}
  await Promise.allSettled([...refs].map(url=>putIfOk(cache,url,{cache:'reload'})));
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE_FILES.map(url=>putIfOk(cache,url,{cache:'reload'})));
    for(const page of CORE_PAGES)await cachePageAndAssets(cache,page);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch(e){
    return (await cache.match(request))||(await cache.match('/tools/99-club/'))||Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  const update=fetch(request).then(async response=>{
    if(response&&response.ok)await cache.put(request,response.clone());
    return response&&response.ok?response:null;
  }).catch(()=>null);
  if(cached){update.catch(()=>null);return cached;}
  return (await update)||Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'&&url.pathname.startsWith(SCOPE_PATH)){
    event.respondWith(networkFirst(request));
    return;
  }

  if(url.pathname.startsWith('/assets/99club/')||
     url.pathname==='/assets/css/custom.css'||
     url.pathname==='/tools/99-club/manifest.webmanifest'){
    event.respondWith(staleWhileRevalidate(request));
  }
});
