/* 99 Club Studio · Online Play arithmetic interaction core v1.0.0 */
(function(global){
'use strict';
if(global.TT99PlayArithmetic)return;
const OPS=new Set(['+','-','×','÷']);
function label(op){return op==='-'?'−':op;}
function numericToken(t){return typeof t==='number'?t:(t&&typeof t==='object'&&t.type==='num'?Number(t.value):Number(t));}
function rawToken(t){if(t&&typeof t==='object')return t.type==='num'?String(t.value):String(t.value??'');return String(t);}
function display(tokens){return (tokens||[]).map(t=>{const s=rawToken(t);return label(s);}).join(' ');}
function normalOp(op){if(op==='×')return '*';if(op==='÷')return '/';if(op==='−')return '-';return op;}
function apply(a,op,b){op=normalOp(op);if(op==='+')return a+b;if(op==='-')return a-b;if(op==='*')return a*b;if(op==='/')return b===0?NaN:a/b;return NaN;}
function leftToRight(tokens){const t=(tokens||[]).map(rawToken);if(!t.length||t.length%2===0)return NaN;let v=Number(t[0]);if(!Number.isFinite(v))return NaN;for(let i=1;i<t.length;i+=2){const b=Number(t[i+1]);if(!OPS.has(t[i])||!Number.isFinite(b))return NaN;v=apply(v,t[i],b);if(!Number.isFinite(v))return NaN;}return v;}
function evaluate(tokens){
  const ts=(tokens||[]).map(t=>rawToken(t)),output=[],ops=[];const prec={'+':1,'-':1,'×':2,'÷':2};let expectValue=true;
  for(const token of ts){
    if(/^\d+(?:\.\d+)?$/.test(token)){if(!expectValue)return NaN;output.push(Number(token));expectValue=false;continue;}
    if(token==='('){if(!expectValue)return NaN;ops.push(token);continue;}
    if(token===')'){if(expectValue)return NaN;let found=false;while(ops.length){const op=ops.pop();if(op==='('){found=true;break;}output.push(op);}if(!found)return NaN;expectValue=false;continue;}
    if(OPS.has(token)){if(expectValue)return NaN;while(ops.length&&OPS.has(ops.at(-1))&&prec[ops.at(-1)]>=prec[token])output.push(ops.pop());ops.push(token);expectValue=true;continue;}
    return NaN;
  }
  if(expectValue)return NaN;while(ops.length){const op=ops.pop();if(op==='(')return NaN;output.push(op);}const stack=[];for(const item of output){if(typeof item==='number')stack.push(item);else{if(stack.length<2)return NaN;const b=stack.pop(),a=stack.pop(),v=apply(a,item,b);if(!Number.isFinite(v))return NaN;stack.push(v);}}return stack.length===1?stack[0]:NaN;
}
function fmt(v){if(!Number.isFinite(Number(v)))return '—';const n=Math.round(Number(v)*1000)/1000;return Number.isInteger(n)?String(n):String(n).replace(/0+$/,'').replace(/\.$/,'');}
function firstStep(solution=''){const clean=String(solution).replace(/[()]/g,' ').replace(/\s+/g,' ').trim(),m=clean.match(/(\d+)\s*([+\-×÷])\s*(\d+)/);return m?`${m[1]} ${label(m[2])} ${m[3]}`:'';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
global.TT99PlayArithmetic={OPS:[...OPS],label,display,leftToRight,evaluate,fmt,firstStep,esc,numericToken};
})(typeof globalThis!=='undefined'?globalThis:this);
