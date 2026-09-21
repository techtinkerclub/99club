/* 99 Club Studio · Verbal Reasoning engines v1.0.0
 * 21 primary/11+ style verbal-reasoning families.
 * Deterministic, offline and validator-backed. No runtime AI or network access.
 */
(function(global){
'use strict';

var VERSION='1.0.0';
var DIFFICULTIES=['easy','standard','challenge'];
var ALL_TOPICS=['number_place_value','calculation','fractions','decimals_percentages','ratio_proportion','measurement','geometry','statistics','algebra'];
var compatibility={};ALL_TOPICS.forEach(function(t){compatibility[t]='reasonable';});

function hashString(s){var h=2166136261>>>0;for(var i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){var a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
function pick(arr,rng){return arr[Math.floor(rng()*arr.length)];}
function shuffle(arr,rng){var out=arr.slice();for(var i=out.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),tmp=out[i];out[i]=out[j];out[j]=tmp;}return out;}
function uniq(arr){return Array.from(new Set(arr));}
function cap(s){s=String(s||'');return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
function clampDifficulty(v){return DIFFICULTIES.indexOf(v)>=0?v:'standard';}
function alphabetShift(ch,n){var code=String(ch).toUpperCase().charCodeAt(0)-65;return String.fromCharCode(65+((code+n)%26+26)%26);}
function signature(parts){return parts.map(function(x){return String(x);}).join('|').replace(/\s+/g,' ').toLowerCase();}
function makeOptions(answer,distractors,rng,count){
  count=count||4;var a=String(answer),pool=uniq((distractors||[]).map(String).filter(function(x){return x!==a;})),chosen=shuffle(pool,rng).slice(0,Math.max(0,count-1)),guard=0;
  while(chosen.length<count-1&&guard++<40){var fallback=String.fromCharCode(65+randInt(rng,0,25));if(fallback!==a&&chosen.indexOf(fallback)<0)chosen.push(fallback);}
  return shuffle([a].concat(chosen),rng);
}
function makeItem(stem,answer,options,explanation,key,context){
  var opts=uniq((options||[]).map(String)),a=String(answer);if(opts.indexOf(a)<0)opts.push(a);
  return {stem:String(stem),context:(context||[]).map(String),options:opts,answer:a,explanation:String(explanation||''),key:String(key||signature([stem,a]))};
}
function numericOptions(answer,rng,spread){spread=spread||4;var a=Number(answer),d=[];for(var k=1;k<=spread;k++){d.push(String(a+k),String(a-k));}return makeOptions(String(a),d,rng,4);}
function poolForLevel(arr,difficulty){var max=difficulty==='easy'?1:difficulty==='standard'?2:3,p=arr.filter(function(x){return (x.level||1)<=max;});return p.length?p:arr;}

var CATEGORIES={
 animals:['cat','dog','horse','cow','sheep','goat','rabbit','fox','tiger','lion','zebra','panda','otter','badger'],
 fruit:['apple','pear','grape','orange','lemon','peach','plum','melon','banana','cherry','mango','berry'],
 colours:['red','blue','green','yellow','purple','orange','brown','black','white','pink','silver','gold'],
 school:['pencil','ruler','book','desk','chair','paper','lesson','teacher','pupil','class','board','chalk'],
 transport:['car','bus','train','plane','boat','bike','van','lorry','tram','taxi','ship','coach'],
 weather:['rain','snow','wind','storm','cloud','frost','thunder','mist','drizzle','hail','sun','shower'],
 tools:['hammer','saw','drill','spade','brush','wrench','pliers','rake','shovel','chisel','screw','nail'],
 body:['hand','foot','head','knee','elbow','wrist','ankle','nose','ear','eye','mouth','heart'],
 sports:['tennis','rugby','cricket','football','hockey','golf','swimming','boxing','rowing','cycling','running','skating'],
 home:['kitchen','bedroom','bathroom','garden','garage','sofa','table','carpet','curtain','shelf','door','window'],
 materials:['wood','metal','glass','plastic','cotton','wool','paper','stone','brick','rubber','steel','cloth'],
 jobs:['nurse','doctor','teacher','baker','farmer','pilot','driver','artist','builder','chef','dentist','plumber']
};

var SYNONYM_GROUPS=[
 {terms:['big','large','huge'],level:1},
 {terms:['small','little','tiny'],level:1},
 {terms:['quick','fast','speedy'],level:1},
 {terms:['happy','glad','cheerful'],level:1},
 {terms:['angry','cross','mad'],level:1},
 {terms:['quiet','silent','still'],level:1},
 {terms:['smart','clever','bright'],level:1},
 {terms:['neat','tidy','orderly'],level:1},
 {terms:['ill','sick','unwell'],level:1},
 {terms:['choose','select','pick'],level:1},
 {terms:['close','shut','seal'],level:1},
 {terms:['speak','talk','chat'],level:1},
 {terms:['look','see','view'],level:1},
 {terms:['jump','leap','hop'],level:1},
 {terms:['correct','right','accurate'],level:1},
 {terms:['help','aid','assist'],level:1},
 {terms:['odd','strange','unusual'],level:1},
 {terms:['simple','easy','plain'],level:1},
 {terms:['hard','difficult','tough'],level:1},
 {terms:['brave','bold','fearless'],level:1},
 {terms:['safe','secure','protected'],level:1},
 {terms:['finish','end','stop'],level:1},
 {terms:['begin','start','commence'],level:2},
 {terms:['answer','reply','response'],level:2},
 {terms:['story','tale','account'],level:2},
 {terms:['repair','mend','fix'],level:2},
 {terms:['create','make','produce'],level:2},
 {terms:['empty','vacant','bare'],level:2},
 {terms:['careful','cautious','wary'],level:2},
 {terms:['kind','gentle','caring'],level:2},
 {terms:['ancient','old','aged'],level:2},
 {terms:['observe','notice','spot'],level:2},
 {terms:['permit','allow','approve'],level:2},
 {terms:['depart','leave','exit'],level:2},
 {terms:['enormous','vast','immense'],level:3},
 {terms:['purchase','buy','acquire'],level:3},
 {terms:['reply','respond','answer'],level:3},
 {terms:['dangerous','risky','unsafe'],level:3},
 {terms:['honest','truthful','sincere'],level:3},
 {terms:['destroy','ruin','wreck'],level:3},
 {terms:['calm','peaceful','tranquil'],level:3},
 {terms:['important','major','significant'],level:3}
];
var SYNONYMS=[];
SYNONYM_GROUPS.forEach(function(g){
 for(var i=0;i<g.terms.length;i++)for(var j=i+1;j<g.terms.length;j++)SYNONYMS.push({a:g.terms[i],b:g.terms[j],level:g.level});
});
var ANTONYMS=[
 ['hot','cold',1],['big','small',1],['fast','slow',1],['early','late',1],['old','young',1],['light','dark',1],
 ['open','closed',1],['full','empty',1],['high','low',1],['hard','soft',1],['wet','dry',1],['happy','sad',1],
 ['strong','weak',1],['thick','thin',1],['inside','outside',2],['before','after',1],['above','below',1],['push','pull',1],
 ['give','take',1],['begin','end',1],['arrive','leave',2],['laugh','cry',1],['smooth','rough',2],['wide','narrow',2],
 ['true','false',1],['right','wrong',1],['rich','poor',2],['ancient','modern',3],['accept','refuse',3],['increase','decrease',3],
 ['include','exclude',3],['maximum','minimum',3],['victory','defeat',3],['expand','contract',3],['generous','selfish',3]
].map(function(x){return {a:x[0],b:x[1],level:x[2]};});

var COMPOUNDS=[
 ['rain','bow',1],['foot','ball',1],['class','room',1],['tooth','brush',1],['bed','room',1],['play','ground',1],
 ['note','book',1],['door','bell',1],['tea','pot',1],['bath','room',1],['snow','man',1],['moon','light',1],
 ['star','fish',1],['cup','cake',1],['pan','cake',1],['hand','bag',1],['key','board',1],['farm','yard',1],
 ['sea','side',1],['air','port',1],['hair','cut',1],['rain','coat',1],['shoe','lace',1],['week','end',1],
 ['day','light',1],['water','fall',1],['home','work',1],['fire','work',1],['book','case',2],['news','paper',2],
 ['sun','flower',1],['light','house',2],['wheel','chair',2],['door','way',2],['grand','parent',2],['break','fast',2],
 ['after','noon',2],['every','thing',2],['some','where',2],['under','ground',2],['over','coat',2],['foot','print',2],
 ['bed','time',2],['school','work',2],['play','time',2],['rain','drop',2],['snow','ball',2],['mail','box',2],
 ['tooth','paste',2],['sun','shine',2],['hand','writing',3],['head','teacher',3],['water','proof',3],['earth','quake',3],
 ['life','boat',3],['time','table',3],['book','mark',3],['door','step',3],['day','dream',3],['moon','stone',3]
].map(function(x){return {left:x[0],right:x[1],level:x[2]};});

var RELATIONS=[
 {name:'young animal',level:1,pairs:[['dog','puppy'],['cat','kitten'],['cow','calf'],['horse','foal'],['sheep','lamb'],['goat','kid']]},
 {name:'object and action',level:1,pairs:[['knife','cut'],['pen','write'],['brush','paint'],['key','unlock'],['spoon','stir'],['broom','sweep']]},
 {name:'person and workplace',level:2,pairs:[['teacher','school'],['doctor','hospital'],['chef','kitchen'],['pilot','airport'],['farmer','farm'],['baker','bakery']]},
 {name:'part and whole',level:2,pairs:[['wheel','car'],['page','book'],['petal','flower'],['brick','wall'],['finger','hand'],['branch','tree']]},
 {name:'material and object',level:2,pairs:[['glass','window'],['wood','table'],['wool','jumper'],['paper','book'],['metal','spoon'],['rubber','tyre']]},
 {name:'tool and user',level:3,pairs:[['stethoscope','doctor'],['palette','artist'],['trowel','builder'],['whisk','chef'],['spanner','mechanic'],['needle','tailor']]}
];

var COMMON_LINKS=[];
SYNONYM_GROUPS.filter(function(g){return g.terms.length>=3;}).forEach(function(g){
 for(var ai=0;ai<g.terms.length;ai++){
   var answer=g.terms[ai],others=g.terms.filter(function(_,i){return i!==ai;});
   for(var i=0;i<others.length;i++)for(var j=i+1;j<others.length;j++)COMMON_LINKS.push({clues:[others[i],others[j]],answer:answer,level:g.level});
 }
});
var INSERT_PATTERNS=[
 ['c_t','cat','A',1],['h_t','hat','A',1],['m_p','map','A',1],['b_g','bag','A',1],['f_n','fan','A',1],['p_n','pan','A',1],['c_p','cap','A',1],
 ['pl_ne','plane','A',2],['gr_pe','grape','A',2],['sh_re','share','A',2],['st_rt','start','A',2],['bl_ck','black','A',2],['cr_ne','crane','A',3],['tr_ce','trace','A',3],['br_ke','brake','A',3],['fl_me','flame','A',3],
 ['p_n','pen','E',1],['h_n','hen','E',1],['t_n','ten','E',1],['b_d','bed','E',1],['r_d','red','E',1],['l_g','leg','E',1],['n_t','net','E',1],
 ['gr_en','green','E',2],['sc_ne','scene','E',2],['th_me','theme','E',2],['th_se','these','E',2],['sh_lf','shelf','E',2],['fr_sh','fresh','E',2],['bl_nd','blend','E',3],['ch_st','chest','E',3],
 ['p_g','pig','I',1],['f_n','fin','I',1],['s_t','sit','I',1],['h_t','hit','I',1],['b_g','big','I',1],['l_p','lip','I',1],['d_g','dig','I',1],
 ['br_ght','bright','I',2],['ch_ld','child','I',2],['th_rd','third','I',2],['sh_ne','shine','I',2],['cl_mb','climb','I',2],['pr_nt','print','I',2],['str_ct','strict','I',3],['f_nish','finish','I',3],
 ['d_g','dog','O',1],['f_x','fox','O',1],['h_t','hot','O',1],['p_t','pot','O',1],['l_g','log','O',1],['b_x','box','O',1],['t_p','top','O',1],
 ['cl_ck','clock','O',2],['st_ne','stone','O',2],['ph_ne','phone','O',2],['cl_se','close','O',2],['cr_wn','crown','O',2],['fr_nt','front','O',2],['sm_oth','smooth','O',3],['ch_sen','chosen','O',3],
 ['s_n','sun','U',1],['r_n','run','U',1],['f_n','fun','U',1],['b_s','bus','U',1],['c_p','cup','U',1],['m_g','mug','U',1],
 ['tr_ck','truck','U',2],['br_sh','brush','U',2],['cl_b','club','U',2],['pl_m','plum','U',2],['h_nt','hunt','U',2],['cr_st','crust','U',3],['bl_nt','blunt','U',3],
 ['c_ock','clock','L',2],['f_oor','floor','L',2],['p_ay','play','L',1],['b_ue','blue','L',1],['g_ass','glass','L',2],['c_ear','clear','L',2],['b_ack','black','L',2],
 ['b_own','brown','R',2],['g_ape','grape','R',2],['c_own','crown','R',2],['t_ain','train','R',2],['b_ush','brush','R',2],['f_ont','front','R',2],
 ['_tone','stone','S',2],['_tart','start','S',2],['_hare','share','S',2],['_hine','shine','S',2],['_chool','school','S',2],['_mall','small','S',1],
 ['_lock','clock','C',2],['_lass','class','C',2],['_lean','clean','C',2],['_rown','crown','C',2],['_hild','child','C',2],['_rane','crane','C',3]
].map(function(x){return {mask:x[0],word:x[1],letter:x[2],level:x[3]};});

var CODE_WORDS=['CAT','DOG','HEN','PIG','FOX','SUN','MAP','CUP','BOX','PEN','FISH','BIRD','LAMP','BOOK','STAR','MOON','RAIN','WIND','TREE','PLANT','STONE','BRICK','HOUSE','CHAIR','TABLE','TRAIN','PLANE','GRAPE','APPLE','CLOCK','BRUSH','SHELF','SMILE','SHARE','CROWN','LIGHT','NIGHT','GREEN','BLACK','BROWN'];
var CODE_FAMILIES=[['CAT','COT','COAT'],['RATE','TEAR','EAT'],['SALT','LAST','TALL'],['STOP','POTS','POST'],['CARE','RACE','CAR'],['NOTE','TONE','ONE'],['LAMP','PALM','MAP'],['STAR','RATS','ART'],['EAST','SEAT','TEA'],['TEAM','MEAT','MATE']];

var EXTRA_WORDS=[
 'fast','one','that','chair','music','area','stone','tone','star','tar','plane','lane','plot','lot','hair','rate','crate','bread','bead','cow','crow','spear','pear','car','scar','cloud','loud','clean','lean',
 'share','hare','span','pan','train','rain','tray','ray','scone','cone','spot','pot','bring','ring','band','and','flame','lame','fare','are','blend','lend','bend','end','slate','late','spin','pin',
 'glove','love','gate','ate','scare','care','crash','rash','cold','old','brace','race','brat','rat','trace','trip','rip','snail','nail','clock','floor','play','blue','glass','clear','black','brown',
 'grape','crown','brush','front','school','small','child','crane','bright','third','shine','climb','print','strict','finish','green','scene','theme','these','shelf','fresh','chest','phone','close',
 'smooth','chosen','truck','club','plum','hunt','crust','blunt','start','brake','circle','square','river','field','beach','flower','forest','water','earth','quick','rapid','tiny','little','large',
 'huge','glad','cheerful','silent','still','clever','smart','street','road','select','pick','safe','secure','reply','answer','notice','allow','help','leave','buy','begin','open','stop','happy','quiet'
];

var ALL_WORDS=uniq(
 Object.keys(CATEGORIES).reduce(function(a,k){return a.concat(CATEGORIES[k]);},[])
 .concat(SYNONYMS.reduce(function(a,x){return a.concat([x.a,x.b]);},[]))
 .concat(ANTONYMS.reduce(function(a,x){return a.concat([x.a,x.b]);},[]))
 .concat(COMPOUNDS.reduce(function(a,x){return a.concat([x.left,x.right,x.left+x.right]);},[]))
 .concat(RELATIONS.reduce(function(a,r){return a.concat(r.pairs.reduce(function(b,p){return b.concat(p);},[]));},[]))
 .concat(COMMON_LINKS.reduce(function(a,x){return a.concat(x.clues,[x.answer]);},[]))
 .concat(INSERT_PATTERNS.map(function(x){return x.word;}))
 .concat(CODE_WORDS.map(function(x){return x.toLowerCase();}))
 .concat(CODE_FAMILIES.reduce(function(a,x){return a.concat(x);},[]).map(function(x){return x.toLowerCase();}))
 .concat(EXTRA_WORDS)
 .map(function(x){return String(x).toLowerCase();})
 .filter(function(x){return /^[a-z]{3,10}$/.test(x);})
);
var WORD_SET=new Set(ALL_WORDS);
function wordPool(difficulty,min,max){var dmax=difficulty==='easy'?Math.min(5,max):difficulty==='standard'?Math.min(7,max):max;return ALL_WORDS.filter(function(w){return w.length>=min&&w.length<=dmax;});}

var _hiddenCandidates=null;
function hiddenCandidates(){
 if(_hiddenCandidates)return _hiddenCandidates;
 var hosts=ALL_WORDS.filter(function(w){return w.length>=3&&w.length<=6;}),byPair=new Map(),out=[];
 hosts.forEach(function(a){hosts.forEach(function(b){
   if(a===b)return;
   var joined=a+b,boundary=a.length,targets=new Set();
   for(var start=Math.max(0,boundary-5);start<boundary;start++){
     for(var end=boundary+1;end<=Math.min(joined.length,start+6);end++){
       var target=joined.slice(start,end);
       if(target.length>=3&&WORD_SET.has(target))targets.add(target);
     }
   }
   if(targets.size===1)byPair.set(a+'|'+b,{a:a,b:b,target:Array.from(targets)[0]});
 });});
 byPair.forEach(function(v){out.push(v);});
 if(!out.length)out.push({a:'fast',b:'one',target:'stone'});
 _hiddenCandidates=out;return out;
}
var _moveCandidates=null;
function moveCandidates(){
 if(_moveCandidates)return _moveCandidates;
 var words=ALL_WORDS.filter(function(w){return w.length>=3&&w.length<=7;}),receivers=words.filter(function(w){return w.length<=6;}),byLetter=new Map(),out=[],seen=new Set();
 words.forEach(function(source){for(var i=0;i<source.length;i++){var letter=source.charAt(i),reduced=source.slice(0,i)+source.slice(i+1);if(reduced.length<3||!WORD_SET.has(reduced))continue;if(!byLetter.has(letter))byLetter.set(letter,[]);byLetter.get(letter).push({source:source,reduced:reduced,letter:letter});}});
 byLetter.forEach(function(removals,letter){receivers.forEach(function(base){for(var pos=0;pos<=base.length;pos++){var expanded=base.slice(0,pos)+letter+base.slice(pos);if(!WORD_SET.has(expanded)||expanded===base)continue;removals.forEach(function(r){if(r.source===base||r.reduced===expanded)return;var k=signature([r.source,base,r.reduced,expanded]);if(!seen.has(k)){seen.add(k);out.push({source:r.source,receiver:base,newSource:r.reduced,newReceiver:expanded,letter:letter});}});}});});
 [
  ['stone','tar','tone','star','s'],['plane','lot','lane','plot','p'],['chair','rate','hair','crate','c'],['bread','cow','bead','crow','r'],['spear','car','pear','scar','s'],
  ['cloud','lean','loud','clean','c'],['share','pan','hare','span','s'],['train','ray','rain','tray','t'],['scone','pot','cone','spot','s'],['bring','and','ring','band','b'],
  ['flame','are','lame','fare','f'],['blend','end','lend','bend','b'],['slate','pin','late','spin','s'],['glove','ate','love','gate','g'],['scare','pin','care','spin','s'],
  ['crash','old','rash','cold','c'],['brace','rat','race','brat','b'],['trace','rip','race','trip','t'],['snail','pin','nail','spin','s']
 ].forEach(function(x){var f={source:x[0],receiver:x[1],newSource:x[2],newReceiver:x[3],letter:x[4]},k=signature(x);if(!seen.has(k)){seen.add(k);out.push(f);}});
 var grouped=new Map();
 out.forEach(function(m){var k=m.source+'|'+m.receiver;if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(m);});
 var uniqueMoves=[];grouped.forEach(function(list){var unique=uniq(list.map(function(x){return signature([x.newSource,x.newReceiver]);}));if(unique.length===1)uniqueMoves.push(list[0]);});
 _moveCandidates=uniqueMoves.length?uniqueMoves:out;return _moveCandidates;
}
var _completionPairs=null;
function completionPairs(){
 if(_completionPairs)return _completionPairs;
 var groups=new Map(),out=[];
 ALL_WORDS.filter(function(w){return w.length>=4&&w.length<=8;}).forEach(function(word){[1,2,3].forEach(function(len){if(len>=word.length-1)return;for(var start=1;start+len<word.length;start++){var chunk=word.slice(start,start+len),mask=word.slice(0,start)+'_'+word.slice(start+len);if(!groups.has(chunk))groups.set(chunk,[]);groups.get(chunk).push({word:word,mask:mask,chunk:chunk,len:len});}});});
 groups.forEach(function(arr0,chunk){var arr=uniq(arr0.map(JSON.stringify)).map(JSON.parse);for(var i=0;i<arr.length;i++)for(var j=i+1;j<arr.length;j++){if(arr[i].mask!==arr[j].mask)out.push({chunk:chunk,a:arr[i],b:arr[j],level:chunk.length===1?1:chunk.length===2?2:3});}});
 _completionPairs=out;return out;
}

function definition(id,title,subgroup,description,dd){
 return {id:id,title:title,group:'Verbal Reasoning',subgroup:subgroup,description:description,kind:'independent',printableMode:'questions',answerSheetSupport:true,workedExampleSupport:true,needsCutting:false,needsDice:false,needsPartner:false,supportedAnswerTypes:['verbal','reasoning'],difficultyOptions:DIFFICULTIES.slice(),defaultSettings:{difficulty:'standard'},settingsSchema:[{id:'difficulty',type:'difficulty',label:'Difficulty'}],difficultyDescriptions:dd,topicIndependent:true,minYear:3,maxYear:6,randomFamily:'verbal',compatibility:Object.assign({},compatibility)};
}
var DEFINITIONS={
 vr_insertletter:definition('vr_insertletter','Insert a Letter','Letter & word manipulation','Find one letter that completes more than one word.',{easy:'Short familiar words',standard:'Longer words and less obvious gaps',challenge:'Longer words with less obvious letter positions'}),
 vr_oddonesout:definition('vr_oddonesout','Two Odd Ones Out','Word relationships','Find the two words that do not belong with the other three.',{easy:'Very clear everyday categories',standard:'Broader vocabulary categories',challenge:'Closer distractor categories'}),
 vr_lettercode:definition('vr_lettercode','Letter Codes','Codes','Work out an alphabet code and apply it to another word.',{easy:'One constant alphabet shift',standard:'Position-based shifts',challenge:'Reverse-and-shift rules'}),
 vr_closestmeaning:definition('vr_closestmeaning','Closest Meaning','Word relationships','Find the pair of words with the closest meaning.',{easy:'Common synonyms',standard:'Wider vocabulary',challenge:'More precise vocabulary'}),
 vr_hiddenword:definition('vr_hiddenword','Hidden Word','Letter & word manipulation','Find a real word hidden across the join between two words.',{easy:'Short hidden words',standard:'Longer joins',challenge:'Longer hidden words and less obvious boundaries'}),
 vr_missingword:definition('vr_missingword','Missing Letters','Letter & word manipulation','Restore missing letters to complete a word.',{easy:'One missing letter',standard:'Two missing letters',challenge:'Two or three missing letters'}),
 vr_lettersnumbers:definition('vr_lettersnumbers','Letters for Numbers','Codes','Use equations to work out which numbers letters represent.',{easy:'One value is given directly',standard:'Three linked equations',challenge:'A longer chain of linked equations'}),
 vr_moveletter:definition('vr_moveletter','Move a Letter','Letter & word manipulation','Move one letter from the first word to the second to make two new words.',{easy:'Short common transformations',standard:'Longer word pairs',challenge:'Longer, less obvious transformations'}),
 vr_letterseries:definition('vr_letterseries','Letter Series','Sequences','Continue a sequence of letters or letter pairs.',{easy:'Single constant alphabet step',standard:'Two simultaneous letter patterns',challenge:'Paired patterns with larger shifts'}),
 vr_wordconnections:definition('vr_wordconnections','Word Connections','Word relationships','Use the relationship between one pair of words to complete another pair.',{easy:'Familiar concrete relationships',standard:'Part/whole and place relationships',challenge:'Less obvious functional relationships'}),
 vr_numberseries:definition('vr_numberseries','Number Series','Sequences','Find the rule and continue a number sequence.',{easy:'Constant addition or subtraction',standard:'Alternating rules',challenge:'Interleaved two-rule sequences'}),
 vr_compoundwords:definition('vr_compoundwords','Compound Words','Word relationships','Choose the word that forms a familiar compound word.',{easy:'Very familiar compounds',standard:'Less immediate compounds',challenge:'Broader compound vocabulary'}),
 vr_makeword:definition('vr_makeword','Make a Word','Letter & word manipulation','Choose letters from groups to make a valid word.',{easy:'Three-letter words and two choices per group',standard:'Four-letter words',challenge:'Four-letter words with three choices per group'}),
 vr_letterconnections:definition('vr_letterconnections','Letter Connections','Codes','Find the relationship between letter pairs and complete a new pair.',{easy:'Simple paired shifts',standard:'Different shifts for each letter',challenge:'Larger paired transformations'}),
 vr_readinginfo:definition('vr_readinginfo','Reading Information','Logic & information','Use a short set of facts to deduce the only correct answer.',{easy:'Three people and a short chain',standard:'Four people and linked facts',challenge:'Five people and a longer deduction chain'}),
 vr_oppositemeaning:definition('vr_oppositemeaning','Opposite Meaning','Word relationships','Choose the word with the opposite meaning.',{easy:'Common opposites',standard:'Wider vocabulary',challenge:'More precise vocabulary'}),
 vr_completesum:definition('vr_completesum','Complete the Sum','Number reasoning','Find the missing number in an equation.',{easy:'Addition and subtraction',standard:'Multiplication and division',challenge:'Two-step equations'}),
 vr_relatednumbers:definition('vr_relatednumbers','Related Numbers','Number reasoning','Work out the rule linking the outside numbers to the number in brackets.',{easy:'Add or subtract',standard:'Multiply or combine',challenge:'Two-part linear rules'}),
 vr_wordnumbercodes:definition('vr_wordnumbercodes','Word–Number Codes','Codes','Infer a letter-to-number code from example words.',{easy:'Short words with a fully covered code',standard:'More letters and overlapping examples',challenge:'Compact number codes'}),
 vr_completeword:definition('vr_completeword','Complete the Words','Letter & word manipulation','Find the same missing letter group that completes two words.',{easy:'One shared missing letter',standard:'Two shared letters',challenge:'Two or three shared letters'}),
 vr_commonlink:definition('vr_commonlink','Same Meaning · Common Link','Word relationships','Find one word that links two clue words by meaning.',{easy:'Everyday vocabulary',standard:'Broader vocabulary',challenge:'More precise word meanings'})
};

function normalise(id,raw){raw=raw||{};var base=DEFINITIONS[id]?DEFINITIONS[id].defaultSettings:{difficulty:'standard'};return Object.assign({},base,raw,{difficulty:clampDifficulty(raw.difficulty||base.difficulty)});}
function buildActivity(id,o,items,instruction,seed){
 var seen=new Set(),cleanItems=[];(items||[]).forEach(function(it){if(it&&cleanItems.length<1&&!seen.has(it.key)){seen.add(it.key);cleanItems.push(it);}});
 var key=hashString(id+':'+o.difficulty+':'+cleanItems.map(function(x){return x.key;}).join('::')).toString(36);
 return {engineId:id,vrType:id,title:DEFINITIONS[id].title,difficulty:o.difficulty,instruction:instruction,items:cleanItems,contentKey:key,seed:seed,options:o,engineVersion:VERSION};
}

function lettersForMask(mask){
 var out=[];'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function(ch){if(WORD_SET.has(mask.replace('_',ch)))out.push(ch.toUpperCase());});return out;
}
function generateInsert(o,seed){
 var rng=rngFromSeed(seed),max=o.difficulty==='easy'?1:o.difficulty==='standard'?2:3,available=INSERT_PATTERNS.filter(function(x){return x.level<=max;}),candidates=[];
 for(var i=0;i<available.length;i++)for(var j=i+1;j<available.length;j++){
   var a=available[i],b=available[j];if(a.mask===b.mask)continue;
   var common=lettersForMask(a.mask).filter(function(ch){return lettersForMask(b.mask).indexOf(ch)>=0;});
   if(common.length===1&&common[0]===a.letter&&a.letter===b.letter)candidates.push({a:a,b:b,letter:a.letter});
 }
 if(!candidates.length)throw new Error('No unambiguous insert-letter pairs are available for this difficulty.');
 var items=[],used=new Set(),guard=0;
 while(items.length<3&&guard++<60){
   var p=pick(candidates,rng),key=signature([p.a.mask,p.b.mask,p.letter]);if(used.has(key))continue;used.add(key);
   var opts=makeOptions(p.letter,shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(function(x){return x!==p.letter;}),rng),rng,4);
   items.push(makeItem('Which ONE letter completes both words?',p.letter,opts,'Putting '+p.letter+' in both gaps gives '+p.a.word.toUpperCase()+' and '+p.b.word.toUpperCase()+'.',key,[p.a.mask.toUpperCase(),p.b.mask.toUpperCase()]));
 }
 return buildActivity('vr_insertletter',o,items,'Put the same letter into both gaps. Choose the only letter that makes two real words.',seed);
}
function categoryMembership(word){return Object.keys(CATEGORIES).filter(function(cat){return CATEGORIES[cat].indexOf(word)>=0;});}
function uniqueCategoryWords(cat){return CATEGORIES[cat].filter(function(w){return categoryMembership(w).length===1;});}
function generateOdd(o,seed){
 var rng=rngFromSeed(seed),allCats=Object.keys(CATEGORIES).filter(function(cat){return uniqueCategoryWords(cat).length>=3;}),simple=['animals','fruit','colours','transport','body','school'],cats=o.difficulty==='easy'?allCats.filter(function(cat){return simple.indexOf(cat)>=0;}):allCats,items=[];
 for(var q=0;q<3;q++){
   var core=pick(cats,rng),others=shuffle(allCats.filter(function(cat){return cat!==core&&uniqueCategoryWords(cat).length>=2;}),rng),coreWords=shuffle(uniqueCategoryWords(core),rng).slice(0,3),odd1,odd2;
   if(o.difficulty==='challenge'){
     var oddPair=shuffle(uniqueCategoryWords(others[0]),rng).slice(0,2);odd1=oddPair[0];odd2=oddPair[1];
   }else{
     odd1=pick(uniqueCategoryWords(others[0]),rng);odd2=pick(uniqueCategoryWords(others[1]),rng);
   }
   var words=shuffle(coreWords.concat([odd1,odd2]),rng),correct=[odd1,odd2].sort().map(cap).join(' & '),d=[];
   for(var i=0;i<words.length;i++)for(var j=i+1;j<words.length;j++){var pair=[words[i],words[j]].sort().map(cap).join(' & ');if(pair!==correct)d.push(pair);}
   var why=o.difficulty==='challenge'?'The other two form a smaller pair, but the question asks for the two outside the group of three.':'The remaining two come from different groups.';
   items.push(makeItem('Which TWO words are the odd ones out?',correct,makeOptions(correct,d,rng,4),coreWords.map(cap).join(', ')+' belong to the same group: '+core+'. '+why,signature([core,o.difficulty].concat(words)),words.map(cap)));
 }
 return buildActivity('vr_oddonesout',o,items,'In each set, three words belong together. Choose the pair that does not belong.',seed);
}
function codeRule(difficulty,rng){
 if(difficulty==='easy'){var s=pick([1,2,3,-1,-2],rng);return {label:'shift every letter '+(s>0?'+':'')+s,apply:function(w){return w.split('').map(function(ch){return alphabetShift(ch,s);}).join('');}};}
 if(difficulty==='standard'){var a=pick([1,2,3],rng),b=pick([-1,-2,-3],rng);return {label:'alternate +'+a+', '+b,apply:function(w){return w.split('').map(function(ch,i){return alphabetShift(ch,i%2?b:a);}).join('');}};}
 var shift=pick([1,2,3,-1,-2],rng);return {label:'reverse then shift '+(shift>0?'+':'')+shift,apply:function(w){return w.split('').reverse().map(function(ch){return alphabetShift(ch,shift);}).join('');}};
}
function generateLetterCode(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){var rule=codeRule(o.difficulty,rng),pool=CODE_WORDS.filter(function(w){return o.difficulty==='easy'?w.length===3:w.length>=3&&w.length<=5;}),words=shuffle(pool,rng),a=words[0],b=words[1],target=words[2],answer=rule.apply(target),d=[codeRule('easy',rng).apply(target),answer.split('').reverse().join(''),target.split('').map(function(ch){return alphabetShift(ch,1);}).join(''),target.split('').map(function(ch){return alphabetShift(ch,-1);}).join('')];items.push(makeItem('Using the same code, how is '+target+' written?',answer,makeOptions(answer,d,rng,4),'The code rule is: '+rule.label+'.',signature([rule.label,a,b,target]),[a+' → '+rule.apply(a),b+' → '+rule.apply(b)]));}
 return buildActivity('vr_lettercode',o,items,'Work out the alphabet rule from the examples, then code the new word.',seed);
}
function generateClosest(o,seed){
 var rng=rngFromSeed(seed),pool=poolForLevel(SYNONYMS,o.difficulty),items=[];
 for(var q=0;q<3;q++){var p=pick(pool,rng),other=shuffle(pool.filter(function(x){return x!==p;}),rng).slice(0,4),answer=cap(p.a)+' — '+cap(p.b),d=other.map(function(x,i){return cap(i%2?p.a:x.a)+' — '+cap(i%2?x.b:p.b);});items.push(makeItem('Which pair of words is closest in meaning?',answer,makeOptions(answer,d,rng,4),cap(p.a)+' and '+cap(p.b)+' are synonyms.',signature([p.a,p.b]),[]));}
 return buildActivity('vr_closestmeaning',o,items,'Choose the pair whose meanings are closest.',seed);
}
function generateHidden(o,seed){
 var rng=rngFromSeed(seed),all=hiddenCandidates(),maxLen=o.difficulty==='easy'?4:o.difficulty==='standard'?5:6,pool=all.filter(function(x){return x.target.length<=maxLen;}),items=[];
 if(!pool.length)pool=all;
 for(var q=0;q<3;q++){var h=pick(pool,rng),answer=h.target.toUpperCase(),d=shuffle(wordPool(o.difficulty,answer.length,answer.length).map(function(x){return x.toUpperCase();}).filter(function(x){return x!==answer;}),rng);items.push(makeItem('Which word is hidden across the join?',answer,makeOptions(answer,d,rng,4),answer+' appears across the join in '+h.a.toUpperCase()+' | '+h.b.toUpperCase()+'.',signature([h.a,h.b,h.target]),[h.a.toUpperCase()+' | '+h.b.toUpperCase()]));}
 return buildActivity('vr_hiddenword',o,items,'The hidden word must use letters from the end of the first word and the start of the second.',seed);
}
function generateMissing(o,seed){
 var rng=rngFromSeed(seed),pool=wordPool(o.difficulty,4,8),items=[];
 for(var q=0;q<3;q++){
   var word=pick(pool,rng),want=o.difficulty==='easy'?1:o.difficulty==='standard'?2:pick([2,3],rng),len=Math.min(want,word.length-2),start=randInt(rng,1,word.length-len-1),chunk=word.slice(start,start+len).toUpperCase(),prefix=word.slice(0,start),suffix=word.slice(start+len),mask=(prefix+new Array(len+1).join('_')+suffix).toUpperCase(),chunks=[];
   pool.forEach(function(w){for(var i=1;i+len<w.length;i++){var candidate=w.slice(i,i+len).toUpperCase();if(candidate!==chunk&&!WORD_SET.has(prefix+candidate.toLowerCase()+suffix))chunks.push(candidate);}});
   items.push(makeItem('Which letters complete '+mask+'?',chunk,makeOptions(chunk,shuffle(uniq(chunks),rng),rng,4),mask+' becomes '+word.toUpperCase()+' when '+chunk+' is restored.',signature([word,start,len]),[mask]));
 }
 return buildActivity('vr_missingword',o,items,'Choose the missing letter or letter group that makes a real word.',seed);
}
function uniqueDigits(rng,n){return shuffle([1,2,3,4,5,6,7,8,9],rng).slice(0,n);}
function generateLettersNumbers(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){var v=uniqueDigits(rng,4),A=v[0],B=v[1],C=v[2],D=v[3],context,answer,ask;if(o.difficulty==='easy'){context=['A = '+A,'A + B = '+(A+B),'B + C = '+(B+C)];answer=C;ask='What number does C represent?';}else if(o.difficulty==='standard'){context=['A + B = '+(A+B),'B + C = '+(B+C),'A + C = '+(A+C)];answer=B;ask='What number does B represent?';}else{context=['A + B = '+(A+B),'B + C = '+(B+C),'A + C = '+(A+C),'C + D = '+(C+D)];answer=D;ask='What number does D represent?';}items.push(makeItem(ask,String(answer),numericOptions(answer,rng,5),'The linked equations fix the letter values; the answer is '+answer+'.',signature(context.concat([answer])),context));}
 return buildActivity('vr_lettersnumbers',o,items,'Each letter represents one number. Use all the equations together.',seed);
}
function generateMove(o,seed){
 var rng=rngFromSeed(seed),all=moveCandidates(),min=o.difficulty==='challenge'?5:o.difficulty==='standard'?4:3,pool=all.filter(function(x){return Math.max(x.source.length,x.receiver.length)>=min;}),items=[];if(!pool.length)pool=all;
 for(var q=0;q<3;q++){var m=pick(pool,rng),answer=m.newSource.toUpperCase()+' & '+m.newReceiver.toUpperCase(),d=shuffle(all.filter(function(x){return x!==m;}),rng).slice(0,10).map(function(x){return x.newSource.toUpperCase()+' & '+x.newReceiver.toUpperCase();});items.push(makeItem('Move ONE letter from '+m.source.toUpperCase()+' to '+m.receiver.toUpperCase()+'. Which two new words are made?',answer,makeOptions(answer,d,rng,4),'Move '+m.letter.toUpperCase()+': '+m.source.toUpperCase()+' → '+m.newSource.toUpperCase()+' and '+m.receiver.toUpperCase()+' → '+m.newReceiver.toUpperCase()+'.',signature([m.source,m.receiver,m.newSource,m.newReceiver]),[]));}
 return buildActivity('vr_moveletter',o,items,'Move one letter from the first word to the second. Do not rearrange the remaining letters.',seed);
}
function generateLetterSeries(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){if(o.difficulty==='easy'){var step=pick([1,2,3,-1,-2],rng),start=randInt(rng,0,25),first=String.fromCharCode(65+start),seq=[];for(var i=0;i<5;i++)seq.push(alphabetShift(first,i*step));var answer=alphabetShift(seq[4],step);items.push(makeItem('Which letter comes next?',answer,makeOptions(answer,[alphabetShift(seq[4],1),alphabetShift(seq[4],-1),alphabetShift(answer,step)],rng,4),'Each letter moves '+Math.abs(step)+' place'+(Math.abs(step)===1?'':'s')+' '+(step>0?'forward':'backward')+' in the alphabet.',signature([seq.join(''),step]),[seq.join('  ')+'  ?']));}else{var s1=pick([1,2,3],rng),s2=pick([-1,-2,-3],rng),a0=randInt(rng,0,25),b0=randInt(rng,0,25),pairs=[];for(var k=0;k<4;k++)pairs.push(alphabetShift(String.fromCharCode(65+a0),k*s1)+alphabetShift(String.fromCharCode(65+b0),k*s2));var ans=alphabetShift(String.fromCharCode(65+a0),4*s1)+alphabetShift(String.fromCharCode(65+b0),4*s2),dd=[alphabetShift(ans.charAt(0),1)+ans.charAt(1),ans.charAt(0)+alphabetShift(ans.charAt(1),1),alphabetShift(ans.charAt(0),-1)+alphabetShift(ans.charAt(1),-1)];items.push(makeItem('Which letter pair comes next?',ans,makeOptions(ans,dd,rng,4),'The first and second letters follow separate alphabet patterns.',signature([pairs.join(','),ans]),[pairs.join('   ')+'   ?']));}}
 return buildActivity('vr_letterseries',o,items,'Follow the alphabet pattern. In letter pairs, track each position separately.',seed);
}
function generateWordConnections(o,seed){
 var rng=rngFromSeed(seed),max=o.difficulty==='easy'?1:o.difficulty==='standard'?2:3,rels=RELATIONS.filter(function(r){return r.level<=max;}),items=[];
 for(var q=0;q<3;q++){var rel=pick(rels,rng),pairs=shuffle(rel.pairs,rng),p1=pairs[0],p2=pairs[1],reverse=o.difficulty==='challenge'&&rng()<.5,a=reverse?[p1[1],p1[0]]:p1,b=reverse?[p2[1],p2[0]]:p2,answer=cap(b[1]),d=pairs.slice(2).map(function(p){return cap(reverse?p[0]:p[1]);});items.push(makeItem(cap(a[0])+' is to '+cap(a[1])+' as '+cap(b[0])+' is to …',answer,makeOptions(answer,d,rng,4),'Both pairs use the same relationship: '+rel.name+'.',signature([rel.name].concat(a,b)),[]));}
 return buildActivity('vr_wordconnections',o,items,'Find the relationship in the first pair, then apply the same relationship to the second.',seed);
}
function generateNumberSeries(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){var seq=[],answer,rule;if(o.difficulty==='easy'){var step=pick([2,3,4,5,-2,-3],rng),start=step>0?randInt(rng,1,20):randInt(rng,20,40);for(var i=0;i<5;i++)seq.push(start+i*step);answer=seq[4]+step;rule='add '+step;}else if(o.difficulty==='standard'){var a=randInt(rng,2,5),b=randInt(rng,3,7),st=randInt(rng,1,12);seq=[st];for(var j=1;j<6;j++)seq.push(seq[j-1]+(j%2?a:b));answer=seq.pop();rule='alternate +'+a+', +'+b;}else{var a0=randInt(rng,2,8),b0=randInt(rng,15,30),sa=randInt(rng,2,5),sb=randInt(rng,3,6);for(var k=0;k<3;k++)seq.push(a0+k*sa,b0+k*sb);answer=a0+3*sa;rule='two interleaved sequences: +'+sa+' and +'+sb;}items.push(makeItem('Which number comes next?',String(answer),numericOptions(answer,rng,8),'The rule is '+rule+'.',signature([seq.join(','),rule]),[seq.join(', ')+', ?']));}
 return buildActivity('vr_numberseries',o,items,'Find the number pattern and choose the next term.',seed);
}
function generateCompound(o,seed){
 var rng=rngFromSeed(seed),pool=poolForLevel(COMPOUNDS,o.difficulty),allSet=new Set(COMPOUNDS.map(function(x){return x.left+'|'+x.right;})),items=[];
 for(var q=0;q<3;q++){
   var c=pick(pool,rng),reverse=rng()<.5,answer=cap(reverse?c.left:c.right),stem=reverse?'Which word goes before '+c.right.toUpperCase()+' to make a compound word?':'Which word goes after '+c.left.toUpperCase()+' to make a compound word?',raw=uniq(pool.filter(function(x){return x!==c;}).map(function(x){return reverse?x.left:x.right;}));
   var d=raw.filter(function(candidate){return reverse?!allSet.has(candidate+'|'+c.right):!allSet.has(c.left+'|'+candidate);}).map(cap);
   items.push(makeItem(stem,answer,makeOptions(answer,d,rng,4),cap(c.left)+' + '+c.right+' = '+cap(c.left+c.right)+'.',signature([c.left,c.right,reverse]),[]));
 }
 return buildActivity('vr_compoundwords',o,items,'Choose the word that makes one familiar compound word.',seed);
}
function generateMakeWord(o,seed){
 var rng=rngFromSeed(seed),len=o.difficulty==='easy'?3:4,pool=wordPool(o.difficulty,len,len),items=[];
 for(var q=0;q<3;q++){var answer=pick(pool,rng).toUpperCase(),choicesPer=o.difficulty==='challenge'?3:2,groups=[];for(var i=0;i<len;i++){var letters=[answer.charAt(i)];while(letters.length<choicesPer){var ch=String.fromCharCode(65+randInt(rng,0,25));if(letters.indexOf(ch)<0)letters.push(ch);}groups.push(shuffle(letters,rng));}var d=shuffle(pool.filter(function(w){var up=w.toUpperCase();if(up===answer)return false;for(var n=0;n<up.length;n++)if(groups[n].indexOf(up.charAt(n))<0)return true;return false;}),rng).slice(0,12).map(function(w){return w.toUpperCase();}),ctx=groups.map(function(g,i){return 'Group '+(i+1)+': '+g.join(' / ');});items.push(makeItem('Choose one letter from each group, in order. Which word can you make?',answer,makeOptions(answer,d,rng,4),answer+' uses one allowed letter from every group.',signature([answer].concat(groups.map(function(g){return g.join('');}))),ctx));}
 return buildActivity('vr_makeword',o,items,'Take one letter from each group, keeping the group order.',seed);
}
function pairTransform(pair,s1,s2){return alphabetShift(pair.charAt(0),s1)+alphabetShift(pair.charAt(1),s2);}
function generateLetterConnections(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){var s1=pick([1,2,3,-1,-2],rng),s2=o.difficulty==='easy'?s1:pick([1,2,3,-1,-2,-3].filter(function(x){return x!==s1;}),rng),examples=[],used=new Set();for(var i=0;i<3;i++){var p;do{p=String.fromCharCode(65+randInt(rng,0,25))+String.fromCharCode(65+randInt(rng,0,25));}while(used.has(p));used.add(p);examples.push([p,pairTransform(p,s1,s2)]);}var target;do{target=String.fromCharCode(65+randInt(rng,0,25))+String.fromCharCode(65+randInt(rng,0,25));}while(used.has(target));var answer=pairTransform(target,s1,s2),d=[pairTransform(target,s1,s1),pairTransform(target,-s1,s2),alphabetShift(answer.charAt(0),1)+alphabetShift(answer.charAt(1),-1)];items.push(makeItem('Using the same connection, '+target+' becomes …',answer,makeOptions(answer,d,rng,4),'The first letter moves '+(s1>0?'+':'')+s1+'; the second moves '+(s2>0?'+':'')+s2+'.',signature([s1,s2,target]),examples.map(function(x){return x[0]+' → '+x[1];})));}return buildActivity('vr_letterconnections',o,items,'Work out how each letter in the pair changes, then apply the same rule.',seed);
}
var NAMES=['Ava','Ben','Cara','Dylan','Erin','Finn','Grace','Hugo'];
function generateReading(o,seed){
 var rng=rngFromSeed(seed),count=o.difficulty==='easy'?3:o.difficulty==='standard'?4:5,items=[],wanted=o.difficulty==='challenge'?2:3,guard=0;
 while(items.length<wanted&&guard++<80){
   var names=shuffle(NAMES,rng).slice(0,count),base=randInt(rng,o.difficulty==='challenge'?22:14,o.difficulty==='challenge'?34:26),scores=[base];
   for(var i=0;i<count-1;i++){var delta=randInt(rng,2,6)*(rng()<.35?-1:1);scores.push(scores[scores.length-1]+delta);}
   if(Math.min.apply(null,scores)<1||new Set(scores).size!==scores.length)continue;
   var facts=[names[0]+' scored '+scores[0]+' points.'];for(var j=1;j<count;j++){var diff=scores[j]-scores[j-1];facts.push(names[j]+' scored '+Math.abs(diff)+' '+(diff>0?'more':'fewer')+' points than '+names[j-1]+'.');}
   var stem,answer,d,ex,opts;
   if(items.length%2===0){var idx=randInt(rng,1,count-1);stem='How many points did '+names[idx]+' score?';answer=String(scores[idx]);opts=numericOptions(Number(answer),rng,6);ex='Following the chain gives '+names[idx]+' = '+scores[idx]+'.';}
   else{var mx=Math.max.apply(null,scores),mi=scores.indexOf(mx);stem='Who scored the most points?';answer=names[mi];d=names.filter(function(_,k){return k!==mi;}).concat(shuffle(NAMES.filter(function(n){return names.indexOf(n)<0;}),rng));opts=makeOptions(answer,d,rng,4);ex=names[mi]+' has the highest score: '+mx+'.';}
   items.push(makeItem(stem,answer,opts,ex,signature(facts.concat([stem,answer])),facts));
 }
 return buildActivity('vr_readinginfo',o,items,'Read the facts carefully. Use only the information given to make the deduction.',seed);
}
function generateOpposite(o,seed){
 var rng=rngFromSeed(seed),pool=poolForLevel(ANTONYMS,o.difficulty),items=[];
 for(var q=0;q<3;q++){var p=pick(pool,rng),reverse=rng()<.5,target=reverse?p.b:p.a,answer=reverse?p.a:p.b,d=shuffle(pool.filter(function(x){return x!==p;}),rng).reduce(function(a,x){return a.concat([cap(x.a),cap(x.b)]);},[]);items.push(makeItem('Which word is the opposite of '+target.toUpperCase()+'?',cap(answer),makeOptions(cap(answer),d,rng,4),cap(target)+' and '+answer+' have opposite meanings.',signature([target,answer]),[]));}return buildActivity('vr_oppositemeaning',o,items,'Choose the word with the opposite meaning.',seed);
}
function generateCompleteSum(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){var ans,a,b,stem,ex;if(o.difficulty==='easy'){ans=randInt(rng,2,20);b=randInt(rng,2,15);var total=ans+b;stem='□ + '+b+' = '+total;ex=total+' − '+b+' = '+ans+'.';}else if(o.difficulty==='standard'){ans=randInt(rng,2,12);b=randInt(rng,2,10);var product=ans*b;stem='□ × '+b+' = '+product;ex=product+' ÷ '+b+' = '+ans+'.';}else{ans=randInt(rng,2,12);a=randInt(rng,2,8);b=randInt(rng,2,15);var value=a*ans+b;stem=a+' × □ + '+b+' = '+value;ex='First '+value+' − '+b+' = '+(a*ans)+', then '+(a*ans)+' ÷ '+a+' = '+ans+'.';}items.push(makeItem('Complete the sum: '+stem,String(ans),numericOptions(ans,rng,7),ex,signature([stem,ans]),[stem]));}return buildActivity('vr_completesum',o,items,'Find the number that makes the equation true.',seed);
}
function generateRelatedNumbers(o,seed){
 var rng=rngFromSeed(seed),items=[];
 for(var q=0;q<3;q++){var fn,label;if(o.difficulty==='easy'){if(rng()<.5){fn=function(a,b){return a+b;};label='add the outside numbers';}else{fn=function(a,b){return Math.abs(a-b);};label='find the positive difference';}}else if(o.difficulty==='standard'){if(rng()<.5){fn=function(a,b){return a*b;};label='multiply the outside numbers';}else{fn=function(a,b){return a+b+2;};label='add the outside numbers, then add 2';}}else{if(rng()<.5){fn=function(a,b){return 2*a+b;};label='double the left number, then add the right';}else{fn=function(a,b){return a+2*b;};label='add the left number to double the right';}}var pairs=[],context=[];for(var i=0;i<3;i++)pairs.push([randInt(rng,2,9),randInt(rng,2,9)]);pairs.forEach(function(p){context.push(p[0]+'  ('+fn(p[0],p[1])+')  '+p[1]);});var t=[randInt(rng,2,9),randInt(rng,2,9)],answer=fn(t[0],t[1]);items.push(makeItem(t[0]+'  (?)  '+t[1]+' — what belongs in the brackets?',String(answer),numericOptions(answer,rng,10),'Rule: '+label+'.',signature([label].concat(context,t)),context));}return buildActivity('vr_relatednumbers',o,items,'The same number rule is used on every line. Work it out from the examples.',seed);
}
function encodeWord(word,map,compact){return word.split('').map(function(ch){return map[ch];}).join(compact?'':'-');}
function generateWordNumberCodes(o,seed){
 var rng=rngFromSeed(seed),items=[],pool=CODE_FAMILIES.filter(function(f){return o.difficulty==='easy'?f[2].length===3:f[2].length===4;});
 if(!pool.length)pool=CODE_FAMILIES;
 for(var q=0;q<3;q++){
   var fam=pick(pool,rng),target=fam[2],clues=fam.slice(0,2),letters=uniq(fam.join('').split('')),digits=uniqueDigits(rng,letters.length),map={};letters.forEach(function(ch,i){map[ch]=digits[i];});
   var compact=o.difficulty==='challenge',answer=encodeWord(target,map,compact),context=clues.map(function(w){return w+' = '+encodeWord(w,map,compact);}),alts=[];
   if(o.difficulty==='challenge')context=shuffle(context,rng);
   for(var i=0;i<3;i++){var bad=Object.assign({},map),l=pick(letters,rng);bad[l]=((bad[l]+i+1)%9)+1;alts.push(encodeWord(target,bad,compact));}
   items.push(makeItem('Using the code, what is the number code for '+target+'?',answer,makeOptions(answer,alts,rng,4),'Use repeated letters in the examples to identify each digit.',signature([o.difficulty].concat(context,[target,answer])),context));
 }
 return buildActivity('vr_wordnumbercodes',o,items,'Each letter always has the same digit. Use the example words to work out the target code.',seed);
}
function generateCompleteWord(o,seed){
 var rng=rngFromSeed(seed),max=o.difficulty==='easy'?1:o.difficulty==='standard'?2:3,all=completionPairs(),pool=all.filter(function(x){return x.level<=max;}),items=[];if(!pool.length)pool=all;
 for(var q=0;q<3;q++){
   var p=pick(pool,rng),answer=p.chunk.toUpperCase(),sameLen=uniq(all.filter(function(x){return x.chunk.length===p.chunk.length;}).map(function(x){return x.chunk.toUpperCase();}).filter(function(x){if(x===answer)return false;var low=x.toLowerCase();return !(WORD_SET.has(p.a.mask.replace('_',low))&&WORD_SET.has(p.b.mask.replace('_',low)));}));
   items.push(makeItem('Which SAME letter group completes both words?',answer,makeOptions(answer,sameLen,rng,4),p.a.mask.toUpperCase()+' becomes '+p.a.word.toUpperCase()+' and '+p.b.mask.toUpperCase()+' becomes '+p.b.word.toUpperCase()+'.',signature([p.a.mask,p.b.mask,p.chunk]),[p.a.mask.toUpperCase(),p.b.mask.toUpperCase()]));
 }
 return buildActivity('vr_completeword',o,items,'Put the same missing letter group into both word patterns.',seed);
}
function generateCommonLink(o,seed){
 var rng=rngFromSeed(seed),pool=poolForLevel(COMMON_LINKS,o.difficulty),items=[];
 for(var q=0;q<3;q++){var x=pick(pool,rng),answer=cap(x.answer),d=shuffle(pool.filter(function(y){return y!==x;}),rng).map(function(y){return cap(y.answer);});items.push(makeItem('Which word is closest in meaning to BOTH '+x.clues[0].toUpperCase()+' and '+x.clues[1].toUpperCase()+'?',answer,makeOptions(answer,d,rng,4),answer+' links both clue words by meaning.',signature(x.clues.concat([x.answer])),[]));}return buildActivity('vr_commonlink',o,items,'Choose the one word that links both clue words by meaning.',seed);
}

