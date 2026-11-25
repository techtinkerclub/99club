/* Pure written calculation engine. Column indices start at the ones place.
 * Renderers consume immutable step snapshots, never recompute arithmetic. */
(function(G){
'use strict';
const METHODS=['addition','subtraction','short-multiplication','long-multiplication','short-division','long-division'];
const PROFILES={3:{addition:3,subtraction:3,'short-multiplication':2,'short-division':2},4:{addition:4,subtraction:4,'short-multiplication':3,'short-division':3},5:{addition:6,subtraction:6,'short-multiplication':4,'long-multiplication':4,'short-division':4},6:{addition:7,subtraction:7,'short-multiplication':4,'long-multiplication':4,'short-division':4,'long-division':4}};
const copy=x=>JSON.parse(JSON.stringify(x)),digits=n=>String(n).split('').reverse().map(Number),value=ds=>ds.reduce((s,d,i)=>s+(d||0)*10**i,0);
const place=i=>['ones','tens','hundreds','thousands','ten thousands','hundred thousands','millions','ten millions'][i]||'place '+i;
function calculate(method,a,b){
 if(!METHODS.includes(method))throw Error('Unknown written method.');
 if(![a,b].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=9999999))throw Error('Use non-negative whole numbers up to 9,999,999.');
 if(method==='subtraction'&&b>a)throw Error('The first number must not be smaller than the second.');
 if(method==='short-multiplication'&&b>9)throw Error('Use a one-digit multiplier.');
 if(method==='long-multiplication'&&(b<10||b>99))throw Error('Use a two-digit multiplier.');
 if(method==='short-division'&&(b<1||b>9))throw Error('Use a one-digit non-zero divisor.');
 if(method==='long-division'&&(b<10||b>99))throw Error('Use a two-digit divisor.');
 if((method.endsWith('multiplication')||method.endsWith('division'))&&a>9999)throw Error('Use a first number of at most four digits.');
 const A=digits(a),B=digits(b),width=Math.max(A.length,B.length),steps=[],m={method,a,b,width,steps};
 const emit=(type,data,explanation)=>steps.push({type,...copy(data),explanation});
 if(method==='addition'){
   const result=[],carries=[0];let carry=0;
   for(let i=0;i<width;i++){
     const x=A[i]||0,y=B[i]||0,incoming=carry,total=x+y+incoming,digit=total%10;
     carry=Math.floor(total/10);result[i]=digit;carries[i+1]=carry;
     emit('add-column',{column:i,x,y,incoming,total,digit,carry,result,carries},x+' + '+y+(incoming?' + '+incoming:'')+' = '+total+' in the '+place(i)+' column. Write '+digit+(carry?'; exchange 10 for 1 in the next place.':'.'));
   }
   if(carry){result[width]=carry;emit('final-carry',{column:width,digit:carry,result,carries},'Write the remaining '+carry+' in the '+place(width)+' column.')}
   m.answer=value(result);m.result=result;m.carries=carries;
 }else if(method==='subtraction'){
   const top=A.slice(),result=[];
   for(let i=0;i<width;i++){
     const y=B[i]||0;
     if((top[i]||0)<y){
       let donor=i+1;while(donor<top.length&&!top[donor])donor++;
       if(donor===top.length)throw Error('Invalid exchange.');
       for(let j=donor;j>i;j--){
         top[j]--;top[j-1]=(top[j-1]||0)+10;
         emit('exchange',{from:j,to:j-1,top,result},'Exchange one unit in the '+place(j)+' column for ten in the '+place(j-1)+' column.');
       }
     }
     const x=top[i]||0,digit=x-y;result[i]=digit;
     emit('subtract-column',{column:i,x,y,digit,top,result},x+' − '+y+' = '+digit+' in the '+place(i)+' column.');
   }
   m.answer=value(result);m.result=result;m.exchanged=top;
 }else if(method.endsWith('multiplication')){
   const rows=[];
   for(let j=0;j<B.length;j++){
     const partial=Array(j).fill(0),carries=[0];let carry=0;
     if(j)emit('shift',{row:j,partial,rows},'Multiply by the '+place(j)+' digit. The ones place in this partial product is zero.');
     for(let i=0;i<A.length;i++){
       const incoming=carry,total=A[i]*B[j]+incoming,digit=total%10;
       carry=Math.floor(total/10);partial[i+j]=digit;carries[i+1]=carry;
       emit('multiply-column',{row:j,column:i+j,sourceColumn:i,x:A[i],y:B[j],incoming,total,digit,carry,partial,carries,rows},A[i]+' × '+B[j]+(incoming?' + '+incoming:'')+' = '+total+'. Write '+digit+' in the '+place(i+j)+' column'+(carry?'; carry '+carry+'.':'.'));
     }
     if(carry){partial[A.length+j]=carry;emit('final-product-carry',{row:j,column:A.length+j,partial,carries,rows},'Write the remaining carry '+carry+'.')}
     rows.push(partial);emit('partial-product',{row:j,partial,rows},'This partial product is '+value(partial)+'.');
   }
   m.answer=rows.reduce((s,row)=>s+value(row),0);m.result=digits(m.answer);m.partialProducts=rows.map(value);
   if(rows.length>1)for(const s of calculate('addition',value(rows[0]),value(rows[1])).steps)emit('sum-products',{rows,sumStep:s,result:s.result},s.explanation);
 }else{
   const input=A.slice().reverse(),quotientDigits=[];let remainder=0;
   for(let i=0;i<input.length;i++){
     const incoming=remainder,dividend=incoming*10+input[i],digit=Math.floor(dividend/b),product=digit*b;
     remainder=dividend-product;quotientDigits.push(digit);
     emit('divide-column',{index:i,column:input.length-1-i,inputDigit:input[i],incoming,dividend,digit,product,remainder,quotientDigits},dividend+' ÷ '+b+' gives '+digit+' with '+remainder+' remaining.'+(i<input.length-1?' Regroup the remainder into the next place and bring down the next digit.':''));
   }
   m.answer=Number(quotientDigits.join(''));m.remainder=remainder;m.result=digits(m.answer);
 }
 m.answerText=String(m.answer)+(m.remainder?' r '+m.remainder:'');return m;
}
function settings(raw={}){
 const year=[3,4,5,6].includes(+raw.year)?+raw.year:5;
 return {year,exchange:['any','with','without','across-zero'].includes(raw.exchange)?raw.exchange:'any',remainders:['any','exact','with'].includes(raw.remainders)?raw.remainders:year<5?'exact':'any'};
}
function available(raw){return METHODS.filter(m=>Object.hasOwn(PROFILES[settings(raw).year],m))}
function generate(method,raw={},rng=Math.random){
 const s=settings(raw),maxDigits=PROFILES[s.year][method];if(!maxDigits)throw Error('This method is not available for that year profile.');
 if(s.exchange==='across-zero'&&method==='addition')throw Error('Exchange across zero applies to subtraction.');
 const r=(lo,hi)=>lo+Math.min(hi-lo,Math.floor(rng()*(hi-lo+1))),max=10**maxDigits-1,min=10**(maxDigits-1);
 for(let attempt=0;attempt<2000;attempt++){
   let a=r(min,max),b;
   if(method==='addition'||method==='subtraction'){
     b=r(1,max);
     if(method==='subtraction'&&b>a)[a,b]=[b,a];
     if(method==='subtraction'&&s.exchange==='across-zero'){a=r(1,Math.floor(max/100))*100+r(0,8);b=r(1,9);if(b<=a%10)continue}
     // Construct non-exchange examples instead of relying on rare random matches.
     if(s.exchange==='without'){
       b=value(digits(a).map(x=>r(0,method==='addition'?9-x:x)));
       if(!b)continue;
     }
     const m=calculate(method,a,b),ex=m.steps.filter(x=>x.type==='exchange'||x.type==='add-column'&&x.carry);
     if(s.exchange==='with'&&!ex.length||s.exchange==='without'&&ex.length||s.exchange==='across-zero'&&ex.length<2)continue;
     return m;
   }
   if(method.endsWith('multiplication'))return calculate(method,a,method==='short-multiplication'?r(2,9):r(10,99));
   b=method==='short-division'?r(2,9):r(10,99);
   if(s.remainders==='exact')a=Math.floor(a/b)*b;
   else if(s.remainders==='with'&&a%b===0)a=a===max?a-1:a+1;
   if(a<b||a<min)continue;return calculate(method,a,b);
 }
 throw Error('No question matches these settings. Try another exchange or remainder option.');
}
G.writtenMethods={METHODS,PROFILES,settings,available,calculate,generate,place};
})(typeof window==='undefined'?globalThis:window.TT99Goodies);
