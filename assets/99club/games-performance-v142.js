/* 99 Club Studio · v1.42 large-pack performance layer
 * Keeps the UI responsive by removing repeated expensive generation/render work.
 * - caches deterministic numeric/arithmetic activities by complete generation context + seed;
 * - uses solver-verified Hashi templates for compatible medium/large packs instead of hundreds of random layout attempts;
 * - limits the browser preview to a representative set of pages while PDFs still contain the full pack;
 * - bounds caches so long classroom sessions do not grow memory indefinitely.
 */
(function(global){
'use strict';
const G=global.TT99Games,NL=global.TT99NumberLogicGames,AR=global.TT99ArithmeticGames;
if(!G||G.__performanceV142)return;
G.__performanceV142=true;
const LARGE_PACK=8,MAX_CACHE=240,MAX_PUPIL_PREVIEW=6,MAX_ANSWER_PREVIEW=6,MAX_WORKED_PREVIEW=2;
const activityCache=new Map();
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function remember(key,value){if(activityCache.has(key))activityCache.delete(key);activityCache.set(key,clone(value));while(activityCache.size>MAX_CACHE)activityCache.delete(activityCache.keys().next().value);return value;}
function cached(key){if(!activityCache.has(key))return null;const v=activityCache.get(key);activityCache.delete(key);activityCache.set(key,v);return clone(v);}
function stableEngineKey(id,settings,seed){const o=settings?.engineSettings?.[id]||{},context={minYear:Number(settings?.minYear)||1,maxYear:Number(settings?.maxYear)||6,topics:Array.isArray(settings?.topics)?settings.topics.slice().sort():[]};return `${id}|${seed}|${JSON.stringify(context)}|${JSON.stringify(o)}`;}
function activityCount(settings){const explicit=Math.round(Number(settings?.activityCount));if(Number.isFinite(explicit)&&explicit>0)return explicit;return Math.max(1,(Number(settings?.sheets)||1)*(Number(settings?.activitiesPerSheet)||1));}

// Medium/large packs previously ran the expensive generators twice in Random + Mixed mode.
// The first pass and the second pass use the same deterministic seed for Standard
// activities, so caching at the engine boundary removes that duplicate work without
// changing the exact mixed-difficulty quota or the generated worksheet content.
if(NL?.generate){const base=NL.generate.bind(NL);NL.generate=function(id,settings,seed){const key=stableEngineKey(id,settings,seed),fast=!!G.__fastPackGeneration;if(fast){const hit=cached(key);if(hit)return hit;if(id==='hashi'){const a=fastHashi(settings,seed);if(a)return remember(key,a);}}const out=base(id,settings,seed);return fast?remember(key,out):out;};}
if(AR?.generate){const base=AR.generate.bind(AR);AR.generate=function(id,settings,seed){const key=stableEngineKey(id,settings,seed),fast=!!G.__fastPackGeneration;if(fast){const hit=cached(key);if(hit)return hit;}const out=base(id,settings,seed);return fast?remember(key,out):out;};}

// A Hashi random-layout search can legitimately try hundreds of solver-checked
// networks. That is useful when producing one puzzle, but disastrous inside a
// multi-activity pack. These three templates were already the engine's validated
// deterministic fallbacks. Rotation/reflection provides eight visual variants per
// difficulty while preserving the exact graph and its unique solution.
const HASHI={
 easy:{board:5,islands:[[4,4],[4,2],[2,2],[2,0],[0,2],[1,4],[0,0]],values:{'0:1':1,'0:5':1,'1:2':1,'2:3':1,'2:4':2,'3:6':0,'4:6':1}},
 standard:{board:7,islands:[[0,2],[0,3],[0,6],[1,2],[1,3],[1,6],[4,2],[5,6],[6,3],[6,6]],values:{'0:1':1,'0:3':2,'1:2':2,'1:4':0,'2:5':1,'3:4':1,'3:6':1,'4:5':0,'4:8':2,'5:7':2,'7:9':0,'8:9':1}},
 challenge:{board:8,islands:[[4,3],[7,3],[7,5],[4,5],[2,5],[2,3],[2,7],[4,1],[1,1],[7,7],[0,7],[0,3]],values:{'0:1':1,'0:3':1,'0:5':1,'0:7':1,'1:2':1,'2:3':1,'2:9':1,'3:4':1,'4:5':0,'4:6':1,'5:11':1,'6:9':0,'6:10':1,'7:8':1,'10:11':0}}
};
function hash(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function candidates(islands){const out=new Set();for(let i=0;i<islands.length;i++){const [r,c]=islands[i];for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){let best=-1,dist=1e9;for(let j=0;j<islands.length;j++){if(i===j)continue;const [rr,cc]=islands[j];let d=1e9;if(dr===0&&rr===r&&(cc-c)*dc>0)d=Math.abs(cc-c);else if(dc===0&&cc===c&&(rr-r)*dr>0)d=Math.abs(rr-r);if(d<dist){dist=d;best=j;}}if(best>=0)out.add([Math.min(i,best),Math.max(i,best)].join(':'));}}return [...out].map(x=>x.split(':').map(Number)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);}
function transform(points,seed){let pts=points.map(p=>p.slice()),max=Math.max(...pts.flat()),h=hash(seed),turns=h%4;for(let k=0;k<turns;k++)pts=pts.map(([r,c])=>[c,max-r]);if((h>>>3)&1)pts=pts.map(([r,c])=>[r,max-c]);return pts;}
function enc(data){const s=JSON.stringify(data);if(typeof btoa==='function')return btoa(unescape(encodeURIComponent(s)));if(typeof Buffer!=='undefined')return Buffer.from(s,'utf8').toString('base64');return s;}
function fastHashi(settings,seed){if(!NL?.DEFINITIONS?.hashi)return null;const raw=settings?.engineSettings?.hashi||{},difficulty=['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:'standard',t=HASHI[difficulty];if(!t)return null;const requestedCount=String(raw.islandCount??'auto'),requestedBoard=String(raw.boardSize??'auto');if(requestedCount!=='auto'&&Number(requestedCount)!==t.islands.length)return null;if(requestedBoard!=='auto'&&Number(requestedBoard)!==t.board)return null;const islands=transform(t.islands,seed),edges=candidates(islands),values=edges.map(e=>t.values[e.join(':')]??0),clues=Array(islands.length).fill(0);edges.forEach(([a,b],i)=>{clues[a]+=values[i];clues[b]+=values[i];});const payload={islands,edges,values,clues};return {engineId:'hashi',title:'Bridges · Hashi',difficulty,islands:islands.map((p,i)=>({r:p[0],c:p[1],clue:clues[i]})),edges:edges.map((e,i)=>({a:e[0],b:e[1],solution:values[i]})),seed,options:{...raw,boardSize:String(t.board),islandCount:String(islands.length)},engineVersion:'1.42-fast-pack',instruction:`Join the islands with horizontal or vertical bridges. Each number tells how many bridges touch that island. Use at most two between a pair, do not cross bridges, and connect every island. [[TT99V140:hashi:${enc(payload)}]]`};}

const basePack=G.generatePack.bind(G);
G.generatePack=function(settings,seed='games',customVocabulary=[]){const count=activityCount(settings),previous=G.__fastPackGeneration;G.__fastPackGeneration=count>=LARGE_PACK;try{return basePack(settings,seed,customVocabulary);}finally{G.__fastPackGeneration=previous;}};

// The old preview rendered every pupil sheet and every answer sheet at the same time.
// A 40-activity pack therefore created roughly forty full A4 DOM pages (plus worked
// examples), even though half of them were hidden. Keep the first representative
// pages in the live preview; the PDF builder still receives the untouched full pack.
function trimPreviewHTML(input){let html=String(input??''),pupil=0,answer=0,worked=0,omittedPupil=0,omittedAnswer=0,omittedWorked=0;const page=/<article class="tt99-game-paper([^\"]*)">[\s\S]*?<\/article>/g;html=html.replace(page,(m,classes)=>{const c=String(classes||'');if(c.includes('is-answer')){answer++;if(answer>MAX_ANSWER_PREVIEW){omittedAnswer++;return '';}return m;}if(c.includes('tt99-worked-page')){worked++;if(worked>MAX_WORKED_PREVIEW){omittedWorked++;return '';}return m;}pupil++;if(pupil>MAX_PUPIL_PREVIEW){omittedPupil++;return '';}return m;});const omitted=omittedPupil+omittedAnswer+omittedWorked;if(omitted){const details=[omittedPupil?`${omittedPupil} pupil sheet${omittedPupil===1?'':'s'}`:'',omittedAnswer?`${omittedAnswer} answer sheet${omittedAnswer===1?'':'s'}`:'',omittedWorked?`${omittedWorked} worked-example page${omittedWorked===1?'':'s'}`:''].filter(Boolean).join(', ');const note=`<div class="tt99-preview-performance-note"><strong>Fast preview</strong><span>${details} hidden from the live preview to keep the browser responsive. The downloaded PDF still contains the complete pack.</span></div>`;html=html.replace('<div class="tt99-games-preview-stack tt99-games-pupil-pages">',`${note}<div class="tt99-games-preview-stack tt99-games-pupil-pages">`);}return html;}
function installPreviewLimiter(){if(typeof Element==='undefined'||typeof document==='undefined')return;const root=document.getElementById('tt99-games-root');if(!root||root.__tt99PreviewLimiter)return;const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');if(!desc?.get||!desc?.set)return;root.__tt99PreviewLimiter=true;Object.defineProperty(root,'innerHTML',{configurable:true,get(){return desc.get.call(this);},set(value){desc.set.call(this,trimPreviewHTML(value));}});const style=document.createElement('style');style.id='tt99-performance-v142-style';style.textContent='.tt99-preview-performance-note{display:flex;gap:8px;align-items:flex-start;margin:0 2px 10px;padding:8px 10px;border:1px solid #cfe1de;border-radius:9px;background:#f5faf9;color:#526a6e;font-size:.65rem;line-height:1.35}.tt99-preview-performance-note strong{flex:0 0 auto;color:#176f67}.tt99-preview-performance-note span{min-width:0}';document.head.appendChild(style);}
installPreviewLimiter();
G.PERFORMANCE={version:'1.42.3',largePackThreshold:LARGE_PACK,maxCache:MAX_CACHE,maxPupilPreview:MAX_PUPIL_PREVIEW,maxAnswerPreview:MAX_ANSWER_PREVIEW,maxWorkedPreview:MAX_WORKED_PREVIEW,clearCache(){activityCache.clear();},cacheSize(){return activityCache.size;},trimPreviewHTML};
})(typeof globalThis!=='undefined'?globalThis:this);
