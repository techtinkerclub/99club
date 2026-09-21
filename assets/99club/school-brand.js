/* 99 Club Studio - public school branding carried by parent links/widgets.
 * Contains only deliberately public school identity: name + compact logo.
 */
(function(global){
'use strict';
const PREFIX='TT99B1.';
const VERSION=1;
const MAX_LOGO_LENGTH=18000;
const MAX_TOKEN_LENGTH=26000;
function cleanText(v,max=80){return String(v||'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').slice(0,max);}
function cleanLogo(v){
  const s=String(v||'').trim();
  if(!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(s))return '';
  return s.length<=MAX_LOGO_LENGTH?s:'';
}
function dim(v){const n=Math.round(Number(v)||0);return n>0&&n<=2000?n:0;}
function normalise(input){
  const src=input&&typeof input==='object'?input:{};
  const name=cleanText(src.name||src.schoolName||'',80);
  const logo=cleanLogo(src.logo||src.logoDataUrl||'');
  return {name,logo,logoWidth:logo?dim(src.logoWidth||src.width):0,logoHeight:logo?dim(src.logoHeight||src.height):0};
}
function compact(input){const s=normalise(input);const out={};if(s.name)out.n=s.name;if(s.logo){out.l=s.logo;if(s.logoWidth)out.w=s.logoWidth;if(s.logoHeight)out.h=s.logoHeight;}return out;}
function expand(input){const o=input&&typeof input==='object'?input:{};return normalise({name:o.n,logo:o.l,logoWidth:o.w,logoHeight:o.h});}
function b64e(text){
  if(typeof Buffer!=='undefined')return Buffer.from(text,'utf8').toString('base64url');
  const bytes=new TextEncoder().encode(text);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64d(text){
  if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
  let b64=String(text).replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
  const bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new TextDecoder().decode(bytes);
}
function encode(input){
  const token=PREFIX+b64e(JSON.stringify({v:VERSION,s:compact(input)}));
  if(token.length>MAX_TOKEN_LENGTH)throw new Error('School branding is too large for a shared practice link');
  return token;
}
function decode(token){
  const raw=String(token||'').trim();if(!raw)return normalise({});
  if(!raw.startsWith(PREFIX)||raw.length>MAX_TOKEN_LENGTH)throw new Error('Invalid school-brand token');
  let p;try{p=JSON.parse(b64d(raw.slice(PREFIX.length)));}catch(_){throw new Error('Invalid school-brand token');}
  if(Number(p?.v)!==VERSION)throw new Error('Unsupported school-brand token');
  return expand(p.s);
}
function localIsoDate(date=new Date()){
  const pad=n=>String(n).padStart(2,'0');
  return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
}
const api={PREFIX,VERSION,MAX_LOGO_LENGTH,MAX_TOKEN_LENGTH,normalise,compact,expand,encode,decode,localIsoDate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
global.TT99SchoolBrand=api;
})(typeof window!=='undefined'?window:globalThis);
