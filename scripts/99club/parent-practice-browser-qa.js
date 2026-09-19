#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const HARNESS=path.join(ROOT,'99club-parent-practice-qa.html');
const mode=process.argv[2]||'prepare';

function prepare(){
  const G=require(path.join(ROOT,'assets/99club/generator.js'));
  delete global.TT99SchoolUsage;delete global.TT99ParentPractice;
  const SU=require(path.join(ROOT,'assets/99club/school-usage.js'));
  const PP=require(path.join(ROOT,'assets/99club/parent-practice.js'));
  const rules=G.normalizeRules(Object.assign({},G.CLASSIC_PRESETS['33'],{factorMax:9}));
  const schoolUsageKey=SU.makeSchoolKey('Browser QA Primary School');
  const token=PP.encode({schemeId:'classic',clubId:'33',rules:rules,orientation:'portrait',schoolUsageKey:schoolUsageKey});

  const hook=[
    '(function(){',
    '  window.__schoolUsageEvents=[];',
    '  const originalTrack=window.TT99SchoolUsage.trackPractice;',
    '  window.TT99SchoolUsage.trackPractice=function(name,config){window.__schoolUsageEvents.push({name:name,key:config&&config.schoolUsageKey});return originalTrack.call(window.TT99SchoolUsage,name,config);};',
    '  const original=window.TT99PDFLayout.buildDocument;',
    '  window.TT99PDFLayout.buildDocument=function(options){',
    '    window.__ppBuild=options;',
    '    const doc=original(options);',
    '    doc.save=function(){window.__ppSaveCalled=true;};',
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
    "    document.documentElement.dataset.qaStatus=pre.dataset.status;document.title='99club-parent-practice-qa:'+pre.dataset.status;",
    '  }',
    '  async function run(){',
    '    try{',
    '      await sleep(350);',
    "      const root=document.getElementById('tt99-practice-root');",
    "      const button=document.getElementById('tt99-practice-download');",
    "      if(!root)fail('boot','Parent practice root missing');",
    "      if(!root||!root.querySelector('.tt99-practice-card'))fail('boot','Parent practice card did not render');",
    "      if(root&&root.querySelector('.tt99-controls,.tt99-workspace,[data-rule],#tt99-toggle-rules'))fail('isolation','Full Studio generator controls leaked into parent view');",
    "      if(root&&root.querySelector('input,textarea,select'))fail('privacy','Parent view unexpectedly asks for form data');",
    "      const title=root&&root.querySelector('#tt99-practice-title')?root.querySelector('#tt99-practice-title').textContent:'';",
    "      if(!/33 Club/i.test(title))fail('preset','Expected 33 Club title, got '+title);",
    "      if(!window.TT99SchoolUsage||window.TT99SchoolUsage.enabled())fail('school-usage','School usage telemetry should be present but disabled');",
    "      const openEvent=(window.__schoolUsageEvents||[]).find(x=>x.name==='practice_open');",
    "      if(!openEvent||!/^sch_/.test(openEvent.key||''))fail('school-usage','Practice-open school usage event was not wired with an opaque school key');",
    "      if(!button)fail('download','Combined PDF button missing');",
    '      else{',
    '        button.click();await sleep(600);',
    "        if(!window.__ppBuild)fail('download','PDF builder was not invoked');",
    '        else{',
    "          if(window.__ppBuild.kind!=='both')fail('download','Parent download did not request worksheet + answers');",
    "          if(window.__ppBuild.rules&&window.__ppBuild.rules.factorMax!==9)fail('preset','Edited school rule factorMax=9 was not preserved');",
    "          if(!window.__ppBuild.answerContext||window.__ppBuild.answerContext.label!=='Answer copy')fail('download','Parent answer page still uses teacher-copy wording');",
    '        }',
    "        if(!window.__ppSaveCalled)fail('download','PDF save was not invoked');",
    "        if(!/another worksheet \\+ answers/i.test(button.textContent||''))fail('download','Download button did not reset after creation');",
    "        const downloadEvent=(window.__schoolUsageEvents||[]).find(x=>x.name==='practice_download');",
    "        if(!downloadEvent||downloadEvent.key!==openEvent?.key)fail('school-usage','Practice-download school usage event was not wired to the same school key');",
    '      }',
    "      if(document.querySelector('script[src*=\"analytics\"],script[src*=\"googletagmanager\"]'))fail('privacy','Analytics script present in parent harness');",
    "      if(!report.failures.length)pass('parent-practice','Locked parent view and combined PDF flow verified in browser');",
    "    }catch(e){fail('runtime',(e&&e.stack)||String(e));}",
    '    finally{finish();}',
    '  }',
    "  if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});",
    '})();'
  ].join('\n');

  const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>99club-parent-practice-qa:running</title><link rel="stylesheet" href="/assets/99club/parent-practice.css"></head><body class="tt99-practice-body"><div id="tt99-practice-root"></div>'+
    '<script src="/assets/99club/generator.js"></script><script src="/assets/99club/simple-pdf.js"></script><script src="/assets/99club/pdf-layout.js"></script><script src="/assets/99club/school-usage-config.js"></script><script src="/assets/99club/school-usage.js"></script><script src="/assets/99club/parent-practice.js"></script>'+
    '<script>'+hook+'<\/script><script src="/assets/99club/parent-practice-page.js"></script><script>'+runner+'<\/script></body></html>';
  fs.writeFileSync(HARNESS,html);
  fs.writeFileSync(path.join(ROOT,'99club-parent-practice-qa-url.txt'),'/99club-parent-practice-qa.html#p='+encodeURIComponent(token)+'\n');
  console.log('Prepared parent-practice browser harness; token length '+token.length+'.');
}

function check(file){
  const dom=fs.readFileSync(file,'utf8'),m=dom.match(/<pre[^>]*id=["']qa-result["'][^>]*>([A-Za-z0-9+/=]+)<\/pre>/i);
  if(!m){console.error('Parent-practice browser QA result marker not found.');process.exit(1);}
  const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
  fs.writeFileSync(path.join(ROOT,'99club-parent-practice-qa-report.json'),JSON.stringify(report,null,2)+'\n');
  for(const x of report.failures||[])console.error('FAIL ['+x.area+'] '+x.msg);
  console.log('Parent-practice browser QA: '+(report.failures||[]).length+' failure(s), '+(report.passes||[]).length+' pass(es).');
  if(report.failures&&report.failures.length)process.exit(1);
}

if(mode==='prepare')prepare();
else if(mode==='check')check(process.argv[3]);
else{console.error('Usage: parent-practice-browser-qa.js prepare | check <dumped-dom-file>');process.exit(2);}
