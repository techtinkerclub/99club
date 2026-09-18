/* 99 Club Studio · v1.41 Alphametics library
 * Curated real-word puzzles. Runtime is fully local/offline.
 * ESDB/SCOWL is used as the reference word-list source for development validation;
 * see docs/99club/ALPHAMETICS_ESDB.md for source/licence and update workflow.
 */
(function(global){
'use strict';
const NL=global.TT99NumberLogicGames;
if(!NL||!NL.V140?.ALPHAMETICS||NL.__alphaLibraryV141)return;
const BASE_GENERATE=NL.generate.bind(NL),BASE_NORMALISE=NL.normalise.bind(NL);
const solve=NL.V140.ALPHAMETICS.solve;
const LIBRARY=[{"id":"two_two_four","label":"TWO + TWO = FOUR","adds":["TWO","TWO"],"result":"FOUR","difficulty":"easy","theme":"classic","givens":{"O":4}},{"id":"base_ball_games","label":"BASE + BALL = GAMES","adds":["BASE","BALL"],"result":"GAMES","difficulty":"standard","theme":"classic","givens":{}},{"id":"send_more_money","label":"SEND + MORE = MONEY","adds":["SEND","MORE"],"result":"MONEY","difficulty":"standard","theme":"classic","givens":{}},{"id":"cross_roads_danger","label":"CROSS + ROADS = DANGER","adds":["CROSS","ROADS"],"result":"DANGER","difficulty":"challenge","theme":"classic","givens":{}},{"id":"forty_ten_ten_sixty","label":"FORTY + TEN + TEN = SIXTY","adds":["FORTY","TEN","TEN"],"result":"SIXTY","difficulty":"challenge","theme":"classic","givens":{}},{"id":"count_count_factor","label":"COUNT + COUNT = FACTOR","adds":["COUNT","COUNT"],"result":"FACTOR","difficulty":"standard","theme":"math","givens":{}},{"id":"count_total_factor","label":"COUNT + TOTAL = FACTOR","adds":["COUNT","TOTAL"],"result":"FACTOR","difficulty":"standard","theme":"math","givens":{}},{"id":"equal_equal_square","label":"EQUAL + EQUAL = SQUARE","adds":["EQUAL","EQUAL"],"result":"SQUARE","difficulty":"standard","theme":"math","givens":{}},{"id":"equal_total_square","label":"EQUAL + TOTAL = SQUARE","adds":["EQUAL","TOTAL"],"result":"SQUARE","difficulty":"standard","theme":"math","givens":{}},{"id":"graph_graph_number","label":"GRAPH + GRAPH = NUMBER","adds":["GRAPH","GRAPH"],"result":"NUMBER","difficulty":"challenge","theme":"math","givens":{}},{"id":"maths_maths_factor","label":"MATHS + MATHS = FACTOR","adds":["MATHS","MATHS"],"result":"FACTOR","difficulty":"standard","theme":"math","givens":{}},{"id":"minus_minus_divide","label":"MINUS + MINUS = DIVIDE","adds":["MINUS","MINUS"],"result":"DIVIDE","difficulty":"standard","theme":"math","givens":{}},{"id":"minus_minus_puzzle","label":"MINUS + MINUS = PUZZLE","adds":["MINUS","MINUS"],"result":"PUZZLE","difficulty":"standard","theme":"math","givens":{}},{"id":"number_number_puzzle","label":"NUMBER + NUMBER = PUZZLE","adds":["NUMBER","NUMBER"],"result":"PUZZLE","difficulty":"standard","theme":"math","givens":{}},{"id":"plus_sum_equal","label":"PLUS + SUM = EQUAL","adds":["PLUS","SUM"],"result":"EQUAL","difficulty":"standard","theme":"math","givens":{}},{"id":"prime_prime_factor","label":"PRIME + PRIME = FACTOR","adds":["PRIME","PRIME"],"result":"FACTOR","difficulty":"challenge","theme":"math","givens":{}},{"id":"solve_total_answer","label":"SOLVE + TOTAL = ANSWER","adds":["SOLVE","TOTAL"],"result":"ANSWER","difficulty":"challenge","theme":"math","givens":{}},{"id":"equal_square_number","label":"EQUAL + SQUARE = NUMBER","adds":["EQUAL","SQUARE"],"result":"NUMBER","difficulty":"challenge","theme":"math","givens":{}},{"id":"count_count_puzzle","label":"COUNT + COUNT = PUZZLE","adds":["COUNT","COUNT"],"result":"PUZZLE","difficulty":"standard","theme":"math","givens":{}},{"id":"book_book_class","label":"BOOK + BOOK = CLASS","adds":["BOOK","BOOK"],"result":"CLASS","difficulty":"easy","theme":"school","givens":{}},{"id":"chalk_class_pencil","label":"CHALK + CLASS = PENCIL","adds":["CHALK","CLASS"],"result":"PENCIL","difficulty":"challenge","theme":"school","givens":{}},{"id":"class_class_pencil","label":"CLASS + CLASS = PENCIL","adds":["CLASS","CLASS"],"result":"PENCIL","difficulty":"standard","theme":"school","givens":{}},{"id":"class_ruler_pencil","label":"CLASS + RULER = PENCIL","adds":["CLASS","RULER"],"result":"PENCIL","difficulty":"challenge","theme":"school","givens":{}},{"id":"paper_paper_class","label":"PAPER + PAPER = CLASS","adds":["PAPER","PAPER"],"result":"CLASS","difficulty":"easy","theme":"school","givens":{}},{"id":"ruler_ruler_school","label":"RULER + RULER = SCHOOL","adds":["RULER","RULER"],"result":"SCHOOL","difficulty":"standard","theme":"school","givens":{}},{"id":"apple_apple_toast","label":"APPLE + APPLE = TOAST","adds":["APPLE","APPLE"],"result":"TOAST","difficulty":"easy","theme":"food","givens":{}},{"id":"apple_honey_cereal","label":"APPLE + HONEY = CEREAL","adds":["APPLE","HONEY"],"result":"CEREAL","difficulty":"challenge","theme":"food","givens":{}},{"id":"apple_pear_grape","label":"APPLE + PEAR = GRAPE","adds":["APPLE","PEAR"],"result":"GRAPE","difficulty":"easy","theme":"food","givens":{}},{"id":"berry_berry_toast","label":"BERRY + BERRY = TOAST","adds":["BERRY","BERRY"],"result":"TOAST","difficulty":"standard","theme":"food","givens":{}},{"id":"bread_bread_apple","label":"BREAD + BREAD = APPLE","adds":["BREAD","BREAD"],"result":"APPLE","difficulty":"easy","theme":"food","givens":{}},{"id":"cake_cake_apple","label":"CAKE + CAKE = APPLE","adds":["CAKE","CAKE"],"result":"APPLE","difficulty":"easy","theme":"food","givens":{}},{"id":"cream_cream_apple","label":"CREAM + CREAM = APPLE","adds":["CREAM","CREAM"],"result":"APPLE","difficulty":"easy","theme":"food","givens":{}},{"id":"juice_rice_berry","label":"JUICE + RICE = BERRY","adds":["JUICE","RICE"],"result":"BERRY","difficulty":"standard","theme":"food","givens":{}},{"id":"lemon_lemon_apple","label":"LEMON + LEMON = APPLE","adds":["LEMON","LEMON"],"result":"APPLE","difficulty":"easy","theme":"food","givens":{}},{"id":"pear_pear_berry","label":"PEAR + PEAR = BERRY","adds":["PEAR","PEAR"],"result":"BERRY","difficulty":"easy","theme":"food","givens":{}},{"id":"peach_peach_cereal","label":"PEACH + PEACH = CEREAL","adds":["PEACH","PEACH"],"result":"CEREAL","difficulty":"standard","theme":"food","givens":{}},{"id":"earth_earth_river","label":"EARTH + EARTH = RIVER","adds":["EARTH","EARTH"],"result":"RIVER","difficulty":"easy","theme":"nature","givens":{}},{"id":"hill_hill_earth","label":"HILL + HILL = EARTH","adds":["HILL","HILL"],"result":"EARTH","difficulty":"easy","theme":"nature","givens":{}},{"id":"hill_hill_field","label":"HILL + HILL = FIELD","adds":["HILL","HILL"],"result":"FIELD","difficulty":"easy","theme":"nature","givens":{}},{"id":"lake_sky_ocean","label":"LAKE + SKY = OCEAN","adds":["LAKE","SKY"],"result":"OCEAN","difficulty":"standard","theme":"nature","givens":{}},{"id":"rain_rain_hill","label":"RAIN + RAIN = HILL","adds":["RAIN","RAIN"],"result":"HILL","difficulty":"easy","theme":"nature","givens":{}},{"id":"rain_wind_water","label":"RAIN + WIND = WATER","adds":["RAIN","WIND"],"result":"WATER","difficulty":"standard","theme":"nature","givens":{}},{"id":"star_star_earth","label":"STAR + STAR = EARTH","adds":["STAR","STAR"],"result":"EARTH","difficulty":"easy","theme":"nature","givens":{}},{"id":"tree_tree_water","label":"TREE + TREE = WATER","adds":["TREE","TREE"],"result":"WATER","difficulty":"easy","theme":"nature","givens":{}},{"id":"water_water_earth","label":"WATER + WATER = EARTH","adds":["WATER","WATER"],"result":"EARTH","difficulty":"easy","theme":"nature","givens":{}},{"id":"foot_foot_mouth","label":"FOOT + FOOT = MOUTH","adds":["FOOT","FOOT"],"result":"MOUTH","difficulty":"easy","theme":"body","givens":{}},{"id":"hand_hand_knee","label":"HAND + HAND = KNEE","adds":["HAND","HAND"],"result":"KNEE","difficulty":"easy","theme":"body","givens":{}},{"id":"hand_hand_tooth","label":"HAND + HAND = TOOTH","adds":["HAND","HAND"],"result":"TOOTH","difficulty":"easy","theme":"body","givens":{}},{"id":"head_head_tooth","label":"HEAD + HEAD = TOOTH","adds":["HEAD","HEAD"],"result":"TOOTH","difficulty":"easy","theme":"body","givens":{}},{"id":"child_child_sister","label":"CHILD + CHILD = SISTER","adds":["CHILD","CHILD"],"result":"SISTER","difficulty":"standard","theme":"family","givens":{}},{"id":"family_family_sister","label":"FAMILY + FAMILY = SISTER","adds":["FAMILY","FAMILY"],"result":"SISTER","difficulty":"challenge","theme":"family","givens":{}},{"id":"father_sister_parent","label":"FATHER + SISTER = PARENT","adds":["FATHER","SISTER"],"result":"PARENT","difficulty":"challenge","theme":"family","givens":{}},{"id":"mother_mother_parent","label":"MOTHER + MOTHER = PARENT","adds":["MOTHER","MOTHER"],"result":"PARENT","difficulty":"standard","theme":"family","givens":{}},{"id":"parent_parent_sister","label":"PARENT + PARENT = SISTER","adds":["PARENT","PARENT"],"result":"SISTER","difficulty":"standard","theme":"family","givens":{}},{"id":"sister_sister_friend","label":"SISTER + SISTER = FRIEND","adds":["SISTER","SISTER"],"result":"FRIEND","difficulty":"standard","theme":"family","givens":{}},{"id":"black_green_orange","label":"BLACK + GREEN = ORANGE","adds":["BLACK","GREEN"],"result":"ORANGE","difficulty":"challenge","theme":"colour","givens":{}},{"id":"brown_yellow_purple","label":"BROWN + YELLOW = PURPLE","adds":["BROWN","YELLOW"],"result":"PURPLE","difficulty":"challenge","theme":"colour","givens":{}},{"id":"green_green_yellow","label":"GREEN + GREEN = YELLOW","adds":["GREEN","GREEN"],"result":"YELLOW","difficulty":"standard","theme":"colour","givens":{}},{"id":"orange_orange_purple","label":"ORANGE + ORANGE = PURPLE","adds":["ORANGE","ORANGE"],"result":"PURPLE","difficulty":"standard","theme":"colour","givens":{}},{"id":"purple_purple_yellow","label":"PURPLE + PURPLE = YELLOW","adds":["PURPLE","PURPLE"],"result":"YELLOW","difficulty":"standard","theme":"colour","givens":{}},{"id":"yellow_yellow_orange","label":"YELLOW + YELLOW = ORANGE","adds":["YELLOW","YELLOW"],"result":"ORANGE","difficulty":"standard","theme":"colour","givens":{}}];
const THEMES={
 auto:'All meaningful words',classic:'Classic alphametics',math:'Maths words',school:'School words',
 food:'Food',nature:'Nature',body:'Body',family:'Family',colour:'Colours'
};
function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function enc(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(unescape(encodeURIComponent(s)));if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
function marker(data){return ` [[TT99V140:alphametics:${enc(data)}]]`;}
const oldDef=NL.DEFINITIONS.alphametics||{};
NL.DEFINITIONS.alphametics={
 ...oldDef,
 defaultSettings:{difficulty:'standard',hintLevel:'auto',theme:'auto'},
 settingsSchema:[
  {id:'difficulty',type:'difficulty',label:'Difficulty'},
  {id:'hintLevel',type:'select',label:'Digit hints',options:[{value:'auto',label:'Auto'},{value:'more',label:'More hints'},{value:'one',label:'One hint'},{value:'none',label:'No hints'}]},
  {id:'theme',type:'select',label:'Word theme',options:Object.entries(THEMES).map(([value,label])=>({value,label}))}
 ],
 difficultyDescriptions:{
  easy:'Shorter real-word puzzles with one helpful digit by default',
  standard:'Medium real-word puzzles with little or no support',
  challenge:'Longer puzzles with more distinct letters and no automatic digit hint'
 }
};
function normalise(raw={}){
 const d=NL.DEFINITIONS.alphametics.defaultSettings,o={...d,...raw};
 o.difficulty=['easy','standard','challenge'].includes(o.difficulty)?o.difficulty:'standard';
 o.hintLevel=['auto','more','one','none'].includes(o.hintLevel)?o.hintLevel:'auto';
 o.theme=Object.prototype.hasOwnProperty.call(THEMES,o.theme)?o.theme:'auto';
 if(raw.template&&raw.template!=='auto')o.legacyTemplate=raw.template;
 return o;
}
NL.normalise=function(id,raw={}){if(id==='alphametics')return normalise(raw);return BASE_NORMALISE(id,raw);};
function choose(o,seed){
 if(o.legacyTemplate){
  const legacy=LIBRARY.find(t=>t.id===o.legacyTemplate||t.id===String(o.legacyTemplate).replace(/-/g,'_'));
  if(legacy)return legacy;
 }
 let pool=LIBRARY.filter(t=>t.difficulty===o.difficulty&&(o.theme==='auto'||t.theme===o.theme));
 if(!pool.length)pool=LIBRARY.filter(t=>o.theme==='auto'||t.theme===o.theme);
 if(!pool.length)pool=LIBRARY;
 const rng=rngFromSeed(seed);
 return pool[Math.floor(rng()*pool.length)];
}
function generateAlpha(settings,seed){
 const raw=settings?.engineSettings?.alphametics||{},o=normalise(raw),t=choose(o,`${seed}:alpha-v141`);
 const base=solve(t,t.givens||{},20);
 if(!base.length)return {engineId:'alphametics',title:'Word Codes · Alphametics',error:'The selected word code has no solution.'};
 const solution=base[0],givens={...(t.givens||{})},rng=rngFromSeed(`${seed}:alpha-hints-v141`),letters=shuffle(Object.keys(solution),rng);
 const automatic=o.difficulty==='easy'?1:0;
 const desired=o.hintLevel==='more'?2:o.hintLevel==='one'?1:o.hintLevel==='none'?0:automatic;
 const fixedBase=Object.keys(givens).length;
 for(const ch of letters){if(Object.keys(givens).length>=fixedBase+desired)break;if(givens[ch]==null)givens[ch]=solution[ch];}
 while(solve(t,givens,2).length!==1){const ch=letters.find(x=>givens[x]==null);if(!ch)break;givens[ch]=solution[ch];}
 if(solve(t,givens,2).length!==1)return {engineId:'alphametics',title:'Word Codes · Alphametics',error:'A unique word code could not be prepared.'};
 const payload={adds:t.adds,result:t.result,givens,solution,label:t.label,theme:t.theme,library:'v1.41'};
 return {engineId:'alphametics',title:'Word Codes · Alphametics',difficulty:o.difficulty,templateId:t.id,theme:t.theme,addends:t.adds,result:t.result,givens,solution,seed,options:o,engineVersion:'1.1.0',instruction:`Replace each letter with a digit so the addition is correct. The same letter always means the same digit, different letters use different digits, and a word cannot start with 0.${marker(payload)}`};
}
NL.generate=function(id,settings,seed){if(id==='alphametics')return generateAlpha(settings,seed);return BASE_GENERATE(id,settings,seed);};
NL.V140.ALPHAMETICS.templates=LIBRARY;
NL.V140.ALPHAMETICS.libraryVersion='1.41';
NL.V140.ALPHAMETICS.themes=THEMES;
NL.V140.ALPHAMETICS.generate=generateAlpha;
NL.__alphaLibraryV141=true;
global.TT99AlphaLibrary={VERSION:'1.41',templates:LIBRARY,themes:THEMES,source:'ESDB/SCOWL development reference; curated runtime library'};
if(typeof module!=='undefined'&&module.exports)module.exports=global.TT99AlphaLibrary;
})(typeof globalThis!=='undefined'?globalThis:this);
