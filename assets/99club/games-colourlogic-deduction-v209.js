/* 99 Club Studio · Colour Logic deduction gate v2.09
 * Allows interdependent clues and contradiction reasoning, but rejects puzzles
 * that require an arbitrary unresolved branch.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||A.__colourLogicDeductionV209)return;

const BASE_GENERATE=A.generate.bind(A);
const BASE_VALIDATE=A.validate.bind(A);

function cloneDomains(ds){return ds.map(function(s){return new Set(s);});}

function rowRelation(clue,p,n){
  const a=p[clue.a],b=p[clue.b],c=p[clue.c];
  switch(clue.type){
    case'exact':return a===clue.i;
    case'notExact':return a!==clue.i;
    case'end':return a===0||a===n-1;
    case'notEnd':return a!==0&&a!==n-1;
    case'left':return a<b;
    case'right':return a>b;
    case'next':return Math.abs(a-b)===1;
    case'notNext':return Math.abs(a-b)!==1;
    case'immediateLeft':return a+1===b;
    case'distance2':return Math.abs(a-b)===2;
    case'betweenImmediate':return Math.abs(b-c)===2&&a===(b+c)/2;
    case'between':return (b<a&&a<c)||(c<a&&a<b);
    case'oneOf':return a===clue.i||a===clue.j;
    case'exactlyOneEnd':return Number(a===0||a===n-1)+Number(b===0||b===n-1)===1;
    default:return true;
  }
}

function perfectMatch(domains,forcedIndex,forcedPos){
  const used=new Set(),n=domains.length;
  function rec(i){
    if(i===n)return true;
    const values=i===forcedIndex?[forcedPos]:Array.from(domains[i]);
    for(const pos of values){
      if(!domains[i].has(pos)||used.has(pos))continue;
      used.add(pos);
      if(rec(i+1))return true;
      used.delete(pos);
    }
    return false;
  }
  return rec(0);
}

function propagateRow(p,domains){
  const colours=(p.colors||[]).map(function(x){return x.id;});
  const n=colours.length,index=new Map(colours.map(function(x,i){return [x,i];}));
  let changed=true,passes=0;
  while(changed&&passes++<60){
    changed=false;
    for(const clue of p.clues||[]){
      const vars=[clue.a,clue.b,clue.c].filter(Boolean).filter(function(x,i,a){return a.indexOf(x)===i;});
      if(!vars.length)continue;
      const support=new Map(vars.map(function(v){return [v,new Set()];})),assign={};
      function rec(k,used){
        if(k===vars.length){
          if(rowRelation(clue,assign,n))for(const v of vars)support.get(v).add(assign[v]);
          return;
        }
        const v=vars[k],d=domains[index.get(v)];
        if(!d)return;
        for(const pos of d){
          if(used.has(pos))continue;
          assign[v]=pos;used.add(pos);rec(k+1,used);used.delete(pos);
        }
      }
      rec(0,new Set());
      for(const v of vars){
        const d=domains[index.get(v)],s=support.get(v);
        for(const pos of Array.from(d))if(!s.has(pos)){d.delete(pos);changed=true;}
        if(!d.size)return {ok:false,passes:passes};
      }
    }
    if(!perfectMatch(domains,-1,-1))return {ok:false,passes:passes};
    for(let i=0;i<n;i++)for(const pos of Array.from(domains[i])){
      if(!perfectMatch(domains,i,pos)){
        domains[i].delete(pos);changed=true;
        if(!domains[i].size)return {ok:false,passes:passes};
      }
    }
  }
  return {ok:true,passes:passes};
}

function auditRow(p){
  const n=(p.colors||[]).length;
  if(!n)return {solved:false,error:'missing colours'};
  const domains=Array.from({length:n},function(){return new Set(Array.from({length:n},function(_,i){return i;}));});
  let contradictions=0,passes=0;
  for(let guard=0;guard<120;guard++){
    const q=propagateRow(p,domains);passes+=q.passes||0;
    if(!q.ok)return {solved:false,contradiction:true,contradictions:contradictions,passes:passes};
    if(domains.every(function(d){return d.size===1;}))return {solved:true,contradiction:false,contradictions:contradictions,passes:passes};
    let removed=false;
    outer:for(let i=0;i<n;i++)if(domains[i].size>1)for(const pos of Array.from(domains[i])){
      const test=cloneDomains(domains);test[i]=new Set([pos]);
      if(!propagateRow(p,test).ok){
        domains[i].delete(pos);contradictions++;removed=true;break outer;
      }
    }
    if(!removed)return {solved:false,contradiction:false,contradictions:contradictions,passes:passes,remaining:domains.map(function(d){return d.size;})};
  }
  return {solved:false,contradiction:false,contradictions:contradictions,passes:passes,capped:true};
}

function forceDomain(domains,i,value){
  const d=domains[i];
  if(d.size===1&&d.has(value))return 0;
  if(!d.has(value))return -1;
  domains[i]=new Set([value]);return 1;
}
function removeDomain(domains,i,value){
  const d=domains[i];
  if(!d.has(value))return 0;
  if(d.size===1)return -1;
  d.delete(value);return 1;
}
function applyCount(domains,indices,col,target){
  let known=0,possible=0,unknown=[];
  for(const i of indices){
    const d=domains[i];
    if(d.size===1&&d.has(col))known++;
    else if(d.has(col)){possible++;unknown.push(i);}
  }
  if(known>target||known+possible<target)return -1;
  let changed=0;
  if(known===target){
    for(const i of unknown){const q=removeDomain(domains,i,col);if(q<0)return -1;changed+=q;}
  }else if(known+possible===target){
    for(const i of unknown){const q=forceDomain(domains,i,col);if(q<0)return -1;changed+=q;}
  }
  return changed;
}

function propagateGrid(p,domains){
  const n=Number(p.size),at=function(r,c){return r*n+c;};
  let changed=true,passes=0;
  while(changed&&passes++<80){
    changed=false;
    for(const clue of p.clues||[]){
      let q=0;
      if(clue.type==='fixed')q=forceDomain(domains,at(clue.r,clue.c),clue.col);
      else if(clue.type==='notFixed')q=removeDomain(domains,at(clue.r,clue.c),clue.col);
      else if(clue.type==='rowCount')q=applyCount(domains,Array.from({length:n},function(_,c){return at(clue.r,c);}),clue.col,clue.k);
      else if(clue.type==='colCount')q=applyCount(domains,Array.from({length:n},function(_,r){return at(r,clue.c);}),clue.col,clue.k);
      else if(clue.type==='totalCount')q=applyCount(domains,Array.from({length:n*n},function(_,i){return i;}),clue.col,clue.k);
      else if(clue.type==='cornerCount')q=applyCount(domains,[at(0,0),at(0,n-1),at(n-1,0),at(n-1,n-1)],clue.col,clue.k);
      else if(clue.type==='diagCount')q=applyCount(domains,Array.from({length:n},function(_,i){return at(i,clue.diag==='main'?i:n-1-i);}),clue.col,clue.k);
      else if(clue.type==='edgeCount'){
        const cells=[];
        for(let i=0;i<n;i++){cells.push(at(0,i),at(n-1,i));if(i>0&&i<n-1)cells.push(at(i,0),at(i,n-1));}
        q=applyCount(domains,Array.from(new Set(cells)),clue.col,clue.k);
      }else if(clue.type==='noTouch'){
        for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(domains[at(r,c)].size===1&&domains[at(r,c)].has(clue.col)){
          for(const pair of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]){
            const rr=pair[0],cc=pair[1];
            if(rr<0||cc<0||rr>=n||cc>=n)continue;
            const z=removeDomain(domains,at(rr,cc),clue.col);
            if(z<0)return {ok:false,passes:passes};
            if(z>0)changed=true;
          }
        }
        continue;
      }else if(clue.type==='no2x2'){
        for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){
          const cells=[at(r,c),at(r+1,c),at(r,c+1),at(r+1,c+1)];
          for(const col of ['R','B']){
            const fixed=cells.filter(function(i){return domains[i].size===1&&domains[i].has(col);});
            if(fixed.length===4)return {ok:false,passes:passes};
            if(fixed.length===3){
              const other=cells.find(function(i){return !(domains[i].size===1&&domains[i].has(col));});
              if(other!=null){
                const z=removeDomain(domains,other,col);
                if(z<0)return {ok:false,passes:passes};
                if(z>0)changed=true;
              }
            }
          }
        }
        continue;
      }
      if(q<0)return {ok:false,passes:passes};
      if(q>0)changed=true;
    }
    if(domains.some(function(d){return !d.size;}))return {ok:false,passes:passes};
  }
  return {ok:true,passes:passes};
}

function auditGrid(p){
  const n=Number(p.size);
  if(!n)return {solved:false,error:'missing grid size'};
  const domains=Array.from({length:n*n},function(){return new Set(['R','B']);});
  let contradictions=0,passes=0;
  for(let guard=0;guard<160;guard++){
    const q=propagateGrid(p,domains);passes+=q.passes||0;
    if(!q.ok)return {solved:false,contradiction:true,contradictions:contradictions,passes:passes};
    if(domains.every(function(d){return d.size===1;}))return {solved:true,contradiction:false,contradictions:contradictions,passes:passes};
    let removed=false;
    outer:for(let i=0;i<domains.length;i++)if(domains[i].size>1)for(const value of Array.from(domains[i])){
      const test=cloneDomains(domains);test[i]=new Set([value]);
      if(!propagateGrid(p,test).ok){
        domains[i].delete(value);contradictions++;removed=true;break outer;
      }
    }
    if(!removed)return {solved:false,contradiction:false,contradictions:contradictions,passes:passes,remaining:domains.filter(function(d){return d.size>1;}).length};
  }
  return {solved:false,contradiction:false,contradictions:contradictions,passes:passes,capped:true};
}

function audit(p){
  if(!p||p.engineId!=='colourlogic')return {solved:false,error:'not colour logic'};
  if(p.variant==='row')return auditRow(p);
  if(p.variant==='grid')return auditGrid(p);
  return {solved:false,error:'unknown Colour Logic variant'};
}

function guardedGenerate(settings,seed){
  for(let attempt=0;attempt<24;attempt++){
    const candidateSeed=attempt?String(seed)+':deduction-retry:'+attempt:seed;
    const p=BASE_GENERATE('colourlogic',settings,candidateSeed);
    if(!p||p.error)continue;
    const result=audit(p);
    if(result.solved){
      p.deductionStats=Object.assign({},result,{method:'propagation+contradiction',attempt:attempt+1});
      return p;
    }
  }
  return {engineId:'colourlogic',title:'Colour Logic',error:'A deduction-solvable Colour Logic puzzle could not be built. Generate another version.',seed:seed};
}

A.generate=function(id,settings,seed){
  return id==='colourlogic'?guardedGenerate(settings,seed):BASE_GENERATE(id,settings,seed);
};
A.validate=function(p){
  const base=BASE_VALIDATE(p);
  if(!base||base.ok===false||p?.engineId!=='colourlogic')return base;
  const result=audit(p);
  if(!result.solved)return {ok:false,error:'colour logic requires an arbitrary branch'};
  return Object.assign({},base,{deductionSolvable:true,deductionStats:result});
};

A.COLOURLOGIC_DEDUCTION={audit:audit,auditRow:auditRow,auditGrid:auditGrid};
A.__colourLogicDeductionV209=true;
})(typeof globalThis!=='undefined'?globalThis:this);
