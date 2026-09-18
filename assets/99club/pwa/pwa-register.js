/* 99 Club Studio PWA registration + install/update helper v6 */
(function(){
'use strict';
const APP_PATHS=new Set(['/','/games/','/play/','/help/','/help/games/','/contact/','/privacy/','/tools/99-club/custom/']);
if(!APP_PATHS.has(location.pathname))return;

const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isSafari=/safari/i.test(navigator.userAgent)&&!/crios|fxios|edgios|opios/i.test(navigator.userAgent);
const currentBuild=document.querySelector('meta[name="tt99-build"]')?.content?.trim()||'';
const appliedKey='tt99-pwa-applied-build';
const dismissedKey='tt99-pwa-update-dismissed';
let deferredPrompt=null;
let installCard=null;
let updateCard=null;
let updateTarget='';
let registration=null;
let refreshing=false;
let lastVersionCheck=0;

function safeGet(store,key){try{return store.getItem(key)||'';}catch(e){return '';}}
function safeSet(store,key,value){try{store.setItem(key,value);}catch(e){}}
function safeRemove(store,key){try{store.removeItem(key);}catch(e){}}

function lockStandaloneViewport(){
  if(!standalone)return;
  let viewport=document.querySelector('meta[name="viewport"]');
  if(!viewport){
    viewport=document.createElement('meta');
    viewport.name='viewport';
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

  const preventGesture=e=>{if(e.cancelable)e.preventDefault();};
  document.addEventListener('gesturestart',preventGesture,{passive:false});
  document.addEventListener('gesturechange',preventGesture,{passive:false});
  document.addEventListener('gestureend',preventGesture,{passive:false});
  document.addEventListener('touchmove',e=>{
    if(e.touches?.length>1&&e.cancelable)e.preventDefault();
  },{passive:false});
}

// Installed desktop/Android/iOS apps are deliberately isolated from the host
// website chrome. The normal browser site is unchanged.
if(standalone){
  document.documentElement.classList.add('tt99-standalone');
  lockStandaloneViewport();
}

function appliedBuild(){return safeGet(localStorage,appliedKey);}
function markApplied(version){if(version)safeSet(localStorage,appliedKey,version);}

function hideUpdate(){
  if(updateCard){updateCard.remove();updateCard=null;}
}

function showUpdate(target){
  if(!standalone||refreshing)return;
  const version=String(target||currentBuild||'latest').trim();
  if(safeGet(sessionStorage,dismissedKey)===version)return;
  updateTarget=version;
  if(updateCard)return;
  updateCard=document.createElement('aside');
  updateCard.className='tt99-pwa-update';
  updateCard.setAttribute('role','status');
  updateCard.setAttribute('aria-live','polite');
  updateCard.innerHTML='<span class="tt99-pwa-update__badge" aria-hidden="true">↻</span><div><strong>Update available</strong><span>Refresh to use the latest 99 Club Studio.</span></div><button type="button" class="tt99-pwa-update__action">Refresh</button><button type="button" class="tt99-pwa-update__close" aria-label="Remind me later">×</button>';
  document.body.appendChild(updateCard);
  updateCard.querySelector('.tt99-pwa-update__action').addEventListener('click',refreshToLatest);
  updateCard.querySelector('.tt99-pwa-update__close').addEventListener('click',()=>{
    safeSet(sessionStorage,dismissedKey,version);
    hideUpdate();
  });
}

async function clearStudioCaches(){
  if(!('caches' in window))return;
  try{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('tt99-studio-')).map(name=>caches.delete(name)));
  }catch(e){console.warn('99 Club cache refresh failed',e);}
}

async function refreshToLatest(){
  if(refreshing)return;
  refreshing=true;
  const button=updateCard?.querySelector('.tt99-pwa-update__action');
  if(button){button.disabled=true;button.textContent='Updating…';}
  const target=updateTarget||currentBuild;
  try{
    await clearStudioCaches();
    if(registration){try{await registration.update();}catch(e){}}
    markApplied(target);
    safeRemove(sessionStorage,dismissedKey);
  }finally{
    location.reload();
  }
}

async function latestBuild(){
  const response=await fetch(`/tools/99-club/version.json?ts=${Date.now()}`,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
  if(!response.ok)throw new Error(`version check returned ${response.status}`);
  const data=await response.json();
  return String(data?.version||'').trim();
}

async function checkForUpdate(force=false){
  if(!standalone||!navigator.onLine)return;
  const now=Date.now();
  if(!force&&now-lastVersionCheck<60000)return;
  lastVersionCheck=now;
  try{
    const latest=await latestBuild();
    if(!latest)return;
    const applied=appliedBuild();
    if(!applied){
      // First run after this update system is introduced: use the page currently
      // on screen as the baseline. Future deployments will compare against it.
      markApplied(currentBuild||latest);
      if(currentBuild&&latest!==currentBuild)showUpdate(latest);
      return;
    }
    if(latest!==applied||currentBuild&&currentBuild!==applied)showUpdate(latest);
  }catch(e){
    // Offline/temporary version-check failures are intentionally silent.
  }
}

function watchRegistration(reg){
  registration=reg;
  reg.addEventListener('updatefound',()=>{
    const worker=reg.installing;
    if(!worker)return;
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed'&&navigator.serviceWorker.controller&&standalone){
        // The service worker uses skipWaiting, so the new worker can activate
        // immediately. We still ask before reloading the visible app page.
        showUpdate(updateTarget||currentBuild);
      }
    });
  });
  // Ask the browser to check now instead of waiting for its normal SW interval.
  reg.update().catch(()=>{});
}

