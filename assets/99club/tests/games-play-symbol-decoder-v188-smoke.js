'use strict';
const assert=require('assert');
require('../games-vocabulary.js');
const raw=global.TT99GamesVocabularyV2?.entries||[];
assert(raw.length>500,'expected full maths vocabulary catalogue');
let adapter=null;
global.TT99Games={VOCABULARY:raw};
global.TT99GamesPlay={registerAdapter(id,a){if(id==='symbols')adapter=a;}};
require('../games-play-symbol-decoder-v188.js');
const D=global.TT99SymbolDecoderV188;
assert(adapter&&D,'decoder adapter did not register');
assert(D.SCIENCE.length>=80,`science word bank unexpectedly small: ${D.SCIENCE.length}`);
assert(D.mathsBank().length>=150,`eligible one-word maths bank unexpectedly small: ${D.mathsBank().length}`);

function solveExpression(text,p){
  let s=String(text);
  p.symbols.forEach((sym,i)=>{s=s.split(sym).join(String(p.values[i]));});
  const [lhs,rhs]=s.split('=').map(x=>x.trim().replace(/×/g,'*').replace(/−/g,'-'));
  const a=Function(`"use strict";return (${lhs});`)();
  const b=Function(`"use strict";return (${rhs});`)();
  return Math.abs(a-b)<1e-9;
}
for(const difficulty of ['easy','standard','challenge']){
  for(const theme of ['mixed','maths','science']){
    for(let i=0;i<20;i++){
      const p=adapter.createPuzzle({difficulty,theme,equationStyle:i%3===0?'coefficients':i%3===1?'additive':'auto'},`v188:${difficulty}:${theme}:${i}`);
      assert(/^[A-Z]+$/.test(p.word),'secret word must be letters only');
      assert(p.symbols.length===new Set(p.word).size,'one symbol per distinct letter');
      assert(p.symbols.length<=7,'too many symbols for decoder UI');
      assert(p.code.length===p.word.length,'coded message length mismatch');
      for(let k=0;k<p.word.length;k++)assert(p.map[p.word[k]]===p.code[k],'message symbol mapping mismatch');
      p.letters.forEach((ch,k)=>assert.strictEqual(p.values[k],ch.charCodeAt(0)-64,'A1Z26 mismatch'));
      p.clues.forEach(q=>assert(solveExpression(q,p),`invalid clue: ${q}`));
      assert(p.clues.length>=p.symbols.length,'not enough clues to crack all symbols');
    }
  }
}
console.log(`Symbol Decoder v1.88 smoke passed: ${D.mathsBank().length} maths words + ${D.SCIENCE.length} curated science words.`);
