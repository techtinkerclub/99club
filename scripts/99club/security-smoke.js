'use strict';

const fs=require('fs');

function read(path){return fs.readFileSync(path,'utf8');}
function assert(condition,message){if(!condition)throw new Error(message);}

const head=read('_includes/head/custom.html');
const analytics=read('assets/99club/analytics.js');
const banner=read('assets/99club/banner-actions-v2.js');
const play=read('_pages/99-club-games-play.md');
const schoolUsage=read('assets/99club/school-usage.js');
const schoolUsageConfig=read('assets/99club/school-usage-config.js');
const widgetRuntime=read('assets/99club/widget-runtime.js');
const sw=read('sw.js');
const privacy=read('_pages/privacy.md');

assert(!head.includes('googletagmanager.com/gtag/js'),'GA4 must not be loaded unconditionally from the page head.');
assert(analytics.includes("choice!=='allow'"),'Analytics must gate collection on explicit allow.');
assert(analytics.includes("script.src='https://www.googletagmanager.com/gtag/js?id='"),'GA4 should load dynamically only through analytics.js.');
assert(analytics.includes("page_location:location.origin+location.pathname"),'GA page locations must discard query strings and fragments.');
assert(banner.includes('_url:window.location.origin+window.location.pathname'),'Contact form must not send query strings or fragments.');
assert(banner.includes("PUPIL_FACING=location.pathname==='/play/'"),'Pupil-facing routes must suppress payment UI.');
assert(play.includes('integrity="sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA=="'),'html2canvas must be pinned with SRI.');
assert(play.includes('crossorigin="anonymous"')&&play.includes('referrerpolicy="no-referrer"'),'External capture library must use anonymous CORS and no-referrer.');
assert(!schoolUsage.includes('function hash32'),'School keys must not be deterministic hashes of public school names.');
assert(schoolUsage.includes("SCHOOL_KEY_STORE='tt99-school-keys-v1'"),'Random school keys must be retained locally on staff devices.');
assert(schoolUsageConfig.includes('enabled: false')&&schoolUsageConfig.includes("endpoint: ''"),'First-party school telemetry must remain disabled until explicitly configured.');
assert(!widgetRuntime.includes('registerSchool?.'),'Public widgets must not register school names.');
assert(sw.includes("cache.match('/offline/')"),'Navigation failures must use the explicit offline page.');
assert(sw.includes('assetNetworkFirst'),'Mutable Studio assets must prefer the network before cached copies.');
assert(privacy.includes('Google Analytics library is not requested from Google unless you explicitly choose'),'Privacy notice must describe basic consent accurately.');
assert(privacy.includes('Clear 99 Studio data on this device'),'Privacy page must expose local-data clearing.');

console.log('99 Club security smoke: PASS');
