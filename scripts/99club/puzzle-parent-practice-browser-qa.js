#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const HARNESS=path.join(ROOT,'99club-puzzle-parent-practice-qa.html');
const mode=process.argv[2]||'prepare';

function prepare(){
  const payload={
    v:1,
    s:{
      minYear:4,maxYear:4,topics:['calculation'],sheets:1,activitiesPerSheet:1,includeAnswers:true,workedExamples:'none',
      selectedEngines:['pyramid'],
      engineSettings:{pyramid:{difficulty:'standard',levels:'3',clueLevel:'balanced'}}
    },
    u:'sch_browserqa12',
    i:{n:'Browser QA Primary School',l:'data:image/jpeg;base64,AAAA',w:80,h:40}
  };
  const token='TT99GP1.'+Buffer.from(JSON.stringify(payload),'utf8').toString('base64url');
  const layout=fs.readFileSync(path.join(ROOT,'_layouts/puzzle-practice.html'),'utf8');
  const scriptUrls=[...layout.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(m=>m[1]);
  const pageScript='/assets/99club/games-parent-practice-page.js?v=1';
  const before=scriptUrls.filter(x=>!x.startsWith('/assets/99club/games-parent-practice-page.js'));

  const hook=[
    '(function(){',
    '  window.__puzzleSchoolEvents=[];',
    '  const originalTrack=window.TT99SchoolUsage.trackPuzzlePractice;',
    '  window.TT99SchoolUsage.trackPuzzlePractice=function(name,config){window.__puzzleSchoolEvents.push({name:name,key:config&&config.schoolUsageKey});return originalTrack.call(window.TT99SchoolUsage,name,config);};',
    '  const original=window.TT99GamesPDF.buildDocument;',
    '  window.TT99GamesPDF.buildDocument=function(options){',
    '    window.__puzzleBuild=options;',
    '    const doc=original(options);',
    '    doc.save=function(){window.__puzzleSaveCalled=true;};',
    '    return doc;',
    '  };',
    '})();'
  ].join('\n');

  const runner=[
    '(function(){',
    '  const report={failures:[],passes:[]};',
    "  const fail=(area,msg)=>{report.failures.push({area:area,msg:msg});console.error('QA FAIL',area,msg);};",
    "  const pass=(area,msg)=>report.passes.push({area:area,msg:msg});",
    '  const sleep=ms=>new Promise(r=>setTimeout(r,ms));',
    '  function finish(){',
    '    const json=JSON.stringify(report),encoded=btoa(unescape(encodeURIComponent(json)));',
    "    const pre=document.createElement('pre');pre.id='qa-result';pre.dataset.status=report.failures.length?'fail':'pass';pre.textContent=encoded;document.body.appendChild(pre);",
    "    document.documentElement.dataset.qaStatus=pre.dataset.status;document.title='99club-puzzle-parent-qa:'+pre.dataset.status;",
    '  }',
    '  async function run(){',
    '    try{',
    '      await sleep(700);',
    "      const root=document.getElementById('tt99-puzzle-practice-root');",
    "      const button=document.getElementById('tt99-puzzle-practice-download');",
    "      if(!root||!root.querySelector('.tt99-practice-card'))fail('boot','Puzzle parent practice card did not render');",
    "      if(root&&root.querySelector('input,textarea,select'))fail('privacy','Puzzle parent view unexpectedly asks for form data');",
    "      if(!/Maths Games/.test(root?.querySelector('h1')?.textContent||''))fail('preset','Puzzle practice title missing');",
    "      if(!/Number Pyramid/.test(root?.textContent||''))fail('preset','Selected puzzle type was not shown');",
    "      if(!window.TT99SchoolUsage||window.TT99SchoolUsage.enabled())fail('school-usage','School telemetry should be present but disabled');",
    "      const openEvent=(window.__puzzleSchoolEvents||[]).find(x=>x.name==='puzzle_practice_open');",
    "      if(!openEvent||openEvent.key!=='sch_browserqa12')fail('school-usage','Puzzle open event was not wired to the opaque school key');",
    "      if(!button)fail('download','Puzzle combined-PDF button missing');",
    '      else{',
    '        button.click();await sleep(1100);',
    "        if(!window.__puzzleBuild)fail('download','Puzzle PDF builder was not invoked');",
    '        else{',
    "          if(window.__puzzleBuild.kind!=='both')fail('download','Puzzle parent download did not request puzzle + answers');",
    "          const settings=window.__puzzleBuild.settings||{};",
    "          if(!Array.isArray(settings.selectedEngines)||settings.selectedEngines[0]!=='pyramid')fail('preset','Selected puzzle engine was not preserved');",
    "          const p=settings.personalisation||{};",
    "          if(p.schoolName!=='Browser QA Primary School')fail('branding','Puzzle parent PDF lost school name');",
    "          if(p.logoDataUrl!=='data:image/jpeg;base64,AAAA')fail('branding','Puzzle parent PDF lost school logo');",
    "          if(p.worksheetDate!==window.TT99SchoolBrand.localIsoDate())fail('date','Puzzle parent PDF did not use generation date');",
    "          if(p.classLabel)fail('privacy','Puzzle parent PDF included class personalisation');",
    '        }',
    "        if(!window.__puzzleSaveCalled)fail('download','Puzzle PDF save was not invoked');",
    "        const dl=(window.__puzzleSchoolEvents||[]).find(x=>x.name==='puzzle_practice_download');",
    "        if(!dl||dl.key!==openEvent?.key)fail('school-usage','Puzzle download event did not use the same school key');",
    '      }',
    "      if(document.querySelector('script[src*=\"analytics\"],script[src*=\"googletagmanager\"]'))fail('privacy','Analytics script present in puzzle parent harness');",
    "      if(!report.failures.length)pass('puzzle-parent','Locked puzzle parent view and combined PDF flow verified in browser');",
    "    }catch(e){fail('runtime',(e&&e.stack)||String(e));}",
    '    finally{finish();}',
    '  }',
    "  if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});",
    '})();'
  ].join('\n');

  const scripts=before.map(src=>'<script src="'+src+'"></script>').join('');
  const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>99club-puzzle-parent-qa:running</title><link rel="stylesheet" href="/assets/99club/parent-practice.css"><link rel="stylesheet" href="/assets/99club/games-parent-practice.css"></head><body class="tt99-practice-body"><div id="tt99-puzzle-practice-root"></div>'+scripts+'<script>'+hook+'<\/script><script src="'+pageScript+'"></script><script>'+runner+'<\/script></body></html>';
  fs.writeFileSync(HARNESS,html);
  fs.writeFileSync(path.join(ROOT,'99club-puzzle-parent-practice-qa-url.txt'),'/99club-puzzle-parent-practice-qa.html#p='+encodeURIComponent(token)+'\n');
  console.log('Prepared puzzle parent-practice browser harness; token length '+token.length+'.');
}

function check(file){
  const dom=fs.readFileSync(file,'utf8'),m=dom.match(/<pre[^>]*id=["']qa-result["'][^>]*>([A-Za-z0-9+/=]+)<\/pre>/i);
  if(!m){console.error('Puzzle parent-practice browser QA result marker not found.');process.exit(1);}
  const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
  fs.writeFileSync(path.join(ROOT,'99club-puzzle-parent-practice-qa-report.json'),JSON.stringify(report,null,2)+'\n');
  for(const x of report.failures||[])console.error('FAIL ['+x.area+'] '+x.msg);
  console.log('Puzzle parent-practice browser QA: '+(report.failures||[]).length+' failure(s), '+(report.passes||[]).length+' pass(es).');
  if(report.failures&&report.failures.length)process.exit(1);
}

if(mode==='prepare')prepare();
else if(mode==='check')check(process.argv[3]);
else{console.error('Usage: puzzle-parent-practice-browser-qa.js prepare | check <dumped-dom-file>');process.exit(2);}
