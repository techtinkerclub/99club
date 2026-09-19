/* 99 Club Studio - parent practice link codec
 * Carries school-selected maths rules in the URL fragment only.
 * No pupil, parent, school-name, logo, seed, score or progress data is encoded.
 */
(function(global){
  'use strict';

  const G=global.TT99Generator || (typeof require!=='undefined' ? require('./generator.js') : null);
  if(!G)throw new Error('99 Club parent practice requires TT99Generator');

  const PREFIX='TT99P1.';
  const VERSION=1;
  const MAX_TOKEN_LENGTH=24000;

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function isObject(value){return !!value && typeof value==='object' && !Array.isArray(value);}
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}

  function baseRules(schemeId,clubId){
    const scheme=G.SCHEME_PRESETS && G.SCHEME_PRESETS[schemeId];
    const base=(scheme&&scheme.presets&&scheme.presets[clubId])
      || (G.CHALLENGE_PRESETS&&G.CHALLENGE_PRESETS[clubId])
      || (clubId==='worksheet'?G.OPEN_WORKSHEET_PRESET:null);
    return base?G.normalizeRules(clone(base)):null;
  }

  function diffObject(base,current){
    if(Array.isArray(current))return same(base,current)?undefined:clone(current);
    if(!isObject(current))return same(base,current)?undefined:current;
    const out={};
    for(const key of Object.keys(current)){
      const diff=diffObject(isObject(base)||Array.isArray(base)?base[key]:undefined,current[key]);
      if(diff!==undefined)out[key]=diff;
    }
    return Object.keys(out).length?out:undefined;
  }

  function mergeObject(base,patch){
    if(Array.isArray(patch))return clone(patch);
    if(!isObject(patch))return patch===undefined?clone(base):patch;
    const out=isObject(base)?clone(base):{};
    for(const key of Object.keys(patch))out[key]=mergeObject(out[key],patch[key]);
    return out;
  }

  function safeId(value,fallback){
    const text=String(value==null?'':value).trim();
    if(!text || text.length>80 || !/^[a-zA-Z0-9_-]+$/.test(text))return fallback;
    return text;
  }

  function normaliseConfig(input){
    if(!input || typeof input!=='object')throw new Error('Practice configuration is missing');
    const schemeId=safeId(input.schemeId,'classic');
    const clubId=safeId(input.clubId,'33');
    const rules=G.normalizeRules(clone(input.rules||baseRules(schemeId,clubId)||G.CLASSIC_PRESETS['33']));
    const orientation=input.orientation==='landscape'?'landscape':'portrait';
    return {schemeId,clubId,rules,orientation};
  }

  function compactPayload(input){
    const cfg=normaliseConfig(input);
    const base=baseRules(cfg.schemeId,cfg.clubId);
    const payload={v:VERSION,s:cfg.schemeId,c:cfg.clubId,o:cfg.orientation==='landscape'?'l':'p'};
    if(base){
      const diff=diffObject(base,cfg.rules);
      if(diff&&Object.keys(diff).length)payload.d=diff;
    }else payload.r=cfg.rules;
    return payload;
  }

  function utf8ToBase64Url(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'utf8').toString('base64url');
    const bytes=new TextEncoder().encode(text);
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function base64UrlToUtf8(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
    let b64=String(text).replace(/-/g,'+').replace(/_/g,'/');
    while(b64.length%4)b64+='=';
    const binary=atob(b64);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encode(input){
    const raw=JSON.stringify(compactPayload(input));
    return PREFIX+utf8ToBase64Url(raw);
  }

  function decode(token){
    const rawToken=String(token||'').trim();
    if(!rawToken.startsWith(PREFIX))throw new Error('Unsupported parent practice link');
    if(rawToken.length>MAX_TOKEN_LENGTH)throw new Error('Parent practice link is too large');
    let payload;
    try{payload=JSON.parse(base64UrlToUtf8(rawToken.slice(PREFIX.length)));}catch(err){throw new Error('Parent practice link is not valid');}
    if(!payload || Number(payload.v)!==VERSION)throw new Error('Unsupported parent practice link version');
    const schemeId=safeId(payload.s,'classic');
    const clubId=safeId(payload.c,'33');
    const base=baseRules(schemeId,clubId);
    let rules;
    if(payload.r)rules=payload.r;
    else if(base)rules=mergeObject(base,payload.d||{});
    else throw new Error('This parent practice preset is not available in this build');
    return normaliseConfig({schemeId,clubId,rules,orientation:payload.o==='l'?'landscape':'portrait'});
  }

  function originBase(origin){
    const raw=String(origin||'https://99studio.uk').replace(/\/+$/,'');
    return raw || 'https://99studio.uk';
  }

  function buildLink(input,origin){
    return originBase(origin)+'/practice/#p='+encodeURIComponent(encode(input));
  }

  function htmlEscape(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }

  function buttonHtml(link,label,variant){
    const href=htmlEscape(link),text=htmlEscape(label||'99 Club practice');
    const styles={
      teal:'display:inline-block;padding:12px 18px;border-radius:10px;background:#147d75;color:#ffffff;text-decoration:none;font:700 16px/1.2 Arial,sans-serif;border:2px solid #147d75;',
      gold:'display:inline-block;padding:12px 18px;border-radius:10px;background:#fff4d6;color:#5f470f;text-decoration:none;font:700 16px/1.2 Arial,sans-serif;border:2px solid #e3b94f;',
      outline:'display:inline-block;padding:12px 18px;border-radius:10px;background:#ffffff;color:#0d5e58;text-decoration:none;font:700 16px/1.2 Arial,sans-serif;border:2px solid #147d75;'
    };
    const style=styles[variant]||styles.teal;
    return '<a href="'+href+'" target="_blank" rel="noopener noreferrer" style="'+style+'">'+text+'</a>';
  }

  const api={PREFIX,VERSION,baseRules,normaliseConfig,compactPayload,encode,decode,buildLink,buttonHtml};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99ParentPractice=api;
}(typeof window!=='undefined'?window:globalThis));
