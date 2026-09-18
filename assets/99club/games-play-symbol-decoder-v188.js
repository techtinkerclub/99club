/* 99 Club Studio · Symbol Decoder Online Play v1.88
 * Turns Symbol Equations into a deduction -> number -> letter -> secret-word game.
 * Printable Symbol Equations remain unchanged.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,G=global.TT99Games;
if(!Play||!G)return;

const DIFFS=['easy','standard','challenge'];
const THEMES=['mixed','maths','science'];
const STYLES=['auto','additive','coefficients'];
const SYMBOLS=['◆','●','▲','■','★','⬟','✦'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const cap=s=>String(s||'').replace(/^./,x=>x.toUpperCase());

/* Curated primary-science bank. Maths terms are added dynamically from the
   existing curriculum vocabulary catalogue, so the total bank stays large as
   that catalogue grows. Keep entries single-word for a clean cipher reveal. */
const SCIENCE_DATA=`
AIR|the mixture of gases around us|materials
ANIMAL|a living thing that feeds on other organisms|biology
ATOM|a tiny particle that makes up matter|materials
BARK|the protective outer covering of a tree|plants
BATTERY|a source of electrical energy|electricity
BEAK|the hard mouthpart of a bird|animals
BLOOD|the liquid that carries oxygen and nutrients around the body|body
BONE|a hard part of the skeleton|body
BRAIN|the organ that controls the nervous system|body
BULB|a component that produces light in a simple circuit|electricity
CAMOUFLAGE|colouring or pattern that helps an organism blend in|animals
CARBON|an element found in living things and many materials|materials
CELL|the basic unit of a living organism|biology
CIRCUIT|a complete path through which electric current can flow|electricity
CLAW|a curved pointed nail on an animal|animals
CLOUD|a visible mass of tiny water droplets or ice crystals|weather
CONDENSE|to change from a gas to a liquid|materials
CONDUCTOR|a material that lets heat or electricity pass through easily|materials
CURRENT|the flow of electric charge|electricity
DECAY|the breakdown of dead material|biology
DIET|the food and drink regularly consumed by an organism|body
DIGESTION|the process of breaking food into substances the body can use|body
EARTH|the planet on which we live|space
ECHO|a reflected sound|sound
ELECTRIC|relating to electricity or electric charge|electricity
ENERGY|the ability to make things happen or change|physics
EVAPORATE|to change from a liquid into a gas|materials
EYE|the organ used for sight|body
FISH|an animal that lives in water and has gills|animals
FLOWER|the reproductive structure of a flowering plant|plants
FOOD|material eaten by living things for energy and growth|biology
FORCE|a push or a pull|physics
FOSSIL|preserved remains or traces of ancient life|rocks
FREEZE|to change from a liquid into a solid|materials
FRICTION|a force that resists movement between surfaces|physics
GAS|a state of matter with no fixed shape or volume|materials
GERM|a microorganism that may cause disease|biology
GILLS|organs used by many aquatic animals to take oxygen from water|animals
GRAVITY|the force that pulls objects towards each other|physics
HABITAT|the natural home of an organism|biology
HEART|the organ that pumps blood around the body|body
HEAT|thermal energy transferred from a hotter place to a cooler one|physics
INSECT|an animal with six legs and three main body sections|animals
INSULATOR|a material that does not easily let heat or electricity pass|materials
JOINT|a place where two bones meet|body
LEAF|a plant organ that usually makes food using light|plants
LIFE|the condition that distinguishes living things from nonliving matter|biology
LIGHT|energy that enables us to see|physics
LIQUID|a state of matter with fixed volume but no fixed shape|materials
LUNGS|organs used for breathing|body
MAGNET|an object that produces a magnetic field|physics
MAMMAL|an animal that feeds milk to its young|animals
MATERIAL|a substance from which an object is made|materials
MELT|to change from a solid into a liquid|materials
METAL|a material that is usually strong and conducts heat and electricity|materials
MICROBE|a microscopic living organism|biology
MINERAL|a naturally occurring solid substance found in rocks|rocks
MOON|a natural object that orbits a planet|space
MOTION|movement from one position to another|physics
MUSCLE|body tissue that contracts to produce movement|body
NERVE|a bundle of fibres that carries signals around the body|body
NEST|a structure built or used by an animal for eggs or young|animals
NUTRIENT|a substance needed for growth and health|biology
OCEAN|a very large body of salt water|earth
ORBIT|the path of one object around another in space|space
ORGAN|a body part made of tissues that performs a particular function|body
OXYGEN|a gas needed for respiration in many living things|biology
PARTICLE|a very small piece of matter|materials
PETAL|a coloured part of many flowers|plants
PLANET|a large object that orbits a star|space
PLANT|a living organism that usually makes its own food using light|plants
POLLEN|tiny grains produced by flowers for reproduction|plants
PREDATOR|an animal that hunts other animals for food|animals
PREY|an animal hunted by another animal|animals
RAIN|liquid water falling from clouds|weather
REFLECT|to bounce light sound or heat from a surface|physics
REPTILE|a cold-blooded vertebrate with scales|animals
ROOT|the plant organ that anchors the plant and absorbs water|plants
SEASON|one of the yearly periods caused by Earths tilt and orbit|space
SEED|a plant structure that can grow into a new plant|plants
SHADOW|a dark area formed when light is blocked|light
SKELETON|the framework of bones supporting a body|body
SOIL|the upper layer of earth in which plants grow|earth
SOLAR|relating to the Sun|space
SOLID|a state of matter with fixed shape and fixed volume|materials
SOUND|energy made by vibrations and detected by hearing|physics
SPACE|the region beyond Earths atmosphere|space
SPECIES|a group of organisms able to reproduce with one another|biology
STAR|a huge ball of hot glowing gas in space|space
STEM|the plant organ that supports leaves and transports materials|plants
SUN|the star at the centre of our solar system|space
SWITCH|a component used to open or close an electric circuit|electricity
TEETH|hard structures used to bite and chew food|body
TEMPERATURE|a measure of how hot or cold something is|physics
TISSUE|a group of similar cells working together|biology
VIBRATE|to move backwards and forwards repeatedly|sound
VOLTAGE|a measure of the electrical push in a circuit|electricity
WATER|a liquid essential for life|earth
WEATHER|the day-to-day conditions of the atmosphere|weather
WING|a body part used for flight by birds insects and some other animals|animals
WOOD|the hard material forming much of a tree|plants
`.trim();

