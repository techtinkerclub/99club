/* 99 Club Studio root-scope PWA service worker v1.1.17 */
'use strict';

const CACHE_PREFIX='tt99-studio-';
const CACHE_NAME=CACHE_PREFIX+'v1.1.17';
const CORE_PAGES=[
  '/',
  '/games/',
  '/play/',
  '/help/',
  '/help/games/',
  '/contact/',
  '/privacy/',
  '/tools/99-club/custom/'
];
const CORE_FILES=[
  '/offline.html',
  '/manifest.webmanifest',
  '/tools/99-club/version.json',
  '/assets/99club/pwa/icon-192.png',
  '/assets/99club/pwa/icon-512.svg',
  '/assets/99club/pwa/pwa.css?v=5',
  '/assets/99club/pwa/pwa-register.js?v=7'
];

function sameOriginAsset(ref){
  try{
    const u=new URL(ref,self.location.origin);
    if(u.origin!==self.location.origin)return null;
    if(u.pathname.startsWith('/assets/99club/'))return u.pathname+u.search;
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

async function networkFirstPage(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch(e){
    return (await cache.match(request))||(await cache.match('/offline.html'))||Response.error();
  }
}

async function networkFirstAsset(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch(e){
    return (await cache.match(request))||Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(networkFirstPage(request));
    return;
  }

  if(url.pathname.startsWith('/assets/99club/')||
     url.pathname==='/manifest.webmanifest'||
     url.pathname==='/tools/99-club/version.json'){
    event.respondWith(networkFirstAsset(request));
  }
});
