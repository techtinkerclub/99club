#!/usr/bin/env node
'use strict';
const path=require('path'),ROOT=path.join(__dirname,'..','..','assets','99club');
const VR=require(path.join(ROOT,'verbal-reasoning-core-v208.js'));
function assert(v,m){if(!v)throw new Error(m);}
assert(VR.VERSION==='2.08.0','wrong VR core version');
assert(VR.TYPE_IDS.length===21,'expected 21 verbal reasoning types');

const report={version:VR.VERSION,types:{},errors:[]},coreIssues=[];
function formatIssues(q,id,d){
  const e=[],c=q?.check||{},size=d==='easy'?2:d==='standard'?3:4;
  if(id==='insert_letter'&&(c.kind!=='insert4'||!Array.isArray(c.words)||c.words.length!==4))e.push('Type 1 must use one letter to make four words');
  if(id==='letter_code'&&(d==='easy'?c.kind!=='letter_code':c.kind!=='letter_code_decode'))e.push('Type 3 difficulty format drifted');
  if(id==='closest_meaning'&&(c.kind!=='syn_pair'||c.groupA?.length!==size||c.groupB?.length!==size))e.push('Type 4 group structure drifted');
  if(id==='hidden_word'&&(c.kind!=='hidden_row'||c.row?.length!==(d==='easy'?4:d==='standard'?5:6)))e.push('Type 5 search-row structure drifted');
  if(id==='missing_word'&&c.kind!=='missing_classic')e.push('Type 6 must remove a real three-letter word');
  if(id==='letters_for_numbers'&&(c.kind!=='letter_number_expr'||c.terms?.length!==(d==='easy'?2:d==='standard'?3:4)))e.push('Type 7 expression depth drifted');
  if(id==='move_letter'&&(c.kind!=='move'||String(q.answer).length!==1))e.push('Type 8 answer must be the moved letter');
  if(id==='word_connections'&&(c.kind!=='analogy_pair'||c.group1?.length!==size||c.group2?.length!==size))e.push('Type 10 two-group structure drifted');
  if(id==='compound_words'&&(c.kind!=='compound_unique'||c.groupA?.length!==size||c.groupB?.length!==size))e.push('Type 12 group structure drifted');
  if(id==='make_word'&&(c.kind!=='make_word'||!String(q.key).startsWith('mw2:')))e.push('Type 13 must infer from two completed examples');
  if(id==='letter_connections'&&c.kind==='letter_connections'){
    if(d==='easy'&&c.s1!==c.s2)e.push('Type 14 Easy should use one shared forward shift');
    if(d==='standard'&&!(c.s1>0&&c.s2>0))e.push('Type 14 Standard should use two forward shifts');
    if(d==='challenge'&&!(c.s1>0&&c.s2<0))e.push('Type 14 Challenge should use opposing shifts');
  }else if(id==='letter_connections')e.push('Type 14 relation metadata missing');
  if(id==='reading_information'&&c.kind!=='reading_expected')e.push('Type 15 deduction metadata missing');
  if(id==='opposite_meaning'&&(c.kind!=='ant_pair'||c.groupA?.length!==size||c.groupB?.length!==size))e.push('Type 16 group structure drifted');
  if(id==='related_numbers'&&c.kind!=='related_unique')e.push('Type 18 must reject competing supported rules');
  if(id==='word_number_codes'&&c.kind!=='wn_scrambled')e.push('Type 19 must use scrambled code matching');
  if(id==='same_meaning'&&(c.kind!=='link'||c.pairs?.length!==2||c.pairs.some(p=>p.length!==2)))e.push('Type 21 must use two clue pairs');
  return e;
}
for(const d of VR.DIFFICULTIES){
  for(const id of VR.TYPE_IDS){
    const keys=new Set();let generated=0;
    for(let i=0;i<60;i++){
      const seed='vrqa:'+id+':'+d+':'+i;
      try{
        const q=VR.generate(id,d,seed),again=VR.generate(id,d,seed),v=VR.validate(q);
        if(!v.ok)coreIssues.push(id+'/'+d+' invalid: '+v.errors.join(', '));
        if(JSON.stringify(q)!==JSON.stringify(again))coreIssues.push(id+'/'+d+' is not deterministic');
        for(const issue of formatIssues(q,id,d))coreIssues.push(id+'/'+d+' format: '+issue);
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
for(const d of VR.DIFFICULTIES){
  const finiteFamily='vr_compound_words';
  const rules=CG.normalizeRules({...CG.OPEN_WORKSHEET_PRESET,mode:'family_mix',questionCount:200,families:[finiteFamily],verbalDifficulty:d,familyWeights:{[finiteFamily]:1}});
  const qs=CG.generateQuestions(rules,'custom-vr-oversize:'+d);
  assert(qs.length>=40,'Custom '+d+' finite verbal family fell below useful capacity: '+qs.length);
  assert(new Set(qs.map(q=>q.key)).size===qs.length,'Custom '+d+' oversized finite verbal sheet wrapped around and repeated questions');
}

require('fs').writeFileSync('99club-verbal-reasoning-qa-report.json',JSON.stringify(report,null,2));
console.log('PASS verbal reasoning v2.08: 21 types × 3 difficulties validated for format, answer integrity and variety; 40-question single-type packs are duplicate-free; oversized Custom finite banks stop before repeating; Custom and random scope checks passed.');
