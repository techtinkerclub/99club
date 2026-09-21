#!/usr/bin/env node
'use strict';

const path=require('path'),ROOT=path.join(__dirname,'..');
require(path.join(ROOT,'games-vocabulary.js'));
require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-verbal-reasoning.js'));
const G=require(path.join(ROOT,'games-engine.js'));
require(path.join(ROOT,'games-pack-mode.js'));

const VR=globalThis.TT99VerbalReasoning;
const IDS=Object.keys(VR?.DEFINITIONS||{});
const DIFFS=['easy','standard','challenge'];
function assert(v,m){if(!v)throw new Error(m);}
function flat(pack){return (pack.sheets||[]).flatMap(s=>s.activities||[]);}
function settingsFor(id,difficulty,count=1){
  return G.normalizeSettings({
    minYear:5,maxYear:5,topics:['calculation'],
    selectedEngines:[id],activityCount:count,activitiesPerSheet:2,packMode:'manual',
    engineSettings:{[id]:{difficulty}}
  });
}

assert(VR&&VR.VERSION==='1.0.0','Verbal Reasoning v1.0.0 not loaded');
assert(IDS.length===21,`expected 21 verbal-reasoning types, got ${IDS.length}`);
assert(new Set(IDS).size===IDS.length,'duplicate verbal-reasoning engine id');

for(const id of IDS){
  const d=VR.DEFINITIONS[id];
  assert(d.group==='Verbal Reasoning',`${id}: wrong group`);
  assert(d.topicIndependent===true,`${id}: should be topic-independent`);
  assert(d.randomFamily==='verbal',`${id}: missing verbal random family`);
  assert(d.minYear===3&&d.maxYear===6,`${id}: expected Year 3-6 range`);
  assert((d.settingsSchema||[]).length===1&&d.settingsSchema[0].id==='difficulty',`${id}: v1 should expose difficulty only`);
  assert(DIFFS.every(x=>d.difficultyOptions.includes(x)),`${id}: missing difficulty option`);
}

const topicIndependent=G.normalizeSettings({minYear:5,maxYear:5,topics:['fractions'],selectedEngines:['vr_insertletter']});
assert(G.compatibleEngines(topicIndependent).includes('vr_insertletter'),'VR should remain compatible regardless of selected maths topic');
const tooYoung=G.normalizeSettings({minYear:1,maxYear:2,topics:['calculation'],selectedEngines:['vr_insertletter']});
assert(!G.compatibleEngines(tooYoung).includes('vr_insertletter'),'VR should be age-gated below Year 3');

const report={types:IDS.length,difficulties:{},packs:{},randomScope:{}};

for(const difficulty of DIFFS){
  report.difficulties[difficulty]={};
  for(const id of IDS){
    const seenActivities=new Set(),seenQuestions=new Set();
    for(let n=0;n<24;n++){
      const s=settingsFor(id,difficulty,1),seed=`vr-smoke-${id}-${difficulty}-${n}`;
      const a=G.generateActivity(id,s,seed);
      assert(!a.error,`${id}/${difficulty}/${n}: ${a.error}`);
      const v=VR.validate(a);assert(v.ok,`${id}/${difficulty}/${n}: ${v.error}`);
      assert(a.difficulty===difficulty,`${id}: generated wrong difficulty`);
      const again=G.generateActivity(id,s,seed);
      assert(JSON.stringify(a)===JSON.stringify(again),`${id}/${difficulty}: same seed is not deterministic`);
      seenActivities.add(a.contentKey);
      for(const q of a.items){
        assert(new Set(q.options).size===q.options.length,`${id}: duplicate displayed options`);
        assert(q.options.filter(x=>String(x)===String(q.answer)).length===1,`${id}: answer must appear once`);
        seenQuestions.add(q.key);
      }
    }
    assert(seenActivities.size>=18,`${id}/${difficulty}: insufficient activity variety (${seenActivities.size}/24)`);
    assert(seenQuestions.size>=18,`${id}/${difficulty}: insufficient question variety (${seenQuestions.size}/24)`);
    report.difficulties[difficulty][id]={activities:seenActivities.size,questions:seenQuestions.size};
  }
}

// Maximum-size packs: every type must produce 40 activities without repeating an activity content key.
for(const id of IDS){
  report.packs[id]={};
  for(const difficulty of DIFFS){
    const s=settingsFor(id,difficulty,40),pack=G.generatePack(s,`vr-pack-${id}-${difficulty}`);
    const activities=flat(pack);
    assert(!pack.capacityMessage,`${id}/${difficulty}: 40-pack hit finite capacity: ${pack.capacityMessage}`);
    assert(activities.length===40,`${id}/${difficulty}: expected 40 activities, got ${activities.length}`);
    assert(activities.every(a=>!a.error),`${id}/${difficulty}: pack contains an error activity`);
    const keys=activities.map(a=>a.contentKey);
    assert(new Set(keys).size===40,`${id}/${difficulty}: repeated activity content in 40-pack`);
    report.packs[id][difficulty]=40;
  }
}

// Random packs retain current maths-only behaviour unless Verbal Reasoning is explicitly requested.
const baseRandom={minYear:5,maxYear:5,topics:['calculation'],packMode:'random',activityCount:12,activitiesPerSheet:2,randomDifficulty:'standard'};
const maths=G.selectedCompatibleEngines(G.normalizeSettings({...baseRandom,randomScope:'maths'}));
const verbal=G.selectedCompatibleEngines(G.normalizeSettings({...baseRandom,randomScope:'verbal'}));
const mixed=G.selectedCompatibleEngines(G.normalizeSettings({...baseRandom,randomScope:'mixed'}));
assert(maths.length>0&&maths.every(id=>G.ENGINES[id]?.randomFamily!=='verbal'),'maths random scope leaked Verbal Reasoning');
assert(verbal.length===21&&verbal.every(id=>G.ENGINES[id]?.randomFamily==='verbal'),'verbal random scope is incomplete');
assert(mixed.some(id=>G.ENGINES[id]?.randomFamily==='verbal')&&mixed.some(id=>G.ENGINES[id]?.randomFamily!=='verbal'),'mixed random scope should contain both families');
report.randomScope={maths:maths.length,verbal:verbal.length,mixed:mixed.length};

console.log('PASS verbal reasoning:',JSON.stringify(report));
