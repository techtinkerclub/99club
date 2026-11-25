'use strict';
const assert=require('node:assert/strict');
const M=require('../../assets/99club/goodies-statistics-model.js');
const d=M.dataset([{label:'A',value:0},{label:'B',value:5},{label:'C',value:5},{label:'D',value:10}],{title:'Votes',unit:'votes'});
assert.deepEqual(M.summary(d),{total:20,min:0,max:10,range:10,mean:5,largest:['D'],smallest:['A']});
assert.deepEqual(M.summary(M.dataset([{label:'A',value:2},{label:'B',value:2}])).largest,['A','B']);
assert.throws(()=>M.dataset([]));
assert.throws(()=>M.dataset([{label:'A',value:-1}]));
assert.throws(()=>M.dataset([{label:'A',value:1.5}]));
assert.throws(()=>M.dataset([{label:'A',value:1},{label:' A ',value:2}]));
assert.throws(()=>M.pie(M.dataset([{label:'A',value:0}])));
assert.throws(()=>M.pictogram(d,0));
assert.throws(()=>M.question(d,'read',9));
assert(Object.isFrozen(d)&&Object.isFrozen(d.rows)&&Object.isFrozen(d.rows[0]));
assert.deepEqual(M.tally(12),{groups:2,remainder:2});
assert.equal(M.question(d,'difference',0,3).answer,10);
let seed=713,count=0;
const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
for(let i=0;i<2000;i++){
 const values=Array.from({length:2+rand(7)},()=>rand(101));
 const data=M.dataset(values.map((value,j)=>({label:'Item '+j,value}))),s=M.summary(data);
 assert.equal(s.total,values.reduce((a,b)=>a+b,0));
 assert.equal(s.mean,s.total/values.length);
 assert.equal(s.range,Math.max(...values)-Math.min(...values));
 const key=1+rand(10);
 for(const row of M.pictogram(data,key))assert.equal(row.whole*key+row.remainder,row.value);
 for(const v of values){const t=M.tally(v);assert.equal(t.groups*5+t.remainder,v)}
 const axis=M.axis(data);assert(axis.max>=s.max&&axis.step>=1&&axis.max%axis.step===0);
 if(s.total){const p=M.pie(data);assert.equal(p[0].start,0);assert.equal(p.at(-1).end,360);p.forEach((r,j)=>{assert(r.end>=r.start);assert(Math.abs(r.end-r.start-r.angle)<1e-9);if(j)assert.equal(r.start,p[j-1].end)})}
 assert.equal(M.question(data,'total').answer,s.total);
 assert.equal(M.question(data,'read',0).answer,values[0]);
 assert.equal(M.question(data,'mean').answer,s.mean);
 count++;
}
console.log('Statistics: '+count+' datasets verified.');