var GENERATORS={
 vr_insertletter:generateInsert,vr_oddonesout:generateOdd,vr_lettercode:generateLetterCode,vr_closestmeaning:generateClosest,vr_hiddenword:generateHidden,vr_missingword:generateMissing,
 vr_lettersnumbers:generateLettersNumbers,vr_moveletter:generateMove,vr_letterseries:generateLetterSeries,vr_wordconnections:generateWordConnections,vr_numberseries:generateNumberSeries,
 vr_compoundwords:generateCompound,vr_makeword:generateMakeWord,vr_letterconnections:generateLetterConnections,vr_readinginfo:generateReading,vr_oppositemeaning:generateOpposite,
 vr_completesum:generateCompleteSum,vr_relatednumbers:generateRelatedNumbers,vr_wordnumbercodes:generateWordNumberCodes,vr_completeword:generateCompleteWord,vr_commonlink:generateCommonLink
};
function generate(id,settings,seed){
 var def=DEFINITIONS[id];if(!def)return null;var raw=settings&&settings.engineSettings&&settings.engineSettings[id]||{},o=normalise(id,raw),fn=GENERATORS[id],excluded=new Set(settings&&settings._finiteExclusions&&settings._finiteExclusions.vr||[]);
 try{
   for(var attempt=0;attempt<128;attempt++){
     var a=fn(o,String(seed||'vr')+':'+id+':'+attempt),v=validate(a);
     if(!v.ok)continue;
     if(!excluded.has(String(a.contentKey)))return a;
   }
   return {engineId:id,title:def.title,difficulty:o.difficulty,error:'No unused Verbal Reasoning activity remains for these settings.'};
 }catch(err){return {engineId:id,title:def.title,difficulty:o.difficulty,error:err&&err.message||'A valid verbal-reasoning activity could not be generated.'};}
}
function validate(a){
 if(!a||a.error)return {ok:false,error:a&&a.error||'missing activity'};if(!DEFINITIONS[a.engineId])return {ok:false,error:'unknown verbal-reasoning type'};if(DIFFICULTIES.indexOf(a.difficulty)<0)return {ok:false,error:'invalid difficulty'};if(!Array.isArray(a.items)||a.items.length<1)return {ok:false,error:'question missing'};
 var keys=new Set();for(var i=0;i<a.items.length;i++){var it=a.items[i];if(!it||!it.stem||!it.answer||!Array.isArray(it.options)||it.options.length<3)return {ok:false,error:'question '+(i+1)+' is incomplete'};if(new Set(it.options).size!==it.options.length)return {ok:false,error:'question '+(i+1)+' has duplicate options'};if(it.options.filter(function(x){return String(x)===String(it.answer);}).length!==1)return {ok:false,error:'question '+(i+1)+' does not have exactly one displayed answer'};if(!it.explanation)return {ok:false,error:'question '+(i+1)+' has no explanation'};if(keys.has(it.key))return {ok:false,error:'question repeated inside one activity'};keys.add(it.key);}
 return {ok:true};
}
var WORKED_META={
 vr_insertletter:['Use one letter to make two complete words.',['Try each option in both gaps.','Reject a letter as soon as either result is not a real word.']],
 vr_oddonesout:['Spot the relationship shared by three words.',['Find the strongest category shared by three words.','The remaining two are the answer.']],
 vr_lettercode:['Infer an alphabet transformation.',['Compare each input letter with its coded letter.','Apply the same position rule to the new word.']],
 vr_closestmeaning:['Compare meanings, not spellings.',['Read every pair.','Choose the pair whose meanings overlap most closely.']],
 vr_hiddenword:['Search across a word boundary.',['Join the two printed words mentally.','Look for a real word that begins before the join and ends after it.']],
 vr_missingword:['Restore a real word.',['Read the visible letters.','Try each option in the gap and keep the real word.']],
 vr_lettersnumbers:['Solve linked letter equations.',['Use the simplest equation first.','Substitute known values into the remaining equations.']],
 vr_moveletter:['Move exactly one letter between words.',['Remove one letter from the first word without rearranging it.','Insert that same letter into the second word.','Both results must be real words.']],
 vr_letterseries:['Track alphabet positions.',['Convert letters to alphabet positions if helpful.','For pairs, track the first and second letters separately.']],
 vr_wordconnections:['Reuse the same word relationship.',['Name the relationship in the first pair.','Apply it in the same direction to the second pair.']],
 vr_numberseries:['Find the repeating number rule.',['Check the differences or multipliers.','Test the rule on every step before choosing the next number.']],
 vr_compoundwords:['Build one familiar compound.',['Say the two parts together.','Choose the option that forms a recognised word.']],
 vr_makeword:['Use one letter from each group.',['Keep the group order.','Check that the result is a real word.']],
 vr_letterconnections:['Track two letter changes at once.',['Compare the first letters in each example.','Then compare the second letters.','Apply both shifts to the target pair.']],
 vr_readinginfo:['Deduce from a short fact set.',['Write down the first fixed fact.','Follow each comparison carefully.','Answer only from facts you can prove.']],
 vr_oppositemeaning:['Find an antonym.',['Decide what the target word means.','Choose the option with the reverse meaning.']],
 vr_completesum:['Use inverse operations.',['Undo the final operation.','Check by substituting your answer back into the equation.']],
 vr_relatednumbers:['Infer the bracket rule.',['Test a simple rule on both examples.','Only use a rule that works every time.']],
 vr_wordnumbercodes:['Track repeated letter-digit mappings.',['Start with letters that repeat across examples.','Build enough of the code key to encode the target.']],
 vr_completeword:['Use one shared missing chunk.',['Try the same option in both gaps.','Both completed results must be real words.']],
 vr_commonlink:['Find one shared meaning.',['Think of a synonym for the first clue.','Check that it also matches the second clue.']]
};
function workedExample(id){
 var def=DEFINITIONS[id];if(!def)return null;var meta=WORKED_META[id]||['Use the rule to find the only valid answer.',['Read the information carefully.','Test the rule and check the result.']];
 return {engineId:id,kind:id,title:def.title+' worked example',goal:meta[0],rules:['Use the same rule throughout the question.','Choose only one answer unless the question explicitly asks for two words.'],steps:meta[1],tip:'Check your answer against every part of the question, not just the first clue.',commonMistake:'Do not switch to a different rule halfway through a question.'};
}
var api={VERSION:VERSION,DEFINITIONS:DEFINITIONS,normalise:normalise,generate:generate,validate:validate,workedExample:workedExample,_data:{categories:CATEGORIES,synonyms:SYNONYMS,antonyms:ANTONYMS,compounds:COMPOUNDS,relations:RELATIONS,words:ALL_WORDS},_helpers:{hiddenCandidates:hiddenCandidates,moveCandidates:moveCandidates,completionPairs:completionPairs}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
global.TT99VerbalReasoning=api;
})(typeof globalThis!=='undefined'?globalThis:this);
