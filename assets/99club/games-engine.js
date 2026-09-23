/* 99 Club Studio · Maths Games & Puzzles
 * v1.8.1 — mixed-difficulty profiles + vocabulary-game refinements + 40-activity pack compatibility.
 * Architecture: game engine + maths content provider + applicability rules.
 */
(function(global){
  'use strict';

  const VERSION='1.10.0';
  let VOCAB_DATA=global.TT99GamesVocabularyV2||null;
  let ARITH=global.TT99ArithmeticGames||null;
  let NUMLOGIC=global.TT99NumberLogicGames||null;
  if(!VOCAB_DATA && typeof require==='function'){
    try{VOCAB_DATA=require('./games-vocabulary.js');}catch(e){}
    try{ARITH=require('./games-arithmetic.js');}catch(e){}
    try{NUMLOGIC=require('./games-number-logic.js');}catch(e){}
  }

  const TOPICS={
    number_place_value:{label:'Number & place value',years:[1,2,3,4,5,6]},
    calculation:{label:'Calculation',years:[1,2,3,4,5,6]},
    fractions:{label:'Fractions',years:[1,2,3,4,5,6]},
    decimals_percentages:{label:'Decimals & percentages',years:[4,5,6]},
    ratio_proportion:{label:'Ratio & proportion',years:[6]},
    measurement:{label:'Measurement',years:[1,2,3,4,5,6]},
    geometry:{label:'Geometry',years:[1,2,3,4,5,6]},
    statistics:{label:'Statistics',years:[2,3,4,5,6]},
    algebra:{label:'Algebra & sequences',years:[2,3,4,5,6]}
  };

  const CORE_ENGINES={
    wordsearch:{
      id:'wordsearch',title:'Maths Word Search',group:'Vocabulary & language',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['vocabulary'],minItems:6,maxItems:14,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',clueMode:'words_definitions',wordCount:'auto',gridSize:'auto',directionMode:'auto'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'clueMode',type:'choice',label:'Clues',options:['words_definitions','definitions']},
        {id:'wordCount',type:'select',label:'Number of terms',options:['auto','6','8','10','12']},
        {id:'gridSize',type:'select',label:'Grid size',options:['auto','12','14','16']},
        {id:'directionMode',type:'select',label:'Word directions',options:['auto','straight','diagonal','all']}
      ],
      compatibility:Object.fromEntries(Object.keys(TOPICS).map(t=>[t,'excellent']))
    },
    pyramid:{
      id:'pyramid',title:'Number Pyramid',group:'Number & arithmetic',kind:'independent',printableMode:'puzzle',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['integer'],minItems:1,maxItems:3,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',levels:'auto',clueLevel:'balanced'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'levels',type:'select',label:'Pyramid levels',options:['auto','3','4','5','6','7']},
        {id:'clueLevel',type:'choice',label:'Clues shown',options:['more','balanced','fewer']}
      ],
      compatibility:{number_place_value:'excellent',calculation:'excellent',fractions:'poor',decimals_percentages:'poor',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'poor'}
    },
    crossword:{
      id:'crossword',title:'Maths Crossword',group:'Vocabulary & language',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['vocabulary'],minItems:5,maxItems:12,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',wordCount:'auto',gridSize:'auto',wordBank:'auto'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'wordCount',type:'select',label:'Number of answers',options:['auto','6','8','10','12']},
        {id:'gridSize',type:'select',label:'Grid size',options:['auto','13','15','17']},
        {id:'wordBank',type:'select',label:'Word bank',options:['auto','show','hide']}
      ],
      compatibility:Object.fromEntries(Object.keys(TOPICS).map(t=>[t,'excellent']))
    },
    magic:{
      id:'magic',title:'Magic Squares',group:'Logic & patterns',kind:'independent',printableMode:'puzzle',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['number','reasoning'],minItems:1,maxItems:3,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',gridSize:'auto',puzzleType:'auto',numberPattern:'auto',clueLevel:'balanced'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'gridSize',type:'select',label:'Square size',options:['auto','3','4']},
        {id:'puzzleType',type:'select',label:'Puzzle style',options:['auto','missing','check','repair','transform']},
        {id:'numberPattern',type:'select',label:'Numbers',options:['auto','classic','shifted','scaled','decimal']},
        {id:'clueLevel',type:'choice',label:'Clues shown',options:['more','balanced','fewer']}
      ],
      compatibility:{number_place_value:'excellent',calculation:'excellent',fractions:'poor',decimals_percentages:'reasonable',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'reasonable'}
    },
    sudoku:{
      id:'sudoku',title:'Sudoku & Latin Squares',group:'Logic & patterns',kind:'independent',printableMode:'puzzle',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['number','logic'],minItems:1,maxItems:3,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',gridSize:'auto',puzzleStyle:'auto',clueLevel:'balanced'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'gridSize',type:'select',label:'Grid size',options:['auto','4','6','9']},
        {id:'puzzleStyle',type:'select',label:'Puzzle style',options:['auto','sudoku','latin']},
        {id:'clueLevel',type:'choice',label:'Clues shown',options:['more','balanced','fewer']}
      ],
      compatibility:{number_place_value:'excellent',calculation:'reasonable',fractions:'poor',decimals_percentages:'poor',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'reasonable'}
    }
  };
  const ENGINES={...CORE_ENGINES,...((ARITH&&ARITH.DEFINITIONS)||{}),...((NUMLOGIC&&NUMLOGIC.DEFINITIONS)||{})};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
  function normalizeTerm(term){return String(term||'').toUpperCase().replace(/[^A-Z]/g,'');}
  // Vocabulary grids are letter puzzles. Keep numerals / mathematical symbols in the master
  // vocabulary catalogue for other uses, but do not turn e.g. "3-D shape" into "DSHAPE".
  function puzzleTermSuitable(term){const text=String(term||'').trim();return /^[A-Za-z][A-Za-z '\u2019-]*$/.test(text)&&!/[0-9]/.test(text)&&normalizeTerm(text).length>=2;}
  function answerEnumeration(term){const words=String(term||'').trim().split(/\s+/).filter(Boolean).map(word=>word.split('-').map(part=>(part.match(/[A-Za-z]/g)||[]).length).filter(Boolean).join('-')).filter(Boolean);return words.length?`(${words.join(', ')})`:'';}
  function needsEnumeration(term){return /[\s-]/.test(String(term||'').trim());}
  function formatNumber(value){const n=Number(value);if(!Number.isFinite(n))return String(value??'');const r=Math.round(n*1000)/1000;return Number.isInteger(r)?String(r):String(r).replace(/0+$/,'').replace(/\.$/,'');}
  function yearText(minYear,maxYear){return minYear===maxYear?`Year ${minYear}`:`Years ${minYear}–${maxYear}`;}

  function mapBuiltInVocabulary(raw){
    const term=String(raw?.term||'').trim(),definition=String(raw?.definition||'').trim();
    if(!term||!definition)return null;
    const primaryTopic=TOPICS[raw.topic]?raw.topic:null;
    const appTopics=[...new Set([...(Array.isArray(raw.app_topics)?raw.app_topics:[]),primaryTopic].filter(t=>TOPICS[t]))];
    const puzzleSafe=puzzleTermSuitable(term);
    return {
      id:raw.id||`${raw.topic||appTopics[0]}.${term.toLowerCase().replace(/[^a-z0-9]+/g,'_')}`,
      topic:primaryTopic||(appTopics[0]||'number_place_value'),primaryTopic,sourceTopic:String(raw.topic||''),appTopics:appTopics.length?appTopics:['number_place_value'],subtopic:raw.subtopic||'',
      term,definition,crosswordClue:String(raw.crossword_clue||definition),gridAnswer:String(raw.grid_answer||normalizeTerm(term)),
      minYear:clamp(Number(raw.min_year)||1,1,6),maxYear:clamp(Number(raw.max_year)||6,1,6),priority:raw.priority||'core',source:'built-in',
      wordsearchSuitable:raw.wordsearch_suitable!==false&&puzzleSafe,crosswordSuitable:raw.crossword_suitable!==false&&puzzleSafe,minimumWordsearchGrid:Number(raw.minimum_wordsearch_grid)||Math.max(8,normalizeTerm(term).length),aliases:raw.aliases||[]
    };
  }
  const VOCABULARY=((VOCAB_DATA&&Array.isArray(VOCAB_DATA.entries))?VOCAB_DATA.entries:[]).map(mapBuiltInVocabulary).filter(Boolean);
  const VOCABULARY_METADATA=(VOCAB_DATA&&VOCAB_DATA.metadata)||{};

  function normalizeDifficultyWeights(raw={}){
    const src=raw&&typeof raw==='object'?raw:{};
    let vals=['easy','standard','challenge'].map(k=>Math.max(0,Number(src[k])||0));
    if(vals.reduce((a,b)=>a+b,0)<=0)vals=[25,50,25];
    const sum=vals.reduce((a,b)=>a+b,0),scaled=vals.map(v=>v*100/sum),whole=scaled.map(Math.floor);
    let left=100-whole.reduce((a,b)=>a+b,0);
    const order=scaled.map((v,i)=>({i,r:v-Math.floor(v)})).sort((a,b)=>b.r-a.r||a.i-b.i);
    for(let i=0;i<left;i++)whole[order[i%order.length].i]++;
    return {easy:whole[0],standard:whole[1],challenge:whole[2]};
  }
  function attachDifficultyProfile(raw,base){
    const requested=raw?.difficulty;
    return {...base,difficulty:requested==='mixed'?'mixed':base.difficulty,difficultyWeights:normalizeDifficultyWeights(raw?.difficultyWeights)};
  }
  function normalizeEngineSettings(engineId,raw={}){
    const defaults=ENGINES[engineId]?.defaultSettings||{},generationRaw=raw?.difficulty==='mixed'?{...raw,difficulty:'standard'}:raw;
    if(ARITH&&ARITH.DEFINITIONS&&ARITH.DEFINITIONS[engineId])return attachDifficultyProfile(raw,ARITH.normalise(engineId,generationRaw));
    if(NUMLOGIC&&NUMLOGIC.DEFINITIONS&&NUMLOGIC.DEFINITIONS[engineId])return attachDifficultyProfile(raw,NUMLOGIC.normalise(engineId,generationRaw));
    if(engineId==='wordsearch'){
      const legacyMode=raw.clueMode||raw.wordSearchMode;
      return attachDifficultyProfile(raw,{
        difficulty:['easy','standard','challenge'].includes(generationRaw.difficulty)?generationRaw.difficulty:defaults.difficulty,
        clueMode:['words_definitions','definitions'].includes(legacyMode)?legacyMode:(legacyMode==='words'?'words_definitions':defaults.clueMode),
        wordCount:['auto','6','8','10','12'].includes(String(raw.wordCount??'auto'))?String(raw.wordCount??'auto'):'auto',
        gridSize:['auto','12','14','16'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
        directionMode:['auto','straight','diagonal','all'].includes(raw.directionMode)?raw.directionMode:'auto'
      });
    }
    if(engineId==='pyramid')return attachDifficultyProfile(raw,{
      difficulty:['easy','standard','challenge'].includes(generationRaw.difficulty)?generationRaw.difficulty:defaults.difficulty,
      levels:['auto','3','4','5','6','7'].includes(String(raw.levels??'auto'))?String(raw.levels??'auto'):'auto',
      clueLevel:['more','balanced','fewer'].includes(raw.clueLevel)?raw.clueLevel:defaults.clueLevel
    });
    if(engineId==='crossword')return attachDifficultyProfile(raw,{
      difficulty:['easy','standard','challenge'].includes(generationRaw.difficulty)?generationRaw.difficulty:defaults.difficulty,
      wordCount:['auto','6','8','10','12'].includes(String(raw.wordCount??'auto'))?String(raw.wordCount??'auto'):'auto',
      gridSize:['auto','13','15','17'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
      wordBank:['auto','show','hide'].includes(raw.wordBank)?raw.wordBank:'auto'
    });
    if(engineId==='magic')return attachDifficultyProfile(raw,{
      difficulty:['easy','standard','challenge'].includes(generationRaw.difficulty)?generationRaw.difficulty:defaults.difficulty,
      gridSize:['auto','3','4'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
      puzzleType:['auto','missing','check','repair','transform'].includes(raw.puzzleType)?raw.puzzleType:(raw.puzzleType==='find_total'?'check':'auto'),
      numberPattern:['auto','classic','shifted','scaled','decimal'].includes(raw.numberPattern)?raw.numberPattern:'auto',
      clueLevel:['more','balanced','fewer'].includes(raw.clueLevel)?raw.clueLevel:'balanced'
    });
    if(engineId==='sudoku')return attachDifficultyProfile(raw,{
      difficulty:['easy','standard','challenge'].includes(generationRaw.difficulty)?generationRaw.difficulty:defaults.difficulty,
      gridSize:['auto','4','6','9'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
      puzzleStyle:['auto','sudoku','latin'].includes(raw.puzzleStyle)?raw.puzzleStyle:'auto',
      clueLevel:['more','balanced','fewer'].includes(raw.clueLevel)?raw.clueLevel:'balanced'
    });
    return attachDifficultyProfile(raw,{...defaults,...generationRaw});
  }

  function normalizeSettings(input={}){
    const minYear=clamp(Number(input.minYear)||1,1,6),maxYear=clamp(Number(input.maxYear)||6,minYear,6);
    const topics=(Array.isArray(input.topics)?input.topics:[]).filter(t=>TOPICS[t]);
    const legacyDifficulty=['easy','standard','challenge'].includes(input.difficulty)?input.difficulty:'standard';
    const legacyWordMode=input.wordSearchMode==='definitions'?'definitions':'words_definitions';
    const rawEngineSettings=input.engineSettings||{};
    const engineSettings={
      wordsearch:normalizeEngineSettings('wordsearch',{difficulty:legacyDifficulty,clueMode:legacyWordMode,...rawEngineSettings.wordsearch}),
      pyramid:normalizeEngineSettings('pyramid',{difficulty:legacyDifficulty,...rawEngineSettings.pyramid}),
      crossword:normalizeEngineSettings('crossword',{difficulty:legacyDifficulty,...rawEngineSettings.crossword}),
      magic:normalizeEngineSettings('magic',{difficulty:legacyDifficulty,...rawEngineSettings.magic}),
      sudoku:normalizeEngineSettings('sudoku',{difficulty:legacyDifficulty,...rawEngineSettings.sudoku})
    };
    if(ARITH&&ARITH.DEFINITIONS)for(const id of Object.keys(ARITH.DEFINITIONS))engineSettings[id]=normalizeEngineSettings(id,{difficulty:legacyDifficulty,...(rawEngineSettings[id]||{})});
    if(NUMLOGIC&&NUMLOGIC.DEFINITIONS)for(const id of Object.keys(NUMLOGIC.DEFINITIONS))engineSettings[id]=normalizeEngineSettings(id,{difficulty:legacyDifficulty,...(rawEngineSettings[id]||{})});
    const hasExplicitSelection=Array.isArray(input.selectedEngines);
    let selectedEngines=hasExplicitSelection?input.selectedEngines.filter(id=>ENGINES[id]&&!ENGINES[id].hiddenFromLibrary):[];
    if(!hasExplicitSelection&&input.gameMode==='single'&&ENGINES[input.gameId]&&!ENGINES[input.gameId].hiddenFromLibrary)selectedEngines=[input.gameId];
    if(!hasExplicitSelection&&!selectedEngines.length)selectedEngines=['wordsearch','pyramid'];
    const rawPersonal=input.personalisation&&typeof input.personalisation==='object'?input.personalisation:{};
    const personalisation={
      schoolName:String(rawPersonal.schoolName||'').slice(0,100),
      packTitle:String(rawPersonal.packTitle||'Maths Games & Puzzles').slice(0,100) || 'Maths Games & Puzzles',
      classLabel:String(rawPersonal.classLabel||'').slice(0,80),
      worksheetDate:String(rawPersonal.worksheetDate||'').slice(0,20),
      logoDataUrl:typeof rawPersonal.logoDataUrl==='string'&&rawPersonal.logoDataUrl.startsWith('data:image/jpeg;base64,')?rawPersonal.logoDataUrl:'',
      logoWidth:Math.max(0,Number(rawPersonal.logoWidth)||0),logoHeight:Math.max(0,Number(rawPersonal.logoHeight)||0)
    };
    return {
      minYear,maxYear,topics:topics.length?topics:['calculation'],sheets:clamp(Number(input.sheets)||1,1,20),activitiesPerSheet:clamp(Number(input.activitiesPerSheet)||1,1,3),
      selectedEngines:[...new Set(selectedEngines)],includeAnswers:input.includeAnswers!==false,workedExamples:input.workedExamples==='front'?'front':'none',engineSettings,personalisation
    };
  }

  function compatibleEngines(settings){
    const s=normalizeSettings(settings);return Object.values(ENGINES).filter(engine=>!engine.hiddenFromLibrary&&s.topics.some(t=>{if(!['excellent','reasonable'].includes(engine.compatibility[t]))return false;const min=Number(engine.topicYearMin?.[t]||1),max=Number(engine.topicYearMax?.[t]||6);return s.maxYear>=min&&s.minYear<=max;})).map(x=>x.id);
  }
  function selectedCompatibleEngines(settings){
    const s=normalizeSettings(settings),eligible=new Set(compatibleEngines(s)),selected=s.selectedEngines.filter(id=>eligible.has(id));
    return selected;
  }
  function chooseEngine(settings,index,seed){
    const selected=selectedCompatibleEngines(settings);if(!selected.length)return null;if(selected.length===1)return selected[0];if(index<selected.length)return selected[index];return selected[Math.floor(rngFromSeed(`${seed}:engine:${index}`)()*selected.length)];
  }

  function sanitizeCustomVocabulary(entries){
    const out=[];
    for(const raw of Array.isArray(entries)?entries:[]){
      const topic=TOPICS[raw?.topic]?raw.topic:'number_place_value',term=String(raw?.term||'').trim().replace(/\s+/g,' '),definition=String(raw?.definition||'').trim().replace(/\s+/g,' ');
      const minYear=clamp(Number(raw?.minYear??raw?.min_year)||1,1,6),maxYear=clamp(Number(raw?.maxYear??raw?.max_year)||6,minYear,6),normalized=normalizeTerm(term);
      if(term&&definition&&puzzleTermSuitable(term)&&normalized.length>=2&&normalized.length<=24)out.push({id:`mine.${topic}.${term.toLowerCase().replace(/[^a-z0-9]+/g,'_')}`,topic,primaryTopic:topic,sourceTopic:topic,appTopics:[topic],term,definition,crosswordClue:definition,gridAnswer:normalized,minYear,maxYear,priority:'core',source:'mine',wordsearchSuitable:true,crosswordSuitable:normalized.length>=3,minimumWordsearchGrid:Math.max(8,normalized.length)});
    }
    const seen=new Set();return out.filter(x=>{const k=`${x.topic}|${x.term.toLowerCase()}`;if(seen.has(k))return false;seen.add(k);return true;});
  }

  // Automatic topic packs are deliberately topic-pure. General mathematical-language
  // records stay in the master catalogue, but do not leak into every subject pack.
  function vocabularyMatchesSelectedTopic(entry,topics){return !!entry?.primaryTopic&&topics.includes(entry.primaryTopic);}
  function vocabularyCountForTopic(topic){return VOCABULARY.filter(x=>x.primaryTopic===topic&&x.wordsearchSuitable).length;}
  function vocabularyPool(settings,customVocabulary=[],purpose='wordsearch'){
    const s=normalizeSettings(settings),all=VOCABULARY.concat(sanitizeCustomVocabulary(customVocabulary));
    const engineId=purpose==='crossword'?'crossword':'wordsearch',difficulty=s.engineSettings[engineId].difficulty;
    return all.filter(x=>vocabularyMatchesSelectedTopic(x,s.topics)&&(x.source==='mine'||(x.minYear<=s.maxYear&&x.maxYear>=s.minYear))&&
      (purpose==='crossword'?x.crosswordSuitable:x.wordsearchSuitable)&&
      (difficulty==='challenge'||x.priority!=='extension'));
  }

  function wordSearchOptions(settings){return normalizeSettings(settings).engineSettings.wordsearch;}
  function wordSearchGridSize(settings){const o=wordSearchOptions(settings);if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?12:o.difficulty==='challenge'?16:14;}
  function wordSearchCount(settings,available){const o=wordSearchOptions(settings),target=o.wordCount!=='auto'?Number(o.wordCount):(o.difficulty==='easy'?7:o.difficulty==='challenge'?11:9);return Math.max(4,Math.min(target,available));}
  function wordSearchDirections(settings){
    const o=wordSearchOptions(settings),mode=o.directionMode==='auto'?(o.difficulty==='easy'?'straight':o.difficulty==='challenge'?'all':'diagonal'):o.directionMode;
    if(mode==='straight')return {mode,dirs:[[1,0],[0,1]],label:'left→right / top→bottom',tip:'Search directions: → ↓ · No backwards words.',pdfTip:'Directions: left to right and top to bottom. No backwards words.'};
    if(mode==='diagonal')return {mode,dirs:[[1,0],[0,1],[1,1],[-1,1]],label:'straight + diagonals',tip:'Search directions: → ↓ ↘ ↙ · No backwards words.',pdfTip:'Directions: left to right, top to bottom and diagonally down. No backwards words.'};
    return {mode:'all',dirs:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]],label:'all directions, including backwards',tip:'Search directions: → ← ↓ ↑ ↘ ↙ ↗ ↖ · Words may be backwards.',pdfTip:'Directions: horizontal, vertical and diagonal - forwards or backwards.'};
  }
  function vocabularyFor(settings,customVocabulary=[]){
    const size=wordSearchGridSize(settings);return vocabularyPool(settings,customVocabulary,'wordsearch').filter(x=>normalizeTerm(x.term).length<=size&&x.minimumWordsearchGrid<=size);
  }
  function wordPlacementCandidates(grid,word,dir){
    const n=grid.length,[dx,dy]=dir,out=[];
    for(let y0=0;y0<n;y0++)for(let x0=0;x0<n;x0++){
      const x1=x0+dx*(word.length-1),y1=y0+dy*(word.length-1);
      if(x1<0||x1>=n||y1<0||y1>=n)continue;
      let ok=true;
      for(let i=0;i<word.length;i++){const x=x0+dx*i,y=y0+dy*i,c=grid[y][x];if(c&&c!==word[i]){ok=false;break;}}
      if(ok)out.push({x0,y0,dx,dy});
    }
    return out;
  }
  function placeWord(grid,word,rng,dirs,directionUsage){
    const usage=directionUsage||new Map(),viable=[];
    for(const dir of dirs){
      const key=`${dir[0]},${dir[1]}`,candidates=wordPlacementCandidates(grid,word,dir);
      if(candidates.length)viable.push({key,used:usage.get(key)||0,candidates});
    }
    if(!viable.length)return null;
    const leastUsed=Math.min(...viable.map(v=>v.used)),directionPool=viable.filter(v=>v.used===leastUsed),choice=directionPool[randInt(rng,0,directionPool.length-1)],candidate=choice.candidates[randInt(rng,0,choice.candidates.length-1)];
    const cells=[];
    for(let i=0;i<word.length;i++){const x=candidate.x0+candidate.dx*i,y=candidate.y0+candidate.dy*i;grid[y][x]=word[i];cells.push([x,y]);}
    usage.set(choice.key,choice.used+1);
    return {cells,dx:candidate.dx,dy:candidate.dy};
  }
  function buildWordSearchFromItems(settings,seed,items){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),size=wordSearchGridSize(s),grid=Array.from({length:size},()=>Array(size).fill('')),placements=[],direction=wordSearchDirections(s),directionUsage=new Map();
    const tagged=items.map((item,order)=>({...item,_displayOrder:order})),ordered=tagged.slice().sort((a,b)=>normalizeTerm(b.term).length-normalizeTerm(a.term).length);
    for(const item of ordered){const word=normalizeTerm(item.term),placed=placeWord(grid,word,rng,direction.dirs,directionUsage);if(placed)placements.push({id:item.id,term:item.term,definition:item.definition,source:item.source,topic:item.topic,appTopics:item.appTopics,cells:placed.cells,dx:placed.dx,dy:placed.dy,_displayOrder:item._displayOrder});}
    placements.sort((a,b)=>a._displayOrder-b._displayOrder);for(const p of placements)delete p._displayOrder;
    const alphabet='EEEEEEEEAAAAAAIIIIIOOOONNNNRRRRTTTTSSSSLLLCCDDMPUFGHBVYWKXJQZ';
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!grid[y][x])grid[y][x]=alphabet[randInt(rng,0,alphabet.length-1)];
    const o=wordSearchOptions(s);return {engineId:'wordsearch',title:'Maths Word Search',topicIds:[...new Set(placements.flatMap(x=>x.appTopics||[x.topic]))],grid,size,placements,mode:o.clueMode,difficulty:o.difficulty,yearText:yearText(s.minYear,s.maxYear),seed,options:o,directionMode:direction.mode,directionLabel:direction.label,directionTip:direction.tip,directionTipPdf:direction.pdfTip};
  }
  function generateWordSearch(settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),available=vocabularyFor(s,customVocabulary);
    if(available.length<4)return {engineId:'wordsearch',title:'Maths Word Search',error:'Not enough vocabulary is available for this teaching focus. Add My vocabulary entries or choose another topic.'};
    const count=wordSearchCount(s,available.length),chosen=shuffle(available,rng).slice(0,count);return buildWordSearchFromItems(s,seed,chosen);
  }
  function replaceWordSearchEntry(activity,index,settings,seed,customVocabulary=[]){
    if(!activity||activity.engineId!=='wordsearch'||!activity.placements?.[index])return activity;
    const pool=vocabularyFor(settings,customVocabulary),existing=activity.placements.map(p=>String(p.term).toLowerCase()),old=existing[index];
    const candidates=pool.filter(x=>!existing.includes(x.term.toLowerCase())&&x.term.toLowerCase()!==old);
    if(!candidates.length)return activity;
    const rng=rngFromSeed(seed),replacement=shuffle(candidates,rng)[0],items=activity.placements.map((p,i)=>i===index?replacement:pool.find(x=>x.id===p.id)||{...p,id:p.id||`kept.${i}`,appTopics:p.appTopics||[p.topic]});
    const next=buildWordSearchFromItems(settings,seed,items);next.replacedIndex=index;return next;
  }

  function pyramidProfile(settings){
    const s=normalizeSettings(settings),year=s.maxYear,o=s.engineSettings.pyramid,d=o.difficulty;
    let rows;
    if(o.levels!=='auto')rows=Number(o.levels);
    else if(d==='easy')rows=year<=2?3:4;
    else if(d==='challenge')rows=year<=2?4:year===3?5:year===4?6:7;
    else rows=year<=2?3:year===3?4:5;
    rows=clamp(rows,3,7);
    const baseApex=year===1?20:year===2?100:year===3?500:year===4?2000:year===5?5000:10000;
    const depthScale=rows<=4?1:rows===5?.72:rows===6?.42:.24;
    let maxApex=Math.max(rows>=6?Math.pow(2,rows-1):10,Math.floor(baseApex*depthScale));
    if(d==='easy')maxApex=Math.max(Math.pow(2,rows-1),Math.floor(maxApex*.55));
    if(d==='challenge'&&rows<=5&&year>=4)maxApex=Math.min(20000,Math.floor(maxApex*1.25));
    const baseMissing=o.clueLevel==='more'?.28:o.clueLevel==='fewer'?.62:(d==='easy'?.34:d==='challenge'?.56:.45),depthFactor=rows<=4?1:rows===5?.90:rows===6?.72:.58,missingRatio=baseMissing*depthFactor;
    return {rows,maxApex,missingRatio,difficulty:d,clueLevel:o.clueLevel};
  }
  function buildPyramid(bottom){const rows=[bottom.slice()];let current=bottom.slice();while(current.length>1){const next=[];for(let i=0;i<current.length-1;i++)next.push(current[i]+current[i+1]);rows.unshift(next);current=next;}return rows;}
  function matrixRank(matrix,eps=1e-9){const a=matrix.map(row=>row.map(Number));if(!a.length)return 0;const rows=a.length,cols=a[0].length;let rank=0,col=0;while(rank<rows&&col<cols){let pivot=rank;for(let r=rank+1;r<rows;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;if(Math.abs(a[pivot][col])<=eps){col++;continue;}[a[rank],a[pivot]]=[a[pivot],a[rank]];const div=a[rank][col];for(let c=col;c<cols;c++)a[rank][c]/=div;for(let r=0;r<rows;r++){if(r===rank)continue;const f=a[r][col];if(Math.abs(f)<=eps)continue;for(let c=col;c<cols;c++)a[r][c]-=f*a[rank][c];}rank++;col++;}return rank;}
  function pyramidCoefficientRows(size){let rows=[Array.from({length:size},(_,i)=>Array.from({length:size},(__,j)=>i===j?1:0))],current=rows[0];while(current.length>1){const next=[];for(let i=0;i<current.length-1;i++)next.push(current[i].map((v,j)=>v+current[i+1][j]));rows.unshift(next);current=next;}return rows;}
  function uniquelySolvablePyramidMask(rowCount,candidates,targetMissing,rng){const coeff=pyramidCoefficientRows(rowCount),all=[];for(let r=0;r<coeff.length;r++)for(let c=0;c<coeff[r].length;c++)all.push([r,c]);const missing=new Set(),order=shuffle(candidates,rng);for(const [r,c] of order){if(missing.size>=targetMissing)break;const key=`${r}:${c}`;missing.add(key);const visible=all.filter(([rr,cc])=>!missing.has(`${rr}:${cc}`)).map(([rr,cc])=>coeff[rr][cc]);if(matrixRank(visible)<rowCount)missing.delete(key);}return [...missing].map(k=>k.split(':').map(Number));}
  function generateNumberPyramid(settings,seed){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),profile=pyramidProfile(s);let rows=null;
    for(let tries=0;tries<700;tries++){const minBottom=profile.rows>=6?0:(s.minYear<=1?0:1),depthCap=profile.rows>=7?8:profile.rows===6?12:profile.rows===5?25:Infinity,maxBottom=Math.max(minBottom+1,Math.min(depthCap,Math.floor(profile.maxApex/Math.pow(2,profile.rows-1)))),bottom=Array.from({length:profile.rows},()=>randInt(rng,minBottom,maxBottom));rows=buildPyramid(bottom);if(rows[0][0]<=profile.maxApex)break;}
    const all=[];for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++)all.push([r,c]);const candidates=all.filter(([r])=>!(profile.difficulty==='easy'&&r===0));
    const missingCount=Math.min(all.length-profile.rows,Math.max(2,Math.round(all.length*profile.missingRatio))),missing=uniquelySolvablePyramidMask(profile.rows,candidates,missingCount,rng),missingSet=new Set(missing.map(([r,c])=>`${r}:${c}`));
    return {engineId:'pyramid',title:'Number Pyramid',topicIds:['calculation'],rows,missing,missingSet:[...missingSet],difficulty:profile.difficulty,yearText:yearText(s.minYear,s.maxYear),seed,instruction:'Each brick is the sum of the two bricks directly below it.',options:s.engineSettings.pyramid};
  }


  const MAGIC3=[[8,1,6],[3,5,7],[4,9,2]];
  const MAGIC4=[[16,2,3,13],[5,11,10,8],[9,7,6,12],[4,14,15,1]];
  function cloneGrid(grid){return grid.map(row=>row.slice());}
  function rotateGrid(grid){const n=grid.length;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>grid[n-1-c][r]));}
  function reflectGrid(grid){return grid.map(row=>row.slice().reverse());}
  function magicVariant(base,rng){let g=cloneGrid(base);const turns=randInt(rng,0,3);for(let i=0;i<turns;i++)g=rotateGrid(g);if(rng()<.5)g=reflectGrid(g);return g;}
  function mapMagicValues(grid,offset,step){return grid.map(row=>row.map(v=>Math.round((offset+step*(v-1))*1000)/1000));}
  function magicLineSums(grid){const n=grid.length,rows=grid.map(row=>row.reduce((a,b)=>a+b,0)),cols=Array.from({length:n},(_,c)=>grid.reduce((sum,row)=>sum+row[c],0)),diag1=grid.reduce((sum,row,i)=>sum+row[i],0),diag2=grid.reduce((sum,row,i)=>sum+row[n-1-i],0);return {rows,cols,diags:[diag1,diag2]};}
  function isMagicGrid(grid,eps=1e-8){if(!grid?.length)return false;const sums=magicLineSums(grid),all=[...sums.rows,...sums.cols,...sums.diags];return all.every(x=>Math.abs(x-all[0])<eps);}
  function magicOptions(settings){return normalizeSettings(settings).engineSettings.magic;}
  function magicGridSize(settings,seed='magic'){const s=normalizeSettings(settings),o=s.engineSettings.magic;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='challenge'&&s.maxYear>=4)return rngFromSeed(`${seed}:size`)()<.62?4:3;return 3;}
  function magicNumberProfile(settings,seed,size){const s=normalizeSettings(settings),o=s.engineSettings.magic,rng=rngFromSeed(`${seed}:numbers`),year=s.maxYear;let kind=o.numberPattern;
    if(kind==='auto'){if(s.topics.includes('decimals_percentages')&&year>=4)kind='decimal';else if(o.difficulty==='easy')kind=rng()<.7?'classic':'shifted';else if(o.difficulty==='challenge')kind=rng()<.65?'scaled':'shifted';else kind=rng()<.5?'shifted':'scaled';}
    if(kind==='decimal'&&year<4)kind='shifted';
    let offset=1,step=1,label='consecutive numbers';
    if(kind==='classic'){offset=1;step=1;label=size===3?'1 to 9':'1 to 16';}
    else if(kind==='shifted'){const maxStart=year<=2?5:year===3?15:year===4?30:year===5?60:100;offset=randInt(rng,2,maxStart);step=1;label=`consecutive numbers from ${formatNumber(offset)}`;}
    else if(kind==='scaled'){const choices=year<=2?[2]:year===3?[2,3,5]:year===4?[2,3,5,10]:[2,3,5,10,25];step=choices[randInt(rng,0,choices.length-1)];offset=(o.difficulty==='challenge'&&year>=4&&rng()<.4)?randInt(rng,0,Math.max(5,year*5)):step;label=`step ${formatNumber(step)}${offset!==step?`, starting ${formatNumber(offset)}`:''}`;}
    else if(kind==='decimal'){const choices=year===4?[0.1,0.2,0.5]:[0.1,0.2,0.25,0.5];step=choices[randInt(rng,0,choices.length-1)];offset=Math.round(step*randInt(rng,0,10)*100)/100;label=`decimal step ${formatNumber(step)}`;}
    return {kind,offset,step,label};
  }
  function magicPuzzleType(settings,seed,size){const s=normalizeSettings(settings),o=s.engineSettings.magic;if(o.puzzleType!=='auto')return o.puzzleType;const rng=rngFromSeed(`${seed}:type`),d=o.difficulty,r=rng();if(d==='easy')return r<.68?'missing':r<.90?'check':'repair';if(d==='standard')return r<.46?'missing':r<.72?'check':r<.90?'repair':'transform';return r<.34?'missing':r<.62?'check':r<.82?'repair':'transform';}
  function magicEquationRows(size,hiddenSet){const vars=[...hiddenSet].map(k=>k.split(':').map(Number)),index=new Map(vars.map((rc,i)=>[`${rc[0]}:${rc[1]}`,i])),rows=[];const addLine=cells=>{const row=Array(vars.length).fill(0);for(const [r,c] of cells){const idx=index.get(`${r}:${c}`);if(idx!==undefined)row[idx]=1;}if(row.some(Boolean))rows.push(row);};for(let r=0;r<size;r++)addLine(Array.from({length:size},(_,c)=>[r,c]));for(let c=0;c<size;c++)addLine(Array.from({length:size},(_,r)=>[r,c]));addLine(Array.from({length:size},(_,i)=>[i,i]));addLine(Array.from({length:size},(_,i)=>[i,size-1-i]));return rows;}
  function uniquelySolvableMagicMask(size,target,rng){const all=[];for(let r=0;r<size;r++)for(let c=0;c<size;c++)all.push([r,c]);const hidden=new Set();for(const [r,c] of shuffle(all,rng)){if(hidden.size>=target)break;const k=`${r}:${c}`;hidden.add(k);const rows=magicEquationRows(size,hidden);if(matrixRank(rows)<hidden.size)hidden.delete(k);}return [...hidden];}
  function magicMissingCount(settings,size){const o=magicOptions(settings),total=size*size,ratio=o.clueLevel==='more'?.26:o.clueLevel==='fewer'?.56:(o.difficulty==='easy'?.30:o.difficulty==='challenge'?.52:.42);const cap=size===3?5:8;return Math.max(1,Math.min(cap,Math.round(total*ratio)));}
  function magicTransform(settings,seed,source){const s=normalizeSettings(settings),rng=rngFromSeed(`${seed}:transform`),year=s.maxYear,isDecimal=source.some(row=>row.some(v=>!Number.isInteger(v)));let operation='add',amount;if(rng()<.48){operation='multiply';amount=randInt(rng,2,year<=2?3:5);}else{if(isDecimal)amount=[0.5,1,2][randInt(rng,0,2)];else amount=randInt(rng,1,year<=2?5:year<=4?12:25);}const grid=source.map(row=>row.map(v=>Math.round((operation==='add'?v+amount:v*amount)*1000)/1000));return {operation,amount,grid,label:operation==='add'?`Add ${formatNumber(amount)} to every number`:`Multiply every number by ${formatNumber(amount)}`};}
  function magicCheckEvidence(grid){
    const sums=magicLineSums(grid),all=[...sums.rows,...sums.cols,...sums.diags],first=all[0],same=all.every(v=>Math.abs(v-first)<1e-8);
    if(same)return {isMagic:true,evidence:`Yes. Every row, column and main diagonal totals ${formatNumber(first)}.`,sums};
    const labels=[...sums.rows.map((_,i)=>`row ${i+1}`),...sums.cols.map((_,i)=>`column ${i+1}`),'main diagonal','other diagonal'];
    let other=1;while(other<all.length&&Math.abs(all[other]-first)<1e-8)other++;
    return {isMagic:false,evidence:`No. ${labels[0]} totals ${formatNumber(first)}, but ${labels[other]} totals ${formatNumber(all[other])}.`,sums};
  }
  function generateMagicSquare(settings,seed){const s=normalizeSettings(settings),rng=rngFromSeed(seed),size=magicGridSize(s,seed),profile=magicNumberProfile(s,seed,size),base=magicVariant(size===4?MAGIC4:MAGIC3,rng),solutionGrid=mapMagicValues(base,profile.offset,profile.step),magicSum=magicLineSums(solutionGrid).rows[0],puzzleType=magicPuzzleType(s,seed,size),o=s.engineSettings.magic;
    const common={engineId:'magic',title:'Magic Squares',topicIds:s.topics.filter(t=>['number_place_value','calculation','decimals_percentages','algebra'].includes(t)),size,difficulty:o.difficulty,puzzleType,numberPattern:profile.kind,numberPatternLabel:profile.label,solutionGrid,magicSum,yearText:yearText(s.minYear,s.maxYear),seed,options:o};
    if(puzzleType==='check'){
      const makeBroken=o.difficulty==='easy'?rng()<.42:o.difficulty==='challenge'?rng()<.68:rng()<.56;
      let displayGrid=cloneGrid(solutionGrid),brokenCell='',correctValue=null,shownValue=null;
      if(makeBroken){
        const candidates=[];for(let r=0;r<size;r++)for(let c=0;c<size;c++)candidates.push([r,c]);
        const [r,c]=candidates[randInt(rng,0,candidates.length-1)],delta=profile.step*randInt(rng,1,o.difficulty==='challenge'?2:1)*(rng()<.5?-1:1);
        correctValue=displayGrid[r][c];shownValue=Math.round((correctValue+delta)*1000)/1000;displayGrid[r][c]=shownValue;brokenCell=`${r}:${c}`;
      }
      const evidence=magicCheckEvidence(displayGrid);
      return {...common,displayGrid,missingSet:[],checkIsMagic:evidence.isMagic,checkEvidence:evidence.evidence,checkSums:evidence.sums,brokenCell,correctValue,shownValue,instruction:'Is this a magic square? Check rows, columns and both main diagonals. If you find two different totals, you can stop and explain why.'};
    }
    if(puzzleType==='repair'){const candidates=size===3?[[0,0],[0,size-1],[size-1,0],[size-1,size-1],[1,1]]:[[0,0],[0,size-1],[size-1,0],[size-1,size-1]],cell=candidates[randInt(rng,0,candidates.length-1)],delta=profile.step*randInt(rng,1,3)*(rng()<.5?-1:1),displayGrid=cloneGrid(solutionGrid),correct=displayGrid[cell[0]][cell[1]],wrong=Math.round((correct+delta)*1000)/1000;displayGrid[cell[0]][cell[1]]=wrong;return {...common,displayGrid,missingSet:[],wrongCell:`${cell[0]}:${cell[1]}`,wrongValue:wrong,correctValue:correct,instruction:`One number is wrong. Find it and correct it so every row, column and main diagonal has the same total.`,answerText:`Replace ${formatNumber(wrong)} with ${formatNumber(correct)}. The magic total is ${formatNumber(magicSum)}.`};}
    if(puzzleType==='transform'){const tx=magicTransform(s,seed,solutionGrid),target=tx.grid,targetSum=magicLineSums(target).rows[0],givenCount=o.clueLevel==='more'?Math.ceil(size*size*.45):o.clueLevel==='fewer'?Math.ceil(size*size*.18):Math.ceil(size*size*.30),positions=shuffle(Array.from({length:size*size},(_,i)=>[Math.floor(i/size),i%size]),rng).slice(0,givenCount),given=new Set(positions.map(([r,c])=>`${r}:${c}`));return {...common,sourceGrid:solutionGrid,solutionGrid:target,displayGrid:target.map((row,r)=>row.map((v,c)=>given.has(`${r}:${c}`)?v:null)),missingSet:Array.from({length:size*size},(_,i)=>`${Math.floor(i/size)}:${i%size}`).filter(k=>!given.has(k)),magicSum:targetSum,sourceMagicSum:magicSum,transform:tx,instruction:`${tx.label}. Complete the new magic square, then work out its magic total.`,answerText:`New magic total = ${formatNumber(targetSum)}`};}
    const target=magicMissingCount(s,size),hidden=uniquelySolvableMagicMask(size,target,rng),hiddenSet=new Set(hidden),displayGrid=solutionGrid.map((row,r)=>row.map((v,c)=>hiddenSet.has(`${r}:${c}`)?null:v));return {...common,displayGrid,missingSet:[...hiddenSet],instruction:`Every row, column and main diagonal totals ${formatNumber(magicSum)}. Fill the missing numbers.`,answerText:`Magic total = ${formatNumber(magicSum)}`};
  }

  function sudokuOptions(settings){return normalizeSettings(settings).engineSettings.sudoku;}
  function sudokuGridSize(settings){const s=normalizeSettings(settings),o=s.engineSettings.sudoku;if(o.gridSize!=='auto')return Number(o.gridSize);if(s.maxYear<=2)return 4;if(s.maxYear<=4)return o.difficulty==='easy'?4:6;if(o.difficulty==='challenge')return 9;return 6;}
  function sudokuStyle(settings,seed){const o=sudokuOptions(settings);if(o.puzzleStyle!=='auto')return o.puzzleStyle;if(sudokuGridSize(settings)===9)return 'sudoku';return rngFromSeed(`${seed}:style`)()<.72?'sudoku':'latin';}
  function sudokuBoxShape(size){if(size===9)return {rows:3,cols:3};if(size===6)return {rows:2,cols:3};return {rows:2,cols:2};}
  function shuffledRange(n,rng){return shuffle(Array.from({length:n},(_,i)=>i),rng);}
  function permuteSudokuSolution(size,style,seed){
    const rng=rngFromSeed(`${seed}:solution`),box=sudokuBoxShape(size);
    let base;
    if(style==='latin')base=Array.from({length:size},(_,r)=>Array.from({length:size},(_,c)=>(r+c)%size+1));
    else base=Array.from({length:size},(_,r)=>Array.from({length:size},(_,c)=>((box.cols*(r%box.rows)+Math.floor(r/box.rows)+c)%size)+1));
    const symbols=shuffle(Array.from({length:size},(_,i)=>i+1),rng),map=v=>symbols[v-1];
    let rows,cols;
    if(style==='latin'){
      rows=shuffledRange(size,rng);cols=shuffledRange(size,rng);
    }else{
      const bandCount=size/box.rows,stackCount=size/box.cols,bands=shuffledRange(bandCount,rng),stacks=shuffledRange(stackCount,rng);
      rows=bands.flatMap(b=>shuffle(Array.from({length:box.rows},(_,i)=>b*box.rows+i),rng));
      cols=stacks.flatMap(s=>shuffle(Array.from({length:box.cols},(_,i)=>s*box.cols+i),rng));
    }
    return rows.map(r=>cols.map(c=>map(base[r][c])));
  }
  function sudokuCandidates(grid,r,c,style,box){
    const n=grid.length,used=new Set(grid[r].filter(Boolean));for(let rr=0;rr<n;rr++)if(grid[rr][c])used.add(grid[rr][c]);
    if(style==='sudoku'){const r0=Math.floor(r/box.rows)*box.rows,c0=Math.floor(c/box.cols)*box.cols;for(let rr=r0;rr<r0+box.rows;rr++)for(let cc=c0;cc<c0+box.cols;cc++)if(grid[rr][cc])used.add(grid[rr][cc]);}
    return Array.from({length:n},(_,i)=>i+1).filter(v=>!used.has(v));
  }
  function countSudokuSolutions(grid,style='sudoku',limit=2){
    const n=grid.length,box=sudokuBoxShape(n);
    let best=null,bestCandidates=null;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!grid[r][c]){
      const cand=sudokuCandidates(grid,r,c,style,box);if(!cand.length)return 0;if(!bestCandidates||cand.length<bestCandidates.length){best=[r,c];bestCandidates=cand;if(cand.length===1)break;}
    }
    if(!best)return 1;
    let count=0;const [r,c]=best;for(const v of bestCandidates){grid[r][c]=v;count+=countSudokuSolutions(grid,style,limit-count);grid[r][c]=0;if(count>=limit)return count;}return count;
  }

  function sudokuUnitSupports(domains,cells){
    const supports=cells.map(()=>new Set()),used=new Set(),pick=Array(cells.length).fill(0);let count=0;
    function rec(i){if(i===cells.length){count++;for(let k=0;k<cells.length;k++)supports[k].add(pick[k]);return;}const [r,c]=cells[i];for(const v of [...domains[r][c]].sort((a,b)=>a-b)){if(used.has(v))continue;used.add(v);pick[i]=v;rec(i+1);used.delete(v);}}
    rec(0);return {count,supports};
  }
  function solveSudokuByLogic(displayGrid,style='sudoku'){
    const n=displayGrid.length,all=()=>new Set(Array.from({length:n},(_,i)=>i+1)),domains=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>displayGrid[r][c]?new Set([displayGrid[r][c]]):all())),box=sudokuBoxShape(n);let passes=0,eliminations=0;
    function reduce(set,allowed){let changed=false;for(const v of [...set])if(!allowed.has(v)){set.delete(v);eliminations++;changed=true;}return changed;}
    function grid(){return domains.map(row=>row.map(s=>s.size===1?[...s][0]:0));}
    for(let guard=0;guard<150;guard++){
      passes++;let changed=false,units=[];
      for(let r=0;r<n;r++)units.push(Array.from({length:n},(_,c)=>[r,c]));
      for(let c=0;c<n;c++)units.push(Array.from({length:n},(_,r)=>[r,c]));
      if(style==='sudoku')for(let r0=0;r0<n;r0+=box.rows)for(let c0=0;c0<n;c0+=box.cols){const cells=[];for(let r=r0;r<r0+box.rows;r++)for(let c=c0;c<c0+box.cols;c++)cells.push([r,c]);units.push(cells);}
      for(const cells of units){const q=sudokuUnitSupports(domains,cells);if(!q.count)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};for(let i=0;i<cells.length;i++){const [r,c]=cells[i];if(reduce(domains[r][c],q.supports[i]))changed=true;if(!domains[r][c].size)return {solved:false,contradiction:true,passes,eliminations,grid:grid(),domains};}}
      if(domains.every(row=>row.every(s=>s.size===1)))return {solved:true,contradiction:false,passes,eliminations,grid:grid(),domains};
      if(!changed)return {solved:false,contradiction:false,passes,eliminations,grid:grid(),domains};
    }
    return {solved:false,contradiction:false,passes,eliminations,grid:grid(),domains};
  }

  function sudokuTargetBlanks(settings,size){
    const o=sudokuOptions(settings);
    let base,adjust;
    if(size===4){base=o.difficulty==='easy'?5:o.difficulty==='challenge'?9:7;adjust=o.clueLevel==='more'?-2:o.clueLevel==='fewer'?2:0;}
    else if(size===6){base=o.difficulty==='easy'?12:o.difficulty==='challenge'?23:18;adjust=o.clueLevel==='more'?-4:o.clueLevel==='fewer'?4:0;}
    else{base=o.difficulty==='easy'?38:o.difficulty==='challenge'?50:45;adjust=o.clueLevel==='more'?-5:o.clueLevel==='fewer'?5:0;}
    return clamp(base+adjust,3,size*size-8);
  }
  function generateMiniSudoku(settings,seed){
    const s=normalizeSettings(settings),o=s.engineSettings.sudoku,size=sudokuGridSize(s),style=sudokuStyle(s,seed),solutionGrid=permuteSudokuSolution(size,style,seed),rng=rngFromSeed(String(seed)+':mask'),displayGrid=cloneGrid(solutionGrid),positions=shuffle(Array.from({length:size*size},(_,i)=>[Math.floor(i/size),i%size]),rng),target=sudokuTargetBlanks(s,size),removed=[];
    for(const [r,c] of positions){if(removed.length>=target)break;const old=displayGrid[r][c];displayGrid[r][c]=0;const test=cloneGrid(displayGrid);if(countSudokuSolutions(test,style,2)===1)removed.push(r+':'+c);else displayGrid[r][c]=old;}
    let logic=solveSudokuByLogic(displayGrid,style),restored=0;
    if(!logic.solved){for(const key of shuffle(removed,rngFromSeed(String(seed)+':logic-repair'))){const [r,c]=key.split(':').map(Number);if(displayGrid[r][c])continue;displayGrid[r][c]=solutionGrid[r][c];restored++;logic=solveSudokuByLogic(displayGrid,style);if(logic.solved)break;}}
    if(!logic.solved)return {engineId:'sudoku',title:style==='latin'?'Latin Square':'Sudoku',error:'A deduction-solvable puzzle could not be built. Generate another version.'};
    const box=sudokuBoxShape(size),title=style==='latin'?'Latin Square':'Sudoku',instruction=style==='latin'?'Fill the grid with the numbers 1 to '+size+'. Each number must appear once in every row and once in every column.':'Fill the grid with the numbers 1 to '+size+'. Each number must appear once in every row, every column and every outlined box.',givenSet=[],missingSet=[];
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)(displayGrid[r][c]?givenSet:missingSet).push(r+':'+c);
    return {engineId:'sudoku',title,topicIds:s.topics.filter(t=>['number_place_value','calculation','algebra'].includes(t)),size,style,boxRows:box.rows,boxCols:box.cols,difficulty:o.difficulty,solutionGrid,displayGrid,givenSet,missingSet,logicStats:{solved:true,passes:logic.passes,eliminations:logic.eliminations,restoredGivens:restored},instruction,yearText:yearText(s.minYear,s.maxYear),seed,options:o};
  }


  function crosswordOptions(settings){return normalizeSettings(settings).engineSettings.crossword;}
  function crosswordGridSize(settings){const o=crosswordOptions(settings);if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?13:o.difficulty==='challenge'?17:15;}
  function crosswordCount(settings,available){const o=crosswordOptions(settings),target=o.wordCount!=='auto'?Number(o.wordCount):(o.difficulty==='easy'?6:o.difficulty==='challenge'?10:8);return Math.max(4,Math.min(target,available));}
  function crosswordWordBank(settings){const o=crosswordOptions(settings);return o.wordBank==='show'||(o.wordBank==='auto'&&o.difficulty==='easy');}
  function crosswordVocabularyFor(settings,customVocabulary=[]){const size=crosswordGridSize(settings);return vocabularyPool(settings,customVocabulary,'crossword').filter(x=>{const n=normalizeTerm(x.term).length;return n>=3&&n<=size-2;});}
  function emptyCrossword(n){return Array.from({length:n},()=>Array.from({length:n},()=>({ch:'',dirs:new Set()})));}
  function canPlaceCrossword(grid,word,x,y,dir,requireCross=true){
    const n=grid.length,dx=dir==='across'?1:0,dy=dir==='down'?1:0,endX=x+dx*(word.length-1),endY=y+dy*(word.length-1);if(x<0||y<0||endX>=n||endY>=n)return false;
    const beforeX=x-dx,beforeY=y-dy,afterX=endX+dx,afterY=endY+dy;if(beforeX>=0&&beforeY>=0&&beforeX<n&&beforeY<n&&grid[beforeY][beforeX].ch)return false;if(afterX>=0&&afterY>=0&&afterX<n&&afterY<n&&grid[afterY][afterX].ch)return false;
    let crosses=0;
    for(let i=0;i<word.length;i++){
      const xx=x+dx*i,yy=y+dy*i,cell=grid[yy][xx];
      if(cell.ch){if(cell.ch!==word[i]||cell.dirs.has(dir))return false;crosses++;continue;}
      if(dir==='across'){
        if((yy>0&&grid[yy-1][xx].ch)||(yy<n-1&&grid[yy+1][xx].ch))return false;
      }else if((xx>0&&grid[yy][xx-1].ch)||(xx<n-1&&grid[yy][xx+1].ch))return false;
    }
    return !requireCross||crosses>0;
  }
  function placeCrosswordEntry(grid,item,x,y,dir){const word=normalizeTerm(item.term),dx=dir==='across'?1:0,dy=dir==='down'?1:0,cells=[];for(let i=0;i<word.length;i++){const xx=x+dx*i,yy=y+dy*i;grid[yy][xx].ch=word[i];grid[yy][xx].dirs.add(dir);cells.push([xx,yy]);}return {id:item.id,term:item.term,answer:word,clue:item.crosswordClue||item.definition,enumeration:answerEnumeration(item.term),definition:item.definition,source:item.source,topic:item.topic,appTopics:item.appTopics,x,y,dir,cells};}
  function crosswordPlacementScore(grid,word,x,y,dir,entries){
    const dx=dir==='across'?1:0,dy=dir==='down'?1:0;let crosses=0;for(let i=0;i<word.length;i++)if(grid[y+dy*i][x+dx*i].ch)crosses++;
    const current=entries.flatMap(e=>e.cells),next=current.concat(Array.from({length:word.length},(_,i)=>[x+dx*i,y+dy*i]));
    const xs=next.map(c=>c[0]),ys=next.map(c=>c[1]),width=Math.max(...xs)-Math.min(...xs)+1,height=Math.max(...ys)-Math.min(...ys)+1,area=width*height,skew=Math.abs(width-height);
    // Crossings are the main quality signal. Compactness is a secondary tiebreaker.
    return {crosses,area,skew,score:crosses*1000-area*2-skew*3};
  }
  function crosswordQuality(raw){
    const counts=new Map();for(const e of raw.entries||[])for(const [x,y] of e.cells){const k=`${x}:${y}`;counts.set(k,(counts.get(k)||0)+1);}
    const crossings=[...counts.values()].filter(v=>v>1).length,used=[...counts.keys()].map(k=>k.split(':').map(Number)),xs=used.map(c=>c[0]),ys=used.map(c=>c[1]),area=used.length?(Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...ys)-Math.min(...ys)+1):Infinity;
    return {entries:raw.entries?.length||0,crossings,area,score:(raw.entries?.length||0)*100000+crossings*1000-area};
  }
  function crosswordAttempt(items,size,seed,target){
    const rng=rngFromSeed(seed),grid=emptyCrossword(size),entries=[];if(!items.length)return {grid,entries};
    const first=items.slice().sort((a,b)=>normalizeTerm(b.term).length-normalizeTerm(a.term).length)[0],fw=normalizeTerm(first.term),fx=Math.floor((size-fw.length)/2),fy=Math.floor(size/2);entries.push(placeCrosswordEntry(grid,first,fx,fy,'across'));
    const remaining=shuffle(items.filter(x=>x.id!==first.id),rng);
    for(const item of remaining){if(entries.length>=target)break;const word=normalizeTerm(item.term),candidates=[];
      for(let i=0;i<word.length;i++)for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++)if(grid[yy][xx].ch===word[i]){
        for(const dir of ['across','down']){if(grid[yy][xx].dirs.has(dir))continue;const x=xx-(dir==='across'?i:0),y=yy-(dir==='down'?i:0);if(canPlaceCrossword(grid,word,x,y,dir,true))candidates.push({x,y,dir});}
      }
      if(candidates.length){
        const ranked=candidates.map(p=>({...p,...crosswordPlacementScore(grid,word,p.x,p.y,p.dir,entries)})).sort((a,b)=>b.score-a.score);
        const bestScore=ranked[0].score,top=ranked.filter(p=>p.score===bestScore),p=top[randInt(rng,0,top.length-1)];entries.push(placeCrosswordEntry(grid,item,p.x,p.y,p.dir));
      }
    }
    return {grid,entries};
  }
  function finaliseCrossword(raw,size){
    const used=raw.entries.flatMap(e=>e.cells),xs=used.map(c=>c[0]),ys=used.map(c=>c[1]);if(!used.length)return {grid:[],entries:[]};
    // Trim to the exact occupied footprint. The renderer is a printer-friendly
    // freeform criss-cross: unused cells are white page, not blocked squares.
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),w=maxX-minX+1,h=maxY-minY+1;
    const grid=Array.from({length:h},(_,yy)=>Array.from({length:w},(_,xx)=>raw.grid[yy+minY][xx+minX].ch||''));
    const entries=raw.entries.map(e=>({...e,x:e.x-minX,y:e.y-minY,cells:e.cells.map(([x,y])=>[x-minX,y-minY])}));
    const starts=new Map();for(const e of entries){const k=`${e.x}:${e.y}`;if(!starts.has(k))starts.set(k,[]);starts.get(k).push(e);}
    let num=1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=`${x}:${y}`;if(starts.has(k)){for(const e of starts.get(k))e.number=num;num++;}}
    entries.sort((a,b)=>a.number-b.number||(a.dir==='across'?-1:1));return {grid,entries,width:w,height:h};
  }
  function generateCrossword(settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings),available=crosswordVocabularyFor(s,customVocabulary);if(available.length<4)return {engineId:'crossword',title:'Maths Crossword',error:'Not enough crossword vocabulary is available for this teaching focus.'};
    const size=crosswordGridSize(s),target=crosswordCount(s,available.length),rng=rngFromSeed(seed),candidatePool=shuffle(available,rng).slice(0,Math.min(40,available.length));let best=null,bestQ=null;
    for(let attempt=0;attempt<64;attempt++){const raw=crosswordAttempt(shuffle(candidatePool,rngFromSeed(`${seed}:order:${attempt}`)),size,`${seed}:cw:${attempt}`,target),q=crosswordQuality(raw);if(!best||q.score>bestQ.score){best=raw;bestQ=q;}}
    if(!best||best.entries.length<4)return {engineId:'crossword',title:'Maths Crossword',error:'A connected crossword could not be built from this selection. Try a wider teaching focus or generate a new version.'};
    const final=finaliseCrossword(best,size),o=crosswordOptions(s);return {engineId:'crossword',title:'Maths Crossword',topicIds:[...new Set(final.entries.flatMap(x=>x.appTopics||[x.topic]))],grid:final.grid,entries:final.entries,width:final.width,height:final.height,difficulty:o.difficulty,wordBank:crosswordWordBank(s),crossings:bestQ?.crossings||0,yearText:yearText(s.minYear,s.maxYear),seed,options:o};
  }

  function generateWorkedExample(engineId,settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings);
    if(ARITH&&ARITH.DEFINITIONS&&ARITH.DEFINITIONS[engineId])return ARITH.workedExample(engineId,s,seed);
    if(NUMLOGIC&&NUMLOGIC.DEFINITIONS&&NUMLOGIC.DEFINITIONS[engineId])return NUMLOGIC.workedExample(engineId,s,seed);
    if(engineId==='pyramid'){
      const rng=rngFromSeed(seed),a=randInt(rng,2,6),b=randInt(rng,2,6),c=randInt(rng,2,6),rows=buildPyramid([a,b,c]),missingValue=b;
      return {engineId,title:'Number Pyramid worked example',kind:'pyramid',rows,exampleMissing:'2:1',goal:'Fill every empty brick using the addition rule.',rules:['A brick is the sum of the two bricks directly below it.','If a lower brick is missing, use subtraction to work backwards.'],steps:[`${a} + ${b} = ${a+b}, so the left middle brick is ${a+b}.`,`${b} + ${c} = ${b+c}, so the right middle brick is ${b+c}.`,`${a+b} + ${b+c} = ${rows[0][0]}, so the top brick is ${rows[0][0]}.`,`Working backwards also works: ${a+b} - ${a} = ${missingValue}.`],tip:'Check each completed brick against the two bricks below it.',commonMistake:'Do not add bricks that are not directly next to each other.'};
    }
    if(engineId==='crossword'){
      const pool=crosswordVocabularyFor(s,customVocabulary);const item=pool.length?shuffle(pool,rngFromSeed(seed))[0]:null;if(!item)return null;const enumeration=answerEnumeration(item.term);
      return {engineId,title:'Maths Crossword worked example',kind:'crossword',term:item.term,answer:normalizeTerm(item.term),enumeration,clue:item.crosswordClue||item.definition,goal:'Use each definition to work out a mathematical word, then write it into the grid.',rules:['The number tells you where an answer starts.','Across answers run left to right; Down answers run top to bottom.',`The pattern ${enumeration} tells you the word length${needsEnumeration(item.term)?'s':''}. Spaces and punctuation are not written in the grid.`],steps:['Read the definition and look at the answer pattern.',`This clue describes “${item.term}”.`,'Write the letters into the numbered cells.','Use crossing letters to help solve another clue.'],tip:'If you are unsure of a clue, solve a crossing word first and use the letters you gain.',commonMistake:'Do not put spaces or punctuation into crossword cells.'};
    }
    if(engineId==='magic'){
      const grid=[[8,1,6],[3,5,7],[4,9,2]],magicSum=15;
      return {engineId,title:'Magic Squares worked example',kind:'magic',grid,displayGrid:[[8,1,6],[3,5,null],[4,9,2]],magicSum,goal:'Fill the missing number so every row, column and main diagonal has the same total.',rules:['Find or use the magic total.','Every row, every column and both main diagonals must match that total.','When one number is missing, subtract the known numbers from the magic total.'],steps:['The top row is 8 + 1 + 6 = 15, so the magic total is 15.','The middle row must also total 15: 3 + 5 + □ = 15.','3 + 5 = 8, so □ = 15 − 8 = 7.','Check another direction: 6 + 7 + 2 = 15, so the answer fits.'],tip:'Start with a row, column or diagonal that has only one missing number.',commonMistake:'A square is only magic if the rows, columns and both main diagonals all have the same total.'};
    }
    if(engineId==='sudoku'){
      const style=s.engineSettings.sudoku.puzzleStyle==='latin'?'latin':'sudoku',solutionGrid=[[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],displayGrid=cloneGrid(solutionGrid);displayGrid[0][3]=0;
      return {engineId,title:style==='latin'?'Latin Square worked example':'Sudoku worked example',kind:'sudoku',style,size:4,boxRows:2,boxCols:2,solutionGrid,displayGrid,goal:'Work out which number belongs in the empty cell without repeating a number where it is not allowed.',rules:style==='latin'?['Use the numbers 1, 2, 3 and 4.','Each number appears once in every row.','Each number appears once in every column.']:['Use the numbers 1, 2, 3 and 4.','Each number appears once in every row and every column.','In Sudoku, each outlined 2 × 2 box must also contain 1, 2, 3 and 4 once.'],steps:['Look at the first row: it already contains 1, 2 and 3.','The only number missing from that row is 4.',style==='latin'?'Check the last column: putting 4 there does not repeat a 4.':'Check the last column and the top-right 2 × 2 box: 4 is allowed in both.', 'Write 4 in the empty cell, then re-check the row and column.'],tip:'Scan the row first, then the column, then the box if the puzzle uses boxes.',commonMistake:style==='latin'?'Latin Squares do not use Sudoku boxes — only rows and columns matter.':'Do not forget the outlined box rule when a row or column gives more than one possibility.'};
    }
    const pool=vocabularyFor(s,customVocabulary),item=pool.length?shuffle(pool,rngFromSeed(seed))[0]:null;if(!item)return null;const answer=normalizeTerm(item.term),size=Math.max(8,Math.min(12,answer.length+2)),grid=Array.from({length:size},()=>Array(size).fill(''));
    const rng=rngFromSeed(`${seed}:grid`),row=randInt(rng,1,size-2),maxStart=Math.max(0,size-answer.length),start=randInt(rng,0,maxStart);for(let i=0;i<answer.length;i++)grid[row][start+i]=answer[i];const alphabet='ETAOINSHRDLUCMFPGWYBVKXJQZ';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!grid[y][x])grid[y][x]=alphabet[randInt(rng,0,alphabet.length-1)];const enumeration=answerEnumeration(item.term);
    return {engineId:'wordsearch',title:'Maths Word Search worked example',kind:'wordsearch',term:item.term,definition:item.definition,enumeration,answer,row,start,grid,size,mode:s.engineSettings.wordsearch.clueMode,goal:'Find the mathematical vocabulary hidden in the letter grid.',rules:[s.engineSettings.wordsearch.clueMode==='definitions'?'Use each definition to work out the hidden word first.':'Read the word and its definition before searching.',`The word may run in the allowed directions for this puzzle. Spaces and punctuation are removed in the grid.${needsEnumeration(item.term)?` ${enumeration} shows the word lengths.`:''}`],steps:s.engineSettings.wordsearch.clueMode==='definitions'?['Read the definition carefully.',`The mathematical term is “${item.term}” ${enumeration}.`,`Look for the letters ${answer} in one straight line.`,'Trace or circle the complete word.']:['Read the term and its meaning.',`Look for ${answer} in one straight line.`,'Trace or circle the complete word.'],tip:'Start by looking for an unusual first letter or a long group of letters.',commonMistake:'Do not change direction halfway through a hidden word.'};
  }

  function generateSudoku(settings,seed){return generateMiniSudoku(settings,seed);}
  function settingsWithDifficulty(settings,engineId,difficulty){const s=normalizeSettings(settings),copy=clone(s);copy.engineSettings[engineId]={...copy.engineSettings[engineId],difficulty};return copy;}
  function weightedDifficultyPlan(settings,engineId,count,seed='mix'){
    const s=normalizeSettings(settings),o=s.engineSettings[engineId]||{},allowed=['easy','standard','challenge'];if(o.difficulty!=='mixed')return Array(count).fill(allowed.includes(o.difficulty)?o.difficulty:'standard');
    const w=normalizeDifficultyWeights(o.difficultyWeights),exact=allowed.map(k=>count*w[k]/100),counts=exact.map(Math.floor);let left=count-counts.reduce((a,b)=>a+b,0);
    const order=exact.map((v,i)=>({i,r:v-Math.floor(v)})).sort((a,b)=>b.r-a.r||a.i-b.i);for(let i=0;i<left;i++)counts[order[i%order.length].i]++;
    const plan=[];allowed.forEach((d,i)=>{for(let n=0;n<counts[i];n++)plan.push(d);});return shuffle(plan,rngFromSeed(`${seed}:${engineId}:difficulty-mix`));
  }
  function resolveSingleDifficulty(settings,engineId,seed){const plan=weightedDifficultyPlan(settings,engineId,100,seed);return plan[Math.floor(rngFromSeed(`${seed}:single-difficulty`)()*plan.length)]||'standard';}
  function arithmagonOperationPlan(settings,count,seed='mix'){
    const s=normalizeSettings(settings),o=s.engineSettings?.arithmagon||{},requested=o.operation||'auto';
    if(requested!=='auto')return Array(count).fill(requested);
    if(s.maxYear<=1)return Array(count).fill('add');
    const addCount=s.maxYear===2?Math.round(count*.6):Math.ceil(count/2),plan=[...Array(addCount).fill('add'),...Array(Math.max(0,count-addCount)).fill('multiply')];
    return shuffle(plan,rngFromSeed(`${seed}:arithmagon-operation-mix`));
  }
  function settingsWithEngineOption(settings,engineId,key,value){const s=normalizeSettings(settings),copy=clone(s);copy.engineSettings[engineId]={...copy.engineSettings[engineId],[key]:value};return copy;}
  function finiteContentKey(activity){
    if(!activity||activity.error)return '';
    if(activity.engineId==='alphametics'&&activity.templateId)return `alphametics:${activity.templateId}`;
    if(activity.engineId==='symbols'&&activity.word)return `symbols:${String(activity.word).toUpperCase()}`;
    if(activity.engineId==='verbalreasoning'&&activity.questionKey)return `verbal:${String(activity.questionKey)}`;
    return '';
  }
  function withFiniteExclusions(settings,used){
    const copy=clone(settings),current=copy._finiteExclusions&&typeof copy._finiteExclusions==='object'?copy._finiteExclusions:{};
    copy._finiteExclusions={
      ...current,
      alphametics:[...(used.alphametics||[])],
      symbols:[...(used.symbols||[])],
      verbal:[...(used.verbal||[])]
    };
    return copy;
  }

  function generateActivity(engineId,settings,seed,customVocabulary=[]){
    const finiteExclusions=settings?._finiteExclusions;
    let s=normalizeSettings(settings);
    if(finiteExclusions)s._finiteExclusions={alphametics:[...(finiteExclusions.alphametics||[])],symbols:[...(finiteExclusions.symbols||[])],verbal:[...(finiteExclusions.verbal||[])]};
    if(s.engineSettings[engineId]?.difficulty==='mixed'){const exclusions=s._finiteExclusions;s=settingsWithDifficulty(s,engineId,resolveSingleDifficulty(s,engineId,seed));if(exclusions)s._finiteExclusions=exclusions;}
    if(ARITH&&ARITH.DEFINITIONS&&ARITH.DEFINITIONS[engineId])return ARITH.generate(engineId,s,seed);if(NUMLOGIC&&NUMLOGIC.DEFINITIONS&&NUMLOGIC.DEFINITIONS[engineId])return NUMLOGIC.generate(engineId,s,seed);if(engineId==='pyramid')return generateNumberPyramid(s,seed);if(engineId==='crossword')return generateCrossword(s,seed,customVocabulary);if(engineId==='magic')return generateMagicSquare(s,seed);if(engineId==='sudoku')return generateSudoku(s,seed);return generateWordSearch(s,seed,customVocabulary);}
  function generatePack(settings,seed='games',customVocabulary=[]){
    const s=normalizeSettings(settings),selected=selectedCompatibleEngines(s),sheets=[];
    if(!selected.length)return {version:VERSION,seed,settings:s,workedExamples:[],sheets:[]};
    const total=s.sheets*s.activitiesPerSheet,enginePlan=Array.from({length:total},(_,i)=>chooseEngine(s,i,seed)),counts={},seen={},difficultyPlans={},operationPlans={},finiteUsed={alphametics:new Set(),symbols:new Set(),verbal:new Set()};
    enginePlan.forEach(id=>counts[id]=(counts[id]||0)+1);for(const [id,count] of Object.entries(counts)){difficultyPlans[id]=weightedDifficultyPlan(s,id,count,seed);if(id==='arithmagon')operationPlans[id]=arithmagonOperationPlan(s,count,seed);}
    let globalIndex=0,capacityMessage='';
    outer:for(let sheetIndex=0;sheetIndex<s.sheets;sheetIndex++){
      const activities=[];
      for(let i=0;i<s.activitiesPerSheet;i++,globalIndex++){
        const engineId=enginePlan[globalIndex],activitySeed=`${seed}:S${sheetIndex+1}:A${i+1}:${engineId}`,pos=seen[engineId]||0,difficulty=difficultyPlans[engineId]?.[pos]||'standard',operation=operationPlans[engineId]?.[pos];seen[engineId]=pos+1;
        let activitySettings=settingsWithDifficulty(s,engineId,difficulty);
        if(engineId==='arithmagon'&&operation)activitySettings=settingsWithEngineOption(activitySettings,engineId,'operation',operation);
        activitySettings=withFiniteExclusions(activitySettings,finiteUsed);
        let activity;
        try{activity=generateActivity(engineId,activitySettings,activitySeed,customVocabulary);}
        catch(err){activity={engineId,title:ENGINES[engineId]?.title||engineId,error:err?.message||'This puzzle could not be generated.'};}
        if(activity?.error&&/No unused .*remain/i.test(String(activity.error))){
          capacityMessage=`${ENGINES[engineId]?.title||'This puzzle type'} has no more unique items for the selected settings. The pack stopped before repeating a puzzle.`;
          if(activities.length)sheets.push({index:sheetIndex+1,activities});
          break outer;
        }
        const key=finiteContentKey(activity);
        if(key){
          const cut=key.indexOf(':'),bank=cut>=0?key.slice(0,cut):key,value=cut>=0?key.slice(cut+1):'';
          if(finiteUsed[bank]?.has(value)){
            capacityMessage=`${ENGINES[engineId]?.title||'This puzzle type'} produced a repeated finite-bank item, so the pack stopped rather than include a duplicate.`;
            if(activities.length)sheets.push({index:sheetIndex+1,activities});
            break outer;
          }
          finiteUsed[bank]?.add(value);
        }
        activities.push(activity);
      }
      if(activities.length)sheets.push({index:sheetIndex+1,activities});
    }
    const workedExamples=s.workedExamples==='front'?selected.map((id,i)=>{const ws=s.engineSettings[id]?.difficulty==='mixed'?settingsWithDifficulty(s,id,'standard'):s;return generateWorkedExample(id,ws,`${seed}:worked:${i}:${id}`,customVocabulary);}).filter(Boolean):[];
    return {version:VERSION,seed,settings:s,workedExamples,sheets,capacityMessage,finiteBankKeys:[...finiteUsed.alphametics].map(x=>`alphametics:${x}`).concat([...finiteUsed.symbols].map(x=>`symbols:${x}`),[...finiteUsed.verbal].map(x=>`verbal:${x}`))};
  }

  const api={VERSION,TOPICS,ENGINES,ARITH,NUMLOGIC,VOCABULARY,VOCABULARY_METADATA,normalizeSettings,normalizeEngineSettings,normalizeDifficultyWeights,weightedDifficultyPlan,settingsWithDifficulty,arithmagonOperationPlan,compatibleEngines,selectedCompatibleEngines,sanitizeCustomVocabulary,vocabularyCountForTopic,vocabularyFor,crosswordVocabularyFor,generateWordSearch,replaceWordSearchEntry,generateNumberPyramid,generateCrossword,generateMagicSquare,generateSudoku,generateMiniSudoku,generateWorkedExample,generateActivity,generatePack,finiteContentKey,normalizeTerm,puzzleTermSuitable,answerEnumeration,needsEnumeration,formatNumber,rngFromSeed,clone,wordSearchDirections,_matrixRank:matrixRank,_pyramidCoefficientRows:pyramidCoefficientRows,_isMagicGrid:isMagicGrid,_magicLineSums:magicLineSums,_magicEquationRows:magicEquationRows,_countSudokuSolutions:countSudokuSolutions,_solveSudokuByLogic:solveSudokuByLogic,_sudokuBoxShape:sudokuBoxShape};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;global.TT99Games=api;
})(typeof globalThis!=='undefined'?globalThis:this);
