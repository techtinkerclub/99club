/* Pure written calculation engine. Column indices start at the ones place.
 * Renderers consume immutable step snapshots, never recompute arithmetic. */
(function(G){
'use strict';
const METHODS=['addition','subtraction','short-multiplication','long-multiplication','short-division','long-division'];
const PROFILES={3:{addition:3,subtraction:3,'short-multiplication':2,'short-division':2},4:{addition:4,subtraction:4,'short-multiplication':3,'short-division':3},5:{addition:6,subtraction:6,'short-multiplication':4,'long-multiplication':4,'short-division':4},6:{addition:7,subtraction:7,'short-multiplication':4,'long-multiplication':4,'short-division':4,'long-division':4}};
const copy=x=>JSON.parse(JSON.stringify(x)),digits=n=>String(n).split('').reverse().map(Number),value=ds=>ds.reduce((s,d,i)=>s+(d||0)*10**i,0);
const place=i=>i<0?['tenths','hundredths','thousandths','ten thousandths','hundred thousandths','millionths'][-i-1]||'decimal place '+(-i):['ones','tens','hundreds','thousands','ten thousands','hundred thousands','millions','ten millions'][i]||'place '+i;
function whole(method,a,b,{precision=0,extended=false}={}){
 const columnPlace=i=>place(i-precision);
 if(!METHODS.includes(method))throw Error('Unknown written method.');
 if(![a,b].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=(extended?9999999999:9999999)))throw Error('Use non-negative whole numbers up to 9,999,999.');
 if(method==='subtraction'&&b>a)throw Error('The first number must not be smaller than the second.');
 if(method==='short-multiplication'&&b>9)throw Error('Use a one-digit multiplier.');
 if(method==='long-multiplication'&&(b<10||b>99))throw Error('Use a two-digit multiplier.');
 if(method==='short-division'&&(b<1||b>9))throw Error('Use a one-digit non-zero divisor.');
 if(method==='long-division'&&(b<10||b>99))throw Error('Use a two-digit divisor.');
 if((method.endsWith('multiplication')||method.endsWith('division'))&&a>(extended?9999999:9999))throw Error('Use a first number of at most four digits.');
 const A=digits(a),B=digits(b),width=Math.max(A.length,B.length),steps=[],m={method,a,b,width,steps};
 const emit=(type,data,explanation)=>steps.push({type,...copy(data),explanation});
 if(method==='addition'){
   const result=[],carries=[0];let carry=0;
   for(let i=0;i<width;i++){
     const x=A[i]||0,y=B[i]||0,incoming=carry,total=x+y+incoming,digit=total%10;
     carry=Math.floor(total/10);result[i]=digit;carries[i+1]=carry;
     emit('add-column',{column:i,x,y,incoming,total,digit,carry,result,carries},x+' + '+y+(incoming?' + '+incoming:'')+' = '+total+' in the '+columnPlace(i)+' column. Write '+digit+(carry?'; exchange 10 for 1 in the next place.':'.'));
   }
   if(carry){result[width]=carry;emit('final-carry',{column:width,digit:carry,result,carries},'Write the remaining '+carry+' in the '+columnPlace(width)+' column.')}
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
         emit('exchange',{from:j,to:j-1,top,result},'Exchange one unit in the '+columnPlace(j)+' column for ten in the '+columnPlace(j-1)+' column.');
       }
     }
     const x=top[i]||0,digit=x-y;result[i]=digit;
     emit('subtract-column',{column:i,x,y,digit,top,result},x+' − '+y+' = '+digit+' in the '+columnPlace(i)+' column.');
   }
   m.answer=value(result);m.result=result;m.exchanged=top;
 }else if(method.endsWith('multiplication')){
   const rows=[];
   for(let j=0;j<B.length;j++){
     const partial=Array(j).fill(0),carries=[0];let carry=0;
     if(j)emit('shift',{row:j,partial,rows},'Multiply by the '+columnPlace(j)+' digit. The ones place in this partial product is zero.');
     for(let i=0;i<A.length;i++){
       const incoming=carry,total=A[i]*B[j]+incoming,digit=total%10;
       carry=Math.floor(total/10);partial[i+j]=digit;carries[i+1]=carry;
       emit('multiply-column',{row:j,column:i+j,sourceColumn:i,x:A[i],y:B[j],incoming,total,digit,carry,partial,carries,rows},A[i]+' × '+B[j]+(incoming?' + '+incoming:'')+' = '+total+'. Write '+digit+' in the '+columnPlace(i+j)+' column'+(carry?'; carry '+carry+'.':'.'));
     }
     if(carry){partial[A.length+j]=carry;emit('final-product-carry',{row:j,column:A.length+j,partial,carries,rows},'Write the remaining carry '+carry+'.')}
     rows.push(partial);emit('partial-product',{row:j,partial,rows},'This partial product is '+value(partial)+'.');
   }
   m.answer=rows.reduce((s,row)=>s+value(row),0);m.result=digits(m.answer);m.partialProducts=rows.map(value);
   if(rows.length>1)for(const s of whole('addition',value(rows[0]),value(rows[1]),{extended:true}).steps)emit('sum-products',{rows,sumStep:s,result:s.result},s.explanation);
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
// Decimal operands are parsed as digit strings and scaled integers, never
// binary floating-point arithmetic. Retain typed trailing zeros for display.
function parseOperand(raw){
 const s=String(raw).trim();
 if(!/^\d{1,7}(?:\.\d{1,3})?$/.test(s))throw Error('Use non-negative numbers with up to seven whole digits and three decimal places.');
 const [left,right='']=s.split('.'),p=right.length,n=Number(left+right);
 return {n,p,text:String(Number(left))+(p?'.'+right:'')};
}
function fixed(n,p){const s=String(n).padStart(p+1,'0');return p?s.slice(0,-p)+'.'+s.slice(-p):s}
function calculate(method,a,b,options={}){
 if(!METHODS.includes(method))throw Error('Unknown written method.');
 const A=parseOperand(a),B=parseOperand(b),isDiv=method.endsWith('division'),isMult=method.endsWith('multiplication');
 const mode=isDiv&&['decimal','rounded'].includes(options.resultMode)?options.resultMode:'remainder';
 if(!A.p&&!B.p&&mode==='remainder'&&!(method==='short-division'&&B.n>=10&&options.twoDigitShort))return whole(method,A.n,B.n);
 if(isDiv){
   if(B.p)throw Error('Use a whole-number divisor in the primary curriculum.');
   if(B.n<1||B.n>(method==='short-division'&&!options.twoDigitShort?9:99)||method==='long-division'&&B.n<10)throw Error('Choose a valid non-zero divisor for the method.');
   if(A.n/10**A.p>=10000)throw Error('Use at most four whole digits in the dividend.');
   if(A.p&&mode==='remainder')throw Error('For a decimal dividend select decimal or rounded result.');
   if(mode==='remainder'){
     // Two-digit short division uses exactly the same regrouping process.
     const m=whole('long-division',A.n,B.n);return {...m,method:'short-division'};
   }
   const p=Math.max(1,Math.min(3,Number(options.resultPrecision)||3)),wholePlaces=A.text.split('.')[0].length;
   if(A.p>p)throw Error('Result precision must be at least the dividend precision.');
   const input=String(A.n).padStart(wholePlaces+A.p,'0').padEnd(wholePlaces+p,'0').split('').map(Number);
   const steps=[],quotientDigits=[];let rem=0;
   input.forEach((digit,index)=>{
     const incoming=rem,dividend=incoming*10+digit,q=Math.floor(dividend/B.n),product=q*B.n;rem=dividend-product;quotientDigits.push(q);
     steps.push({type:'divide-column',index,column:input.length-1-index,inputDigit:digit,incoming,dividend,digit:q,product,remainder:rem,quotientDigits:quotientDigits.slice(),explanation:dividend+' ÷ '+B.n+' gives '+q+' with '+rem+' remaining.'+(index===wholePlaces-1?' Place the decimal point in the quotient before continuing.':index<input.length-1?' Regroup the remainder and bring down the next digit.':'')});
   });
   if(mode==='decimal'&&rem)throw Error('This division does not terminate within '+p+' decimal places. Choose rounding or more places.');
   const truncated=Number(quotientDigits.join('')),scaledAnswer=truncated+(mode==='rounded'&&rem*2>=B.n?1:0),answerText=fixed(scaledAnswer,p);
   if(mode==='rounded')steps.at(-1).explanation+=' '+(rem?'Compare twice the remaining amount with the divisor and '+(rem*2>=B.n?'round up.':'round down.'):'The result is exact.')+' Answer to '+p+' decimal places: '+answerText+'.';
   return {method,a:Number(A.text),b:B.n,aText:A.text,bText:B.text,width:input.length,steps,result:digits(scaledAnswer),answer:Number(answerText),answerText,scaledAnswer,resultMode:mode,resultPrecision:p,precision:p,wholePlaces,inputDigits:input,roundingRemainder:rem,rounded:mode==='rounded'&&rem!==0,twoDigitShort:!!options.twoDigitShort};
 }
 if(isMult&&B.p)throw Error('Decimal multipliers are an enrichment extension; choose a whole-number multiplier.');
 if(isMult&&A.n/10**A.p>=10000)throw Error('Use at most four whole digits in the first number.');
 if(method==='subtraction'&&A.n*10**B.p<B.n*10**A.p)throw Error('The first number must not be smaller than the second.');
 const p=isMult?A.p:Math.max(A.p,B.p),aScaled=A.n*10**(p-A.p),bScaled=isMult?B.n:B.n*10**(p-B.p);
 const m=whole(method,aScaled,bScaled,{precision:p,extended:true});
 const answerText=fixed(m.answer,p),padDigits=(n,p)=>String(n).padStart(p+1,'0').split('').reverse().map(Number);
 return {...m,a:Number(A.text),b:Number(B.text),aText:A.text,bText:B.text,scaledA:aScaled,scaledB:bScaled,scaledAnswer:m.answer,answer:Number(answerText),answerText,precision:p,width:Math.max(m.width,p+1),operandA:padDigits(aScaled,p),operandB:isMult?digits(bScaled):padDigits(bScaled,p),result:padDigits(m.answer,p),resultMode:'decimal',resultPrecision:p};
}

function settings(raw={}){
 const year=[3,4,5,6].includes(+raw.year)?+raw.year:5;
 return {year,numberType:['whole','decimal','mixed'].includes(raw.numberType)?raw.numberType:'whole',decimalPlaces:Math.max(1,Math.min(3,Number(raw.decimalPlaces)||2)),operandDigits:Math.max(0,Math.min(7,Number(raw.operandDigits)||0)),secondDigits:Math.max(0,Math.min(7,Number(raw.secondDigits)||0)),resultMode:['remainder','decimal','rounded'].includes(raw.resultMode)?raw.resultMode:'remainder',resultPrecision:Math.max(1,Math.min(3,Number(raw.resultPrecision)||2)),twoDigitShort:raw.twoDigitShort===true||raw.twoDigitShort==='true'||raw.twoDigitShort==='1',exchange:['any','with','without','across-zero'].includes(raw.exchange)?raw.exchange:'any',remainders:['any','exact','with'].includes(raw.remainders)?raw.remainders:year<5?'exact':'any'};
}
function available(raw){return METHODS.slice()}
function generate(method,raw={},rng=Math.random){
 const s=settings(raw),maxDigits=s.operandDigits?Math.min(s.operandDigits,method.endsWith('division')||method.endsWith('multiplication')?4:7):PROFILES[s.year][method]||PROFILES[6][method];if(!maxDigits)throw Error('Unknown method.');
 if(s.exchange==='across-zero'&&method==='addition')throw Error('Exchange across zero applies to subtraction.');
 if(method.endsWith('division')&&s.numberType!=='whole'&&s.resultPrecision<s.decimalPlaces)throw Error('Choose result precision at least as large as operand precision.');
 const r=(lo,hi)=>lo+Math.min(hi-lo,Math.floor(rng()*(hi-lo+1))),max=10**maxDigits-1,min=10**(maxDigits-1);
 for(let attempt=0;attempt<2000;attempt++){
   let a=r(min,max),b;
   if(s.numberType!=='whole'||method.endsWith('division')&&s.resultMode!=='remainder'||method==='short-division'&&s.twoDigitShort){
     const div=method.endsWith('division'),mult=method.endsWith('multiplication'),p=s.decimalPlaces,dp=s.numberType==='mixed'?r(0,p):p;
     const operand=(n,places)=>places?String(n)+'.'+String(r(0,10**places-1)).padStart(places,'0'):String(n);
     if(div||mult)b=method.startsWith('short-')?(div&&s.twoDigitShort?r(2,99):r(2,9)):r(10,99);else {const d=Math.min(s.secondDigits||maxDigits,7);b=r(s.secondDigits?10**(d-1):1,10**d-1)}
     let aa=s.numberType==='whole'?String(a):operand(a,dp),bb=div||mult?String(b):s.numberType==='whole'?String(b):operand(b,s.numberType==='mixed'?r(0,p):p);
     if(method==='subtraction'&&Number(aa)<Number(bb)){if(s.operandDigits||s.secondDigits)continue;[aa,bb]=[bb,aa]}
     const mode=div?(s.numberType!=='whole'&&s.resultMode==='remainder'?'decimal':s.resultMode):undefined;
     try{const m=calculate(method,aa,bb,{...s,resultMode:mode});const ex=m.steps.filter(x=>x.type==='exchange'||x.type==='add-column'&&x.carry);if(['addition','subtraction'].includes(method)&&(s.exchange==='with'&&!ex.length||s.exchange==='without'&&ex.length||s.exchange==='across-zero'&&ex.length<2))continue;if(div&&mode==='remainder'&&(s.remainders==='exact'&&m.remainder||s.remainders==='with'&&!m.remainder))continue;return m}catch(e){continue}
   }
   if(method==='addition'||method==='subtraction'){
     {const d=Math.min(s.secondDigits||maxDigits,7);b=r(s.secondDigits?10**(d-1):1,10**d-1)}
     if(method==='subtraction'&&b>a){if(s.operandDigits||s.secondDigits)continue;[a,b]=[b,a]}
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
G.writtenMethods={METHODS,PROFILES,settings,available,calculate,generate,place,parseOperand,fixed};
})(typeof window==='undefined'?globalThis:window.TT99Goodies);
