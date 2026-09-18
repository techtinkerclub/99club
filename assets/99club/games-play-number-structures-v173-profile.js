/* 99 Club Studio · Online Play number structures v1.73 difficulty profile
 * Keep Easy / Standard / Challenge number ranges aligned with the existing
 * Online Play convention instead of generating every puzzle at Year 6 range.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,G=global.TT99Games;if(!Play||!G)return;
function yearFor(c,minYear){const y=c?.difficulty==='easy'?2:c?.difficulty==='challenge'?6:4;return Math.max(minYear,y);}
function build(id,c,seed,minYear,topics){
  const maxYear=(id==='magic'&&c?.numberPattern==='decimal')?Math.max(4,yearFor(c,minYear)):yearFor(c,minYear);
  const chosenTopics=id==='magic'&&c?.numberPattern==='decimal'?[...topics,'decimals_percentages']:topics;
  const settings={minYear,maxYear,topics:chosenTopics,selectedEngines:[id],engineSettings:{[id]:c}};
  const p=G.generateActivity(id,settings,`${seed}:online`);
  if(!p||p.error)throw new Error(`${id} generation failed${p?.error?`: ${p.error}`:''}`);
  return p;
}
const profiles={
  pyramid:{minYear:1,topics:['number_place_value','calculation']},
  magic:{minYear:1,topics:['number_place_value','calculation','algebra']},
  arithmagon:{minYear:2,topics:['calculation']},
  magicshape:{minYear:2,topics:['calculation']}
};
for(const [id,p] of Object.entries(profiles)){
  const adapter=Play.adapters.get(id);if(!adapter)continue;
  adapter.createPuzzle=(config,seed)=>build(id,adapter.normalizeConfig(config),seed,p.minYear,p.topics);
}
})(typeof globalThis!=='undefined'?globalThis:this);
