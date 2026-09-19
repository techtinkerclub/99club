#!/usr/bin/env node
'use strict';

const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
global.window=global;global.globalThis=global;
const G=require(path.join(ROOT,'assets/99club/generator.js'));
global.TT99Generator=G;
const PP=require(path.join(ROOT,'assets/99club/parent-practice.js'));
global.TT99ParentPractice=PP;
const W=require(path.join(ROOT,'assets/99club/widget-config.js'));

const failures=[];
function check(ok,msg){if(ok)console.log('OK   '+msg);else{console.error('FAIL '+msg);failures.push(msg);}}
const clubs={};
for(const id of W.CLUB_IDS)clubs[id]=G.clone(PP.baseRules('classic',id));
clubs['55'].factorMax=11;
clubs['diamond'].arithmeticMax=900;
const cfg=W.fromClubRules({schemeId:'classic',orientation:'landscape',clubs,games:['maze','sumplete','not-real'],puzzles:[
  {link:'https://99studio.uk/practice/puzzles/#p=TT99GP1.TEST',minYear:4,maxYear:5,gameCount:3},
  {link:'https://evil.example/practice/puzzles/#p=TT99GP1.TEST',minYear:4,maxYear:4,gameCount:2}
]});
cfg.selectedClubs=['33','55','diamond'];
const token=W.encode(cfg),round=W.decode(token);
check(token.startsWith('TT99W1.'),'widget token has versioned prefix');
check(round.selectedClubs.join(',')==='33,55,diamond','selected clubs round-trip');
check(round.games.join(',')==='maze,sumplete','unknown games are rejected');
check(round.puzzles.length===1,'non-99studio puzzle links are rejected');
check(round.orientation==='landscape','orientation round-trips');
check(W.clubRules(round,'55').factorMax===11,'custom Club rule patch round-trips');
check(W.clubRules(round,'diamond').arithmeticMax===900,'post-99 custom rule patch round-trips');
check(!token.includes('school')&&!token.includes('teacher')&&!token.includes('pupil'),'token does not contain obvious identity fields');
const clubUrl=W.clubLink(round,'55','https://99studio.uk');
check(/^https:\/\/99studio\.uk\/practice\/#p=TT99P1\./.test(clubUrl),'widget reconstructs locked parent-practice links');
const widgetUrl=W.buildUrl(round,'https://99studio.uk');
check(/^https:\/\/99studio\.uk\/widget\/#w=TT99W1\./.test(widgetUrl),'widget URL is fragment-configured');
const embed=W.embedCode(round,'https://99studio.uk');
check(embed.includes('sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"'),'embed is sandboxed');
check(embed.includes('referrerpolicy="no-referrer"'),'embed suppresses referrer');
check(!embed.includes('allow-same-origin'),'embed does not grant same-origin access');
let bad=false;try{W.decode('TT99W1.invalid')}catch(_){bad=true}
check(bad,'invalid token is rejected');

if(failures.length){console.error('\n'+failures.length+' widget QA failure(s).');process.exit(1);}
console.log('\nSchool widget QA passed.');
