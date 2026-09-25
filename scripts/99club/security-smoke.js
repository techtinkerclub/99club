'use strict';

const fs=require('fs');

function read(path){return fs.readFileSync(path,'utf8');}
function assert(condition,message){if(!condition){console.error('SECURITY QA FAIL:',message);process.exitCode=1;}}

const head=read('_includes/head/custom.html');
const analytics=read('assets/99club/analytics.js');
const banner=read('assets/99club/banner-actions-v2.js');
const app=read('assets/99club/app.js');
const play=read('_pages/99-club-games-play.md');
const telemetry=read('assets/99club/school-usage-config.js');
const sw=read('sw.js');
const privacy=read('_pages/privacy.md');

assert(!/<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js/i.test(head),
  'Google Analytics must not be loaded unconditionally from the page head.');
assert(/choice!==['"]allow['"]/.test(analytics)&&/createElement\(['"]script['"]\)/.test(analytics),
  'Analytics loader must remain gated behind explicit allow consent.');
assert(/send_page_view:\s*false/.test(analytics)&&/gtag\(['"]event['"],['"]page_view['"],safePage\)/.test(analytics),
  'GA4 page views must be sent manually from the sanitized page context.');
assert(/ref\.origin===location\.origin\s*\?\s*ref\.origin\+ref\.pathname\s*:\s*ref\.origin/.test(head),
  'Analytics referrers must strip query strings and fragments before GA4 sees them.');
assert(/html2canvas@1\.4\.1[^\n]+integrity=["']sha512-/i.test(play)&&/crossorigin=["']anonymous["']/i.test(play),
  'html2canvas CDN dependency must stay version-pinned with SRI and crossorigin.');
assert(/_url:location\.origin\+location\.pathname/.test(banner)&&/_url:location\.origin\+location\.pathname/.test(app),
  'All contact forms must send only origin + pathname, never the full URL.');
assert(/referrerPolicy=['"]no-referrer['"]/.test(banner)&&/referrerPolicy=['"]no-referrer['"]/.test(app),
  'Teacher-facing Ko-fi embeds must not send referrer information.');
assert(/enabled:\s*false/.test(telemetry)&&/endpoint:\s*['"]['"]/.test(telemetry),
  'First-party school telemetry must remain disabled until separately approved.');
const schoolUsage=read('assets/99club/school-usage.js');
assert(!/function hash32/.test(schoolUsage)&&/SCHOOL_KEY_STORE=['"]tt99-school-keys-v1['"]/.test(schoolUsage),
  'School identifiers must be random opaque keys, not deterministic hashes of public school names.');
assert(/SUPPORT_DISABLED_PATHS=new Set\(\[['"]\/play\/['"]/.test(banner),
  'Pupil-facing online play must not expose the Ko-fi payment panel.');
assert(/\/offline\.html/.test(sw)&&/networkFirstAsset/.test(sw)&&!/staleWhileRevalidate/.test(sw),
  'PWA must use an explicit offline fallback and network-first application assets.');
assert(/id=["']tt99-clear-local-data["']/.test(privacy),
  'Privacy page must keep the local-data reset control.');

if(!process.exitCode)console.log('Security/privacy regression checks passed.');
