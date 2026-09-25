#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const failures=[];

function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function check(ok,msg){
  if(ok)console.log('OK   '+msg);
  else{console.error('FAIL '+msg);failures.push(msg);}
}
function front(rel){
  const text=read(rel);
  const m=text.match(/^---\s*\n([\s\S]*?)\n---/);
  return {text,yaml:m?m[1]:''};
}
function frontValue(yaml,key){
  const prefix=key+':';
  const line=yaml.split(/\r?\n/).map(x=>x.trim()).find(x=>x.startsWith(prefix));
  if(!line)return '';
  return line.slice(prefix.length).trim().replace(/^["']|["']$/g,'');
}

const config=read('_config.yml');
const excludedItems=['docs','scripts','assets/99club/tests','README.md','MIGRATION_IDENTITY_AUDIT.md','package.json','package-lock.json'];
for(const item of excludedItems){
  check(config.split(/\r?\n/).some(line=>line.trim()==='- '+item),
    'Jekyll excludes '+item+' from the public build');
}
const qaReports=fs.readdirSync(path.join(ROOT,'assets/99club')).filter(name=>/QA_REPORT\.md$/i.test(name));
for(const name of qaReports){
  const rel='assets/99club/'+name;
  check(config.split(/\r?\n/).some(line=>line.trim()==='- '+rel),
    'Jekyll excludes internal QA report '+rel+' from the public build');
}
check(/defaults:[\s\S]*type:\s*"pages"[\s\S]*sitemap:\s*false/.test(config),
  'new pages are excluded from the sitemap by default');

const indexable=[
  ['index.md','/'],
  ['_pages/99-club-games.md','/games/'],
  ['_pages/99-club-games-play.md','/play/'],
  ['_pages/99-club-help.md','/help/'],
  ['_pages/99-club-games-help.md','/help/games/'],
  ['_pages/99-club-schools.md','/schools/'],
  ['_pages/99-club-widget-help.md','/schools/widgets/'],
  ['_pages/contact.md','/contact/'],
  ['_pages/privacy.md','/privacy/'],
  ['_pages/school-website-demo.html','/demo/']
];
for(const [rel,url] of indexable){
  const p=front(rel);
  check(frontValue(p.yaml,'sitemap')==='true',url+' is explicitly opted into the sitemap');
  check(!/noindex/i.test(frontValue(p.yaml,'robots')),url+' is not marked noindex');
}

const demo=read('_pages/school-website-demo.html');
check(/<link\s+rel=["']canonical["']\s+href=["']https:\/\/99studio\.uk\/demo\/["']\s*\/?\s*>/i.test(demo),
  '/demo/ declares the canonical https://99studio.uk/demo/ URL');

const noindexPages=[
  '_pages/99-club-custom.md',
  '_pages/99-club-widget-builder.md',
  '_pages/99-club-practice.md',
  '_pages/99-club-puzzle-practice.md',
  '_pages/99-club-widget.html',
  '_pages/99-club-challenge.md',
  '_pages/custom-shortcut.md',
  '_pages/legacy-99-club-games-help.md',
  '_pages/legacy-99-club-games-play.md',
  '_pages/legacy-99-club-games.md',
  '_pages/legacy-99-club-help.md'
];
for(const rel of noindexPages){
  const p=front(rel);
  check(frontValue(p.yaml,'sitemap')==='false',rel+' stays out of the sitemap');
}

check(frontValue(front('_pages/99-club-custom.md').yaml,'robots')==='noindex,nofollow,noarchive',
  'hidden Custom workspace explicitly requests noindex');
check(frontValue(front('_pages/99-club-widget-builder.md').yaml,'robots')==='noindex,nofollow,noarchive',
  'widget builder explicitly requests noindex');

const head=read('_includes/head/custom.html');
check(head.includes('{% if page.robots %}')&&head.includes('<meta name="robots" content="{{ page.robots | escape }}">'),
  'default-layout pages emit their explicit robots policy');

for(const rel of ['_layouts/practice.html','_layouts/puzzle-practice.html']){
  check(read(rel).includes('<meta name="robots" content="noindex,nofollow,noarchive">'),
    rel+' emits noindex for parent-facing generators');
}
for(const rel of [
  '_pages/99-club-widget.html','_pages/99-club-challenge.md','_pages/custom-shortcut.md',
  '_pages/legacy-99-club-games-help.md','_pages/legacy-99-club-games-play.md',
  '_pages/legacy-99-club-games.md','_pages/legacy-99-club-help.md'
]){
  check(/meta name="robots" content="noindex/i.test(read(rel)),rel+' emits noindex');
}

check(read('offline.html').includes('<meta name="robots" content="noindex,nofollow,noarchive">'),
  'offline fallback is noindex');

const robots=read('robots.txt');
check(/User-agent:\s*\*/i.test(robots)&&/Allow:\s*\//i.test(robots),
  'robots.txt permits crawling so noindex/404 responses can be seen');
check(!/^\s*Disallow:/mi.test(robots),
  'robots.txt does not hide noindex pages from crawlers');
check(/Sitemap:\s*https:\/\/99studio\.uk\/sitemap\.xml/i.test(robots),
  'robots.txt advertises the canonical sitemap');

check(fs.existsSync(path.join(ROOT,'docs/99club')),'internal documentation remains preserved in the repository');
check(fs.existsSync(path.join(ROOT,'scripts/99club')),'QA tooling remains preserved in the repository');
check(fs.existsSync(path.join(ROOT,'assets/99club/tests')),'browser/game test assets remain preserved in the repository');
check(qaReports.length>0,'internal QA reports remain preserved in the repository');

if(failures.length){
  console.error('\n'+failures.length+' SEO/indexability contract failure(s).');
  process.exit(1);
}
console.log('\nSEO/indexability contracts passed.');
