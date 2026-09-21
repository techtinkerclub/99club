#!/usr/bin/env node
'use strict';
const path=require('path'),ROOT=path.join(__dirname,'..','..','assets','99club');
const VR=require(path.join(ROOT,'verbal-reasoning-core-v208.js'));
function assert(v,m){if(!v)throw new Error(m);}
assert(VR.VERSION==='2.08.0','wrong VR core version');
assert(VR.TYPE_IDS.length===21,'expected 21 verbal reasoning types');

const report={version:VR.VERSION,types:{},errors:[]},coreIssues=[];
for(const d of VR.DIFFICULTIES){
  for(const id of VR.TYPE_IDS){
    const keys=new Set();let generated=0;
    for(let i=0;i<60;i++){
      const seed='vrqa:'+id+':'+d+':'+i;
      try{
        const q=VR.generate(id,d,seed),again=VR.generate(id,d,seed),v=VR.validate(q);
        if(!v.ok)coreIssues.push(id+'/'+d+' invalid: '+v.errors.join(', '));
        if(JSON.stringify(q)!==JSON.stringify(again))coreIssues.push(id+'/'+d+' is not deterministic');
        keys.add(q.key);generated++;
      }catch(err){coreIssues.push(id+'/'+d+' generation failed: '+(err?.message||err));break;}
    }
    if(keys.size<40)coreIssues.push(id+'/'+d+' has weak variety: only '+keys.size+' unique from '+generated+' generated seeds');
    report.types[id+':'+d]={sampled:generated,unique:keys.size};
  }
}
if(coreIssues.length){
  report.errors.push(...coreIssues);
  require('fs').writeFileSync('99club-verbal-reasoning-qa-report.json',JSON.stringify(report,null,2));
  throw new Error('VR core QA failed:\n - '+coreIssues.join('\n - '));
}

require(path.join(ROOT,'games-vocabulary.js'));
require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-engine.js'));
require(path.join(ROOT,'games-verbal-reasoning-v208.js'));
require(path.join(ROOT,'games-pack-mode.js'));
const G=globalThis.TT99Games;
for(const d of VR.DIFFICULTIES){
  for(const id of VR.TYPE_IDS){
    const settings=G.normalizeSettings({
      minYear:3,maxYear:6,topics:['calculation'],selectedEngines:['verbalreasoning'],
      activityCount:40,activitiesPerSheet:2,packMode:'manual',
      engineSettings:{verbalreasoning:{difficulty:d,questionTypes:[id]}}
    });
    settings.activityCount=40;settings.activitiesPerSheet=2;settings.packMode='manual';
    const pack=G.generatePack(settings,'vr-pack:'+id+':'+d),acts=(pack.sheets||[]).flatMap(s=>s.activities||[]);
    assert(!pack.capacityMessage,id+'/'+d+' 40-pack hit capacity: '+pack.capacityMessage);
    assert(acts.length===40,id+'/'+d+' 40-pack generated '+acts.length);
    assert(new Set(acts.map(a=>a.questionKey)).size===40,id+'/'+d+' 40-pack repeated a question');
    assert(acts.every(a=>VR.validate(a.question).ok),id+'/'+d+' 40-pack has invalid activity');
  }
}
const randomMaths=G.generatePack({...G.normalizeSettings({minYear:3,maxYear:4,topics:['calculation']}),packMode:'random',randomScope:'maths',activityCount:12,activitiesPerSheet:2},'vr-random-maths');
assert(!(randomMaths.usedEngineIds||[]).includes('verbalreasoning'),'Maths-only random pack leaked verbal reasoning');
const randomVr=G.generatePack({...G.normalizeSettings({minYear:3,maxYear:6,topics:['calculation']}),packMode:'random',randomScope:'verbal',activityCount:12,activitiesPerSheet:2},'vr-random-verbal');
assert((randomVr.usedEngineIds||[]).length>0,'Verbal-only random pack is empty');
assert((randomVr.usedEngineIds||[]).every(id=>id==='verbalreasoning'),'Verbal-only random pack included maths engines');

require(path.join(ROOT,'generator.js'));
require(path.join(ROOT,'custom-verbal-reasoning-v208.js'));
const CG=globalThis.TT99Generator,CV=globalThis.TT99CustomVerbalReasoning;
const cv=CV.validate();
assert(cv.ok,'Custom VR validation failed: '+cv.errors.slice(0,10).join(', '));
const vrFamilies=Object.keys(CV.FAMILIES);
assert(vrFamilies.length===21,'Custom should register 21 VR families');
for(const d of VR.DIFFICULTIES){
  const rules=CG.normalizeRules({...CG.OPEN_WORKSHEET_PRESET,mode:'family_mix',questionCount:42,families:vrFamilies,verbalDifficulty:d,familyWeights:Object.fromEntries(vrFamilies.map(x=>[x,1]))});
  const qs=CG.generateQuestions(rules,'custom-vr:'+d);
  assert(qs.length===42,'Custom '+d+' generated '+qs.length+' questions');
  assert(qs.every(q=>String(q.kind).startsWith('vr_')),'Custom '+d+' leaked non-VR questions');
  assert(new Set(qs.map(q=>q.key)).size===qs.length,'Custom '+d+' repeated exact questions in a 42-question mixed sheet');
}

require('fs').writeFileSync('99club-verbal-reasoning-qa-report.json',JSON.stringify(report,null,2));
console.log('PASS verbal reasoning v2.08: 21 types × 3 difficulties validated; 40-question single-type packs are duplicate-free; Custom and random scope checks passed.');
