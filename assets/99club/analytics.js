/* 99 Club Studio analytics v1.1.0
 * Google Consent Mode is initialised in the page head before gtag.js loads.
 * Analytics storage remains denied until the visitor allows analytics.
 * Product events must never include pupil/school names, worksheet content,
 * free text, answers, seeds, URLs containing recreation data, or uploaded data.
 */
(function(global){
'use strict';

const cfg=global.TT99_ANALYTICS_CONFIG||{};
const measurementId=String(cfg.ga4MeasurementId||'').trim();
const validMeasurement=/^G-[A-Z0-9]+$/i.test(measurementId);
const PREF_KEY='tt99-analytics-choice-v1';
let choice=readChoice();

function readChoice(){
  try{
    const v=localStorage.getItem(PREF_KEY);
    return v==='allow'||v==='deny'?v:'';
  }catch(_){return '';}
}
function writeChoice(v){
  choice=v;
  try{localStorage.setItem(PREF_KEY,v);}catch(_){}
}
function cleanValue(value){
  if(value==null)return undefined;
  if(typeof value==='boolean')return value?1:0;
  if(typeof value==='number')return Number.isFinite(value)?value:undefined;
  const s=String(value).trim();
  return s.slice(0,100);
}
function cleanParams(params){
  const out={};
  Object.entries(params||{}).forEach(([key,value])=>{
    if(!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key))return;
    const clean=cleanValue(value);
    if(clean!==undefined&&clean!=='')out[key]=clean;
  });
  return out;
}
function gtag(){
  global.dataLayer=global.dataLayer||[];
  global.dataLayer.push(arguments);
}
function ensureGtag(){
  global.dataLayer=global.dataLayer||[];
  global.gtag=global.gtag||gtag;
}
function clearGaCookies(){
  const names=['_ga'];
  if(validMeasurement)names.push('_ga_'+measurementId.replace(/^G-/i,'').replace(/-/g,'_'));
  const domains=['',location.hostname,'.'+location.hostname.replace(/^www\./,'')];
  names.forEach(name=>domains.forEach(domain=>{
    const d=domain?'; domain='+domain:'';
    document.cookie=name+'=; Max-Age=0; path=/; SameSite=Lax'+d;
  }));
}
function setChoice(next){
  writeChoice(next);
  removeBanner();
  ensureGtag();
  global.gtag('consent','update',{
    analytics_storage:next==='allow'?'granted':'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied'
  });
  if(next!=='allow')clearGaCookies();
  if(global.TT99Analytics)global.TT99Analytics.enabled=next==='allow';
  updateSettingsState();
}
function track(name,params){
  if(choice!=='allow'||!validMeasurement)return false;
  ensureGtag();
  global.gtag('event',String(name||'').slice(0,40),cleanParams(params));
  return true;
}
function targetLabel(el){
  const href=el?.getAttribute?.('href')||'';
  if(href==='/tools/99-club/games/'||href==='/games/')return 'games';
  if(href==='/tools/99-club/games/play/'||href==='/play/')return 'play_online';
  if(href==='/tools/99-club/help/'||href==='/help/'||href==='/tools/99-club/games/help/'||href==='/help/games/')return 'help';
  if(href==='/schools/'||href.startsWith('/schools/#'))return 'integration_help';
  if(href==='/schools/widgets/')return 'widget_help';
  if(href==='/widget/builder/'||href.startsWith('/widget/builder/?'))return 'widget_builder';
  if(href==='/'||href==='/tools/99-club/')return 'club';
  if(el?.id==='tt99-contact-open'||el?.matches?.('[data-tt99-contact-open]'))return 'contact';
  if(el?.id==='tt99-kofi-open'||el?.matches?.('[data-tt99-kofi-open]'))return 'support';
  return '';
}
function bindNavigation(){
  document.addEventListener('click',e=>{
    if(choice!=='allow')return;
    const el=e.target.closest?.('a,button');
    if(!el)return;
    const target=targetLabel(el);
    if(target)track('navigation_click',{target,source_area:location.pathname});
  },{passive:true});
}
function bannerMarkup(){
  const privacy=String(cfg.privacyPath||'/privacy/');
  return '<aside class="tt99-analytics-banner" aria-label="Analytics choice">'+
    '<div><strong>Help improve 99 Club Studio</strong>'+
    '<p>Allow Google Analytics so we can see which pages, downloads, games and sharing features are useful. When available, product events may include an opaque school key and the referring website origin (domain only), but not the school name, pupil/teacher names, worksheet content or full referring page. <a href="'+privacy+'">Privacy details</a>.</p></div>'+
    '<div class="tt99-analytics-banner__actions">'+
    '<button type="button" data-analytics-deny>No thanks</button>'+
    '<button type="button" data-analytics-allow>Allow analytics</button>'+
    '</div></aside>';
}
function showBanner(){
  if(!validMeasurement||choice||document.querySelector('.tt99-analytics-banner'))return;
  document.body.insertAdjacentHTML('beforeend',bannerMarkup());
  const banner=document.querySelector('.tt99-analytics-banner');
  banner?.querySelector('[data-analytics-allow]')?.addEventListener('click',()=>setChoice('allow'));
  banner?.querySelector('[data-analytics-deny]')?.addEventListener('click',()=>setChoice('deny'));
}
function removeBanner(){document.querySelector('.tt99-analytics-banner')?.remove();}
function settingsMarkup(){
  const privacy=String(cfg.privacyPath||'/privacy/');
  return '<div class="tt99-analytics-panel" hidden>'+
    '<section class="tt99-analytics-panel__card" role="dialog" aria-modal="true" aria-labelledby="tt99-analytics-title">'+
    '<div class="tt99-analytics-panel__head"><div><h2 id="tt99-analytics-title">Privacy & analytics</h2>'+
    '<p>99 Club Studio loads the Google tag with analytics storage disabled. If you allow analytics, it can then use analytics storage to understand visits, downloads and feature usage so the free tools can be improved. Product events may include an opaque school key and a referring website origin when available.</p></div>'+
    '<button type="button" class="tt99-analytics-panel__close" data-analytics-close aria-label="Close">×</button></div>'+
    '<div class="tt99-analytics-panel__state"></div>'+
    '<p>No pupil names, school names, teacher names, uploaded logos, worksheet questions, answers, custom vocabulary, full referring page URLs, free text or recreation codes are deliberately sent as Google Analytics event data. <a href="'+privacy+'">Read the privacy details</a>.</p>'+
    '<div class="tt99-analytics-panel__actions"><button type="button" data-analytics-deny>Do not allow</button><button type="button" data-analytics-allow>Allow analytics</button></div>'+
    '</section></div>';
}
function ensureSettings(){
  if(!validMeasurement)return;
  if(!document.querySelector('.tt99-analytics-panel')){
    document.body.insertAdjacentHTML('beforeend',settingsMarkup());
    const panel=document.querySelector('.tt99-analytics-panel');
    const close=()=>{panel.hidden=true;};
    panel.querySelector('[data-analytics-close]')?.addEventListener('click',close);
    panel.addEventListener('click',e=>{if(e.target===panel)close();});
    panel.querySelector('[data-analytics-allow]')?.addEventListener('click',()=>{setChoice('allow');close();});
    panel.querySelector('[data-analytics-deny]')?.addEventListener('click',()=>{setChoice('deny');close();});
  }
  if(!document.querySelector('.tt99-analytics-settings')){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='tt99-analytics-settings';
    btn.textContent='Privacy & analytics';
    btn.addEventListener('click',openSettings);
    const footer=document.querySelector('footer,.page__footer')||document.body;
    footer.appendChild(btn);
  }
  updateSettingsState();
}
function updateSettingsState(){
  const box=document.querySelector('.tt99-analytics-panel__state');
  if(!box)return;
  box.textContent=choice==='allow'?'Analytics is currently allowed.':choice==='deny'?'Analytics is currently disabled.':'No analytics choice has been saved yet.';
}
function openSettings(){
  ensureSettings();
  const panel=document.querySelector('.tt99-analytics-panel');
  if(panel){updateSettingsState();panel.hidden=false;panel.querySelector('[data-analytics-close]')?.focus();}
}
function boot(){
  if(!validMeasurement){
    global.TT99Analytics={track:()=>false,openSettings:()=>{},enabled:false,configured:false};
    return;
  }
  ensureGtag();
  global.TT99Analytics={track,openSettings,enabled:choice==='allow',configured:true};
  bindNavigation();
  ensureSettings();
  if(!choice)showBanner();
}

global.TT99Analytics={track,openSettings,enabled:false,configured:validMeasurement};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
