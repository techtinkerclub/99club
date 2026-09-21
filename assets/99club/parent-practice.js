/* 99 Club Studio - parent practice link codec
 * Carries school-selected maths rules plus deliberately public school branding
 * (school name + compact logo) in the URL fragment. Pupil/parent details,
 * teacher notes, generated questions, scores and progress are never encoded.
 * The worksheet date is never stored here: parent downloads use generation day.
 */
(function(global){
  'use strict';

  const G=global.TT99Generator || (typeof require!=='undefined' ? require('./generator.js') : null);
  const SU=global.TT99SchoolUsage || (typeof require!=='undefined' ? require('./school-usage.js') : null);
  const B=global.TT99SchoolBrand || (typeof require!=='undefined' ? require('./school-brand.js') : null);
  if(!G||!B)throw new Error('99 Club parent practice requires TT99Generator + TT99SchoolBrand');

  const PREFIX='TT99P1.';
  const VERSION=1;
  const MAX_TOKEN_LENGTH=48000;

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
    const schoolUsageKey=SU?.validSchoolKey?.(input.schoolUsageKey||input.schoolKey||input.schoolUsage?.schoolKey)||'';
    const school=B.normalise(input.school||input.brand||{});
    return {schemeId,clubId,rules,orientation,schoolUsageKey,school};
  }

  function compactPayload(input){
    const cfg=normaliseConfig(input);
    // Keep a complete functional-rules snapshot in the link. Parent links are
    // intended to be long-lived school resources, so a later change to Studio's
    // built-in defaults must not silently change an already-published link.
    // Display/preset metadata is deliberately stripped: the parent URL is a maths
    // configuration, not a place to carry a school, teacher or custom preset name.
    const rules=clone(cfg.rules);
    for(const key of ['id','name','tagline','sourceSchemeId','sourceClubId','worksheetTitle'])delete rules[key];
    const payload={v:VERSION,g:1,s:cfg.schemeId,c:cfg.clubId,o:cfg.orientation==='landscape'?'l':'p',r:rules};
    const school=B.compact(cfg.school);if(Object.keys(school).length)payload.i=school;
    if(cfg.schoolUsageKey)payload.u=cfg.schoolUsageKey;
    return payload;
  }

  function utf8ToBase64Url(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'utf8').toString('base64url');
    let binary='';
    if(typeof TextEncoder!=='undefined'){
      const bytes=new TextEncoder().encode(text);
      const chunk=0x8000;
      for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
    }else binary=unescape(encodeURIComponent(text));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function base64UrlToUtf8(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
    let b64=String(text).replace(/-/g,'+').replace(/_/g,'/');
    while(b64.length%4)b64+='=';
    const binary=atob(b64);
    if(typeof TextDecoder!=='undefined'){
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(escape(binary));
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
    if(!payload.r || typeof payload.r!=='object')throw new Error('This parent practice link does not contain a rules snapshot');
    return normaliseConfig({schemeId,clubId,rules:payload.r,orientation:payload.o==='l'?'landscape':'portrait',schoolUsageKey:payload.u,school:B.expand(payload.i)});
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
    return '<a href="'+href+'" target="_blank" rel="noopener" referrerpolicy="origin" style="'+style+'">'+text+'</a>';
  }

  function websiteCardHtml(link,title,badgeUrl,summary){
    const href=htmlEscape(link);
    const name=htmlEscape(title||'99 Club practice');
    const badge=htmlEscape(badgeUrl||'https://99studio.uk/assets/99club/images/99club-studio-shield.png');
    const detail=htmlEscape(summary||'Printable worksheet + answers');
    return '<a href="'+href+'" target="_blank" rel="noopener" referrerpolicy="origin" style="box-sizing:border-box;display:flex;align-items:center;gap:14px;width:100%;max-width:560px;margin:10px 0;padding:14px 16px;border:1px solid #d6e1e4;border-radius:14px;background:#ffffff;color:#24343b;text-decoration:none;font-family:Arial,Helvetica,sans-serif;box-shadow:0 2px 8px rgba(36,52,59,.08);">'+
      '<img src="'+badge+'" alt="" width="58" height="58" style="display:block;width:58px;height:58px;object-fit:contain;flex:0 0 58px;border:0;">'+
      '<span style="display:block;min-width:0;flex:1 1 auto;">'+
        '<strong style="display:block;margin:0 0 4px;font-size:18px;line-height:1.15;color:#24343b;">'+name+'</strong>'+
        '<span style="display:block;font-size:13px;line-height:1.35;color:#65747b;">'+detail+'</span>'+
      '</span>'+
      '<span aria-hidden="true" style="box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:#147d75;color:#ffffff;font-size:20px;line-height:1;font-weight:700;">→</span>'+
    '</a>';
  }

  const api={PREFIX,VERSION,MAX_TOKEN_LENGTH,baseRules,normaliseConfig,compactPayload,encode,decode,buildLink,buttonHtml,websiteCardHtml};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99ParentPractice=api;
}(typeof window!=='undefined'?window:globalThis));
