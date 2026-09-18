/* 99 Club Studio · Arithmetic Equation Crossgrid usability patch
 * v1.1.1 — true active grid sizes, missing-cell modes, operator corner hints.
 */
(function(global){
  'use strict';
  const A=global.TT99ArithmeticGames;
  if(!A||A.__crossgridCornerHintV1)return;

  const originalGenerate=A.generate.bind(A);
  const originalWorked=A.workedExample.bind(A);
  const originalNormalise=A.normalise.bind(A);
  const OPS=new Set(['+','-','×','÷']);

  const def=A.DEFINITIONS?.equationcrossgrid;
  if(def){
    def.defaultSettings={...def.defaultSettings,gridSize:'auto',missingType:'auto'};
    def.settingsSchema=(def.settingsSchema||[]).map(field=>{
      if(field.id!=='gridSize')return field;
      return {...field,label:'Active grid size',options:[
        {value:'auto',label:'Auto'},
        {value:'5',label:'5 × 5'},
        {value:'7',label:'7 × 7'},
        {value:'9',label:'9 × 9'}
      ],help:'Crossgrids use an odd-sized equation lattice so the selected size is the actual visible working grid, with no permanently black border row or column.'};
    });
    const missingIndex=def.settingsSchema.findIndex(field=>field.id==='missingLevel');
    if(!def.settingsSchema.some(field=>field.id==='missingType')){
      const field={id:'missingType',type:'select',label:'What can be missing?',options:[
        {value:'auto',label:'Auto for difficulty'},
        {value:'numbers',label:'Numbers only'},
        {value:'numbers_operators',label:'Numbers + operation signs'}
      ],help:'Auto keeps operation signs visible on Easy and Standard. Challenge may also hide operation signs, marked by a small ? in the corner.'};
      if(missingIndex>=0)def.settingsSchema.splice(missingIndex,0,field);else def.settingsSchema.push(field);
    }
    def.difficultyDescriptions={...def.difficultyDescriptions,
      easy:'5 × 5 linked + / − equations with more clues',
      standard:'7 × 7 connected crossgrid with mixed relationships',
      challenge:'9 × 9 connected crossgrid, fewer clues and all four operations'
    };
  }

  function migrateGridSize(v){
    v=String(v??'auto');
    if(v==='8')return '7';
    if(v==='10')return '9';
    return ['auto','5','7','9'].includes(v)?v:'auto';
  }
  A.normalise=function(id,raw={}){
    if(id!=='equationcrossgrid')return originalNormalise(id,raw);
    const migrated={...raw,gridSize:migrateGridSize(raw.gridSize)};
    if(!['auto','numbers','numbers_operators'].includes(String(migrated.missingType||'auto')))migrated.missingType='auto';
    const out=originalNormalise(id,migrated);
    out.gridSize=migrateGridSize(out.gridSize);
    out.missingType=['auto','numbers','numbers_operators'].includes(String(out.missingType||'auto'))?String(out.missingType||'auto'):'auto';
    return out;
  };

  function copySettings(settings){
    return {...(settings||{}),engineSettings:{...(settings?.engineSettings||{}),equationcrossgrid:{...(settings?.engineSettings?.equationcrossgrid||{})}}};
  }
  function requestedSize(settings){
    const raw=settings?.engineSettings?.equationcrossgrid||{},difficulty=raw.difficulty||'standard',v=migrateGridSize(raw.gridSize);
    if(v==='5')return 5;
    if(v==='7')return 7;
    if(v==='9')return 9;
    return difficulty==='easy'?5:difficulty==='challenge'?9:7;
  }
  function internalSize(target){return target===5?5:target===7?8:10;}
  function missingType(settings,difficulty){
    const v=String(settings?.engineSettings?.equationcrossgrid?.missingType||'auto');
    if(v==='numbers'||v==='numbers_operators')return v;
    return difficulty==='challenge'?'numbers_operators':'numbers';
  }
  function parseKey(k){const [r,c]=String(k).split(':').map(Number);return [r,c];}
  function makeKey(r,c){return `${r}:${c}`;}
  function activeBounds(grid){
    const used=[];
    for(let r=0;r<(grid||[]).length;r++)for(let c=0;c<(grid[r]||[]).length;c++)if(grid[r][c]!=='#')used.push([r,c]);
    if(!used.length)return null;
    const rs=used.map(p=>p[0]),cs=used.map(p=>p[1]);
    return {minR:Math.min(...rs),maxR:Math.max(...rs),minC:Math.min(...cs),maxC:Math.max(...cs),height:Math.max(...rs)-Math.min(...rs)+1,width:Math.max(...cs)-Math.min(...cs)+1};
  }
  function remapKey(k,b){const [r,c]=parseKey(k);return makeKey(r-b.minR,c-b.minC);}
  function cropGrid(grid,b){return grid.slice(b.minR,b.maxR+1).map(row=>row.slice(b.minC,b.maxC+1));}
  function cropActivity(activity,target){
    if(!activity||activity.error||activity.engineId!=='equationcrossgrid')return activity;
    const b=activeBounds(activity.solutionGrid);
    if(!b||b.width!==target||b.height!==target)return null;
    activity.solutionGrid=cropGrid(activity.solutionGrid,b);
    activity.displayGrid=cropGrid(activity.displayGrid,b);
    activity.lines=(activity.lines||[]).map(line=>({...line,cells:(line.cells||[]).map(([r,c])=>[r-b.minR,c-b.minC])}));
    activity.hiddenKeys=(activity.hiddenKeys||[]).map(k=>remapKey(k,b));
    activity.size=target;
    const used=activity.solutionGrid.flat().filter(v=>v!=='#').length;
    activity.occupancy=used/(target*target);
    activity.options={...(activity.options||{}),gridSize:String(target)};
    return activity;
  }
  function apply(a,op,b){if(op==='+')return a+b;if(op==='-')return a-b;if(op==='×')return a*b;if(op==='÷')return b===0?NaN:a/b;return NaN;}
  function uniqueOperator(activity,line){
    const g=activity.solutionGrid||[],[ap,op,bp,,rp]=line.cells||[],a=Number(g?.[ap?.[0]]?.[ap?.[1]]),b=Number(g?.[bp?.[0]]?.[bp?.[1]]),res=Number(g?.[rp?.[0]]?.[rp?.[1]]),actual=g?.[op?.[0]]?.[op?.[1]];
    if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(res)||!OPS.has(actual))return false;
    const matches=[...OPS].filter(test=>Math.abs(apply(a,test,b)-res)<1e-9);
    return matches.length===1&&matches[0]===actual;
  }
  function isOperatorKey(activity,k){const [r,c]=parseKey(k);return OPS.has(activity.solutionGrid?.[r]?.[c]);}
  function revealKey(activity,k){
    const [r,c]=parseKey(k);if(activity.displayGrid?.[r])activity.displayGrid[r][c]=activity.solutionGrid?.[r]?.[c];
    activity.hiddenKeys=(activity.hiddenKeys||[]).filter(x=>x!==k);
  }
  function hideKey(activity,k){
    const [r,c]=parseKey(k);if(activity.displayGrid?.[r])activity.displayGrid[r][c]=null;
    if(!(activity.hiddenKeys||[]).includes(k))activity.hiddenKeys=[...(activity.hiddenKeys||[]),k];
  }
  function revealAllOperators(activity){
    for(const k of [...(activity.hiddenKeys||[])])if(isOperatorKey(activity,k))revealKey(activity,k);
  }
  function forceOneOperatorBlank(activity,seed){
    if((activity.hiddenKeys||[]).some(k=>isOperatorKey(activity,k)))return;
    const candidates=(activity.lines||[]).filter(line=>uniqueOperator(activity,line));
    if(!candidates.length)return;
    let h=2166136261>>>0;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    const line=candidates[(h>>>0)%candidates.length],cells=line.cells||[];
    for(const p of [cells[0],cells[2],cells[4]])if(p)revealKey(activity,makeKey(p[0],p[1]));
    if(cells[1])hideKey(activity,makeKey(cells[1][0],cells[1][1]));
  }
  function applyMissingMode(activity,settings,seed){
    if(!activity||activity.error)return activity;
    const mode=missingType(settings,activity.difficulty||'standard');
    if(mode==='numbers')revealAllOperators(activity);
    else if(mode==='numbers_operators')forceOneOperatorBlank(activity,seed);
    activity.options={...(activity.options||{}),missingType:settings?.engineSettings?.equationcrossgrid?.missingType||'auto'};
    return activity;
  }
  function enrich(activity){
    if(!activity||activity.error||activity.engineId!=='equationcrossgrid')return activity;
    const hidden=new Set(activity.hiddenKeys||[]),solution=activity.solutionGrid||[],hiddenOperatorKeys=[];
    for(let r=0;r<solution.length;r++)for(let c=0;c<(solution[r]||[]).length;c++){
      if(hidden.has(`${r}:${c}`)&&OPS.has(solution[r][c]))hiddenOperatorKeys.push(`${r}:${c}`);
    }
    activity.hiddenOperatorKeys=hiddenOperatorKeys;
    activity.instruction=hiddenOperatorKeys.length
      ?'Fill the missing numbers. A small ? in a corner marks a missing operation sign: write +, −, × or ÷ in that square. Make every connected equation true. Black squares are not used.'
      :'Fill the missing numbers so every connected equation is true. Black squares are not used.';
    return activity;
  }

  function generateCrossgrid(settings,seed){
    const target=requestedSize(settings),internal=internalSize(target),mapped=copySettings(settings);
    mapped.engineSettings.equationcrossgrid.gridSize=String(internal);
    let best=null,bestArea=-1;
    for(let attempt=0;attempt<28;attempt++){
      const attemptSeed=attempt===0?seed:`${seed}:full-grid:${attempt}`;
      const raw=originalGenerate('equationcrossgrid',mapped,attemptSeed);
      if(raw?.error){if(!best)best=raw;continue;}
      const b=activeBounds(raw.solutionGrid),area=b?b.width*b.height:0;
      if(area>bestArea){best=raw;bestArea=area;}
      const cropped=cropActivity(raw,target);
      if(cropped){cropped.seed=seed;return enrich(applyMissingMode(cropped,settings,seed));}
    }
    return {engineId:'equationcrossgrid',title:'Arithmetic Equation Crossgrid',error:`Could not build a full ${target} × ${target} active crossgrid without an empty border. Generate another version.`,seed,options:{...(best?.options||{}),gridSize:String(target)}};
  }

  A.generate=function(id,settings,seed){
    return id==='equationcrossgrid'?generateCrossgrid(settings,seed):originalGenerate(id,settings,seed);
  };
  A.workedExample=function(id,...args){
    const ex=originalWorked(id,...args);
    if(id!=='equationcrossgrid'||!ex)return ex;
    const rules=[...(ex.rules||[])];
    if(!rules.some(x=>/small \?/i.test(String(x))))rules.push('If operation signs are allowed to be missing, a small ? in the corner marks that square; write the operator in the centre.');
    const steps=[...(ex.steps||[])];
    if(!steps.some(x=>/operation/i.test(String(x))&&/\?/i.test(String(x))))steps.unshift('If you see a small ? in a corner, use the surrounding numbers to decide whether +, −, × or ÷ belongs in that square.');
    return {...ex,rules,steps,commonMistake:ex.commonMistake||'Do not write over the small ?; it is only a hint that the centre of that square needs an operation sign.'};
  };

  A.CROSSGRID_USABILITY={VERSION:'1.1.1',requestedSize,activeBounds,cropActivity,migrateGridSize};
  A.__crossgridCornerHintV1=true;
})(typeof globalThis!=='undefined'?globalThis:this);
