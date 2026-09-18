/* 99 Club Studio · printable Operation Codebreaker parity v1.55
 * Adds the same operator->digit key and signed alphabet cipher used by Online Play
 * to generated printable activities. A compact marker lets the browser paper
 * renderer be upgraded without modifying the large legacy games-app.js file.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames,OG=A?.OPERATIONGRID_V153;if(!A||!OG||A.__operationGridPrintV155)return;
const WORDS={easy:['MATH','CODE','SUMS','SHAPE','ANGLE','COUNT'],standard:['PRIME','LOGIC','NUMBER','EQUALS','FACTOR','PUZZLE','DIGITS'],challenge:['ALGEBRA','INTEGER','DECIMAL','FACTORS','MULTIPLE','EQUATION','PRODUCT','FRACTION']};
const baseGenerate=A.generate.bind(A);
function mod26(n){return ((n%26)+26)%26;}
function shiftChar(ch,delta){return String.fromCharCode(65+mod26(ch.charCodeAt(0)-65+delta));}
function codeMapFor(p,pool){const rng=A.rngFromSeed(`${p.seed||'operationgrid'}:operator-code`),digits=['1','2','3','4','5','6','7','8','9'];for(let i=digits.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[digits[i],digits[j]]=[digits[j],digits[i]];}return Object.fromEntries(pool.map((op,i)=>[op,digits[i]]));}
function secretWordFor(p){const d=['easy','standard','challenge'].includes(p.difficulty)?p.difficulty:'standard',bank=WORDS[d],rng=A.rngFromSeed(`${p.seed||'operationgrid'}:cipher-word`);return bank[Math.floor(rng()*bank.length)%bank.length];}
function movesFor(p,key,length){const rng=A.rngFromSeed(`${p.seed||'operationgrid'}:cipher-directions`),moves=Array.from({length},(_,i)=>({digit:Number(key[i%key.length]),direction:rng()<.5?-1:1}));if(length>1&&moves.every(m=>m.direction===1))moves[length-1].direction=-1;if(length>1&&moves.every(m=>m.direction===-1))moves[length-1].direction=1;return moves;}
function encode(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(unescape(encodeURIComponent(s)));if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
function enrich(p){
  if(!p||p.engineId!=='operationgrid')return p;
  const pool=(p.operatorPool||OG.poolFor(p.options||{})).slice(),map=codeMapFor(p,pool),ops=(p.code||p.rows?.flatMap(r=>r.ops||[])||[]),code=ops.map(op=>map[op]),word=secretWordFor(p),moves=movesFor(p,code,word.length),cipher=word.split('').map((ch,i)=>shiftChar(ch,-moves[i].direction*moves[i].digit)).join('');
  p.printCipher={version:155,operatorDigits:map,code,word,moves,cipher,alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'};
  const payload={operatorDigits:map,code,word,moves,cipher,alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'};
  p.instruction=`Fill the operator boxes so every equation is true. Translate each solved sign into its digit, then use the signed shifts to decode the secret maths word. [[TT99OC155:${encode(payload)}]]`;
  return p;
}
A.generate=function(id,settings,seed){const p=baseGenerate(id,settings,seed);return id==='operationgrid'?enrich(p):p;};
A.OPERATIONGRID_PRINT_V155={version:155,enrich,shiftChar};A.__operationGridPrintV155=true;
})(typeof globalThis!=='undefined'?globalThis:this);
