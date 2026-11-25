/* Shared statistics model: independent of DOM, rendering and publishing. */
(function(root){
'use strict';
const freezeRows=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
function dataset(rows,{title='',unit='',ordered=false}={}){
  if(!Array.isArray(rows)||!rows.length)throw new TypeError('Dataset needs at least one row');
  const seen=new Set();
  const clean=rows.map(({label,value})=>{
    label=String(label).trim();
    if(!label||seen.has(label)||!Number.isSafeInteger(value)||value<0)throw new RangeError('Expected unique labels and non-negative integer values');
    seen.add(label);return {label,value};
  });
  if(!Number.isSafeInteger(clean.reduce((s,r)=>s+r.value,0)))throw new RangeError('Dataset total exceeds safe integer range');
  return Object.freeze({title:String(title),unit:String(unit),ordered:Boolean(ordered),rows:freezeRows(clean)});
}
function summary(data){
  const values=data.rows.map(r=>r.value),total=values.reduce((a,b)=>a+b,0),min=Math.min(...values),max=Math.max(...values);
  return Object.freeze({total,min,max,range:max-min,mean:total/values.length,largest:Object.freeze(data.rows.filter(r=>r.value===max).map(r=>r.label)),smallest:Object.freeze(data.rows.filter(r=>r.value===min).map(r=>r.label))});
}
function tally(value){
  if(!Number.isSafeInteger(value)||value<0)throw new RangeError('Invalid tally');
  return Object.freeze({groups:Math.floor(value/5),remainder:value%5});
}
function pictogram(data,key){
  if(!Number.isSafeInteger(key)||key<1)throw new RangeError('Invalid pictogram key');
  return freezeRows(data.rows.map(r=>({...r,whole:Math.floor(r.value/key),remainder:r.value%key,key})));
}
function pie(data){
  const total=summary(data).total;
  if(!total)throw new RangeError('Pie chart needs a positive total');
  let cumulative=0;
  return freezeRows(data.rows.map(r=>{
    const start=360*(cumulative/total);
    cumulative+=r.value;
    return {...r,start,end:360*(cumulative/total),angle:360*(r.value/total),numerator:r.value,denominator:total};
  }));
}
function axis(data,targetTicks=5){
  if(!Number.isInteger(targetTicks)||targetTicks<2||targetTicks>20)throw new RangeError('Invalid tick count');
  const max=summary(data).max, raw=Math.max(1,max/targetTicks),power=10**Math.floor(Math.log10(raw));
  const step=([1,2,5,10].find(n=>n*power>=raw))*power;
  return Object.freeze({step,max:Math.max(step,Math.ceil(max/step)*step)});
}
function question(data,type,a=0,b=1){
  const rows=data.rows,s=summary(data);
  const row=i=>{if(!Number.isInteger(i)||!rows[i])throw new RangeError('Invalid row index');return rows[i]};
  let prompt,answer;
  switch(type){
    case 'read':prompt='What is the value for '+row(a).label+'?';answer=row(a).value;break;
    case 'total':prompt='What is the total?';answer=s.total;break;
    case 'difference':prompt='What is the difference between '+row(a).label+' and '+row(b).label+'?';answer=Math.abs(row(a).value-row(b).value);break;
    case 'mean':prompt='What is the mean of all the values?';answer=s.mean;break;
    case 'range':prompt='What is the difference between the largest and smallest values?';answer=s.range;break;
    default:throw new RangeError('Unknown question type');
  }
  return Object.freeze({type,prompt,answer});
}
const api=Object.freeze({dataset,summary,tally,pictogram,pie,axis,question});
if(typeof module==='object'&&module.exports)module.exports=api;
else (root.TT99Goodies=root.TT99Goodies||{}).statistics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
