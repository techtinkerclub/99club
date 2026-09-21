#!/usr/bin/env node
'use strict';

const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
global.window=global;global.globalThis=global;
const G=require(path.join(ROOT,'assets/99club/generator.js'));
global.TT99Generator=G;
const B=require(path.join(ROOT,'assets/99club/school-brand.js'));global.TT99SchoolBrand=B;
const PP=require(path.join(ROOT,'assets/99club/parent-practice.js'));
global.TT99ParentPractice=PP;
const W=require(path.join(ROOT,'assets/99club/widget-config.js'));

const failures=[];
function check(ok,msg){if(ok)console.log('OK   '+msg);else{console.error('FAIL '+msg);failures.push(msg);}}

const clubs={};
for(const id of W.CLUB_IDS)clubs[id]=G.clone(PP.baseRules('classic',id));
clubs['55'].factorMax=11;
clubs['diamond'].arithmeticMax=900;

const tinyLogo='data:image/png;base64,AAAA';
const clubCfg=W.fromClubRules({
  widgetType:'club',integrationId:'wid_test12345',schemeId:'classic',orientation:'landscape',clubs,
  school:{schoolName:'Oakfield Primary School',logoDataUrl:tinyLogo,logoWidth:80,logoHeight:40},
  games:['maze','sumplete'],
  puzzles:[{link:'https://99studio.uk/practice/puzzles/#p=TT99GP1.TEST',minYear:4,maxYear:5,gameCount:3,vocabCount:2}]
});
clubCfg.selectedClubs=['33','55','diamond'];
const clubToken=W.encode(clubCfg),clubRound=W.decode(clubToken);
check(clubToken.startsWith('TT99W1.'),'widget token has versioned prefix');
check(clubRound.widgetType==='club','99 Club widget type round-trips');
check(clubRound.integrationId==='wid_test12345','widget integration ID round-trips');
check(clubRound.selectedClubs.join(',')==='33,55,diamond','selected clubs round-trip');
check(clubRound.games.length===0&&clubRound.puzzles.length===0,'99 Club public token strips games and puzzle packs');
check(clubRound.school.name==='Oakfield Primary School','public school name round-trips');
check(clubRound.school.logo===tinyLogo,'compact public school logo round-trips');
check(clubRound.school.logoWidth===80&&clubRound.school.logoHeight===40,'public school logo dimensions round-trip');
const brandToken=W.schoolBrandToken(clubRound),brand=B.decode(brandToken);
check(brand.name==='Oakfield Primary School'&&brand.logo===tinyLogo,'widget creates reusable public school-brand token');
check(clubRound.orientation==='landscape','orientation round-trips');
check(W.clubRules(clubRound,'55').factorMax===11,'custom Club rule patch round-trips');
check(W.clubRules(clubRound,'diamond').arithmeticMax===900,'post-99 custom rule patch round-trips');

const clubUrl=W.clubLink(clubRound,'55','https://99studio.uk');
check(/^https:\/\/99studio\.uk\/practice\/#p=TT99P1\./.test(clubUrl),'widget reconstructs locked parent-practice links');
const clubEmbed=W.embedCode(clubRound,'https://99studio.uk');
check(clubEmbed.includes('title="99 Club home practice"'),'Club embed has specific accessible title');
check(clubEmbed.includes('sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"'),'embed is sandboxed');
check(clubEmbed.includes('referrerpolicy="origin"'),'embed requests origin-only referrer attribution');
check(!clubEmbed.includes('noreferrer'),'embed does not suppress source-site attribution');
check(!clubEmbed.includes('allow-same-origin'),'embed does not grant same-origin access');

const gamesCfg=W.normalise({
  widgetType:'games',
  school:{name:'Oakfield Primary School',logo:tinyLogo,logoWidth:80,logoHeight:40},
  selectedClubs:['33','44'],
  games:['maze','sumplete','not-real'],
  puzzles:[
    {link:'https://99studio.uk/practice/puzzles/#p=TT99GP1.TEST',minYear:4,maxYear:5,gameCount:3,vocabCount:7},
    {link:'https://evil.example/practice/puzzles/#p=TT99GP1.TEST',minYear:4,maxYear:4,gameCount:2}
  ],
  defaultTab:'puzzles'
});
const gamesRound=W.decode(W.encode(gamesCfg));
check(gamesRound.widgetType==='games','Maths Games widget type round-trips');
check(gamesRound.selectedClubs.length===0&&Object.keys(gamesRound.clubPatches).length===0,'Maths Games public token strips Club content');
check(gamesRound.games.join(',')==='maze,sumplete','unknown games are rejected');
check(gamesRound.puzzles.length===1,'non-99studio puzzle links are rejected');
check(gamesRound.puzzles[0].vocabCount===7,'public vocabulary count metadata round-trips');
check(gamesRound.school.name==='Oakfield Primary School','school identity is available to Games widget');

const combined=W.normalise({selectedClubs:['33'],games:['maze']});
check(combined.widgetType==='combined','older widget configurations default to combined mode');

const badLogo=W.normalise({widgetType:'club',school:{name:'School',logo:'javascript:alert(1)'}});
check(badLogo.school.logo==='','non-image school logo data is rejected');
const badIntegration=W.normalise({widgetType:'club',integrationId:'<script>alert(1)</script>'});
check(badIntegration.integrationId==='','unsafe widget integration ID is rejected');

const runtime=require('fs').readFileSync(path.join(ROOT,'assets/99club/widget-runtime.js'),'utf8');
check(runtime.includes("hash.set('brand',brandToken)")&&runtime.includes('schoolBrandToken')&&!runtime.includes("searchParams.set('brand',brandToken)"),'widget runtime keeps school branding in the client-side practice fragment');

const widgetUrl=W.buildUrl(gamesRound,'https://99studio.uk');
check(/^https:\/\/99studio\.uk\/widget\/#w=TT99W1\./.test(widgetUrl),'widget URL is fragment-configured');

let bad=false;try{W.decode('TT99W1.invalid')}catch(_){bad=true}
check(bad,'invalid token is rejected');

if(failures.length){console.error('\n'+failures.length+' widget QA failure(s).');process.exit(1);}
console.log('\nSchool widget QA passed.');
