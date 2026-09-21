/* 99 Club Studio · Games pack mode v1.4.0
 * Adds exact activity counts and deterministic random-compatible packs.
 * Random packs can use one fixed difficulty or a quota-based mixed profile.
 */
(function(global){
  'use strict';

  const G=global.TT99Games;
  if(!G||G.__packModeV1)return;

  const STORAGE_MODE='tt99-games-pack-mode-v1';
  const STORAGE_COUNT='tt99-games-activity-count-v1';
  const STORAGE_PER_PAGE='tt99-games-activities-per-sheet-v2';
  const STORAGE_DIFFICULTY='tt99-games-random-difficulty-v1';
  const STORAGE_WEIGHTS='tt99-games-random-difficulty-weights-v1';
  const STORAGE_SCOPE='tt99-games-random-scope-v1';
  const SINGLE_DIFFICULTIES=['easy','standard','challenge'];
  const RANDOM_DIFFICULTIES=[...SINGLE_DIFFICULTIES,'mixed'];
  const DEFAULT_WEIGHTS={easy:25,standard:50,challenge:25};
  const baseNormalize=G.normalizeSettings.bind(G);
  const baseSelected=G.selectedCompatibleEngines.bind(G);
  const baseCompatible=G.compatibleEngines.bind(G);
  const baseGeneratePack=G.generatePack.bind(G);

  function storageGet(key){
    try{return global.localStorage?.getItem(key)??null;}catch(e){return null;}
  }
  function clampCount(value,fallback=4){
    const n=Math.round(Number(value));
    return Math.max(1,Math.min(40,Number.isFinite(n)?n:fallback));
  }
  function normalizeDifficultyWeights(raw={}){
    const src=raw&&typeof raw==='object'?raw:{};
    let vals=SINGLE_DIFFICULTIES.map(k=>Math.max(0,Number(src[k])||0));
    if(vals.reduce((a,b)=>a+b,0)<=0)vals=SINGLE_DIFFICULTIES.map(k=>DEFAULT_WEIGHTS[k]);
    const sum=vals.reduce((a,b)=>a+b,0),scaled=vals.map(v=>v*100/sum),whole=scaled.map(Math.floor);
    let left=100-whole.reduce((a,b)=>a+b,0);
    const order=scaled.map((v,i)=>({i,r:v-Math.floor(v)})).sort((a,b)=>b.r-a.r||a.i-b.i);
    for(let i=0;i<left;i++)whole[order[i%order.length].i]++;
    return {easy:whole[0],standard:whole[1],challenge:whole[2]};
  }
  function parseStoredWeights(){
    const raw=storageGet(STORAGE_WEIGHTS);if(!raw)return null;
    try{return normalizeDifficultyWeights(JSON.parse(raw));}catch(e){return null;}
  }
  function resolveMode(input={}){
    if(input._forcePackMode==='random')return 'random';
    if(input._forcePackMode==='manual')return 'manual';
    const stored=storageGet(STORAGE_MODE);
    if(stored==='random'||stored==='manual')return stored;
    return input.packMode==='random'?'random':'manual';
  }
  function resolveCount(input,base){
    const legacy=Math.max(1,(Number(base.sheets)||1)*(Number(base.activitiesPerSheet)||1));
    const stored=storageGet(STORAGE_COUNT);
    return clampCount(stored??input.activityCount??legacy,legacy);
  }
  function resolveDifficulty(input={}){
    if(RANDOM_DIFFICULTIES.includes(input._forceRandomDifficulty))return input._forceRandomDifficulty;
    const stored=storageGet(STORAGE_DIFFICULTY);
    if(RANDOM_DIFFICULTIES.includes(stored))return stored;
    return RANDOM_DIFFICULTIES.includes(input.randomDifficulty)?input.randomDifficulty:'standard';
  }
  function resolveDifficultyWeights(input={}){
    if(input._forceRandomDifficultyWeights)return normalizeDifficultyWeights(input._forceRandomDifficultyWeights);
    return parseStoredWeights()||normalizeDifficultyWeights(input.randomDifficultyWeights||DEFAULT_WEIGHTS);
  }
  function resolveRandomScope(input={}){
    if(['maths','mixed','verbal'].includes(input._forceRandomScope))return input._forceRandomScope;
    const stored=storageGet(STORAGE_SCOPE);
    if(['maths','mixed','verbal'].includes(stored))return stored;
    return ['maths','mixed','verbal'].includes(input.randomScope)?input.randomScope:'maths';
  }
  function resolveActivitiesPerSheet(input,base){
    const stored=storageGet(STORAGE_PER_PAGE);
    const raw=stored??input.activitiesPerSheet??base.activitiesPerSheet??2;
    return Number(raw)===1?1:2;
  }
  function normalizeSettings(input={}){
    const base=baseNormalize(input);
    const activityCount=resolveCount(input,base),activitiesPerSheet=resolveActivitiesPerSheet(input,base);
    return {...base,activityCount,packMode:resolveMode(input),randomDifficulty:resolveDifficulty(input),randomDifficultyWeights:resolveDifficultyWeights(input),randomScope:resolveRandomScope(input),activitiesPerSheet,sheets:Math.ceil(activityCount/activitiesPerSheet)};
  }
  function manualSettings(settings){
    const s=normalizeSettings(settings);
    return {...s,_forcePackMode:'manual',packMode:'manual'};
  }
  function isVerbal(id){return G.ENGINES?.[id]?.randomFamily==='verbal';}
  function scopeCompatible(ids,scope,seed='scope'){
    const maths=ids.filter(id=>!isVerbal(id)),verbal=ids.filter(isVerbal);
    if(scope==='verbal')return verbal;
    if(scope!=='mixed')return maths;
    const m=shuffleDeterministic(maths,seed+':maths'),v=shuffleDeterministic(verbal,seed+':verbal'),out=[];
    let mi=0,vi=0;
    while(mi<m.length||vi<v.length){
      for(let n=0;n<3&&mi<m.length;n++)out.push(m[mi++]);
      if(vi<v.length)out.push(v[vi++]);
      if(mi>=m.length&&vi<v.length){out.push(...v.slice(vi));break;}
    }
    return out;
  }
  function selectedCompatibleEngines(settings){
    const s=normalizeSettings(settings);
    if(s.packMode==='random')return scopeCompatible(baseCompatible(manualSettings(s)),s.randomScope,'selected');
    return baseSelected(manualSettings(s));
  }
  function shuffleDeterministic(items,seed){
    const out=items.slice(),rng=G.rngFromSeed(`${seed}:random-engine-bag`);
    for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  function difficultyPlan(total,difficulty,weights,seed){
    if(difficulty!=='mixed')return Array(total).fill(SINGLE_DIFFICULTIES.includes(difficulty)?difficulty:'standard');
    const w=normalizeDifficultyWeights(weights),exact=SINGLE_DIFFICULTIES.map(k=>total*w[k]/100),counts=exact.map(Math.floor);
    let left=total-counts.reduce((a,b)=>a+b,0);
    const order=exact.map((v,i)=>({i,r:v-Math.floor(v)})).sort((a,b)=>b.r-a.r||a.i-b.i);
    for(let i=0;i<left;i++)counts[order[i%order.length].i]++;
    const plan=[];SINGLE_DIFFICULTIES.forEach((d,i)=>{for(let n=0;n<counts[i];n++)plan.push(d);});
    const rng=G.rngFromSeed(`${seed}:random-difficulty-plan`);
    for(let i=plan.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[plan[i],plan[j]]=[plan[j],plan[i]];}
    return plan;
  }
  function supportedDifficulties(engineId){
    const engine=G.ENGINES?.[engineId]||{},direct=Array.isArray(engine.difficultyOptions)?engine.difficultyOptions:[];
    if(direct.length)return direct.filter(d=>SINGLE_DIFFICULTIES.includes(d));
    const spec=(engine.settingsSchema||[]).find(s=>s.id==='difficulty'),opts=(spec?.options||[]).map(o=>typeof o==='string'?o:o?.value).filter(Boolean);
    const filtered=opts.filter(d=>SINGLE_DIFFICULTIES.includes(d));return filtered.length?filtered:SINGLE_DIFFICULTIES.slice();
  }
  function closestSupportedDifficulty(engineId,difficulty){
    const allowed=supportedDifficulties(engineId);if(allowed.includes(difficulty))return difficulty;
    const rank={easy:0,standard:1,challenge:2},target=rank[difficulty]??1;
    return allowed.slice().sort((a,b)=>Math.abs((rank[a]??1)-target)-Math.abs((rank[b]??1)-target)||(rank[a]??1)-(rank[b]??1))[0]||'standard';
  }
  function trimSheets(sheets,total){
    let remaining=total,index=1;const out=[];
    for(const sheet of sheets||[]){
      if(remaining<=0)break;
      const activities=(sheet.activities||[]).slice(0,remaining);
      if(activities.length)out.push({...sheet,index:index++,activities});
      remaining-=activities.length;
    }
    return out;
  }
  function uniqueUsedEngines(sheets){
    const seen=new Set(),ids=[];
    for(const sheet of sheets||[])for(const a of sheet.activities||[]){
      if(a?.engineId&&!seen.has(a.engineId)){seen.add(a.engineId);ids.push(a.engineId);}
    }
    return ids;
  }
  function applyRandomDifficulty(settings,engineIds,difficulty){
    const engineSettings={...(settings.engineSettings||{})};
    for(const id of engineIds){
      const current=engineSettings[id]||G.ENGINES[id]?.defaultSettings||{};
      engineSettings[id]={...current,difficulty};
    }
    return {...settings,engineSettings};
  }
  function regenerateRandomDifficulties(sheets,settings,seed,plan,customVocabulary){
    let k=0;const difficultyByEngine={},finiteUsed={alphametics:new Set(),symbols:new Set(),vr:new Set()};
    const out=sheets.map((sheet,si)=>({...sheet,activities:(sheet.activities||[]).map((activity,ai)=>{
      const engineId=activity?.engineId;if(!engineId)return activity;
      const requested=plan[k++]||'standard',difficulty=closestSupportedDifficulty(engineId,requested);
      if(!difficultyByEngine[engineId])difficultyByEngine[engineId]=difficulty;
      if(typeof G.generateActivity!=='function')return {...activity,difficulty};
      let activitySettings=applyRandomDifficulty(settings,[engineId],difficulty);
      activitySettings={...activitySettings,_finiteExclusions:{alphametics:[...finiteUsed.alphametics],symbols:[...finiteUsed.symbols],vr:[...finiteUsed.vr]}};
      const activitySeed=`${seed}:S${si+1}:A${ai+1}:${engineId}`,next=G.generateActivity(engineId,activitySettings,activitySeed,customVocabulary),key=G.finiteContentKey?.(next)||'';
      if(key){const [bank,value]=key.split(':',2);finiteUsed[bank]?.add(value);}
      return next;
    })}));
    return {sheets:out,difficultyByEngine};
  }
  function generatePack(settings,seed='games',customVocabulary=[]){
    const s=normalizeSettings(settings);
    let requested={...s,activitiesPerSheet:s.activitiesPerSheet,sheets:Math.ceil(s.activityCount/s.activitiesPerSheet),workedExamples:'none',_forcePackMode:'manual',packMode:'manual'};

    if(s.packMode==='random'){
      const compatible=scopeCompatible(baseCompatible(requested),s.randomScope,seed);
      requested.selectedEngines=s.randomScope==='mixed'?compatible:shuffleDeterministic(compatible,seed);
      requested=applyRandomDifficulty(requested,compatible,s.randomDifficulty==='mixed'?'standard':s.randomDifficulty);
    }

    const raw=baseGeneratePack(requested,seed,customVocabulary);
    let sheets=trimSheets(raw.sheets,s.activityCount),difficultyByEngine={};
    const randomPlan=s.packMode==='random'?difficultyPlan(s.activityCount,s.randomDifficulty,s.randomDifficultyWeights,seed):[];
    if(s.packMode==='random'&&s.randomDifficulty==='mixed'){
      ({sheets,difficultyByEngine}=regenerateRandomDifficulties(sheets,requested,seed,randomPlan,customVocabulary));
    }else if(s.packMode==='random'){
      for(const id of uniqueUsedEngines(sheets))difficultyByEngine[id]=closestSupportedDifficulty(id,s.randomDifficulty);
    }
    const usedIds=uniqueUsedEngines(sheets);
    const workedExamples=s.workedExamples==='front'
      ? usedIds.map((id,i)=>{
          const difficulty=s.packMode==='random'?(difficultyByEngine[id]||closestSupportedDifficulty(id,s.randomDifficulty==='mixed'?'standard':s.randomDifficulty)):null;
          const exampleSettings=s.packMode==='random'?applyRandomDifficulty(s,[id],difficulty):s;
          return G.generateWorkedExample(id,exampleSettings,`${seed}:worked:${i}:${id}`,customVocabulary);
        }).filter(Boolean)
      : [];

    return {...raw,settings:s,sheets,workedExamples,activityCount:s.activityCount,packMode:s.packMode,randomScope:s.randomScope,randomDifficulty:s.randomDifficulty,randomDifficultyWeights:s.randomDifficultyWeights,randomDifficultyPlan:randomPlan,usedEngineIds:usedIds};
  }
  function generateRandomPack(settings,seed='games',customVocabulary=[]){
    return generatePack({...settings,_forcePackMode:'random'},seed,customVocabulary);
  }

  Object.assign(G,{
    normalizeSettings,
    selectedCompatibleEngines,
    generatePack,
    generateRandomPack,
    PACK_MODE:{version:'1.4.0',storageModeKey:STORAGE_MODE,storageCountKey:STORAGE_COUNT,storageDifficultyKey:STORAGE_DIFFICULTY,storageDifficultyWeightsKey:STORAGE_WEIGHTS,storageScopeKey:STORAGE_SCOPE,storagePerPageKey:STORAGE_PER_PAGE,difficulties:RANDOM_DIFFICULTIES.slice(),singleDifficulties:SINGLE_DIFFICULTIES.slice(),defaultDifficultyWeights:{...DEFAULT_WEIGHTS},maxActivities:40}
  });
  G.__packModeV1=true;
})(typeof globalThis!=='undefined'?globalThis:this);
