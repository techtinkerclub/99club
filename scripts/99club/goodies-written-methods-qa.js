'use strict';
const assert=require('node:assert/strict');
require('../../assets/99club/goodies-written-methods.js');
const M=globalThis.writtenMethods,c=(m,a,b)=>M.calculate(m,a,b);
assert.equal(c('addition',999,1).answer,1000);
assert.equal(c('subtraction',1000,1).answer,999);
assert.equal(c('subtraction',1000,1).steps.filter(s=>s.type==='exchange').length,3);
assert.deepEqual(c('long-multiplication',247,36).partialProducts,[1482,7410]);
assert.equal(c('long-multiplication',247,36).answer,8892);
assert.deepEqual(c('short-division',1005,5).steps.map(s=>s.digit),[0,2,0,1]);
assert.equal(c('long-division',875,24).answer,36);
assert.equal(c('long-division',875,24).remainder,11);
for(const [m,a,b] of [['short-division',12,0],['subtraction',2,3],['short-multiplication',20,12]])assert.throws(()=>c(m,a,b));
let seed=8193;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};let count=0;
function check(m){
 const {method,a,b,answer,remainder,steps}=m;
 assert(steps.length&&steps.every(s=>s.explanation));
 if(method==='addition')assert.equal(answer,a+b);
 if(method==='subtraction')assert.equal(answer,a-b);
 if(method.endsWith('multiplication'))assert.equal(answer,a*b);
 if(method.endsWith('division')){
   assert.equal(answer*b+remainder,a);assert(remainder>=0&&remainder<b);
   for(const s of steps){assert(s.digit>=0&&s.digit<=9);assert.equal(s.product+s.remainder,s.dividend);assert(s.remainder<b)}
 }
 count++;
}
for(let year=3;year<=6;year++)for(const method of M.available({year}))for(let i=0;i<250;i++)check(M.generate(method,{year},rng));
for(const exchange of ['with','without','across-zero'])for(let i=0;i<100;i++){
 const m=M.generate('subtraction',{year:4,exchange},rng),ex=m.steps.filter(s=>s.type==='exchange');assert(exchange==='without'?ex.length===0:exchange==='across-zero'?ex.length>=2:ex.length>0);check(m);
}
for(const remainders of ['exact','with'])for(let i=0;i<100;i++){
 const m=M.generate('long-division',{year:6,remainders},rng);assert(remainders==='exact'?m.remainder===0:m.remainder>0);check(m);
}
for(const method of ['addition','subtraction'])for(let i=0;i<100;i++){
 const m=M.generate(method,{year:6,exchange:'without'},rng);assert(!m.steps.some(s=>s.type==='exchange'||s.type==='add-column'&&s.carry));check(m);
}
console.log('Written methods: '+count+' generated calculations verified.');
