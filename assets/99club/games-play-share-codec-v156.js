/* 99 Club Studio · compact Online Play challenge links v1.60 */
(function(global){
'use strict';
const GAME_TO_CODE={shikaku:'0',sumplete:'1',nonogram:'2',mathsmines:'3',takuzu:'4',sudoku:'5',futoshiki:'6',killersudoku:'7',cornersum:'8',linkedsum:'9',hashi:'a',numberpath:'b',wordsearch:'c',brokencalc:'d',target:'e',operationgrid:'f',kakuro:'g',arithmeticcages:'h',alphametics:'i',numbertowers:'j',propertymaze:'k',maze:'l',crossnumber:'m',pyramid:'n',magic:'o',arithmagon:'p',magicshape:'q',numbertrail:'r',numberwheels:'s',numbersearch:'t',equationcrossgrid:'u',symbols:'v',functionmachine:'w',balance:'x',crossword:'y'};
const CODE_TO_GAME=Object.fromEntries(Object.entries(GAME_TO_CODE).map(([k,v])=>[v,k]));
const VALUE_TO_CODE={auto:'a',easy:'e',standard:'s',challenge:'h',more:'m',balanced:'b',fewer:'f'};
const CODE_TO_VALUE=Object.fromEntries(Object.entries(VALUE_TO_CODE).map(([k,v])=>[v,k]));
const nativeReplace=history.replaceState.bind(history);
function enc(v){return encodeURIComponent(String(v)).replace(/%2D/gi,'-').replace(/%5F/gi,'_').replace(/%2E/gi,'.');}
function dec(v){try{return decodeURIComponent(v);}catch(_){return v;}}
function compactValue(v){return VALUE_TO_CODE[v]??enc(v);}
function expandValue(v){return CODE_TO_VALUE[v]??dec(v);}
function longParts(input){let u;try{u=new URL(input,global.location.href);}catch(_){return null;}const route=u.pathname.replace(/\/+$/,'')||'/';if(route!=='/play'&&route!=='/tools/99-club/games/play')return null;const game=u.searchParams.get('game'),seed=u.searchParams.get('seed');if(!game||!seed)return null;const mode=u.searchParams.get('mode')==='challenge'?'c':'r',code=GAME_TO_CODE[game]||`_${enc(game)}`;const extras=[];for(const [k,v] of u.searchParams){if(k==='game'||k==='seed'||k==='mode'||k==='c')continue;extras.push(`${enc(k)}:${compactValue(v)}`);}return {u,token:`1~${code}~${mode}~${enc(seed)}~${extras.join(',')}`};}
function compactUrl(input=global.location.href){const p=longParts(input);if(!p){try{return new URL(input,global.location.href).toString();}catch(_){return String(input);}}return `${p.u.origin}${p.u.pathname}?c=${p.token}`;}
function shareUrl(input=global.location.href){const p=longParts(input);if(p)return `${p.u.origin}/c/?c=${p.token}`;const q=new URLSearchParams(global.location.search),token=q.get('c');if(token)return `${global.location.origin}/c/?c=${token}`;return compactUrl(input);}
function expandToken(token,input=global.location.href){const parts=String(token||'').split('~');if(parts.length<4||parts[0]!=='1')return null;const [,g,m,s,...tail]=parts,game=g.startsWith('_')?dec(g.slice(1)):CODE_TO_GAME[g];if(!game)return null;let u;try{u=new URL('/play/',input);}catch(_){return null;}u.search='';u.searchParams.set('game',game);u.searchParams.set('seed',dec(s));u.searchParams.set('mode',m==='c'?'challenge':'relaxed');const extra=tail.join('~');if(extra)for(const item of extra.split(',')){if(!item)continue;const at=item.indexOf(':');if(at<1)continue;u.searchParams.set(dec(item.slice(0,at)),expandValue(item.slice(at+1)));}return u.toString();}
function expandIncoming(){const q=new URLSearchParams(global.location.search),token=q.get('c');if(!token)return false;const expanded=expandToken(token);if(!expanded)return false;nativeReplace(null,'',expanded);return true;}
expandIncoming();
history.replaceState=function(state,title,url){if(url!=null){const p=longParts(url);if(p)return nativeReplace(state,title,compactUrl(url));}return nativeReplace(state,title,url);};
function currentCompactUrl(){return shareUrl(global.location.href);}
global.TT99PlayShareCodec={version:'1.60',compactUrl,shareUrl,expandToken,currentCompactUrl,GAME_TO_CODE,CODE_TO_GAME};
})(typeof globalThis!=='undefined'?globalThis:this);
