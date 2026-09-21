/* 99 Club Studio · Custom Worksheet verbal reasoning v2.08 */
(function(global){
'use strict';
var G=global.TT99Generator,VR=global.TT99VerbalReasoning;
if(!G||!VR||G.__customVerbalV208)return;
var VERSION='2.08.0',PREFIX='vr_';
var FAMILIES={};
VR.TYPE_IDS.forEach(function(typeId){
  var t=VR.TYPES[typeId],id=PREFIX+typeId;
  FAMILIES[id]={typeId:typeId,label:t.label,strand:'Verbal Reasoning',years:[3,4,5,6]};
  if(!G.FAMILY_META[id])G.FAMILY_META[id]={label:t.label,strand:'Verbal Reasoning',years:[3,4,5,6],extension:true,visual:false};
  G.FAMILY_LABELS[id]=t.label;
  if(Array.isArray(G.FAMILY_ORDER)&&G.FAMILY_ORDER.indexOf(id)<0)G.FAMILY_ORDER.push(id);
  if(Array.isArray(G.FAMILY_COMPACT_ORDER)&&G.FAMILY_COMPACT_ORDER.indexOf(id)<0)G.FAMILY_COMPACT_ORDER.push(id);
});
var IDS=Object.keys(FAMILIES),cache=new Map();
function isKind(k){return IDS.indexOf(String(k||''))>=0;}
function hasKind(r){return Array.isArray(r&&r.families)&&r.families.some(isKind);}
function clone(o){return JSON.parse(JSON.stringify(o));}
function difficulty(r){return ['easy','standard','challenge'].indexOf(r&&r.verbalDifficulty)>=0?r.verbalDifficulty:'standard';}
var previousNormalize=G.normalizeRules.bind(G);
G.normalizeRules=function(r){var out=previousNormalize(r);out.verbalDifficulty=difficulty(r||out);return out;};
function toCustom(kind,q,index){
  var choiceText=Array.isArray(q.choices)&&q.choices.length?'  Options: '+q.choices.map(function(x,i){return String.fromCharCode(65+i)+') '+x;}).join('   '):'';
  return {kind:kind,prompt:q.prompt+choiceText,answer:String(q.answerText||q.answer),key:kind+':'+q.key,group:kind,footprint:q.typeId==='reading_information'?'L':'M',marking:{mode:'exact',answer:String(q.answerText||q.answer)},vrQuestion:q,response:{kind:'short',size:q.typeId==='reading_information'?'M':'S',label:'Answer'}};
}
function pool(kind,rules){
  var f=FAMILIES[kind];if(!f)return[];
  var d=difficulty(rules),ck=f.typeId+'|'+d;if(cache.has(ck))return clone(cache.get(ck));
  var raw=VR.samplePool(f.typeId,d,240,'custom-vr-v208'),out=raw.map(function(q,i){return toCustom(kind,q,i);});
  cache.set(ck,out);return clone(out);
}
var prev={questionPool:G.questionPool.bind(G),questionByKey:G.questionByKey.bind(G),questionPoolIndex:G.questionPoolIndex.bind(G),questionByPoolIndex:G.questionByPoolIndex.bind(G),generateQuestions:G.generateQuestions.bind(G),replaceQuestion:G.replaceQuestion.bind(G)};
G.questionPool=function(kind,rules){return isKind(kind)?pool(kind,rules):prev.questionPool(kind,rules);};
G.questionByKey=function(kind,rules,key){if(!isKind(kind))return prev.questionByKey(kind,rules,key);var p=pool(kind,rules),x=p.find(function(q){return q.key===key;});return x?clone(x):null;};
G.questionPoolIndex=function(kind,rules,key){if(!isKind(kind))return prev.questionPoolIndex(kind,rules,key);return pool(kind,rules).findIndex(function(q){return q.key===key;});};
G.questionByPoolIndex=function(kind,rules,index){if(!isKind(kind))return prev.questionByPoolIndex(kind,rules,index);var p=pool(kind,rules),n=Number(index);return Number.isInteger(n)&&n>=0&&n<p.length?clone(p[n]):null;};
function hashString(str){var h=2166136261>>>0,s=String(str);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rngFor(seed){if(typeof G.rngFromSeed==='function')return G.rngFromSeed(seed);var a=hashString(seed)||1234567;return function(){a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
function shuf(a,r){var o=a.slice();for(var i=o.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),x=o[i];o[i]=o[j];o[j]=x;}return o;}
function weightedCounts(rules,rng){var bag=[];(rules.families||[]).forEach(function(f){for(var i=0;i<Math.max(1,Number(rules.familyWeights&&rules.familyWeights[f])||1);i++)bag.push(f);});var cycle=shuf(bag,rng),counts={};(rules.families||[]).forEach(function(f){counts[f]=0;});for(var j=0;j<Number(rules.questionCount||0);j++)counts[cycle[j%cycle.length]]++;return counts;}
function pick(p,n,r){if(!p.length)return[];return shuf(p,r).slice(0,Math.min(n,p.length)).map(clone);}
G.generateQuestions=function(inputRules,seed){
  var rules=G.normalizeRules(inputRules);
  if(rules.mode!=='family_mix'||!hasKind(rules))return prev.generateQuestions(inputRules,seed);
  var rng=rngFor(seed||'CUSTOM'),counts=weightedCounts(rules,rng),out=[];
  (rules.families||[]).forEach(function(f){var n=counts[f]||0;if(n)out=out.concat(pick(G.questionPool(f,rules),n,rng));});
  return shuf(out,rng).map(function(it,i){it.number=i+1;return it;});
};
G.replaceQuestion=function(questions,index,inputRules,seed){
  var cur=questions&&questions[index];if(!cur||!isKind(cur.kind))return prev.replaceQuestion(questions,index,inputRules,seed);
  var rules=G.normalizeRules(inputRules),p=pool(cur.kind,rules).filter(function(q){return q.key!==cur.key;}),used=new Set(questions.filter(function(_,i){return i!==index;}).map(function(q){return q.key;})),c=p.filter(function(q){return !used.has(q.key);}),rng=rngFor(String(seed||'')+':vr-replace');
  if(!c.length)return questions.slice();var choice=shuf(c,rng)[0];
  if(!choice)return questions.slice();var out=questions.slice();out[index]=clone(choice);out[index].number=index+1;return out;
};
function validate(){
  var errors=[],counts={};
  ['easy','standard','challenge'].forEach(function(d){IDS.forEach(function(kind){var p=pool(kind,{verbalDifficulty:d});counts[kind+':'+d]=p.length;if(p.length<40)errors.push(kind+':'+d+':only-'+p.length);var keys=new Set();p.forEach(function(q){if(keys.has(q.key))errors.push(kind+':'+d+':duplicate');keys.add(q.key);if(!q.answer)errors.push(kind+':'+d+':blank-answer');});});});
  return {ok:errors.length===0,errors:errors,counts:counts};
}
G.__customVerbalV208=true;
global.TT99CustomVerbalReasoning={VERSION:VERSION,FAMILIES:FAMILIES,pool:pool,validate:validate};
})(typeof window!=='undefined'?window:globalThis);