async function removeLegacyRegistration(){
  if(!('serviceWorker' in navigator)||!navigator.serviceWorker.getRegistrations)return;
  try{
    const regs=await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(reg=>{
      const worker=reg.active||reg.waiting||reg.installing;
      const script=worker?.scriptURL||'';
      return script.includes('/tools/99-club/sw.js')?reg.unregister():Promise.resolve(false);
    }));
  }catch(e){}
}

function registerSW(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',async()=>{
    // Earlier builds registered a narrower /tools/99-club/ worker. Remove it
    // before installing the root-scope worker so nested Studio pages do not
    // remain controlled by the legacy cache.
    await removeLegacyRegistration();
    navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(watchRegistration).catch(err=>console.warn('99 Club PWA service worker registration failed',err));
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(standalone&&!refreshing)showUpdate(updateTarget||currentBuild);
  });
}

function ensureCard(){
  if(standalone||installCard)return;
  installCard=document.createElement('aside');
  installCard.className='tt99-pwa-install';
  installCard.setAttribute('aria-label','Install 99 Club Studio');
  installCard.innerHTML='<div><strong>Install 99 Club Studio</strong><span>Use it like an app and keep recent resources available offline.</span></div><button type="button" class="tt99-pwa-install__action">Install</button><button type="button" class="tt99-pwa-install__close" aria-label="Dismiss install message">×</button>';
  document.body.appendChild(installCard);
  installCard.querySelector('.tt99-pwa-install__close').addEventListener('click',()=>{sessionStorage.setItem('tt99-pwa-dismissed','1');hideCard();});
  installCard.querySelector('.tt99-pwa-install__action').addEventListener('click',install);
}

function hideCard(){if(installCard){installCard.remove();installCard=null;}}

function iosInstructions(){
  let modal=document.querySelector('.tt99-pwa-modal');
  if(modal)return;
  modal=document.createElement('div');
  modal.className='tt99-pwa-modal';
  modal.innerHTML='<div class="tt99-pwa-modal__panel" role="dialog" aria-modal="true" aria-labelledby="tt99-pwa-ios-title"><button type="button" class="tt99-pwa-modal__close" aria-label="Close">×</button><span class="tt99-pwa-modal__badge">99</span><h2 id="tt99-pwa-ios-title">Install 99 Club Studio</h2><p>On iPhone or iPad, Safari installs web apps from the Share menu.</p><ol><li>Tap <strong>Share</strong> in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Make sure <strong>Open as Web App</strong> is enabled if Safari shows that option, then tap <strong>Add</strong>.</li></ol></div>';
  document.body.appendChild(modal);
  const close=()=>modal.remove();
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  modal.querySelector('.tt99-pwa-modal__close').addEventListener('click',close);
}

async function install(){
  if(deferredPrompt){
    const p=deferredPrompt;
    deferredPrompt=null;
    p.prompt();
    try{await p.userChoice;}catch(e){}
    hideCard();
    return;
  }
  if(isiOS&&isSafari){iosInstructions();return;}
  alert('Use your browser menu and choose Install app or Add to Home Screen.');
}

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  if(sessionStorage.getItem('tt99-pwa-dismissed')!=='1')ensureCard();
});
window.addEventListener('appinstalled',()=>{hideCard();deferredPrompt=null;});

function maybeShowIOS(){
  if(standalone||sessionStorage.getItem('tt99-pwa-dismissed')==='1')return;
  if(isiOS&&isSafari&&location.pathname==='/')setTimeout(ensureCard,900);
}

function startUpdateChecks(){
  if(!standalone)return;
  const applied=appliedBuild();
  if(applied&&currentBuild&&applied!==currentBuild)showUpdate(currentBuild);
  checkForUpdate(true);
  window.addEventListener('online',()=>checkForUpdate(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkForUpdate(true);});
  window.setInterval(()=>checkForUpdate(false),10*60*1000);
}

registerSW();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{maybeShowIOS();startUpdateChecks();},{once:true});else{maybeShowIOS();startUpdateChecks();}
})();
