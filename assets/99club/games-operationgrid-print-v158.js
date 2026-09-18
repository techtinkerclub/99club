/* 99 Club Studio · printable Operation Codebreaker parity v1.58
 * One global operator key; one cipher letter per code position.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;if(!A||A.__operationGridPrintV158)return;
const baseGenerate=A.generate.bind(A);
const TERMS={4:['SUMS','AREA','DATA','MEAN'],5:['PRIME','ANGLE','SHAPE','COUNT'],6:['NUMBER','FACTOR','DIGITS','PUZZLE'],7:['ALGEBRA','INTEGER','DECIMAL','PRODUCT'],8:['FRACTION','MULTIPLE','EQUATION','GEOMETRY'],9:['NUMERATOR','CALCULATE'],10:['PERCENTAGE','COORDINATE'],11:['DENOMINATOR'],12:['NUMBERPUZZLE','MATHSPUZZLES']};
function mod26(n){return ((n%26)+26)%26;}
function shift(ch,d){return String.fromCharCode(65+mod26(ch.charCodeAt(0)-65+d));}
function chooseTerm(p,n){const bank=TERMS[n]||[];if(bank.length){const rng=A.rngFromSeed(`${p.seed||'operationgrid'}:paper-term-v158`);return bank[Math.floor(rng()*bank.length)%bank.length];}return 'MATHS'.repeat(Math.ceil(n/5)).slice(0,n);}
function movesFor(p,code){const rng=A.rngFromSeed(`${p.seed||'operationgrid'}:paper-directions-v158`),moves=code.map((d,i)=>({digit:Number(d),codeIndex:i+1,direction:rng()<.5?-1:1}));if(moves.length>1&&moves.every(m=>m.direction===1))moves[moves.length-1].direction=-1;if(moves.length>1&&moves.every(m=>m.direction===-1))moves[moves.length-1].direction=1;return moves;}
function encode(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(unescape(encodeURIComponent(s)));if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
function enrich(p){
 if(!p||p.engineId!=='operationgrid')return p;
 const old=p.printCipher||{},map=old.operatorDigits||{},ops=p.code||p.rows?.flatMap(r=>r.ops||[])||[],code=ops.map(op=>String(map[op]??'')),word=chooseTerm(p,code.length),moves=movesFor(p,code),cipher=word.split('').map((ch,i)=>shift(ch,-moves[i].direction*moves[i].digit)).join('');
 const payload={version:158,operatorDigits:map,code,word,moves,cipher,alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'};p.printCipher=payload;
 p.instruction=`Make every equation true. Use the operator key to turn each numbered sign into a code digit, then use the completed code to crack the secret word. [[TT99OC158:${encode(payload)}]]`;
 return p;
}
const baseWorked=A.workedExample.bind(A);
A.generate=function(id,settings,seed){const p=baseGenerate(id,settings,seed);return id==='operationgrid'?enrich(p):p;};
A.workedExample=function(id,settings,seed){
 if(id!=='operationgrid')return baseWorked(id,settings,seed);
 return {
  engineId:id,kind:id,title:'Operation Codebreaker worked example',
  goal:'Find the missing operation signs, turn them into code digits, then use the signed shifts to decode the secret maths word.',
  rules:['Make every equation true, following normal order of operations and any brackets.','Use the operator key to convert each numbered sign into its code digit.','For each cipher letter, + means move forwards through the alphabet by that code digit and − means move backwards; wrap between A and Z.'],
  steps:['Equation: 8 □ 4 = 12. The missing sign is + because 8 + 4 = 12.','Suppose the operator key says + = 3. That numbered sign contributes code digit 3.','If the cipher shows K with +#1, move 3 letters forwards: K → L → M → N.','Repeat for every cipher letter, using the numbered code digit shown below it, to reveal the secret word.'],
  tip:'Solve all operator boxes first, then copy the code digits carefully before decoding the word.',
  commonMistake:'The +/− under a cipher letter tells you which direction to move in the alphabet; it is not another arithmetic operation.'
 };
};
A.OPERATIONGRID_PRINT_V158={version:158,enrich,shiftChar:shift,TERMS};A.__operationGridPrintV158=true;
})(typeof globalThis!=='undefined'?globalThis:this);
