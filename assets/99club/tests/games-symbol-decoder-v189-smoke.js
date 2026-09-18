/* 99 Club Studio · Symbol Decoder v1.89 smoke tests */
'use strict';
require('../games-vocabulary.js');
require('../games-arithmetic.js');
require('../games-number-logic.js');
require('../games-engine.js');
require('../games-symbol-decoder-v189.js');

const G=global.TT99Games;
const A=global.TT99ArithmeticGames;
const D=global.TT99SymbolDecoder;
if(!G||!A||!D)throw new Error('Symbol Decoder dependencies did not load.');

function assert(ok,msg){if(!ok)throw new Error(msg);}
function settings(difficulty,theme,style='auto'){
  return G.normalizeSettings({
    minYear:4,maxYear:6,topics:['algebra','calculation'],selectedEngines:['symbols'],
    engineSettings:{symbols:{difficulty,theme,equationStyle:style}}
  });
}

let generated=0;
for(const difficulty of ['easy','standard','challenge']){
  for(const theme of ['maths','science','mixed']){
    for(const style of ['auto','additive','coefficients']){
      for(let i=0;i<12;i++){
        const seed=`decoder-v189:${difficulty}:${theme}:${style}:${i}`;
        const s=settings(difficulty,theme,style);
        const p=G.generateActivity('symbols',s,seed);
        const again=G.generateActivity('symbols',s,seed);
        assert(JSON.stringify(p)===JSON.stringify(again),`not deterministic: ${seed}`);
        assert(p.engineId==='symbols'&&p.title==='Symbol Decoder',`wrong activity: ${seed}`);
        assert(typeof p.word==='string'&&p.word.length>=4&&p.word.length<=10,`bad word length: ${seed} ${p.word}`);
        assert(typeof p.definition==='string'&&p.definition.trim().length>4,`missing definition: ${seed}`);
        assert(Array.isArray(p.symbols)&&p.symbols.length===new Set(p.word).size,`symbol count mismatch: ${seed}`);
        assert(Array.isArray(p.letters)&&p.letters.length===p.symbols.length,`letter count mismatch: ${seed}`);
        assert(Array.isArray(p.values)&&p.values.length===p.symbols.length,`value count mismatch: ${seed}`);
        assert(Array.isArray(p.code)&&p.code.length===p.word.length,`code length mismatch: ${seed}`);
        assert(p.code.every(x=>p.symbols.includes(x)),`unknown code symbol: ${seed}`);
        for(let j=0;j<p.letters.length;j++)assert(p.values[j]===D.letterValue(p.letters[j]),`A1Z26 mismatch: ${seed}`);
        assert(A.validate(p).ok,`arithmetic validation failed: ${seed}`);
        generated++;
      }
    }
  }
}

const maths=D.bank('maths','standard').length;
const science=D.bank('science','standard').length;
const mixed=D.bank('mixed','standard').length;
assert(maths>=100,`maths word bank unexpectedly small: ${maths}`);
assert(science>=25,`science word bank unexpectedly small: ${science}`);
assert(mixed>=150,`mixed word bank unexpectedly small: ${mixed}`);
assert(A.DEFINITIONS.symbols.title==='Symbol Decoder','printable engine title not replaced');
assert(A.DEFINITIONS.symbols.settingsSchema.some(x=>x.id==='theme'),'printable theme setting missing');
console.log(`Symbol Decoder v1.89 smoke passed: ${generated} puzzles; standard banks maths=${maths}, science=${science}, mixed=${mixed}.`);
