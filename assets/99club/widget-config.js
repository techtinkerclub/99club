/* 99 Club Studio · accountless school website widget configuration.
 * Public, read-only configuration. School name/logo and any vocabulary carried
 * by a locked puzzle link are intentionally public once embedded by a school.
 */
(function(global){
'use strict';

const G=global.TT99Generator || (typeof require!=='undefined' ? require('./generator.js') : null);
const PP=global.TT99ParentPractice || (typeof require!=='undefined' ? require('./parent-practice.js') : null);
const B=global.TT99SchoolBrand || (typeof require!=='undefined' ? require('./school-brand.js') : null);
if(!G||!PP||!B)throw new Error('99 Club widget configuration requires generator + parent practice + school brand');

const PREFIX='TT99W1.';
const VERSION=1;
const MAX_TOKEN_LENGTH=32000;
const WIDGET_TYPES=['club','games','combined'];
const CLUB_IDS=['11','22','33','44','55','66','77','88','99','bronze','silver','gold','platinum','diamond'];
const GAME_IDS=[
  'wordsearch','crossword','pyramid','magic','arithmagon','magicshape','numbertrail','numberwheels',
  'maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid',
  'kakuro','arithmeticcages','sumplete','symbols','functionmachine','balance','alphametics','sudoku','futoshiki',
  'nonogram','numberpath','numbertowers','takuzu','killersudoku','hashi','mathsmines','shikaku','cornersum',
  'linkedsum','colourlogic','mobilebalance','diagonalpath','squaresearch','insertops','perimeterregions'
];
const GAME_SET=new Set(GAME_IDS),CLUB_SET=new Set(CLUB_IDS);
const GAME_TITLES={
  wordsearch:'Maths Word Search',crossword:'Maths Crossword',pyramid:'Number Pyramid',magic:'Magic Square',
  arithmagon:'Arithmagon',magicshape:'Magic Shape',numbertrail:'Number Trail',numberwheels:'Number Connections',
  maze:'Correct Answer Maze',propertymaze:'Property Maze',crossnumber:'Maths Crossnumber',numbersearch:'Number Search',
  equationcrossgrid:'Arithmetic Equation Crossgrid',target:'Target Number',brokencalc:'Broken Calculator',operationgrid:'Operation Grid',
  kakuro:'Kakuro',arithmeticcages:'Arithmetic Cages',sumplete:'Sumplete',symbols:'Symbol Decoder',functionmachine:'Function Machine',
  balance:'Balance Lab',alphametics:'Alphametics',sudoku:'Sudoku',futoshiki:'Futoshiki',nonogram:'Nonogram',numberpath:'Number Path',
  numbertowers:'Number Towers',takuzu:'Takuzu',killersudoku:'Killer Sudoku',hashi:'Hashi',mathsmines:'Maths Mines',shikaku:'Shikaku',
  cornersum:'Corner Sums',linkedsum:'Linked Sums',colourlogic:'Colour Logic',mobilebalance:'Mobile Balance',diagonalpath:'Diagonal Path',
  squaresearch:'Square Search',insertops:'Insert Operations',perimeterregions:'Perimeter Regions'
};

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function obj(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function cleanText(v,max=80){return String(v||'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').slice(0,max);}
function cleanLogo(v){
  const s=String(v||'').trim();
  if(!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(s))return '';
  return s.length<=18000?s:'';
}
function cleanIntegrationId(v){
  const s=String(v||'').trim().toLowerCase();
  return /^wid_[a-z0-9]{8,32}$/.test(s)?s:'';
}
function diff(base,current){
  if(Array.isArray(current))return same(base,current)?undefined:clone(current);
  if(!obj(current))return same(base,current)?undefined:current;
  const out={};
  for(const key of Object.keys(current)){
    if(['id','name','tagline','sourceSchemeId','sourceClubId','worksheetTitle','teacherNote'].includes(key))continue;
    const d=diff((obj(base)||Array.isArray(base))?base?.[key]:undefined,current[key]);
    if(d!==undefined)out[key]=d;
  }
  return Object.keys(out).length?out:undefined;
}
function merge(base,patch){
  if(Array.isArray(patch))return clone(patch);
  if(!obj(patch))return patch===undefined?clone(base):patch;
  const out=obj(base)?clone(base):{};
  for(const key of Object.keys(patch))out[key]=merge(out[key],patch[key]);
  return out;
}
function safeScheme(v){const id=String(v||'classic');return G.SCHEME_PRESETS?.[id]?id:'classic';}
function safeOrientation(v){return v==='landscape'?'landscape':'portrait';}
function safeType(v){return WIDGET_TYPES.includes(String(v))?String(v):'combined';}
function cleanPuzzleLink(value){
  const text=String(value||'').trim();if(!text)return '';
  let u;try{u=new URL(text,'https://99studio.uk');}catch(_){return '';}
  if(u.origin!=='https://99studio.uk')return '';
  if(u.pathname!=='/practice/puzzles/'&&!u.pathname.startsWith('/practice/puzzles/'))return '';
  const token=new URLSearchParams(u.hash.replace(/^#/,'' )).get('p')||'';
  if(!/^TT99GP1\./.test(decodeURIComponent(token)))return '';
  return u.href;
}
function cleanPuzzle(entry){
  if(!entry||typeof entry!=='object')return null;
  const link=cleanPuzzleLink(entry.link);if(!link)return null;
  const min=Math.max(1,Math.min(6,Number(entry.minYear)||1));
  const max=Math.max(min,Math.min(6,Number(entry.maxYear)||min));
  const count=Math.max(1,Math.min(12,Number(entry.gameCount)||1));
  const vocabCount=Math.max(0,Math.min(60,Number(entry.vocabCount)||0));
  return {link,minYear:min,maxYear:max,gameCount:count,vocabCount};
}
function normalise(input){
  const src=obj(input)?input:{};
  const widgetType=safeType(src.widgetType||src.type);
  const integrationId=cleanIntegrationId(src.integrationId);
  const schemeId=safeScheme(src.schemeId),orientation=safeOrientation(src.orientation);
  const selectedDefault=widgetType==='games'?[]:CLUB_IDS;
  const selectedClubs=[...new Set((Array.isArray(src.selectedClubs)?src.selectedClubs:selectedDefault).map(String).filter(x=>CLUB_SET.has(x)))];
  const clubPatches={};
  if(obj(src.clubPatches))for(const id of selectedClubs)if(obj(src.clubPatches[id]))clubPatches[id]=clone(src.clubPatches[id]);
  const puzzles=(Array.isArray(src.puzzles)?src.puzzles:[]).map(cleanPuzzle).filter(Boolean).slice(0,4);
  const games=[...new Set((Array.isArray(src.games)?src.games:[]).map(String).filter(x=>GAME_SET.has(x)))].slice(0,24);
  const school=B.normalise({
    name:src.school?.name||src.schoolName||'',
    logo:src.school?.logo||src.schoolLogo||'',
    logoWidth:src.school?.logoWidth||src.logoWidth||0,
    logoHeight:src.school?.logoHeight||src.logoHeight||0
  });
  const tabs=[];
  if((widgetType==='club'||widgetType==='combined')&&selectedClubs.length)tabs.push('clubs');
  if((widgetType==='games'||widgetType==='combined')&&puzzles.length)tabs.push('puzzles');
  if((widgetType==='games'||widgetType==='combined')&&games.length)tabs.push('games');
  const requested=['clubs','puzzles','games'].includes(src.defaultTab)?src.defaultTab:(widgetType==='games'?'puzzles':'clubs');
  const defaultTab=tabs.includes(requested)?requested:(tabs[0]||(widgetType==='games'?'games':'clubs'));
  return {v:VERSION,widgetType,integrationId,school,schemeId,orientation,selectedClubs,clubPatches,puzzles,games,defaultTab};
}
function compactPublic(input){
  const c=normalise(input),out=clone(c);
  if(c.widgetType==='club'){out.puzzles=[];out.games=[];out.defaultTab='clubs';}
  if(c.widgetType==='games'){out.selectedClubs=[];out.clubPatches={};if(!['puzzles','games'].includes(out.defaultTab))out.defaultTab=out.puzzles.length?'puzzles':'games';}
  return out;
}
function fromClubRules(input){
  const src=obj(input)?input:{},schemeId=safeScheme(src.schemeId),orientation=safeOrientation(src.orientation);
  const rulesMap=obj(src.clubs)?src.clubs:{},clubPatches={};
  for(const id of CLUB_IDS){
    const current=rulesMap[id];if(!obj(current))continue;
    const base=PP.baseRules(schemeId,id);if(!base)continue;
    const patch=diff(base,G.normalizeRules(clone(current)));if(patch!==undefined)clubPatches[id]=patch;
  }
  const school={name:src.school?.name||src.school?.schoolName||src.schoolName||'',logo:src.school?.logo||src.school?.logoDataUrl||src.schoolLogo||'',logoWidth:src.school?.logoWidth||src.logoWidth||0,logoHeight:src.school?.logoHeight||src.logoHeight||0};
  return normalise({widgetType:src.widgetType||'club',integrationId:src.integrationId||'',school,schemeId,orientation,selectedClubs:CLUB_IDS,clubPatches,puzzles:src.puzzles||[],games:src.games||[],defaultTab:src.defaultTab});
}
function clubRules(cfg,id){
  const c=normalise(cfg),base=PP.baseRules(c.schemeId,id);
  if(!base||!CLUB_SET.has(String(id)))return null;
  return G.normalizeRules(merge(base,c.clubPatches?.[id]));
}
function clubLink(cfg,id,origin){
  const c=normalise(cfg),rules=clubRules(c,id);if(!rules)return '';
  return PP.buildLink({schemeId:c.schemeId,clubId:String(id),rules,orientation:c.orientation},origin||'https://99studio.uk');
}
function utf8ToB64(text){
  if(typeof Buffer!=='undefined')return Buffer.from(text,'utf8').toString('base64url');
  const bytes=new TextEncoder().encode(text);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64ToUtf8(text){
  if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
  let b64=String(text).replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
  const bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function encode(input){
  const token=PREFIX+utf8ToB64(JSON.stringify(compactPublic(input)));
  if(token.length>MAX_TOKEN_LENGTH)throw new Error('This widget configuration is too large. Use a smaller logo or reduce the number of puzzle packs.');
  return token;
}
function decode(token){
  const raw=String(token||'').trim();
  if(!raw.startsWith(PREFIX))throw new Error('Unsupported widget configuration');
  if(raw.length>MAX_TOKEN_LENGTH)throw new Error('Widget configuration is too large');
  let parsed;try{parsed=JSON.parse(b64ToUtf8(raw.slice(PREFIX.length)));}catch(_){throw new Error('Widget configuration is not valid');}
  if(Number(parsed?.v)!==VERSION)throw new Error('Unsupported widget configuration version');
  return normalise(parsed);
}
function tokenFromText(value){const m=String(value||'').trim().match(/TT99W1\.[A-Za-z0-9_-]+/);return m?m[0]:'';}
function schoolBrandToken(input){
  const c=normalise(input);
  if(!c.school.name&&!c.school.logo)return '';
  try{return B.encode(c.school);}catch(_){return '';}
}
function buildUrl(input,origin){
  const base=String(origin||'https://99studio.uk').replace(/\/+$/,'')||'https://99studio.uk';
  return base+'/widget/#w='+encodeURIComponent(encode(input));
}
function embedCode(input,origin){
  const c=compactPublic(input),src=buildUrl(c,origin);
  const height=c.widgetType==='club'?620:(c.widgetType==='games'?690:720);
  const title=c.widgetType==='club'?'99 Club home practice':c.widgetType==='games'?'Maths games and puzzles':'Maths home practice';
  return '<iframe src="'+src.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" title="'+title+'" loading="lazy" referrerpolicy="origin" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style="display:block;width:100%;height:'+height+'px;border:0;border-radius:14px;" ></iframe>';
}

const api={PREFIX,VERSION,MAX_TOKEN_LENGTH,WIDGET_TYPES,CLUB_IDS,GAME_IDS,GAME_TITLES,cleanIntegrationId,normalise,compactPublic,fromClubRules,clubRules,clubLink,schoolBrandToken,encode,decode,tokenFromText,buildUrl,embedCode};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
global.TT99SchoolWidget=api;
})(typeof window!=='undefined'?window:globalThis);
