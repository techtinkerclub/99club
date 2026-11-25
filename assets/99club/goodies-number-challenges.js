/* Pure, paper-first arithmetic generators. No DOM or executable expression parsing. */
(function(G){
'use strict';
const groups=[
 {id:'arithmetic',label:'Arithmetic',ids:['missing-result','missing-number','missing-operation','number-bond']},
 {id:'equivalence',label:'Equality & comparison',ids:['equal-expressions','compare-values','true-false']},
 {id:'reasoning',label:'Reasoning',ids:['order-of-operations','inverse-operation']}
];
const titles={'missing-result':'Calculate the result','missing-number':'Find the missing number','missing-operation':'Find the operator','number-bond':'Number bonds','equal-expressions':'Balance the equation','compare-values':'Compare numbers','true-false':'True or false','order-of-operations':'Order of operations','inverse-operation':'Use the inverse'};
function generate(type,level='medium',rng=Math.random){
 const int=(a,b)=>a+Math.min(b-a,Math.floor(rng()*(b-a+1))),pick=a=>a[int(0,a.length-1)];
 const max=level==='easy'?10:level==='hard'?100:30,table=level==='easy'?5:12;
 const op=pick(['+','−','×','÷']);
 const calc=(a,o,b)=>o==='+'?a+b:o==='−'?a-b:o==='×'?a*b:b?a/b:NaN;
 function operands(o){let a=int(1,max),b=int(1,max);if(o==='−'&&a<b)[a,b]=[b,a];if(o==='×'){a=int(2,table);b=int(2,table)}if(o==='÷'){b=int(2,table);a=b*int(2,table)}return[a,b]}
 const [a,b]=operands(op),c=calc(a,op,b);
 let tiles,prompt,answer,kind='number',choices,solutionExplanation;
 const eq=(x,o,y,z)=>[x,o,y,'=',z].map(String);
 switch(type){
 case 'missing-result':tiles=eq(a,op,b,'?');prompt='Calculate the missing result.';answer=c;break;
 case 'missing-number':{const left=int(0,1)===0;tiles=eq(left?'?':a,op,left?b:'?',c);prompt='Find the missing number.';answer=left?a:b;break}
 case 'missing-operation':{
   // Distinct positive operands chosen so exactly one operation gives the result.
   let x,y,o,z,valid;
   for(let i=0;i<100;i++){o=pick(['+','−','×','÷']);[x,y]=operands(o);z=calc(x,o,y);valid=['+','−','×','÷'].filter(v=>calc(x,v,y)===z);if(valid.length===1)break}
   if(valid.length!==1){x=8;y=4;o='×';z=32}
   tiles=eq(x,'?',y,z);prompt='Which operation makes the equation true?';answer=o;kind='choice';choices=['+','−','×','÷'];break}
 case 'number-bond':{const target=pick(level==='easy'?[10,20]:level==='hard'?[100,200,1000]:[20,50,100]),n=int(1,target-1);tiles=eq(n,'+','?',target);prompt='Complete the number bond.';answer=target-n;break}
 case 'equal-expressions':{const x=int(1,c||1),total=c||2;tiles=[String(a),op,String(b),'=',String(x),'+','?'];if(c===0){tiles=['0','=','?','+','0'];answer=0}else answer=total-x;prompt='Make both sides of the equation equal.';break}
 case 'compare-values':{const scale=level==='hard'?10:1,x=int(0,max*scale)/scale,y=pick([x,int(0,max*scale)/scale]);tiles=[String(x),'?',String(y)];prompt='Choose the correct comparison symbol.';answer=x<y?'<':x>y?'>':'=';kind='choice';choices=['<','=','>'];break}
 case 'true-false':{const shown=pick([c,c+int(1,5),Math.max(0,c-int(1,5))]);tiles=eq(a,op,b,shown);prompt='Is this equation true or false?';answer=shown===c?'True':'False';kind='choice';choices=['True','False'];solutionExplanation=a+' '+op+' '+b+' = '+c;break}
 case 'order-of-operations':{const x=int(2,table),y=int(2,table),z=int(2,table);tiles=[String(x),'+',String(y),'×',String(z),'=','?'];prompt='Calculate the result. Multiply before adding.';answer=x+y*z;solutionExplanation=y+' × '+z+' = '+y*z+'; '+x+' + '+y*z+' = '+answer;break}
 case 'inverse-operation':{const x=int(2,table),y=int(2,table),z=x*y;tiles=[String(x),'×',String(y),'=',String(z),' ; ',String(z),'÷','?','=',String(x)];prompt='Use the multiplication fact to find the missing number in the division fact.';answer=y;break}
 default:throw Error('Unknown number tile challenge: '+type)
 }
 const category=groups.find(g=>g.ids.includes(type)).id;
 return {mode:'standard',type,category,title:'',prompt,answer:String(answer),answerMode:'manual',revealed:false,tiles,kind,choices,solutionExplanation:solutionExplanation||tiles.map(v=>v==='?'?String(answer):v).join(' '),level};
}
G.numberChallenges={groups,titles,generate};
})(window.TT99Goodies);
