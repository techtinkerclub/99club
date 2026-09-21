/* 99 Club Studio · shared Symbol Decoder engine v1.90
 * One deterministic generator for Online Play, browser sheets and PDF sheets.
 */
(function(global){
'use strict';
const G=global.TT99Games,A=global.TT99ArithmeticGames;
if(!G||!A||global.TT99SymbolDecoder)return;
const SYMBOLS=['◆','●','▲','■','★','⬟','✦'];
const DIFFS=['easy','standard','challenge'],THEMES=['mixed','maths','science'],STYLES=['auto','additive','coefficients'];
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
ROCK|a naturally occurring solid material made of minerals|rocks
MOSS|a small non-flowering plant that grows in damp places|plants
POND|a small body of still water that supports living things|earth
MARS|the fourth planet from the Sun|space
WAVE|a repeating disturbance that transfers energy|physics
SKIN|the outer protective covering of the body|body
PUPA|a stage in the life cycle of some insects between larva and adult|animals
GALAXY|a huge group of stars gas and dust held together by gravity|space
`.trim();
const SCIENCE=SCIENCE_DATA.split('\n').map(line=>{const [term,definition,topic]=line.split('|');return {term,definition,topic,theme:'science'};});
function mathsBank(){return (G.VOCABULARY||[]).map(x=>({term:String(x.term||'').toUpperCase(),definition:String(x.definition||''),topic:x.topic||'maths',theme:'maths'})).filter(x=>/^[A-Z]{4,11}$/.test(x.term));}
function uniqueCount(word){return new Set(word).size;}
function bank(theme,difficulty){const all=[...mathsBank(),...SCIENCE],d=new Map();for(const x of all)if(/^[A-Z]{4,11}$/.test(x.term)&&!d.has(x.term))d.set(x.term,x);const b=difficulty==='easy'?{min:4,max:6,uMin:3,uMax:4}:difficulty==='challenge'?{min:6,max:10,uMin:5,uMax:7}:{min:5,max:8,uMin:4,uMax:6};return [...d.values()].filter(x=>(theme==='mixed'||x.theme===theme)&&x.term.length>=b.min&&x.term.length<=b.max&&uniqueCount(x.term)>=b.uMin&&uniqueCount(x.term)<=b.uMax);}
function hash(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=hash(seed)||0x6d2b79f5;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function pick(arr,r){return arr[Math.floor(r()*arr.length)];}
function letterValue(ch){return ch.charCodeAt(0)-64;}
function normalise(c={}){return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',theme:THEMES.includes(c.theme)?c.theme:'mixed',equationStyle:STYLES.includes(c.equationStyle)?c.equationStyle:'auto'};}
function relation(sym,sv,known,kv,style,r,step){const coeff=style==='coefficients'||(style==='auto'&&step>1&&r()<.45);if(coeff){const k=r()<.72?2:3;return r()<.5?`${k} × ${sym} + ${known} = ${k*sv+kv}`:`${sym} + ${k} × ${known} = ${sv+k*kv}`;}if(r()<.45)return `${sym} + ${known} = ${sv+kv}`;return sv>=kv?`${sym} − ${known} = ${sv-kv}`:`${known} − ${sym} = ${kv-sv}`;}
function generate(config,seed){const c=normalise(config),r=rng(seed),excluded=new Set(Array.isArray(config?._excludeWords)?config._excludeWords:[]),choices=bank(c.theme,c.difficulty).filter(x=>!excluded.has(x.term));if(!choices.length)throw new Error('No unused decoder words remain for these settings.');const chosen=pick(choices,r),word=chosen.term,letters=[...new Set(word)],symbols=SYMBOLS.slice(0,letters.length),map={};letters.forEach((ch,i)=>map[ch]=symbols[i]);const values=letters.map(letterValue),clues=[],firstK=c.equationStyle==='coefficients'||c.difficulty==='challenge'?3:2;clues.push(`${firstK} × ${symbols[0]} = ${firstK*values[0]}`);for(let i=1;i<symbols.length;i++)clues.push(relation(symbols[i],values[i],symbols[i-1],values[i-1],c.equationStyle,r,i));if(c.difficulty==='challenge'&&symbols.length>=5)clues.push(`${symbols[0]} + ${symbols.at(-1)} = ${values[0]+values.at(-1)}`);return {engineId:'symbols',title:'Symbol Decoder',difficulty:c.difficulty,theme:chosen.theme,topic:chosen.topic,word,definition:chosen.definition||'',letters,symbols,names:symbols,values,map,code:[...word].map(ch=>map[ch]),clues,equations:clues.map(text=>({text,answer:null})),instruction:'Crack the symbols to reveal the secret word. Each value is also a letter code: 1=A, 2=B, … 26=Z.',seed,options:c};}
const def=A.DEFINITIONS?.symbols;
if(def){def.title='Symbol Decoder';def.defaultSettings={difficulty:'standard',theme:'mixed',equationStyle:'auto'};def.settingsSchema=[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'theme',type:'select',label:'Secret word',options:[{value:'mixed',label:'Maths + science'},{value:'maths',label:'Maths words'},{value:'science',label:'Science words'}]},{id:'equationStyle',type:'select',label:'Clue style',options:[{value:'auto',label:'Auto'},{value:'additive',label:'Addition / subtraction'},{value:'coefficients',label:'Include coefficients'}]}];def.difficultyDescriptions={easy:'Shorter secret words and simpler linked clues',standard:'Longer maths/science words with linked symbol clues',challenge:'Longer codes, more distinct symbols and coefficient clues'};}
const oldGenerate=A.generate.bind(A),oldWorked=A.workedExample.bind(A);
A.generate=function(id,settings,seed){return id==='symbols'?generate({...settings?.engineSettings?.symbols,_excludeWords:settings?._finiteExclusions?.symbols||[]},seed):oldGenerate(id,settings,seed);};
A.workedExample=function(id,settings,seed){if(id!=='symbols')return oldWorked(id,settings,seed);return {engineId:'symbols',title:'Symbol Decoder worked example',kind:'symbols',goal:'Solve the symbol values, turn the values into letters, then reveal the secret word.',rules:['The same symbol always has the same value.','Use 1=A, 2=B, … 26=Z to turn a cracked value into a letter.','A repeated symbol reveals the same letter everywhere in the secret word.'],steps:['Clue: 2 × ◆ = 36, so ◆ = 18.','18 is the 18th letter of the alphabet, so ◆ = R.','Use R’s value in the next linked clue to crack another symbol.','Keep going until every position in the secret word is decoded.'],tip:'Start with the clue that can be solved using only one unknown symbol.',commonMistake:'Do not stop after finding the number — convert it to its alphabet letter too.'};};
global.TT99SymbolDecoder={VERSION:'1.90',SYMBOLS,SCIENCE,normalise,bank,generate,letterValue};
A.__symbolDecoderV189=true;
})(typeof globalThis!=='undefined'?globalThis:this);
