/* 99 Club Studio · Sumplete / Cross-Out Sums
 * v1.0.0 — deterministic unique-solution arithmetic puzzle engine.
 * Whole-number mode first; data model keeps exact integer units so fraction /
 * decimal variants can be added later without weakening solution validation.
 */
(function(global){
  'use strict';

  let base=global.TT99NumberLogicGames||null;
  if(!base&&typeof require==='function'){
    try{base=require('./games-number-logic.js');global.TT99NumberLogicGames=base;}catch(e){}
  }
  if(!base||base.__sumpleteV1)return;

  const VERSION='1.0.0';
  const ORIGINAL_GENERATE=base.generate.bind(base);
  const ORIGINAL_VALIDATE=base.validate.bind(base);
  const ORIGINAL_WORKED=base.workedExample.bind(base);
  const ORIGINAL_NORMALISE=base.normalise.bind(base);

  const compatibility={
    number_place_value:'reasonable',calculation:'excellent',fractions:'poor',decimals_percentages:'poor',
    ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'reasonable'
  };

  const DEF={
    id:'sumplete',title:'Sumplete · Cross-Out Sums',group:'Arithmetic & calculation',kind:'independent',printableMode:'grid',
    answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,
    supportedAnswerTypes:['number','arithmetic','logic'],difficultyOptions:['easy','standard','challenge'],
    defaultSettings:{difficulty:'standard',gridSize:'auto',numberRange:'auto'},
    settingsSchema:[
      {id:'difficulty',type:'difficulty',label:'Difficulty'},
      {id:'gridSize',type:'select',label:'Grid size',options:[
        {value:'auto',label:'Auto'},
        {value:'4',label:'4 × 4'},
        {value:'5',label:'5 × 5'},
        {value:'6',label:'6 × 6'}
      ],help:'Auto uses 4×4 on Easy, 5×5 on Standard and 6×6 on Challenge.'},
      {id:'numberRange',type:'select',label:'Number size',options:[
        {value:'auto',label:'Auto for difficulty'},
        {value:'small',label:'Small numbers'},
        {value:'balanced',label:'Balanced'},
        {value:'larger',label:'Larger numbers'}
      ],help:'Controls the arithmetic without changing the puzzle rules.'}
    ],
    difficultyDescriptions:{
      easy:'4 × 4, smaller values and fewer competing combinations',
      standard:'5 × 5 with balanced arithmetic and deduction',
      challenge:'6 × 6, larger values and more competing combinations'
    },
    topicYearMin:{number_place_value:2,calculation:2,algebra:6},
    compatibility
  };
  base.DEFINITIONS.sumplete=DEF;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

  function normalise(raw={}){
    const d=DEF.defaultSettings,out={...d,...raw};
    out.difficulty=['easy','standard','challenge'].includes(out.difficulty)?out.difficulty:'standard';
    out.gridSize=['auto','4','5','6'].includes(String(out.gridSize))?String(out.gridSize):'auto';
    out.numberRange=['auto','small','balanced','larger'].includes(out.numberRange)?out.numberRange:'auto';
    return out;
  }
  base.normalise=function(id,raw={}){if(id==='sumplete')return normalise(raw);return ORIGINAL_NORMALISE(id,raw);};

  function sizeFor(o){if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?4:o.difficulty==='challenge'?6:5;}
  function maxValueFor(o,n){
    if(o.numberRange==='small')return n<=4?7:9;
    if(o.numberRange==='balanced')return n<=4?9:n===5?12:15;
    if(o.numberRange==='larger')return n<=4?12:n===5?16:24;
    return o.difficulty==='easy'?8:o.difficulty==='challenge'?20:12;
  }
  function minValueFor(o){return o.difficulty==='challenge'?2:1;}

  function makeMask(n,rng,difficulty){
    const keepP=difficulty==='easy'?.58:difficulty==='challenge'?.48:.53;
    const mask=Array.from({length:n},()=>Array.from({length:n},()=>rng()<keepP));
    // Nudge obvious all-kept/all-crossed lines away from triviality. A final
    // strict check below rejects any mask where these local repairs conflict.
    for(let r=0;r<n;r++){
      const kept=mask[r].filter(Boolean).length;
      if(kept===0)mask[r][randInt(rng,0,n-1)]=true;
      else if(kept===n)mask[r][randInt(rng,0,n-1)]=false;
    }
    for(let c=0;c<n;c++){
      let kept=0;for(let r=0;r<n;r++)if(mask[r][c])kept++;
      if(kept===0)mask[randInt(rng,0,n-1)][c]=true;
      else if(kept===n)mask[randInt(rng,0,n-1)][c]=false;
    }
    return mask;
  }
  function maskIsNonTrivial(mask){
    const n=mask.length;
    for(let r=0;r<n;r++){const kept=mask[r].filter(Boolean).length;if(kept===0||kept===n)return false;}
    for(let c=0;c<n;c++){let kept=0;for(let r=0;r<n;r++)if(mask[r][c])kept++;if(kept===0||kept===n)return false;}
    return true;
  }

  function makeValues(n,rng,min,max){
    const values=Array.from({length:n},()=>Array(n).fill(0));
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      let v=randInt(rng,min,max);
      // Reduce immediate duplicate runs: still natural, but better for deduction.
      if(c&&v===values[r][c-1])v=min+((v-min+randInt(rng,1,Math.max(1,max-min)))%(max-min+1));
      if(r&&v===values[r-1][c]&&rng()<.7)v=min+((v-min+randInt(rng,1,Math.max(1,max-min)))%(max-min+1));
      values[r][c]=v;
    }
    return values;
  }

  function targetsFor(values,mask){
    const n=values.length,rowTargets=Array(n).fill(0),colTargets=Array(n).fill(0);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(mask[r][c]){rowTargets[r]+=values[r][c];colTargets[c]+=values[r][c];}
    return {rowTargets,colTargets};
  }

  function rowMasks(values,target){
    const n=values.length,out=[];
    for(let mask=0;mask<(1<<n);mask++){
      let sum=0;for(let c=0;c<n;c++)if(mask&(1<<c))sum+=values[c];
      if(sum===target)out.push(mask);
    }
    return out;
  }

  function analyseSolutions(values,rowTargets,colTargets,limit=2){
    const n=values.length,candidates=values.map((row,r)=>rowMasks(row,rowTargets[r]));
    if(candidates.some(x=>!x.length))return {count:0,nodes:0,rowCandidateCounts:candidates.map(x=>x.length)};
    const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>candidates[a].length-candidates[b].length||a-b);
    const futureMax=Array.from({length:n+1},()=>Array(n).fill(0));
    for(let i=n-1;i>=0;i--){
      futureMax[i]=futureMax[i+1].slice();const r=order[i];
      for(let c=0;c<n;c++)futureMax[i][c]+=values[r][c];
    }
    const sums=Array(n).fill(0);let count=0,nodes=0;
    function rec(depth){
      if(count>=limit)return;
      nodes++;
      if(depth===n){if(sums.every((v,c)=>v===colTargets[c]))count++;return;}
      const r=order[depth];
      for(const bits of candidates[r]){
        let ok=true;
        for(let c=0;c<n;c++){
          const next=sums[c]+((bits&(1<<c))?values[r][c]:0);
          if(next>colTargets[c]||next+futureMax[depth+1][c]<colTargets[c]){ok=false;break;}
        }
        if(!ok)continue;
        for(let c=0;c<n;c++)if(bits&(1<<c))sums[c]+=values[r][c];
        rec(depth+1);
        for(let c=0;c<n;c++)if(bits&(1<<c))sums[c]-=values[r][c];
        if(count>=limit)return;
      }
    }
    rec(0);return {count,nodes,rowCandidateCounts:candidates.map(x=>x.length)};
  }

  function complexityScore(analysis,n){
    const branch=analysis.rowCandidateCounts.reduce((s,x)=>s+Math.max(0,x-1),0);
    return branch*4+Math.log2(Math.max(2,analysis.nodes))*3+n*n;
  }
  function desiredComplexity(o,n,score){
    if(o.difficulty==='easy')return score<=n*n+34;
    if(o.difficulty==='challenge')return score>=n*n+22;
    return true;
  }

  function generateSumplete(settings,seed){
    const o=normalise(settings?.engineSettings?.sumplete),n=sizeFor(o),min=minValueFor(o),max=maxValueFor(o,n);
    let best=null,bestRank=o.difficulty==='challenge'?-Infinity:Infinity;
    for(let attempt=0;attempt<260;attempt++){
      const rng=rngFromSeed(`${seed}:sumplete:${attempt}`),values=makeValues(n,rng,min,max),mask=makeMask(n,rng,o.difficulty);
      if(!maskIsNonTrivial(mask))continue;
      const targets=targetsFor(values,mask),analysis=analyseSolutions(values,targets.rowTargets,targets.colTargets,2);
      if(analysis.count!==1)continue;
      const score=complexityScore(analysis,n),candidate={values,mask,...targets,analysis,score};
      if(desiredComplexity(o,n,score)){best=candidate;break;}
      if(o.difficulty==='challenge'){if(score>bestRank){best=candidate;bestRank=score;}}
      else if(score<bestRank){best=candidate;bestRank=score;}
    }
    if(!best)return {engineId:'sumplete',title:'Sumplete · Cross-Out Sums',error:'A unique Sumplete puzzle could not be built. Generate another version.'};
    return {
      engineId:'sumplete',title:'Sumplete · Cross-Out Sums',difficulty:o.difficulty,size:n,
      valueGrid:best.values,solutionMask:best.mask,rowTargets:best.rowTargets,colTargets:best.colTargets,
      scale:1,valueFormat:'whole',complexity:Math.round(best.score),solutionStats:{nodes:best.analysis.nodes,rowCandidateCounts:best.analysis.rowCandidateCounts},
      instruction:'Cross out some numbers. The numbers left in each row must add to the target on its right, and the numbers left in each column must add to the target below it.',
      seed,options:o,engineVersion:VERSION
    };
  }

  function validateSumplete(a){
    if(!a||a.error)return {ok:false,error:a?.error||'missing activity'};
    const n=a.size;
    if(!Number.isInteger(n)||n<4||n>6)return {ok:false,error:'sumplete grid size invalid'};
    if(a.valueGrid?.length!==n||a.solutionMask?.length!==n)return {ok:false,error:'sumplete grid shape invalid'};
    for(let r=0;r<n;r++){
      if(a.valueGrid[r]?.length!==n||a.solutionMask[r]?.length!==n)return {ok:false,error:'sumplete row shape invalid'};
      for(let c=0;c<n;c++)if(!Number.isInteger(a.valueGrid[r][c])||a.valueGrid[r][c]<=0)return {ok:false,error:'sumplete values must be positive integers'};
    }
    if(!maskIsNonTrivial(a.solutionMask))return {ok:false,error:'sumplete contains a trivial all-kept/all-crossed row or column'};
    const t=targetsFor(a.valueGrid,a.solutionMask);
    if(JSON.stringify(t.rowTargets)!==JSON.stringify(a.rowTargets)||JSON.stringify(t.colTargets)!==JSON.stringify(a.colTargets))return {ok:false,error:'sumplete targets do not match solution'};
    const analysis=analyseSolutions(a.valueGrid,a.rowTargets,a.colTargets,2);
    if(analysis.count!==1)return {ok:false,error:analysis.count===0?'sumplete has no solution':'sumplete is not unique'};
    return {ok:true};
  }

  function workedExample(){
    return {
      engineId:'sumplete',kind:'sumplete',title:'Sumplete · Cross-Out Sums worked example',
      goal:'Cross out numbers so every row and column reaches its target using the numbers left behind.',
      rules:['A number is either kept or crossed out.','Kept numbers in each row add to the target on the right.','Kept numbers in each column add to the target underneath.'],
      steps:['If a row contains 2, 5 and 7 with target 9, keeping 2 and 7 makes 9.','Cross out the 5 in that row.','Now use the column targets to decide which of the remaining numbers must stay.','Check every row and every column before finishing.'],
      tip:'Rows or columns with only one sensible way to make the target are the best place to start.',
      commonMistake:'Do not try to make only the row totals — every decision must also satisfy the column totals.'
    };
  }

  base.generate=function(id,settings,seed){if(id==='sumplete')return generateSumplete(settings,seed);return ORIGINAL_GENERATE(id,settings,seed);};
  base.validate=function(a){if(a?.engineId==='sumplete')return validateSumplete(a);return ORIGINAL_VALIDATE(a);};
  base.workedExample=function(id,...args){if(id==='sumplete')return workedExample();return ORIGINAL_WORKED(id,...args);};
  base.SUMPLETE={VERSION,DEFINITION:DEF,generate:generateSumplete,validate:validateSumplete,analyseSolutions};
  base.__sumpleteV1=true;

  if(typeof module!=='undefined'&&module.exports)module.exports=base;
})(typeof globalThis!=='undefined'?globalThis:this);