const SCIENCE=SCIENCE_DATA.split('\n').map(line=>{const [term,definition,topic]=line.split('|');return {term,definition,topic,theme:'science'};});

function mathsBank(){
  return (G.VOCABULARY||[]).map(x=>({term:String(x.term||'').toUpperCase(),definition:String(x.definition||''),topic:x.topic||'maths',theme:'maths'})).filter(x=>/^[A-Z]{4,11}$/.test(x.term));
}
function uniqueCount(word){return new Set(word).size;}
function candidateBank(theme,difficulty){
  const all=[...mathsBank(),...SCIENCE],dedup=new Map();
  for(const x of all)if(/^[A-Z]{4,11}$/.test(x.term)&&!dedup.has(x.term))dedup.set(x.term,x);
  const bounds=difficulty==='easy'?{min:4,max:6,uMin:3,uMax:4}:difficulty==='challenge'?{min:6,max:10,uMin:5,uMax:7}:{min:5,max:8,uMin:4,uMax:6};
  return [...dedup.values()].filter(x=>(theme==='mixed'||x.theme===theme)&&x.term.length>=bounds.min&&x.term.length<=bounds.max&&uniqueCount(x.term)>=bounds.uMin&&uniqueCount(x.term)<=bounds.uMax);
}
function hash(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=hash(seed)||0x6d2b79f5;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function pick(arr,r){return arr[Math.floor(r()*arr.length)];}
function shuffle(arr,r){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function letterValue(ch){return ch.charCodeAt(0)-64;}

function norm(c={}){return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',theme:THEMES.includes(c.theme)?c.theme:'mixed',equationStyle:STYLES.includes(c.equationStyle)?c.equationStyle:'auto'};}
function fromQuery(q){const o={};if(q.has('d'))o.difficulty=q.get('d');if(q.has('th'))o.theme=q.get('th');if(q.has('es'))o.equationStyle=q.get('es');return o;}
function toQuery(c){c=norm(c);return {d:c.difficulty,th:c.theme,es:c.equationStyle};}
function select(c,id,label,vals,labels={}){return `<label><span>${label}</span><select data-dec-opt="${id}">${vals.map(v=>`<option value="${v}" ${c[id]===v?'selected':''}>${labels[v]||cap(v)}</option>`).join('')}</select></label>`;}
function options(root,c,onChange){c=norm(c);root.innerHTML=select(c,'difficulty','Difficulty',DIFFS)+select(c,'theme','Secret word',THEMES,{mixed:'Maths + science',maths:'Maths words',science:'Science words'})+select(c,'equationStyle','Clue style',STYLES,{auto:'Auto',additive:'Addition / subtraction',coefficients:'Include coefficients'});root.querySelectorAll('[data-dec-opt]').forEach(el=>el.addEventListener('change',()=>onChange(norm({...c,[el.dataset.decOpt]:el.value}))));}

function relationClue(sym,sv,known,kv,style,r,step){
  const coeff=style==='coefficients'||(style==='auto'&&step>1&&r()<.45);
  if(coeff){
    const k=r()<.72?2:3;
    if(r()<.5)return `${k} × ${sym} + ${known} = ${k*sv+kv}`;
    return `${sym} + ${k} × ${known} = ${sv+k*kv}`;
  }
  if(r()<.45)return `${sym} + ${known} = ${sv+kv}`;
  if(sv>=kv)return `${sym} − ${known} = ${sv-kv}`;
  return `${known} − ${sym} = ${kv-sv}`;
}
function makePuzzle(config,seed){
  const c=norm(config),r=rng(seed),bank=candidateBank(c.theme,c.difficulty);
  if(!bank.length)throw new Error('No decoder words available for these settings.');
  const chosen=pick(bank,r),word=chosen.term,letters=[...new Set(word)],symbols=SYMBOLS.slice(0,letters.length),map={};letters.forEach((ch,i)=>map[ch]=symbols[i]);
  const values=letters.map(letterValue),clues=[];
  const firstK=c.equationStyle==='coefficients'||c.difficulty==='challenge'?3:2;
  clues.push(`${firstK} × ${symbols[0]} = ${firstK*values[0]}`);
  for(let i=1;i<symbols.length;i++)clues.push(relationClue(symbols[i],values[i],symbols[i-1],values[i-1],c.equationStyle,r,i));
  if(c.difficulty==='challenge'&&symbols.length>=5){const a=symbols[0],b=symbols.at(-1),av=values[0],bv=values.at(-1);clues.push(`${a} + ${b} = ${av+bv}`);}
  return {engineId:'symbols',title:'Symbol Decoder',difficulty:c.difficulty,theme:chosen.theme,topic:chosen.topic,word,definition:chosen.definition||'',letters,symbols,values,map,code:[...word].map(ch=>map[ch]),clues,seed,options:c};
}
function meta(p,c){return `${cap(c.difficulty)} · ${p.symbols.length} symbols · ${p.code.length}-letter ${p.theme} word`;}
function recordKey(c){c=norm(c);return `${c.difficulty}:${c.theme}:${c.equationStyle}`;}

function keypad(){return `<div class="tt99-wave186-keypad" data-dec-pad aria-label="On-screen number keypad">${[1,2,3,4,5,6,7,8,9].map(v=>`<button type="button" data-dec-digit="${v}">${v}</button>`).join('')}<button type="button" data-dec-back aria-label="Backspace">⌫</button><button type="button" data-dec-digit="0">0</button><button type="button" class="clear" data-dec-clear>Clear</button></div>`;}
function append(cur,d){const s=cur==null?'':String(cur);return (s==='0'?String(d):(s+String(d))).slice(0,2);}
function back(cur){const s=cur==null?'':String(cur);return s.length>1?s.slice(0,-1):null;}
function renderEquation(text,p,state){const bySymbol=Object.fromEntries(p.symbols.map((s,i)=>[s,{letter:p.letters[i],value:p.values[i]}]));return [...text].map(ch=>{const d=bySymbol[ch];if(!d)return esc(ch);const cracked=String(state[ch]??'')===String(d.value);return `<span class="tt99-decoder-eq-symbol${cracked?' is-cracked':''}"><b>${esc(ch)}</b>${cracked?`<small>${d.value}</small>`:''}</span>`;}).join('');}

function mount(root,p,ctx){
  const expected=Object.fromEntries(p.symbols.map((s,i)=>[s,String(p.values[i])])),state=Object.fromEntries(p.symbols.map(s=>[s,null]));let selected=null,wrong=new Set(),hint=null,finished=false,lastCracked=new Set();
  root.className='tt99-play-symbols tt99-play-symbol-decoder';
  root.innerHTML=`<section class="tt99-decoder-mission"><small>${p.theme==='maths'?'MATHS MESSAGE':p.theme==='science'?'SCIENCE MESSAGE':'STEM MESSAGE'}</small><h3>Crack the symbols. Reveal the secret word.</h3><div class="tt99-decoder-code" data-dec-code></div><p>Number-to-letter code: <strong>1=A · 2=B · … · 26=Z</strong></p></section><div class="tt99-decoder-clues">${p.clues.map((q,i)=>`<div data-dec-clue="${i}"><small>Clue ${i+1}</small><strong data-dec-eq="${i}"></strong></div>`).join('')}</div><div class="tt99-decoder-locks">${p.symbols.map((s,i)=>`<button type="button" data-dec-sym="${esc(s)}"><span>${esc(s)}</span><b data-dec-value></b><em data-dec-letter>LOCKED</em></button>`).join('')}</div><div class="tt99-decoder-reveal" data-dec-reveal hidden></div>${keypad()}`;
  const boxes=[...root.querySelectorAll('[data-dec-sym]')],pad=root.querySelector('[data-dec-pad]'),code=root.querySelector('[data-dec-code]'),reveal=root.querySelector('[data-dec-reveal]');
  function cracked(s){return String(state[s]??'')===expected[s];}
  function render(){
    root.querySelectorAll('[data-dec-eq]').forEach((el,i)=>el.innerHTML=renderEquation(p.clues[i],p,state));
    boxes.forEach((b,i)=>{const s=p.symbols[i],ok=cracked(s);b.querySelector('[data-dec-value]').textContent=state[s]??'';b.querySelector('[data-dec-letter]').textContent=ok?`${expected[s]} → ${p.letters[i]}`:'LOCKED';b.classList.toggle('is-selected',selected===s&&!ok);b.classList.toggle('is-wrong',wrong.has(s));b.classList.toggle('is-hint',hint===s);b.classList.toggle('is-cracked',ok);b.disabled=finished||ok;});
    code.innerHTML=p.code.map(s=>{const i=p.symbols.indexOf(s),ok=cracked(s);return `<span class="${ok?'is-cracked':''}"><b>${ok?esc(p.letters[i]):esc(s)}</b>${ok?'<small>✓</small>':''}</span>`;}).join('');
    const all=p.symbols.every(cracked);reveal.hidden=!all;reveal.innerHTML=all?`<small>MESSAGE DECODED</small><strong>${esc(p.word)}</strong>${p.definition?`<p>${esc(p.definition)}</p>`:''}`:'';
    pad.querySelectorAll('button').forEach(b=>b.disabled=finished||!selected||cracked(selected));
  }
  function snapshot(){return {...state};}function emptySnapshot(){return Object.fromEntries(p.symbols.map(s=>[s,null]));}function restore(s){for(const k of p.symbols)state[k]=s?.[k]??null;selected=null;wrong.clear();hint=null;lastCracked=new Set(p.symbols.filter(cracked));render();}
  function selectSym(s){if(finished||ctx.isPaused?.()||cracked(s))return;selected=s;hint=null;render();}
  function commit(v){if(!selected||finished||ctx.isPaused?.()||cracked(selected))return;const s=selected;state[s]=v;wrong.delete(s);hint=null;const now=cracked(s);if(now&&!lastCracked.has(s)){lastCracked.add(s);const i=p.symbols.indexOf(s);ctx.onStatus?.(`${s} cracked: ${expected[s]} → ${p.letters[i]}. Part of the message has been revealed.`,'success');selected=p.symbols.find(x=>!cracked(x))||null;}render();ctx.onChange?.(snapshot());}
  function clickRoot(e){const b=e.target.closest('[data-dec-sym]');if(b)selectSym(b.dataset.decSym);}
  function clickPad(e){if(!selected)return;const d=e.target.closest('[data-dec-digit]');if(d)return commit(append(state[selected],d.dataset.decDigit));if(e.target.closest('[data-dec-back]'))return commit(back(state[selected]));if(e.target.closest('[data-dec-clear]'))return commit(null);}
  function keydown(e){if(!selected||finished||ctx.isPaused?.())return;if(/^\d$/.test(e.key)){e.preventDefault();commit(append(state[selected],e.key));}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();commit(back(state[selected]));}}
  root.addEventListener('click',clickRoot);pad.addEventListener('click',clickPad);root.addEventListener('keydown',keydown);
  function bad(){return p.symbols.filter(s=>state[s]!=null&&!cracked(s));}function solved(){return p.symbols.filter(cracked).length;}function complete(){return solved()===p.symbols.length;}function progress(){return `${solved()} / ${p.symbols.length} symbols cracked`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:`Code cracked! The secret word is ${p.word}.`};const b=bad();if(!silent){wrong=new Set(b);hint=null;render();}return b.length?{complete:false,wrong:true,message:`${b.length} entered value${b.length===1?' is':'s are'} incorrect.`}:{complete:false,wrong:false,message:'No incorrect values so far. Crack another symbol to reveal more of the message.'};}
  function hintFn(){if(bad().length)return {tone:'hint',message:'At least one entered value is incorrect. Use Check to highlight it.'};let s=p.symbols.find(x=>!cracked(x));if(!s)return {tone:'hint',message:'The whole message is decoded — try Check.'};const i=p.symbols.indexOf(s);selected=s;hint=s;wrong.clear();render();const clue=i===0?p.clues[0]:p.clues[Math.min(i,p.clues.length-1)];return {tone:'hint',message:`Focus on ${s}. A useful clue is “${clue}”. Use any symbol you have already cracked and work with inverse operations. The hint does not reveal the value.`};}
  function setFinished(v){finished=!!v;wrong.clear();hint=null;render();}function destroy(){root.removeEventListener('click',clickRoot);pad.removeEventListener('click',clickPad);root.removeEventListener('keydown',keydown);}render();return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished,destroy};
}

const adapter={id:'symbols',order:29,icon:'◆→A',title:'Symbol Decoder',shortTitle:'Symbol Decoder',category:'Algebra & codebreaking',blurb:'Solve linked symbol equations to reveal a hidden maths or science word.',completionTitle:'Message decoded',completeMessage:'Code cracked!',startMessage:'Crack a symbol to reveal the first letters of the hidden message.',instruction:'Solve the linked equations to find each symbol value. Every correct value unlocks a letter of the secret word using 1=A, 2=B, … 26=Z.',howTitle:'Crack symbols to reveal the message',howText:'Start with a clue that lets you find one symbol. Enter its value and, if correct, that symbol unlocks a letter everywhere it appears in the coded message. Use the solved value in the next clue until the whole maths or science word is revealed.',normalizeConfig:norm,fromQuery,toQuery,renderOptions:options,createPuzzle:makePuzzle,mount,meta,recordKey};
Play.registerAdapter('symbols',adapter);

global.TT99SymbolDecoderV188={SCIENCE,mathsBank,candidateBank,makePuzzle,uniqueCount,letterValue,adapter};
})(typeof globalThis!=='undefined'?globalThis:this);
