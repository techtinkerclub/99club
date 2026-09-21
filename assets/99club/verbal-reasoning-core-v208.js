/* 99 Club Studio · Verbal Reasoning core v2.08
 * Deterministic, offline generators for 21 common UK primary/11+ verbal-reasoning formats.
 * Shared by Games & Puzzles and Custom Worksheets.
 */
(function(global){
'use strict';
var VERSION='2.08.0',DIFFICULTIES=['easy','standard','challenge'];
var TYPE_GROUPS=[
{id:'words',label:'Words & spelling',types:['insert_letter','hidden_word','missing_word','move_letter','compound_words','make_word','complete_word']},
{id:'meaning',label:'Vocabulary & relationships',types:['odd_ones_out','closest_meaning','word_connections','opposite_meaning','same_meaning']},
{id:'codes',label:'Codes & letters',types:['letter_code','letters_for_numbers','letter_series','letter_connections','word_number_codes']},
{id:'logic',label:'Number & logic',types:['number_series','reading_information','complete_sum','related_numbers']}
];
var TYPES={
insert_letter:{n:1,label:'Insert a Letter',group:'words',description:'Use the same letter in two brackets to make four complete words.'},
odd_ones_out:{n:2,label:'Two Odd Ones Out',group:'meaning',description:'Find the two words that do not belong with the other three.'},
letter_code:{n:3,label:'Letter Codes',group:'codes',description:'Infer a letter-coding rule and apply it to another word.'},
closest_meaning:{n:4,label:'Closest Meaning',group:'meaning',description:'Choose the pair of words with the closest meanings.'},
hidden_word:{n:5,label:'Hidden Word',group:'words',description:'Find a four-letter word hidden across the join between neighbouring words.'},
missing_word:{n:6,label:'Restore the Missing Letters',group:'words',description:'Restore consecutive missing letters to complete a word.'},
letters_for_numbers:{n:7,label:'Letters for Numbers',group:'codes',description:'Use letter values to calculate an answer and give it as a letter.'},
move_letter:{n:8,label:'Move a Letter',group:'words',description:'Move one letter from one word to another so both become new words.'},
letter_series:{n:9,label:'Letter Series',group:'codes',description:'Continue a sequence of letter pairs.'},
word_connections:{n:10,label:'Word Connections',group:'meaning',description:'Complete a word analogy using the same relationship.'},
number_series:{n:11,label:'Number Series',group:'logic',description:'Continue a number sequence.'},
compound_words:{n:12,label:'Compound Words',group:'words',description:'Choose one word from each group to make a compound word.'},
make_word:{n:13,label:'Make a Word',group:'words',description:'Infer how parts of two words are combined to make a new word.'},
letter_connections:{n:14,label:'Letter Connections',group:'codes',description:'Apply the same relationship between pairs of letters.'},
reading_information:{n:15,label:'Reading Information',group:'logic',description:'Use a small set of facts to identify what must be true.'},
opposite_meaning:{n:16,label:'Opposite Meaning',group:'meaning',description:'Choose the pair of words with opposite meanings.'},
complete_sum:{n:17,label:'Complete the Sum',group:'logic',description:'Find the missing number that makes two expressions equal.'},
related_numbers:{n:18,label:'Related Numbers',group:'logic',description:'Infer the relationship in number groups and complete another.'},
word_number_codes:{n:19,label:'Word–Number Codes',group:'codes',description:'Match scrambled word codes, then encode the remaining word.'},
complete_word:{n:20,label:'Complete the Word',group:'words',description:'Infer which letters are extracted from each word.'},
same_meaning:{n:21,label:'Same Meaning / Common Link',group:'meaning',description:'Find one word that links all the clues by meaning.'}
};
var TYPE_IDS=Object.keys(TYPES);
function hashString(s){var h=2166136261>>>0;for(var i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){var a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function randInt(r,a,b){return Math.floor(r()*(b-a+1))+a;}
function choose(r,a){return a[Math.floor(r()*a.length)];}
function shuffle(r,a){var o=a.slice();for(var i=o.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),x=o[i];o[i]=o[j];o[j]=x;}return o;}
function unique(a){return Array.from(new Set(a));}
function cleanWord(w){return String(w||'').toUpperCase().replace(/[^A-Z]/g,'');}
function diff(d){return DIFFICULTIES.indexOf(d)>=0?d:'standard';}
function tier(d){return d==='easy'?0:d==='challenge'?2:1;}
function alpha(n){return String.fromCharCode(65+((n%26)+26)%26);}
function ai(c){return cleanWord(c).charCodeAt(0)-65;}
function makeQ(id,d,prompt,answer,extra){extra=extra||{};var t=TYPES[id],choices=Array.isArray(extra.choices)?extra.choices.map(String):null;return{typeId:id,typeNumber:t.n,typeLabel:t.label,difficulty:diff(d),prompt:String(prompt),answer:String(answer),answerText:String(extra.answerText==null?answer:extra.answerText),choices:choices,instruction:extra.instruction||'',explanation:extra.explanation||'',key:extra.key||[id,d,prompt,answer].join('|'),check:extra.check||null,footprint:extra.footprint||'M'};}

var EASY=('ABLE ACHE ACID ACORN ACTOR AFTER AGAIN AGENT AGREE AIR ALARM ALBUM ALERT ALIKE ALIVE ALONE AMBER ANGEL ANGRY ANKLE APPLE APRIL AREA ARGUE ARM ARROW ASH AUNT BABY BACK BADGE BAG BAKE BALL BAND BANK BARK BARN BASE BATH BEAN BEAR BEARD BED BEE BELL BELT BENCH BERRY BIRD BIRTH BLACK BLAME BLANK BLOCK BLUE BOARD BOAT BODY BONE BOOK BOOT BOWL BOX BRAIN BRANCH BREAD BRICK BRIDGE BRIGHT BROOM BROWN BRUSH BUILD BULL BUNCH BUS CAKE CALL CALM CAMP CARD CARE CART CAT CHAIR CHALK CHEEK CHEESE CHILD CHIN CLASS CLEAN CLEAR CLOCK CLOUD COACH COAT COLD COLOUR COOK CORN COW CRAB CREAM CROW CUP DAD DANCE DARK DAY DESK DOG DOOR DREAM DRINK DROP DRUM DUCK EAR EARTH EASY EGG ELBOW EMPTY EVEN EYE FACE FAIR FARM FAST FATHER FIELD FIRE FISH FLAG FLOOR FLOUR FLOWER FLY FOOD FOOT FOREST FORK FOX FRESH FRIEND FROG FRUIT GAME GARDEN GATE GIFT GLASS GLOBE GOAT GOLD GOOD GRAPE GRASS GREEN GREY GROUP GROW HAIR HAND HAPPY HAT HEAD HEART HEAVY HILL HOME HONEY HORSE HOT HOUSE HUNGRY ICE IDEA INK JAR JUICE JUMP KNEE KNIFE LAKE LAMB LAMP LARGE LATE LEAF LEARN LEG LEMON LIGHT LINE LION LIP LONG LUNCH MAIL MAP MARCH MILK MOON MOTHER MOUTH MUD MUM MUSIC NAIL NAN NECK NIGHT NOSE NOTE OCEAN OLD ONION ORANGE PAGE PAINT PAPER PARENT PARK PEACH PEAR PEN PENCIL PINK PIZZA PLANE PLANT PLATE PLAY POINT POND POOL QUICK QUIET RABBIT RAIN READ RED RICE RIVER ROAD ROBIN ROCK ROOM ROUND RULER SAD SALAD SALT SAND SCHOOL SEA SEAT SHEEP SHOE SHORT SILVER SISTER SKY SLOW SMALL SMART SNOW SOCK SOIL SON SPOON SPORT SPRING STAR STONE STOP STORY STORM STRONG SUGAR SUMMER SUN TABLE TALL TAME TEA TEACH TEAM TEETH TENT TEST THIN THUMB TIGER TIME TOAST TOE TONGUE TOOL TOOTH TOP TOWN TRAIN TREE TRUCK UNCLE WALL WARM WATER WEAK WHEEL WHITE WIDE WIND WINDOW WINTER WISE WOOD WORD WORLD WRIST WRITE YELLOW YOUNG').split(/\s+/);
var EXTRA=('ABSENT ACTIVE ADMIRE ADULT ADVICE ALLOW AMOUNT ANCIENT ANSWER APPEAR ARRIVE ARTIST AWAKE AWFUL BALANCE BASIC BEAUTY BEGIN BELOW BRAVE BREAK BROAD BROTHER BURST CARRY CENTRE CHANGE CHEER CHOICE CHOOSE CIRCLE CLEVER CLIMB CLOSE COAST COMBINE COMMON CORNER COUSIN CRATE CROWD DAILY DANGER DEEP DELIGHT DIFFERENT DIVIDE DOUBLE EARLY EQUAL EVENT EXACT FAMILY FAMOUS FANCY FINGER FINISH FOLLOW FREEZE FRONT GENTLE GIANT GRANNY GREAT GROUND GUESS HARD HARSH HEALTH HEIGHT HIDDEN HONEST INDIGO KIND LADDER LATER LENGTH LESSON LITTLE LOUD LUCKY MANGO MARKET MEAN MEDIAN MELON MONEY NARROW NEAR NEPHEW NIECE NUMBER OPPOSITE ORDER PASTA PEACE PLAIN POLITE PRIME PROUD PURPLE RANGE RAPID REPAIR RIGHT ROUGH SCALE SHAPE SHARP SHORE SIMPLE SOFT SPELL SQUARE START STILL SWEET SWIFT TABLE TIDY TINY TOTAL TOUGH TRUE VALUE VIOLET VOLUME WET WHOLE WIDTH WRONG').split(/\s+/);
var CHALLENGE=('ABUNDANT ACCURATE ADMIRABLE ANXIOUS APPROVE ARRANGE BENEFIT CAUTIOUS CERTAIN COMPLEX CONCLUDE CONSTANT COURAGE DECREASE DELICATE DEPART DESCRIBE EAGER ENORMOUS EXPAND FORTUNATE FREQUENT GENEROUS GLOOMY GRADUAL INCREASE INFERIOR MASSIVE MODEST OCCASIONAL ORDINARY PERMIT PRECISE PREVENT RARE RELUCTANT RESEMBLE SCARCE SEVERE SIGNIFICANT STURDY SUFFICIENT SUPERIOR TEMPORARY TIMID TRANQUIL VACANT VAST WEARY').split(/\s+/);
var WORDS=unique(EASY.concat(EXTRA,CHALLENGE)),WORD_SET=new Set(WORDS);
function wordPool(d){var t=tier(d),a=t===0?EASY:t===1?unique(EASY.concat(EXTRA)):WORDS;return a.filter(function(w){return t===0?w.length>=3&&w.length<=6:t===1?w.length>=3&&w.length<=7:w.length>=4&&w.length<=9;});}
function suitable(w,d){return tier(d)===0?w.length<=6:tier(d)===1?w.length<=7:w.length>=4;}

var CATEGORIES={
colours:'RED BLUE GREEN YELLOW ORANGE PURPLE PINK BROWN BLACK WHITE GREY SILVER GOLD'.split(' '),
animals:'CAT DOG HORSE SHEEP GOAT COW LION TIGER FOX RABBIT FROG DUCK ROBIN CROW'.split(' '),
fruit:'APPLE PEAR GRAPE LEMON PEACH BERRY MANGO'.split(' '),
school:'BOOK PENCIL RULER CHALK DESK PAPER CLASS SCHOOL TEACHER LESSON'.split(' '),
weather:'RAIN WIND SNOW STORM CLOUD SUN'.split(' '),
body:'HAND FOOT HEAD KNEE ELBOW WRIST ANKLE EAR EYE NOSE MOUTH TOOTH TONGUE'.split(' '),
transport:'BUS TRAIN TRUCK BOAT COACH'.split(' '),
home:'BED CHAIR TABLE DOOR WINDOW BROOM BOWL CUP'.split(' '),
nature:'TREE FLOWER GRASS RIVER LAKE OCEAN HILL FOREST STONE SAND'.split(' '),
food:'BREAD CHEESE RICE HONEY TOAST CAKE PASTA PIZZA SALAD SUGAR'.split(' '),
family:'MOTHER FATHER SISTER BROTHER AUNT UNCLE COUSIN NIECE NEPHEW PARENT'.split(' '),
time:'DAY NIGHT SPRING SUMMER WINTER APRIL MARCH'.split(' '),
places:'HOME SCHOOL PARK FARM GARDEN TOWN COAST'.split(' ')
};
var CATEGORY_LINK_LABELS={colours:'COLOUR',animals:'ANIMAL',fruit:'FRUIT',school:'SCHOOL',weather:'WEATHER',body:'BODY',transport:'TRANSPORT',home:'HOME',nature:'NATURE',food:'FOOD',family:'FAMILY',time:'TIME',places:'PLACE'};
var CATEGORY_CLUES={colours:'a colour',animals:'an animal',fruit:'a fruit',school:'something linked with school',weather:'a weather word',body:'a body part',transport:'a form of transport',home:'something found or used at home',nature:'a nature word',food:'a food word',family:'a family word',time:'a time or season word',places:'a place word'};

var SYN=[
'FAST QUICK RAPID SWIFT','SMART CLEVER WISE BRIGHT','BIG LARGE GIANT MASSIVE VAST ENORMOUS','SMALL TINY LITTLE',
'HAPPY GLAD CHEERFUL DELIGHTED','SAD GLOOMY UNHAPPY','CALM QUIET TRANQUIL PEACEFUL','BRAVE BOLD COURAGEOUS FEARLESS',
'BEGIN START COMMENCE','END FINISH CONCLUDE','TRUE CORRECT ACCURATE','WRONG FALSE INCORRECT','NEAR CLOSE CLOSEBY',
'EMPTY VACANT BARE','FAMOUS KNOWN NOTED','POLITE COURTEOUS GENTLE','ROUGH COARSE HARSH','GENTLE SOFT MILD',
'RARE SCARCE UNCOMMON','COMMON ORDINARY USUAL FREQUENT','ALLOW PERMIT APPROVE','STOP PREVENT HALT','EAGER KEEN WILLING',
'TIRED WEARY SLEEPY','PRECISE EXACT ACCURATE','ENOUGH SUFFICIENT AMPLE ABUNDANT','SHY TIMID QUIET','STURDY STRONG TOUGH',
'CHOOSE SELECT PICK','HELP AID ASSIST'
].map(function(s){return s.split(' ');});
var ANTONYMS=[
['HOT','COLD'],['OLD','YOUNG'],['TALL','SHORT'],['WIDE','NARROW'],['FAST','SLOW'],['HAPPY','SAD'],['LIGHT','HEAVY'],
['STRONG','WEAK'],['EARLY','LATE'],['FULL','EMPTY'],['OPEN','CLOSE'],['HARD','SOFT'],['ROUGH','SMOOTH'],['BRAVE','TIMID'],
['NEAR','FAR'],['LOUD','QUIET'],['WET','DRY'],['CLEAN','DIRTY'],['TRUE','FALSE'],['RIGHT','WRONG'],['BEGIN','FINISH'],
['ARRIVE','DEPART'],['INCREASE','DECREASE'],['ANCIENT','MODERN'],['SUPERIOR','INFERIOR'],['ABUNDANT','SCARCE'],
['SIMPLE','COMPLEX'],['FREQUENT','RARE'],['ACTIVE','IDLE'],['AWAKE','ASLEEP'],['KIND','HARSH'],['PROUD','MODEST'],
['UP','DOWN'],['IN','OUT'],['ABOVE','BELOW'],['BEFORE','AFTER'],['FIRST','LAST'],['MORE','LESS'],['HIGH','LOW'],
['DEEP','SHALLOW'],['THICK','THIN'],['RICH','POOR'],['GIVE','TAKE'],['BUY','SELL'],['PUSH','PULL'],['LOVE','HATE'],
['LAUGH','CRY'],['WIN','LOSE'],['SAFE','DANGEROUS'],['FRIEND','ENEMY'],['PRESENT','ABSENT'],['ACCEPT','REFUSE'],
['REMEMBER','FORGET'],['INCLUDE','EXCLUDE'],['CREATE','DESTROY'],['EXPAND','CONTRACT'],['GENEROUS','SELFISH'],
['CAUTIOUS','RECKLESS'],['PERMANENT','TEMPORARY'],['MAJOR','MINOR'],
['BIG','SMALL'],['LONG','SHORT'],['GOOD','BAD'],['OLD','NEW'],['LEFT','RIGHT'],['DAY','NIGHT'],['BLACK','WHITE'],
['START','STOP'],['LIGHT','DARK'],['SWEET','SOUR'],['HARD','EASY'],['ROUND','FLAT'],['SHARP','BLUNT'],['TIGHT','LOOSE'],
['FRONT','BACK'],['MANY','FEW'],['ALL','NONE'],['SAME','UNLIKE'],['PAST','FUTURE'],['RISE','FALL'],['COME','GO'],
['ARRIVE','LEAVE'],['BUILD','BREAK'],['JOIN','SPLIT'],['GAIN','LOSE'],['LIVE','DIE'],['ALIVE','DEAD'],['BEGIN','END'],
['UNDER','OVER'],['NORTH','SOUTH'],['EAST','WEST'],['YES','NO'],['SAFE','UNSAFE'],['KIND','CRUEL'],['POLITE','RUDE'],
['CALM','ANGRY'],['TAME','WILD'],['PROUD','HUMBLE'],['MODEST','VAIN'],['FOUND','LOST'],['INNER','OUTER'],['UPPER','LOWER'],
['ALWAYS','NEVER'],['OFTEN','RARELY'],['ENTER','LEAVE'],['REMEMBER','FORGET'],['INCLUDE','EXCLUDE'],['CREATE','DESTROY']
];
var RELATIONS=[
{name:'young animal',pairs:[['DOG','PUPPY'],['CAT','KITTEN'],['SHEEP','LAMB'],['COW','CALF'],['HORSE','FOAL']]},
{name:'home',pairs:[['BIRD','NEST'],['BEE','HIVE'],['HORSE','STABLE'],['DOG','KENNEL']]},
{name:'tool and action',pairs:[['KNIFE','CUT'],['PENCIL','WRITE'],['BRUSH','PAINT'],['BROOM','SWEEP']]},
{name:'part and whole',pairs:[['WHEEL','CAR'],['PAGE','BOOK'],['BRANCH','TREE'],['FINGER','HAND']]},
{name:'product and source',pairs:[['MILK','COW'],['HONEY','BEE'],['WOOL','SHEEP']]},
{name:'place',pairs:[['BOOK','LIBRARY'],['PLANE','AIRPORT'],['TRAIN','STATION'],['BOAT','HARBOUR']]},
{name:'opposite',pairs:ANTONYMS.slice(0,18)}
];
var COMPOUNDS=[
['RAIN','BOW'],['FOOT','BALL'],['SUN','FLOWER'],['TOOTH','BRUSH'],['CLASS','ROOM'],['BED','ROOM'],['NOTE','BOOK'],
['PLAY','GROUND'],['SCHOOL','BAG'],['SEA','SIDE'],['SNOW','MAN'],['BOOK','CASE'],['DOOR','BELL'],['FIRE','WORK'],
['HAND','BAG'],['HAIR','CUT'],['TEA','CUP'],['BUTTER','FLY'],['MOON','LIGHT'],['STAR','FISH'],['DAY','DREAM'],
['TIME','TABLE'],['HOUSE','WORK'],['HOME','WORK'],['NEWS','PAPER'],['TABLE','CLOTH'],['BATH','ROOM'],['AIR','PORT'],
['CAR','PARK'],['FARM','YARD'],['WHEEL','CHAIR'],['WATER','FALL'],['RAIN','COAT'],['PLAY','TIME'],['SUN','LIGHT'],
['NIGHT','LIGHT'],['FOOT','STEP'],['BOOK','MARK'],['CUP','CAKE'],['PAN','CAKE'],['JELLY','FISH'],['SEA','SHELL'],
['SAND','PIT'],['SAND','CASTLE'],['POST','BOX'],['MAIL','BOX'],['TOOTH','PASTE'],['BED','TIME'],['BIRTH','DAY'],
['WEEK','END'],['UP','STAIRS'],['DOWN','STAIRS'],['OUT','SIDE'],['IN','SIDE'],['EVERY','ONE'],['ANY','THING'],
['SOME','THING'],['NO','THING'],['RAIN','DROP'],['SNOW','BALL'],
['BACK','PACK'],['BATH','TUB'],['BED','SIDE'],['BLACK','BIRD'],['BLACK','BOARD'],['BLACK','BERRY'],['BLUE','BELL'],['BLUE','BERRY'],
['BOOK','SHELF'],['BOOK','SHOP'],['BOOK','WORM'],['BREAK','FAST'],['BUTTER','CUP'],['CARD','BOARD'],['CHEESE','CAKE'],
['CLASS','MATE'],['CLOCK','WORK'],['COAST','LINE'],['CORN','FIELD'],['COW','BOY'],['CUP','BOARD'],['DAY','LIGHT'],['DOOR','STEP'],
['DOOR','WAY'],['EAR','RING'],['EARTH','QUAKE'],['FARM','HOUSE'],['FIRE','PLACE'],['FIRE','FLY'],['FISH','CAKE'],['FISH','BOWL'],
['FOOT','PATH'],['FOOT','WEAR'],['GREEN','HOUSE'],['HAIR','BRUSH'],['HAND','SHAKE'],['HEAD','ACHE'],['HEAD','LIGHT'],['HORSE','BACK'],
['HOUSE','BOAT'],['ICE','BERG'],['JELLY','BEAN'],['KEY','BOARD'],['LAKE','SIDE'],['LIGHT','HOUSE'],['NEWS','PAPER'],['NOTE','BOOK'],
['PAN','CAKE'],['PLAY','MATE'],['RIVER','SIDE'],['ROAD','SIDE'],['SCHOOL','WORK'],['SEA','SHORE'],['SHOE','LACE'],['SHOP','KEEPER'],
['SNOW','FLAKE'],['SUN','RISE'],['SUN','SET'],['SUN','SHINE'],['TABLE','TOP'],['TEA','POT'],['TEA','SPOON'],['TREE','HOUSE'],
['WALL','PAPER'],['WATER','MELON'],['WATER','PROOF'],['WHEEL','BARROW'],['WIND','MILL'],['WORK','BOOK'],['WORK','PLACE'],['WRIST','WATCH'],
['AIR','LINE'],['AIR','PLANE'],['BIRD','HOUSE'],['BOOK','STORE'],['CAR','PORT'],['CROSS','ROAD'],['DOWN','HILL'],
['DRAGON','FLY'],['FARM','LAND'],['FIRE','SIDE'],['FOOT','PRINT'],['HAND','WRITING'],['HOME','SICK'],['LAND','MARK'],['LIFE','TIME'],
['MOON','BEAM'],['PLAY','HOUSE'],['RAIN','FALL'],['SEA','WEED'],['STAR','LIGHT'],['TOOTH','ACHE'],['WATER','WAY']
];
var COMPOUND_SET=new Set(COMPOUNDS.map(function(p){return p[0]+'+'+p[1];}));
var RESTORE=[
['BASKET','a container you can carry'],['MARKET','a place where things are sold'],['GARDEN','a place where plants grow'],
['PENCIL','something used for writing'],['SCHOOL','a place for learning'],['LESSON','a period of learning'],
['FLOWER','part of a plant'],['FOREST','a large area of trees'],['RIVER','flowing water'],['OCEAN','a very large area of sea'],
['SISTER','a female sibling'],['FATHER','a male parent'],['MOTHER','a female parent'],['PARENT','a mother or father'],
['FRIEND','someone you like and trust'],['NUMBER','a mathematical value'],['CIRCLE','a round shape'],['SQUARE','a four-sided shape'],
['ANSWER','a response to a question'],['PURPLE','a colour'],['YELLOW','a colour'],['ORANGE','a colour or a fruit'],
['SILVER','a metal or colour'],['WINTER','a cold season'],['SUMMER','a warm season'],['SPRING','the season after winter'],
['BRIDGE','a way across a river or road'],['BOTTLE','a container for liquid'],['BUTTON','a small fastener'],
['CARROT','an orange root vegetable'],['CHEESE','a food made from milk'],['BANANA','a long yellow fruit'],
['RABBIT','a small long-eared animal'],['TIGER','a striped big cat'],['WINDOW','an opening with glass'],
['JACKET','an item of clothing'],['POCKET','a small sewn-in pouch'],['ROCKET','a vehicle for space travel'],
['CLOCK','something that shows the time'],['TICKET','a pass for a journey or event'],['LETTER','a written message or alphabet symbol'],
['STREET','a road in a town'],['PEOPLE','more than one person'],['CASTLE','a fortified building'],
['CAMERA','something used to take photographs'],['PIRATE','a robber at sea'],['ISLAND','land surrounded by water'],
['DOCTOR','a medical professional'],['DENTIST','a person who looks after teeth']
].map(function(x){return{word:x[0],clue:x[1]};});
var restoreSeen=new Set(RESTORE.map(function(x){return x.word;}));
Object.keys(CATEGORIES).forEach(function(cat){
  (CATEGORIES[cat]||[]).forEach(function(word){
    if(word.length>=5&&word.length<=8&&!restoreSeen.has(word)){
      RESTORE.push({word:word,clue:CATEGORY_CLUES[cat]||('a '+cat+' word')});
      restoreSeen.add(word);
    }
  });
});
var LINKS=[
['EARTH','GLOBE PLANET SOIL MUD'],['QUICK','FAST RAPID SWIFT SPEEDY'],['SMART','CLEVER WISE BRIGHT SHARP'],
['LARGE','BIG GIANT MASSIVE VAST'],['SMALL','TINY LITTLE MINI SHORT'],['CALM','QUIET PEACEFUL TRANQUIL STILL'],
['BRAVE','BOLD FEARLESS COURAGEOUS HEROIC'],['BEGIN','START OPEN COMMENCE LAUNCH'],['FINISH','END CLOSE COMPLETE CONCLUDE'],
['TRUE','RIGHT CORRECT ACCURATE FACTUAL'],['EMPTY','VACANT BARE HOLLOW UNFILLED'],['RARE','SCARCE UNCOMMON INFREQUENT UNUSUAL'],
['ALLOW','PERMIT LET APPROVE ENABLE'],['CHOOSE','PICK SELECT DECIDE ELECT'],['HELP','AID ASSIST SUPPORT SERVE']
].map(function(x){return{answer:x[0],clues:x[1].split(' ')};});
var LINK_BANK=LINKS.slice();
Object.keys(CATEGORY_LINK_LABELS).forEach(function(cat){
  var clues=(CATEGORIES[cat]||[]).slice();
  if(clues.length>=4)LINK_BANK.push({answer:CATEGORY_LINK_LABELS[cat],clues:clues});
});
SYN.forEach(function(set){
  set.forEach(function(answer,idx){
    var clues=set.filter(function(_,i){return i!==idx;});
    if(clues.length>=2)LINK_BANK.push({answer:answer,clues:clues});
  });
});
LINK_BANK=Array.from(new Map(LINK_BANK.map(function(e){return[e.answer+'|'+e.clues.slice().sort().join(','),e];})).values());

function distract(r,n,blocked,d,len){var b=new Set(blocked||[]),p=shuffle(r,wordPool(d).filter(function(w){return !b.has(w)&&(!len||w.length===len);})),o=[];for(var i=0;i<p.length&&o.length<n;i++)if(o.indexOf(p[i])<0)o.push(p[i]);return o;}
var INSERT_CACHE=null;
function insertCandidates(){
  if(INSERT_CACHE)return INSERT_CACHE;
  var by={},out=[];
  WORDS.forEach(function(w){
    if(w.length<3||w.length>9)return;
    var end=w.slice(-1),start=w.charAt(0);
    (by[end]||(by[end]={left:[],right:[]})).left.push({frag:w.slice(0,-1),word:w});
    (by[start]||(by[start]={left:[],right:[]})).right.push({frag:w.slice(1),word:w});
  });
  Object.keys(by).forEach(function(letter){
    var box=by[letter],groups=[];
    (box.left||[]).forEach(function(l){(box.right||[]).forEach(function(r){
      if(l.word!==r.word&&l.frag.length>=2&&r.frag.length>=2)groups.push({left:l,right:r});
    });});
    for(var i=0;i<groups.length;i++)for(var j=i+1;j<groups.length;j++){
      var g1=groups[i],g2=groups[j],words=[g1.left.word,g1.right.word,g2.left.word,g2.right.word];
      if(new Set(words).size===4)out.push({letter:letter,g1:g1,g2:g2,words:words});
    }
  });
  INSERT_CACHE=out;return out;
}
function gen1(d,seed){
  var r=rngFromSeed(seed),p=insertCandidates().filter(function(x){return x.words.every(function(w){return suitable(w,d);});}),x=choose(r,p);
  if(!x)return null;
  var letters=shuffle(r,unique([x.letter,alpha(ai(x.letter)+1),alpha(ai(x.letter)-1),alpha(ai(x.letter)+2),alpha(ai(x.letter)-2)])).slice(0,d==='easy'?3:4);
  if(letters.indexOf(x.letter)<0)letters[0]=x.letter;
  var prompt='Which SAME letter fits both brackets to make FOUR words?  '+x.g1.left.frag+' (?) '+x.g1.right.frag+'    '+x.g2.left.frag+' (?) '+x.g2.right.frag;
  return makeQ('insert_letter',d,prompt,x.letter,{choices:shuffle(r,letters),key:'insert4:'+x.words.join(':')+':'+x.letter,explanation:'The letter '+x.letter+' makes '+x.words.join(', ')+'.',check:{kind:'insert4',letter:x.letter,left1:x.g1.left.frag,right1:x.g1.right.frag,left2:x.g2.left.frag,right2:x.g2.right.frag,words:x.words}});
}
function gen2(d,seed){
  var r=rngFromSeed(seed),names=d==='easy'?['colours','animals','fruit','body','transport','food']:d==='challenge'?['school','weather','home','nature','family','time','places'].concat(['colours','animals']):Object.keys(CATEGORIES);
  for(var tries=0;tries<80;tries++){
    var cat=choose(r,names),targetSet=new Set(CATEGORIES[cat]),m=shuffle(r,CATEGORIES[cat].filter(function(w){return suitable(w,d);})).slice(0,3);
    if(m.length<3)continue;
    var otherCats=shuffle(r,names.filter(function(x){return x!==cat;})),odd=[];
    for(var oi=0;oi<otherCats.length&&odd.length<2;oi++){
      var candidates=CATEGORIES[otherCats[oi]].filter(function(w){return !targetSet.has(w)&&odd.indexOf(w)<0&&suitable(w,d);});
      if(candidates.length)odd.push(choose(r,candidates));
    }
    if(odd.length<2)continue;
    var all=shuffle(r,m.concat(odd));
    return makeQ('odd_ones_out',d,'Which TWO words are the odd ones out?  '+all.join('   '),odd.slice().sort().join(' & '),{key:'odd:'+cat+':'+m.slice().sort().join(',')+':'+odd.slice().sort().join(','),explanation:m.join(', ')+' belong to one group ('+cat+'); '+odd.join(' and ')+' do not.',check:{kind:'set',answer:odd.slice().sort(),members:m,targetCategory:cat}});
  }
  return null;
}
function codeTransform(w,mode,a,b){var cs=cleanWord(w).split('');if(mode==='reverse_shift')cs.reverse();return cs.map(function(ch,i){var s=mode==='alternate'?(i%2===0?a:b):a;return alpha(ai(ch)+s);}).join('');}
function gen3(d,seed){
  var r=rngFromSeed(seed),p=wordPool(d).filter(function(w){return w.length>=4&&w.length<=6;}),ex=choose(r,p),target=choose(r,p.filter(function(w){return w!==ex;})),mode='shift',a=choose(r,[-3,-2,-1,1,2,3]),b=0;
  if(d==='standard'){mode='alternate';b=a>0?-1:1;}
  if(d==='challenge'){mode='reverse_shift';a=choose(r,[-3,-2,2,3]);}
  var coded=codeTransform(ex,mode,a,b),targetCode=codeTransform(target,mode,a,b);
  if(d==='easy'){
    var wrongCodes=unique([codeTransform(target,'shift',a+(a>0?1:-1),0),codeTransform(target,'shift',-a,0),target.split('').reverse().join('')]).filter(function(x){return x!==targetCode;});
    return makeQ('letter_code',d,'If '+ex+' is written as '+coded+', how is '+target+' written using the SAME code?',targetCode,{choices:shuffle(r,[targetCode].concat(wrongCodes.slice(0,3))),key:'lc-enc:'+mode+':'+a+':'+ex+':'+target,explanation:'Each letter moves by the same number of alphabet places.',check:{kind:'letter_code',word:target,mode:mode,a:a,b:b}});
  }
  var wordChoices=shuffle(r,[target].concat(distract(r,3,[ex,target],d,target.length)));
  return makeQ('letter_code',d,'If the code for '+ex+' is '+coded+', what does '+targetCode+' mean?',target,{choices:wordChoices,key:'lc-dec:'+mode+':'+a+':'+b+':'+ex+':'+target,explanation:d==='standard'?'Reverse the alternating shifts to decode the word.':'Undo the shift and reversal to recover the original word.',check:{kind:'letter_code_decode',code:targetCode,word:target,mode:mode,a:a,b:b}});
}
var SYNPAIRS=[];SYN.forEach(function(s){for(var i=0;i<s.length;i++)for(var j=i+1;j<s.length;j++)SYNPAIRS.push([s[i],s[j],s]);});
function synLinked(a,b){return SYN.some(function(set){return set.indexOf(a)>=0&&set.indexOf(b)>=0;});}
function gen4(d,seed){
  var r=rngFromSeed(seed),pairPool=SYNPAIRS.filter(function(x){return suitable(x[0],d)&&suitable(x[1],d);}),size=d==='easy'?2:d==='challenge'?4:3;
  for(var tries=0;tries<100;tries++){
    var pair=choose(r,pairPool),a=pair[0],b=pair[1],ga=[a],gb=[b],cands=shuffle(r,wordPool(d).filter(function(w){return w!==a&&w!==b;}));
    for(var i=0;i<cands.length&&ga.length<size;i++){var wa=cands[i];if(!synLinked(wa,b))ga.push(wa);}
    cands=shuffle(r,cands);
    for(var j=0;j<cands.length&&gb.length<size;j++){var wb=cands[j];if(gb.indexOf(wb)>=0||ga.some(function(x){return synLinked(x,wb);}))continue;gb.push(wb);}
    if(ga.length!==size||gb.length!==size)continue;
    ga=shuffle(r,ga);gb=shuffle(r,gb);
    var linked=[];ga.forEach(function(x){gb.forEach(function(y){if(synLinked(x,y))linked.push(x+'|'+y);});});
    if(linked.length!==1)continue;
    return makeQ('closest_meaning',d,'Choose one word from each group that are CLOSEST in meaning.  Group 1: '+ga.join(', ')+'   Group 2: '+gb.join(', '),a+' — '+b,{key:'syn-core:'+[a,b].sort().join(':'),explanation:a+' and '+b+' have closely related meanings.',check:{kind:'syn_pair',a:a,b:b,groupA:ga,groupB:gb}});
  }
  return null;
}
var HIDDEN_CACHE=null;
function hiddenCandidates(){
  if(HIDDEN_CACHE)return HIDDEN_CACHE;
  var byPair=new Map();
  for(var i=0;i<WORDS.length;i++){
    var l=WORDS[i];
    for(var j=0;j<WORDS.length;j++){
      var rr=WORDS[j];if(l===rr)continue;
      var targets=[];
      for(var k=1;k<=3;k++){var t=l.slice(-k)+rr.slice(0,4-k);if(t.length===4&&WORD_SET.has(t))targets.push({target:t,k:k});}
      targets=Array.from(new Map(targets.map(function(x){return[x.target,x];})).values());
      if(targets.length===1)byPair.set(l+'|'+rr,{left:l,right:rr,target:targets[0].target,k:targets[0].k});
    }
  }
  HIDDEN_CACHE=Array.from(byPair.values());return HIDDEN_CACHE;
}
function hiddenJoinTargets(left,right){var out=[];for(var k=1;k<=3;k++){var t=left.slice(-k)+right.slice(0,4-k);if(t.length===4&&WORD_SET.has(t))out.push(t);}return unique(out);}
function gen5(d,seed){
  var r=rngFromSeed(seed),p=hiddenCandidates().filter(function(x){return suitable(x.left,d)&&suitable(x.right,d);}),x=choose(r,p);if(!x)return null;
  var row=[x.left,x.right],wanted=d==='easy'?4:d==='standard'?5:6,pool=shuffle(r,wordPool(d)),guard=0;
  while(row.length<wanted&&guard++<500){
    var w=choose(r,pool);if(row.indexOf(w)>=0)continue;
    if(r()<.5){if(hiddenJoinTargets(w,row[0]).length===0)row.unshift(w);}
    else if(hiddenJoinTargets(row[row.length-1],w).length===0)row.push(w);
  }
  if(row.length<wanted)return null;
  var hits=[];for(var i=0;i<row.length-1;i++){var ts=hiddenJoinTargets(row[i],row[i+1]);if(ts.length)hits.push({i:i,targets:ts});}
  if(hits.length!==1||hits[0].targets.length!==1||hits[0].targets[0]!==x.target)return gen5(d,seed+':retry');
  var answer=x.left+' '+x.right,choices=shuffle(r,Array.from({length:row.length-1},function(_,i){return row[i]+' '+row[i+1];}));
  return makeQ('hidden_word',d,'A FOUR-letter word is hidden across one join in this row. Which neighbouring pair contains it?  '+row.join('   '),answer,{choices:choices,answerText:answer+' → '+x.target,key:'hiddenrow:'+row.join(':')+':'+x.target,explanation:x.left+' + '+x.right+' hides '+x.target+' across the join.',check:{kind:'hidden_row',row:row,pair:[x.left,x.right],target:x.target}});
}
var SHORT3=new Set(('THE HER GET EAT EAR ART CAR ASK ANT AND ONE PEN SON FOR WIN DEN BUT SUM LET BET SET END TEA ATE MAN RAN SIT LOW ALL ARE DAY RED SEA SUN AIR ARM BAG BED BEE BUS CAT COW CUP DAD DOG EGG EYE FLY FOX HAT HOT ICE INK JAR LEG LIP MAP MUD MUM NAN OLD SAD SKY TOE TOP WET').split(' '));
var MISSING_WORD_BANK=unique(WORDS.concat(('FATHER MOTHER BROTHER ANOTHER GATHERED TOGETHER WEATHER FEATHER LEATHER HEART HEARD LEARN BEARD EARTH SEARCH CLEAR NEARBY FEARFUL START SMART PARTY ARTIST STARTED SMARTER CARPET CARTON CARROT CARRY BASKET MASKED TASKED ASKED PLANT GIANT CHANT WANTED PLANTED GRANTED HANDLE CANDLE SANDAL RANDOM PANDA GRAND BRAND STAND BLAND STONE MONEY HONEY ALONE CLONE PHONE LONELY PENCIL PENNY LESSON PERSON SEASON FOREST FORGET FORMAL BEFORE INFORM WINDOW WINTER WINNER SWING TWINS GARDEN SUDDEN HIDDEN DENTAL DENTIST BUTTON BUTTER SUMMER LETTER BETTER SETTER FRIEND BLEND TREND SPEND STEAM TEAPOT TEACHER TREAT GREAT CHEAT WHEAT WATER LATER CATER HATER PLATE CRATE STATE SKATE SLATE CREATE ISLAND HUMAN WOMAN MANNER MANAGE MANTLE ELEPHANT IMPORTANT PRESENT ABSENT REMEMBER FORGOTTEN INCLUDE EXCLUDE CONTRACT EXPAND GENEROUS CAUTIOUS TEMPORARY EARTHEN LEARNING TEACHING READING WRITING HEARING SEARCHING STARTER ARTWORK CARTOON BARGAIN GARDENER FARMER MARKETPLACE BEDROOM BATHROOM CLASSROOM PLAYGROUND FOOTBALL HANDBAG RAINCOAT SUNLIGHT MOONLIGHT NOTEBOOK NEWSPAPER').split(' ')));
var MISSING_CACHE=null;
function missingClassicCandidates(){
  if(MISSING_CACHE)return MISSING_CACHE;
  var set=new Set(MISSING_WORD_BANK),raw=[];
  MISSING_WORD_BANK.forEach(function(word){for(var start=0;start<=word.length-3;start++){var removed=word.slice(start,start+3);if(!SHORT3.has(removed))continue;var damaged=word.slice(0,start)+word.slice(start+3);if(damaged.length<2)continue;raw.push({word:word,start:start,removed:removed,damaged:damaged});}});
  var out=[];
  raw.forEach(function(candidate){
    var solutions=new Map();
    SHORT3.forEach(function(chunk){for(var pos=0;pos<=candidate.damaged.length;pos++){var made=candidate.damaged.slice(0,pos)+chunk+candidate.damaged.slice(pos);if(set.has(made))solutions.set(made+'|'+chunk,{word:made,removed:chunk,pos:pos});}});
    if(solutions.size===1){var only=Array.from(solutions.values())[0];if(only.word===candidate.word&&only.removed===candidate.removed)out.push(candidate);}
  });
  MISSING_CACHE=out;return out;
}
function gen6(d,seed){
  var r=rngFromSeed(seed),p=missingClassicCandidates().filter(function(x){return d==='easy'?x.word.length<=6:d==='standard'?x.word.length<=8:x.word.length>=6;}),x=choose(r,p);if(!x)return null;
  var pool=shuffle(r,Array.from(SHORT3).filter(function(w){return w!==x.removed;})),choiceCount=d==='easy'?3:4,opts=shuffle(r,[x.removed].concat(pool.slice(0,choiceCount-1)));
  return makeQ('missing_word',d,'The damaged word '+x.damaged+' has had THREE consecutive letters removed. Those three letters make a word themselves. Which word was removed?',x.removed,{choices:opts,answerText:x.removed+' → '+x.word,key:'missingclassic:'+x.word+':'+x.start+':'+x.removed,explanation:'Insert '+x.removed+' to restore '+x.word+'.',check:{kind:'missing_classic',word:x.word,damaged:x.damaged,start:x.start,removed:x.removed}});
}
function gen7(d,seed){
  var r=rngFromSeed(seed),count=d==='easy'?5:d==='standard'?6:7,letters=shuffle(r,'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')).slice(0,count),values={},avail=shuffle(r,Array.from({length:d==='challenge'?30:20},function(_,i){return i+1;}));letters.forEach(function(l,i){values[l]=avail[i];});
  var termCount=d==='easy'?2:d==='standard'?3:4;
  for(var tries=0;tries<140;tries++){
    var terms=shuffle(r,letters).slice(0,termCount),ops=[];
    for(var oi=0;oi<termCount-1;oi++)ops.push(d==='easy'?'+':(r()<.5?'+':'−'));
    var num=values[terms[0]],expression=terms[0];
    for(var j=0;j<ops.length;j++){num=ops[j]==='+'?num+values[terms[j+1]]:num-values[terms[j+1]];expression+=' '+ops[j]+' '+terms[j+1];}
    var ans=letters.find(function(l){return values[l]===num;});
    if(!ans)continue;
    var opts=shuffle(r,[ans].concat(shuffle(r,letters.filter(function(x){return x!==ans;})).slice(0,3))),map=letters.map(function(l){return l+'='+values[l];}).join(', ');
    return makeQ('letters_for_numbers',d,'Use these values: '+map+'.  What is '+expression+'? Give the answer as a LETTER.',ans,{choices:opts,key:'ln2:'+map+':'+expression,explanation:expression+' = '+String(num)+', and '+ans+' = '+String(num)+'.',check:{kind:'letter_number_expr',values:values,terms:terms,ops:ops}});
  }
  return null;
}
var MOVE_CACHE=null;
function moveCandidates(){if(MOVE_CACHE)return MOVE_CACHE;var out=[],seen=new Set(),words=WORDS.filter(function(w){return w.length>=3&&w.length<=7;}),rec={};words.forEach(function(b){for(var pos=0;pos<=b.length;pos++)for(var k=0;k<26;k++){var letter=alpha(k),nb=b.slice(0,pos)+letter+b.slice(pos);if(WORD_SET.has(nb)&&nb!==b)(rec[letter]||(rec[letter]=[])).push({before:b,after:nb,pos:pos});}});words.forEach(function(a){for(var i=0;i<a.length;i++){var letter=a[i],na=a.slice(0,i)+a.slice(i+1);if(!WORD_SET.has(na))continue;(rec[letter]||[]).forEach(function(b){if(b.before===a||b.after===a||b.before===na)return;var key=[a,b.before,na,b.after,letter].join('|');if(!seen.has(key)){seen.add(key);out.push({a:a,b:b.before,na:na,nb:b.after,letter:letter,index:i,pos:b.pos});}});}});MOVE_CACHE=out;return out;}
function uniqueMoveCandidates(){
  var grouped=new Map();
  moveCandidates().forEach(function(x){var k=x.a+'|'+x.b,arr=grouped.get(k)||[];arr.push(x);grouped.set(k,arr);});
  var out=[];
  grouped.forEach(function(arr){
    var answers=Array.from(new Map(arr.map(function(x){return[x.letter+'|'+x.na+'|'+x.nb,x];})).values());
    if(answers.length===1)out.push(answers[0]);
  });
  return out;
}
function gen8(d,seed){
  var r=rngFromSeed(seed),max=d==='easy'?5:d==='standard'?6:7,p=uniqueMoveCandidates().filter(function(x){return x.a.length<=max&&x.b.length<=max;}),x=choose(r,p);
  if(!x)return null;
  var opts=shuffle(r,unique([x.letter,alpha(ai(x.letter)+1),alpha(ai(x.letter)-1),alpha(ai(x.letter)+2)])).slice(0,4);if(opts.indexOf(x.letter)<0)opts[0]=x.letter;
  return makeQ('move_letter',d,'One letter can be moved from '+x.a+' to '+x.b+' to make TWO new words. The other letters stay in order. Which letter moves?',x.letter,{choices:opts,answerText:x.letter+' ('+x.na+' + '+x.nb+')',key:'move:'+x.a+':'+x.b+':'+x.letter+':'+x.na+':'+x.nb,explanation:'Move '+x.letter+': '+x.a+' → '+x.na+', and '+x.b+' → '+x.nb+'.',check:{kind:'move',a:x.a,b:x.b,na:x.na,nb:x.nb,letter:x.letter,index:x.index,pos:x.pos}});
}
function lsv(mode,i,a,b){if(mode==='opposite')return[alpha(a+i),alpha(b-i)];if(mode==='step2')return[alpha(a+2*i),alpha(b-2*i)];if(mode==='alternate')return[alpha(a+i+(i%2)),alpha(b-i-(i%2))];return[alpha(a+i),alpha(b+2*i)];}
function gen9(d,seed){var r=rngFromSeed(seed),mode=d==='easy'?'opposite':d==='standard'?choose(r,['opposite','step2']):choose(r,['alternate','mixed']),a=randInt(r,0,mode==='step2'?10:12),b=randInt(r,mode==='step2'?10:13,25),shown=[];for(var i=0;i<4;i++)shown.push(lsv(mode,i,a,b).join(''));var ans=lsv(mode,4,a,b).join(''),opts=shuffle(r,unique([ans,lsv(mode,3,a,b).join(''),lsv('opposite',4,a,b).join(''),lsv('step2',4,a,b).join('')])).slice(0,4);if(opts.indexOf(ans)<0)opts[0]=ans;return makeQ('letter_series',d,'What comes next?  '+shown.join('   ')+'   ?',ans,{choices:opts,key:'ls:'+mode+':'+a+':'+b,explanation:'Continue the same movement through the alphabet in each position.',check:{kind:'letter_series',mode:mode,a:a,b:b,index:4}});}
function gen10(d,seed){
  var r=rngFromSeed(seed),rel=choose(r,RELATIONS.filter(function(x){return x.pairs.length>=2;})),ps=shuffle(r,rel.pairs),p1=ps[0],p2=ps[1],dir=r()<.5?0:1,a=p1[dir],b=p1[1-dir],c=p2[dir],ans=p2[1-dir],groupSize=d==='easy'?2:d==='challenge'?4:3;
  var d1=distract(r,10,[a,b,c,ans],d).filter(function(w){return w!==b;}).slice(0,groupSize-1),d2=distract(r,14,[a,b,c,ans].concat(d1),d).filter(function(w){return w!==ans;}).slice(0,groupSize-1);
  var g1=shuffle(r,[b].concat(d1)),g2=shuffle(r,[ans].concat(d2));
  return makeQ('word_connections',d,a+' is to ('+g1.join(', ')+') as '+c+' is to ('+g2.join(', ')+'). Choose ONE word from each group.',b+' — '+ans,{key:'ana-core:'+rel.name+':'+a+':'+b+':'+c+':'+ans,explanation:b+' and '+ans+' complete the same relationship: '+rel.name+'.',check:{kind:'analogy_pair',relation:rel.name,a:a,b:b,c:c,answer:ans,group1:g1,group2:g2}});
}
function ns(mode,start,step,i){var v=start,k;if(mode==='add')return start+step*i;if(mode==='double')return start*Math.pow(2,i);if(mode==='alternate'){for(k=0;k<i;k++)v+=k%2===0?step:step+2;return v;}if(mode==='growing'){for(k=1;k<=i;k++)v+=step*k;return v;}if(mode==='muladd'){for(k=0;k<i;k++)v=v*2+step;return v;}return v;}
function gen11(d,seed){var r=rngFromSeed(seed),mode=d==='easy'?choose(r,['add','double']):d==='standard'?choose(r,['add','alternate','growing']):choose(r,['alternate','growing','muladd']),start=randInt(r,1,d==='easy'?18:d==='standard'?16:14),step=randInt(r,2,d==='easy'?9:d==='standard'?8:7),seq=Array.from({length:5},function(_,i){return ns(mode,start,step,i);}),ans=ns(mode,start,step,5),opts=shuffle(r,unique([ans,ans+step,Math.max(0,ans-step),ans+2])).map(String).slice(0,4),contentStep=mode==='double'?0:step;return makeQ('number_series',d,'What number comes next?  '+seq.join(', ')+', ...',ans,{choices:opts,key:'ns:'+mode+':'+start+':'+contentStep,explanation:'Continue the same number rule.',check:{kind:'number_series',mode:mode,start:start,step:step,index:5}});}
function gen12(d,seed){
  var r=rngFromSeed(seed),target=choose(r,COMPOUNDS),size=d==='easy'?2:d==='challenge'?4:3,left=[target[0]],right=[target[1]],al=unique(COMPOUNDS.map(function(x){return x[0];})).filter(function(x){return x!==target[0];}),ar=unique(COMPOUNDS.map(function(x){return x[1];})).filter(function(x){return x!==target[1];}),guard=0,x;
  while(left.length<size&&guard++<300){x=choose(r,al);if(left.indexOf(x)>=0)continue;if(right.some(function(z){return COMPOUND_SET.has(x+'+'+z);}))continue;left.push(x);}
  guard=0;while(right.length<size&&guard++<300){x=choose(r,ar);if(right.indexOf(x)>=0)continue;if(left.some(function(z){return COMPOUND_SET.has(z+'+'+x);}))continue;right.push(x);}
  if(left.length!==size||right.length!==size)return gen12(d,seed+':retry');
  var la=shuffle(r,left),ra=shuffle(r,right),valid=[];la.forEach(function(l){ra.forEach(function(rrr){if(COMPOUND_SET.has(l+'+'+rrr))valid.push(l+'|'+rrr);});});if(valid.length!==1)return gen12(d,seed+':retry2');
  return makeQ('compound_words',d,'Choose one word from each group to make ONE compound word.  Group 1: '+la.join(', ')+'   Group 2: '+ra.join(', '),target[0]+' + '+target[1],{answerText:target[0]+target[1],key:'comp-core:'+target.join('+'),explanation:target[0]+' + '+target[1]+' = '+target[0]+target[1]+'.',check:{kind:'compound_unique',left:target[0],right:target[1],groupA:la,groupB:ra}});
}
var MP=[{id:'f2l2',label:'first 2 letters of the first word + last 2 of the second',fn:function(a,b){return a.slice(0,2)+b.slice(-2);}},{id:'l2f2',label:'last 2 + first 2',fn:function(a,b){return a.slice(-2)+b.slice(0,2);}},{id:'f1l3',label:'first 1 + last 3',fn:function(a,b){return a.slice(0,1)+b.slice(-3);}},{id:'f3l1',label:'first 3 + last 1',fn:function(a,b){return a.slice(0,3)+b.slice(-1);}}],MW_CACHE=null;
function mwc(){if(MW_CACHE)return MW_CACHE;var out=[];MP.forEach(function(p){WORDS.forEach(function(a){WORDS.forEach(function(b){if(a===b||a.length<4||b.length<4)return;var z=p.fn(a,b);if(WORD_SET.has(z)&&z!==a&&z!==b)out.push({p:p,a:a,b:b,result:z});});});});MW_CACHE=out;return out;}
function gen13(d,seed){
  var r=rngFromSeed(seed),allowed=d==='easy'?['f2l2']:d==='standard'?['f2l2','l2f2']:MP.map(function(x){return x.id;}),pool=shuffle(r,mwc().filter(function(x){return allowed.indexOf(x.p.id)>=0;})),ex1=pool[0],ex2=pool.find(function(x){return ex1&&x.p.id===ex1.p.id&&x.result!==ex1.result&&x.a!==ex1.a&&x.b!==ex1.b;}),tar=pool.find(function(x){return ex1&&ex2&&x.p.id===ex1.p.id&&x.result!==ex1.result&&x.result!==ex2.result&&x.a!==ex1.a&&x.a!==ex2.a&&x.b!==ex1.b&&x.b!==ex2.b;});
  if(!ex1||!ex2||!tar)return null;
  var prompt='Complete the third group in the SAME way:  '+ex1.a+' ('+ex1.result+') '+ex1.b+'    '+ex2.a+' ('+ex2.result+') '+ex2.b+'    '+tar.a+' (?) '+tar.b;
  return makeQ('make_word',d,prompt,tar.result,{choices:shuffle(r,[tar.result].concat(distract(r,3,[tar.result],d,tar.result.length))),key:'mw2:'+ex1.p.id+':'+ex1.a+':'+ex1.b+':'+ex2.a+':'+ex2.b+':'+tar.a+':'+tar.b,explanation:'Each middle word uses the '+ex1.p.label+'.',check:{kind:'make_word',pattern:ex1.p.id,a:tar.a,b:tar.b}});
}
function gen14(d,seed){
  var r=rngFromSeed(seed),s1=randInt(r,1,d==='easy'?3:4),s2=d==='easy'?s1:(d==='standard'?randInt(r,1,4):-randInt(r,1,4)),b1=randInt(r,0,14),b2=d==='challenge'?randInt(r,8,20):randInt(r,4,16),rows=[];
  for(var i=0;i<3;i++)rows.push(alpha(b1+i)+alpha(b2+i)+' → '+alpha(b1+i+s1)+alpha(b2+i+s2));
  var ans=alpha(b1+3+s1)+alpha(b2+3+s2),opts=shuffle(r,unique([ans,alpha(b1+4+s1)+alpha(b2+3+s2),alpha(b1+3+s1)+alpha(b2+4+s2),alpha(b1+3-s1)+alpha(b2+3-s2)])).slice(0,4);
  return makeQ('letter_connections',d,'Apply the same letter relationship:  '+rows.join('   ')+'   '+alpha(b1+3)+alpha(b2+3)+' → ?',ans,{choices:opts,key:'lcon2:'+s1+':'+s2+':'+b1+':'+b2,explanation:d==='easy'?'Both letters move forward by the same amount.':d==='standard'?'The two positions use their own forward shifts.':'The first letter moves forward while the second moves backward.',check:{kind:'letter_connections',s1:s1,s2:s2,b1:b1+3,b2:b2+3}});
}
var NAMES='ALEX BEN CHLOE DAN EMMA FINN GRACE HARRY ISLA JACK LILY MAYA NOAH OLIVIA'.split(' ');
function clockFrom(startHour,startMinute,add){var total=startHour*60+startMinute+add,h=Math.floor(total/60)%24,m=total%60;return String(h)+':'+String(m).padStart(2,'0');}
function gen15(d,seed){
  var r=rngFromSeed(seed),n=d==='easy'?3:d==='standard'?4:5,names=shuffle(r,NAMES).slice(0,n),v=randInt(r,12,25),order=[];
  for(var i=0;i<n;i++){if(i)v+=randInt(r,3,8);order.push({name:names[i],value:v});}
  var facts=[order[0].name+' takes '+order[0].value+' minutes.'];for(i=1;i<n;i++)facts.push(order[i].name+' takes '+(order[i].value-order[i-1].value)+' minutes longer than '+order[i-1].name+'.');
  if(d==='easy'){
    var truth=order[n-1].name+' takes the longest.',falseS=[order[0].name+' takes the longest.',order[1].name+' takes less time than '+order[0].name+'.',order[0].name+' and '+order[1].name+' take the same time.'];
    return makeQ('reading_information',d,'Read the facts, then choose the statement that MUST be true.  '+facts.join(' '),truth,{choices:shuffle(r,[truth].concat(falseS)),key:'ri-e:'+order.map(function(x){return x.name+'='+x.value;}).join(','),explanation:'The times increase through the chain, so '+order[n-1].name+' takes the longest.',check:{kind:'reading_expected',expected:truth}});
  }
  if(d==='standard'){
    var hi=randInt(r,1,n-1),lo=randInt(r,0,hi-1),ans=order[hi].value-order[lo].value,opts=shuffle(r,unique([ans,ans+3,Math.max(1,ans-3),ans+5])).map(String).slice(0,4);
    return makeQ('reading_information',d,'Read the facts.  '+facts.join(' ')+'  How many minutes longer does '+order[hi].name+' take than '+order[lo].name+'?',ans,{choices:opts,key:'ri-s:'+order.map(function(x){return x.name+'='+x.value;}).join(',')+':'+hi+':'+lo,explanation:order[hi].value+' − '+order[lo].value+' = '+ans+' minutes.',check:{kind:'reading_expected',expected:String(ans)}});
  }
  var sh=7,sm=30,who=choose(r,order.slice(1)),arrival=clockFrom(sh,sm,who.value),wrong=unique([clockFrom(sh,sm,who.value+5),clockFrom(sh,sm,Math.max(0,who.value-5)),clockFrom(sh,sm,who.value+10)]).filter(function(x){return x!==arrival;});
  return makeQ('reading_information',d,'Everyone leaves home at 7:30. '+facts.join(' ')+'  What time does '+who.name+' arrive?',arrival,{choices:shuffle(r,[arrival].concat(wrong.slice(0,3))),key:'ri-c:'+order.map(function(x){return x.name+'='+x.value;}).join(',')+':'+who.name,explanation:who.name+' travels for '+who.value+' minutes after 7:30, arriving at '+arrival+'.',check:{kind:'reading_expected',expected:arrival}});
}
function antLinked(a,b){return ANTONYMS.some(function(p){return(p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a);});}
function gen16(d,seed){
  var r=rngFromSeed(seed),pool=ANTONYMS.filter(function(x){return suitable(x[0],d)&&suitable(x[1],d);}),size=d==='easy'?2:d==='challenge'?4:3;
  for(var tries=0;tries<100;tries++){
    var p=choose(r,pool),a=p[0],b=p[1],ga=[a],gb=[b],cands=shuffle(r,wordPool(d).filter(function(w){return w!==a&&w!==b;}));
    for(var i=0;i<cands.length&&ga.length<size;i++)if(!antLinked(cands[i],b))ga.push(cands[i]);
    cands=shuffle(r,cands);
    for(var j=0;j<cands.length&&gb.length<size;j++){var w=cands[j];if(gb.indexOf(w)>=0||ga.some(function(x){return antLinked(x,w);}))continue;gb.push(w);}
    if(ga.length!==size||gb.length!==size)continue;ga=shuffle(r,ga);gb=shuffle(r,gb);
    var pairs=0;ga.forEach(function(x){gb.forEach(function(y){if(antLinked(x,y))pairs++;});});if(pairs!==1)continue;
    return makeQ('opposite_meaning',d,'Choose one word from each group that are most OPPOSITE in meaning.  Group 1: '+ga.join(', ')+'   Group 2: '+gb.join(', '),a+' — '+b,{key:'ant-core:'+[a,b].sort().join(':'),explanation:a+' and '+b+' are opposites.',check:{kind:'ant_pair',a:a,b:b,groupA:ga,groupB:gb}});
  }
  return null;
}
function gen17(d,seed){var r=rngFromSeed(seed),max=d==='easy'?20:d==='standard'?60:150,a=randInt(r,2,max),b=randInt(r,2,max),c=randInt(r,2,max),ans,p;if(d==='challenge'&&r()<.45){var k=randInt(r,2,8),left=a*k,c2=randInt(r,1,k-1);ans=left-c2;p=a+' × '+k+' = '+c2+' + ?';}else{ans=a+b-c;if(ans<0)return gen17(d,seed+':r');p=a+' + '+b+' = '+c+' + ?';}return makeQ('complete_sum',d,'Complete the sum:  '+p,ans,{choices:shuffle(r,unique([ans,ans+1,Math.max(0,ans-1),ans+(d==='challenge'?5:2)])).map(String),key:'sum:'+p,explanation:'Both sides must have the same value.',check:{kind:'sum',answer:ans}});}
function rr(mode,a,b){if(mode==='sum')return a+b;if(mode==='difference')return Math.abs(a-b);if(mode==='double_sum')return 2*a+b;if(mode==='product')return a*b;return a+b;}
function gen18(d,seed){
  var r=rngFromSeed(seed),modes=d==='easy'?['sum']:d==='standard'?['sum','difference','double_sum']:['difference','double_sum','product'];
  for(var tries=0;tries<100;tries++){
    var mode=choose(r,modes),lim=mode==='product'?9:(d==='challenge'?30:18),pairs=Array.from({length:4},function(){return[randInt(r,2,lim),randInt(r,2,lim)];}),examples=pairs.slice(0,3),matching=modes.filter(function(test){return examples.every(function(x){return rr(test,x[0],x[1])===rr(mode,x[0],x[1]);});});
    if(matching.length!==1)continue;
    var ex=examples.map(function(x){return x[0]+', '+x[1]+', '+rr(mode,x[0],x[1]);}),last=pairs[3],ans=rr(mode,last[0],last[1]);
    return makeQ('related_numbers',d,'Each group follows the same rule:  ('+ex.join(')   (')+')   ('+last[0]+', '+last[1]+', ?).  What is missing?',ans,{choices:shuffle(r,unique([ans,last[0]+last[1],Math.abs(last[0]-last[1]),last[0]*last[1],ans+2])).map(String).slice(0,4),key:'rn2:'+mode+':'+pairs.flat().join(','),explanation:'Apply the same '+mode.replace('_',' ')+' rule.',check:{kind:'related_unique',mode:mode,a:last[0],b:last[1],examples:examples,modes:modes}});
  }
  return null;
}
function perms3(){return[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];}
function codeAssignmentValid(words,codes,perm){
  var l2d={},d2l={};
  for(var i=0;i<3;i++){var w=words[i],code=codes[perm[i]];if(!code||w.length!==code.length)return false;for(var j=0;j<w.length;j++){var l=w[j],d=code[j];if(l2d[l]&&l2d[l]!==d)return false;if(d2l[d]&&d2l[d]!==l)return false;l2d[l]=d;d2l[d]=l;}}
  return l2d;
}
function gen19(d,seed){
  var r=rngFromSeed(seed),len=d==='challenge'?5:4,pool=wordPool(d).filter(function(w){return w.length===len;}),maxChoices=d==='easy'?3:4;
  for(var tries=0;tries<220;tries++){
    var target=choose(r,pool),need=new Set(target.split('')),clues=shuffle(r,pool.filter(function(w){return w!==target&&w.split('').some(function(ch){return need.has(ch);});})).slice(0,3);
    if(clues.length<3)continue;
    var covered=new Set(clues.join('').split('')),allCovered=true;need.forEach(function(ch){if(!covered.has(ch))allCovered=false;});if(!allCovered)continue;
    var letters=unique(clues.concat([target]).join('').split(''));if(letters.length>10)continue;
    var digits=shuffle(r,'0123456789'.split('')).slice(0,letters.length),map={};letters.forEach(function(l,i){map[l]=digits[i];});
    var enc=function(w){return w.split('').map(function(ch){return map[ch];}).join('');},codes=clues.map(enc),scrambled=shuffle(r,codes),valid=perms3().map(function(p){return codeAssignmentValid(clues,scrambled,p);}).filter(Boolean);
    if(valid.length!==1)continue;
    var ans=enc(target),wrong=unique([ans.split('').reverse().join(''),enc(target.slice(1)+target[0]),ans.slice(1)+ans[0],String((Number(ans)+11)%Math.pow(10,len)).padStart(len,'0')]).filter(function(x){return x!==ans;}).slice(0,maxChoices-1),prompt;
    if(d==='easy'){
      var known=enc(clues[0]),restCodes=codes.filter(function(x){return x!==known;});
      prompt='Each letter always has the same digit. One match is given: '+clues[0]+' = '+known+'. The remaining words are '+clues[1]+', '+clues[2]+' and their codes are '+shuffle(r,restCodes).join(', ')+'. What is the code for '+target+'?';
    }else{
      prompt='The codes are NOT in the same order as the words. Words: '+clues.join(', ')+'. Codes: '+scrambled.join(', ')+'. Work out the matches, then find the code for '+target+'.';
    }
    return makeQ('word_number_codes',d,prompt,ans,{choices:shuffle(r,[ans].concat(wrong)),key:'wn2:'+letters.map(function(l){return l+map[l];}).join('')+':'+clues.join(':')+':'+target,explanation:'Match the three coded words consistently, then use the recovered letter-to-digit mapping for '+target+'.',check:{kind:'wn_scrambled',map:map,target:target,clues:clues,codes:scrambled}});
  }
  return null;
}
var EP=[{id:'first3',label:'first three letters',fn:function(w){return w.slice(0,3);}},{id:'last3',label:'last three letters',fn:function(w){return w.slice(-3);}},{id:'124',label:'1st, 2nd and 4th letters',fn:function(w){return w[0]+w[1]+w[3];}},{id:'l23',label:'last, 2nd and 3rd letters',fn:function(w){return w.slice(-1)+w[1]+w[2];}}],CW_CACHE=null;
function cwc(){if(CW_CACHE)return CW_CACHE;var o=[];EP.forEach(function(p){WORDS.forEach(function(w){if(w.length<4)return;var z=p.fn(w);if(WORD_SET.has(z))o.push({p:p,w:w,result:z});});});CW_CACHE=o;return o;}
function gen20(d,seed){var r=rngFromSeed(seed),allowed=d==='easy'?['first3','last3']:d==='standard'?['first3','last3','124']:EP.map(function(x){return x.id;}),pool=shuffle(r,cwc().filter(function(x){return allowed.indexOf(x.p.id)>=0;})),e1=pool[0],e2=pool.find(function(x){return e1&&x.p.id===e1.p.id&&x.result!==e1.result;}),tar=pool.find(function(x){return e1&&e2&&x.p.id===e1.p.id&&x.result!==e1.result&&x.result!==e2.result;});if(!e1||!e2||!tar)return null;return makeQ('complete_word',d,'Find the pattern: '+e1.w+' → '+e1.result+',  '+e2.w+' → '+e2.result+'.  Using the same pattern, '+tar.w+' → ?',tar.result,{choices:shuffle(r,[tar.result].concat(distract(r,3,[tar.result],d,3))),key:'cw:'+e1.p.id+':'+e1.w+':'+e2.w+':'+tar.w,explanation:'Take the '+e1.p.label+'.',check:{kind:'cw',pattern:e1.p.id,word:tar.w}});}
var LINK_VARIANT_CACHE={};
function commonLinkVariants(d){
  if(LINK_VARIANT_CACHE[d])return LINK_VARIANT_CACHE[d];
  var out=[],seen=new Set();
  LINK_BANK.forEach(function(e){
    if(!suitable(e.answer,d))return;
    var clues=unique(e.clues.filter(function(x){return suitable(x,d);}));
    for(var a=0;a<clues.length-3;a++)for(var b=a+1;b<clues.length-2;b++)for(var cc=b+1;cc<clues.length-1;cc++)for(var dd=cc+1;dd<clues.length;dd++){
      var set=[clues[a],clues[b],clues[cc],clues[dd]],key=e.answer+'|'+set.slice().sort().join(',');
      if(!seen.has(key)){seen.add(key);out.push({answer:e.answer,clues:set});}
    }
  });
  LINK_VARIANT_CACHE[d]=out;return out;
}
function gen21(d,seed){
  var r=rngFromSeed(seed),variant=choose(r,commonLinkVariants(d));if(!variant)return null;
  var clues=shuffle(r,variant.clues),choiceCount=d==='easy'?3:d==='standard'?4:5,opts=shuffle(r,[variant.answer].concat(distract(r,choiceCount-1,[variant.answer].concat(clues),d)));
  return makeQ('same_meaning',d,'Which ONE answer goes equally well with BOTH pairs?  ('+clues[0]+', '+clues[1]+')   ('+clues[2]+', '+clues[3]+')',variant.answer,{choices:opts,key:'link2:'+variant.answer+':'+variant.clues.slice().sort().join(','),explanation:variant.answer+' links both pairs by meaning.',check:{kind:'link',answer:variant.answer,pairs:[[clues[0],clues[1]],[clues[2],clues[3]]]}});
}

var GENERATORS={insert_letter:gen1,odd_ones_out:gen2,letter_code:gen3,closest_meaning:gen4,hidden_word:gen5,missing_word:gen6,letters_for_numbers:gen7,move_letter:gen8,letter_series:gen9,word_connections:gen10,number_series:gen11,compound_words:gen12,make_word:gen13,letter_connections:gen14,reading_information:gen15,opposite_meaning:gen16,complete_sum:gen17,related_numbers:gen18,word_number_codes:gen19,complete_word:gen20,same_meaning:gen21};
function check(q){var c=q.check;if(!c)return true;if(c.kind==='insert')return c.a[c.ia]===c.letter&&c.b[c.ib]===c.letter;if(c.kind==='insert4')return c.words.length===4&&c.left1+c.letter===c.words[0]&&c.letter+c.right1===c.words[1]&&c.left2+c.letter===c.words[2]&&c.letter+c.right2===c.words[3];if(c.kind==='hidden')return(c.left+c.right).indexOf(c.target)>=0;if(c.kind==='hidden_row'){var hits=[];for(var hr=0;hr<c.row.length-1;hr++){var ht=hiddenJoinTargets(c.row[hr],c.row[hr+1]);if(ht.length)hits.push({pair:[c.row[hr],c.row[hr+1]],targets:ht});}return hits.length===1&&hits[0].targets.length===1&&hits[0].targets[0]===c.target&&hits[0].pair[0]===c.pair[0]&&hits[0].pair[1]===c.pair[1];}if(c.kind==='restore')return c.word.slice(c.start,c.start+3)===c.removed;if(c.kind==='missing_classic'){if(!SHORT3.has(c.removed)||c.word.slice(0,c.start)+c.word.slice(c.start+3)!==c.damaged)return false;var sols=new Map();SHORT3.forEach(function(chunk){for(var mp=0;mp<=c.damaged.length;mp++){var made=c.damaged.slice(0,mp)+chunk+c.damaged.slice(mp);if(MISSING_WORD_BANK.indexOf(made)>=0)sols.set(made+'|'+chunk,1);}});return sols.size===1;}if(c.kind==='letter_code')return codeTransform(c.word,c.mode,c.a,c.b)===q.answer;if(c.kind==='letter_code_decode')return codeTransform(c.word,c.mode,c.a,c.b)===c.code&&q.answer===c.word;if(c.kind==='letter_number'){var v=c.op==='+'?c.values[c.a]+c.values[c.b]:Math.abs(c.values[c.a]-c.values[c.b]);return c.values[q.answer]===v;}if(c.kind==='letter_number_expr'){var vv=c.values[c.terms[0]];for(var ii=0;ii<c.ops.length;ii++)vv=c.ops[ii]==='+'?vv+c.values[c.terms[ii+1]]:vv-c.values[c.terms[ii+1]];return c.values[q.answer]===vv;}if(c.kind==='move')return WORD_SET.has(c.na)&&WORD_SET.has(c.nb)&&c.a.slice(0,c.index)+c.a.slice(c.index+1)===c.na;if(c.kind==='letter_series')return lsv(c.mode,c.index,c.a,c.b).join('')===q.answer;if(c.kind==='number_series')return String(ns(c.mode,c.start,c.step,c.index))===q.answer;if(c.kind==='compound')return COMPOUND_SET.has(c.left+'+'+c.right);if(c.kind==='compound_unique'){var cv=[];c.groupA.forEach(function(l){c.groupB.forEach(function(r){if(COMPOUND_SET.has(l+'+'+r))cv.push(l+'|'+r);});});return cv.length===1&&cv[0]===c.left+'|'+c.right;}if(c.kind==='make_word'){var p=MP.find(function(x){return x.id===c.pattern;});return p&&p.fn(c.a,c.b)===q.answer;}if(c.kind==='letter_connections')return alpha(c.b1+c.s1)+alpha(c.b2+c.s2)===q.answer;if(c.kind==='reading'){var a=c.order.slice().sort(function(x,y){return x.value-y.value;});return q.answer===a[a.length-1].name+' takes the longest.';}if(c.kind==='reading_expected')return q.answer===String(c.expected);if(c.kind==='syn_pair'){var pairs=0;c.groupA.forEach(function(x){c.groupB.forEach(function(y){if(synLinked(x,y))pairs++;});});return pairs===1&&synLinked(c.a,c.b);}if(c.kind==='sum')return String(c.answer)===q.answer;if(c.kind==='related')return String(rr(c.mode,c.a,c.b))===q.answer;if(c.kind==='related_unique'){var matching=c.modes.filter(function(test){return c.examples.every(function(x){return rr(test,x[0],x[1])===rr(c.mode,x[0],x[1]);});});return matching.length===1&&matching[0]===c.mode&&String(rr(c.mode,c.a,c.b))===q.answer;}if(c.kind==='wn')return c.target.split('').map(function(x){return c.map[x];}).join('')===q.answer;if(c.kind==='wn_scrambled'){var expected=c.target.split('').map(function(x){return c.map[x];}).join(''),valid=perms3().map(function(p){return codeAssignmentValid(c.clues,c.codes,p);}).filter(Boolean);return expected===q.answer&&valid.length===1;}if(c.kind==='cw'){var pp=EP.find(function(x){return x.id===c.pattern;});return pp&&pp.fn(c.word)===q.answer;}if(c.kind==='ant_pair'){var ap=0;c.groupA.forEach(function(x){c.groupB.forEach(function(y){if(antLinked(x,y))ap++;});});return ap===1&&antLinked(c.a,c.b);}if(c.kind==='link')return c.answer===q.answer;return true;}
function validate(q){var e=[];if(!q||!TYPES[q.typeId])e.push('unknown type');if(!DIFFICULTIES.includes(q&&q.difficulty))e.push('bad difficulty');if(!String(q&&q.prompt||'').trim())e.push('blank prompt');if(!String(q&&q.answer||'').trim())e.push('blank answer');if(!String(q&&q.key||'').trim())e.push('blank key');if(Array.isArray(q&&q.choices)){if(new Set(q.choices).size!==q.choices.length)e.push('duplicate choices');if(q.choices.indexOf(String(q.answer))<0&&q.choices.indexOf(String(q.answerText))<0)e.push('answer missing from choices');}if(q&&!check(q))e.push('answer validation failed');return{ok:e.length===0,errors:e};}
function generate(typeId,difficulty,seed){if(!TYPES[typeId])throw new Error('Unknown verbal reasoning type: '+typeId);var d=diff(difficulty||'standard'),fn=GENERATORS[typeId];for(var n=0;n<100;n++){var q=fn(d,String(seed||'vr')+':'+n);if(q&&validate(q).ok)return q;}throw new Error('Could not generate a valid '+TYPES[typeId].label+' question.');}
function generateFromTypes(ids,difficulty,seed,exclude){ids=unique((ids||[]).filter(function(id){return TYPES[id];}));if(!ids.length)ids=TYPE_IDS.slice();var blocked=new Set(exclude||[]),r=rngFromSeed(seed),order=shuffle(r,ids);for(var n=0;n<160;n++){var id=order[n%order.length],q=generate(id,difficulty,String(seed)+':type:'+id+':'+n);if(!blocked.has(q.key))return q;}throw new Error('No unused verbal reasoning question remains for the selected settings.');}
function samplePool(id,difficulty,count,seed){var o=[],seen=new Set(),want=count||100;for(var i=0;i<want*10&&o.length<want;i++){try{var q=generate(id,difficulty,String(seed||'pool')+':'+i);if(!seen.has(q.key)){seen.add(q.key);o.push(q);}}catch(e){}}return o;}
var api={VERSION:VERSION,DIFFICULTIES:DIFFICULTIES,TYPES:TYPES,TYPE_IDS:TYPE_IDS,TYPE_GROUPS:TYPE_GROUPS,WORDS:WORDS,generate:generate,generateFromTypes:generateFromTypes,samplePool:samplePool,validate:validate,rngFromSeed:rngFromSeed,shuffle:shuffle,cleanWord:cleanWord};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
global.TT99VerbalReasoning=api;
})(typeof globalThis!=='undefined'?globalThis:this);
