/* 99 Club Studio - locked parent puzzle-pack links.
 * The shared URL contains teaching/generation settings, optional sanitised
 * custom vocabulary, an opaque school usage key and deliberately public school
 * branding (school name + compact logo). Class/date/teacher/pupil data is omitted.
 * Parent downloads always stamp the actual generation date.
 */
(function(global){
  'use strict';

  const G=global.TT99Games || (typeof require!=='undefined' ? require('./games-engine.js') : null);
  const SU=global.TT99SchoolUsage || (typeof require!=='undefined' ? require('./school-usage.js') : null);
  const B=global.TT99SchoolBrand || (typeof require!=='undefined' ? require('./school-brand.js') : null);
  if(!G||!B)throw new Error('Puzzle parent practice requires TT99Games + TT99SchoolBrand');

  const PREFIX='TT99GP1.';
  const VERSION=1;
  const MAX_TOKEN_LENGTH=52000;
  const MAX_CUSTOM_VOCAB=60;

  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}

  function publicSettings(input){
    const s=G.normalizeSettings(clone(input||{}));
    s.includeAnswers=true;
    s.personalisation={
      schoolName:'',
      packTitle:'Maths Games & Puzzles',
      classLabel:'',
      worksheetDate:'',
      logoDataUrl:'',
      logoWidth:0,
      logoHeight:0
    };
    return s;
  }

  function compactVocabulary(entries,settings){
    const s=G.normalizeSettings(settings||{});
    if(!(s.selectedEngines||[]).some(id=>id==='wordsearch'||id==='crossword'))return [];
    const relevant=G.sanitizeCustomVocabulary(entries||[]).filter(x=>
      s.topics.includes(x.topic) && x.minYear<=s.maxYear && x.maxYear>=s.minYear
    );
    if(relevant.length>MAX_CUSTOM_VOCAB)throw new Error('This setup uses too many personal vocabulary entries for one parent link. Export/save the puzzle setup, or reduce the personal vocabulary used by these topics.');
    return relevant.map(x=>[x.topic,x.term,x.definition,x.minYear,x.maxYear]);
  }

  function expandVocabulary(rows){
    const raw=(Array.isArray(rows)?rows:[]).map(row=>({
      topic:row?.[0],term:row?.[1],definition:row?.[2],minYear:row?.[3],maxYear:row?.[4]
    }));
    return G.sanitizeCustomVocabulary(raw);
  }

  function normaliseConfig(input){
    if(!input||typeof input!=='object')throw new Error('Puzzle practice configuration is missing');
    const settings=publicSettings(input.settings||input);
    const customVocabulary=compactVocabulary(input.customVocabulary,settings);
    const schoolUsageKey=SU?.validSchoolKey?.(input.schoolUsageKey||input.schoolKey||input.schoolUsage?.schoolKey)||'';
    const school=B.normalise(input.school||input.brand||{});
    return {settings,customVocabulary,schoolUsageKey,school};
  }

  function utf8ToBase64Url(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'utf8').toString('base64url');
    let binary='';
    if(typeof TextEncoder!=='undefined'){
      const bytes=new TextEncoder().encode(text),chunk=0x8000;
      for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
    }else binary=unescape(encodeURIComponent(text));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function base64UrlToUtf8(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
    let b64=String(text).replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
    const binary=atob(b64);
    if(typeof TextDecoder!=='undefined'){
      const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(escape(binary));
  }

  function compactSettings(settings){
    const s=publicSettings(settings);
    const engineSettings={};
    for(const id of s.selectedEngines||[])if(s.engineSettings?.[id])engineSettings[id]=clone(s.engineSettings[id]);
    return {
      minYear:s.minYear,maxYear:s.maxYear,topics:clone(s.topics),sheets:s.sheets,activitiesPerSheet:s.activitiesPerSheet,
      includeAnswers:true,workedExamples:s.workedExamples,selectedEngines:clone(s.selectedEngines),engineSettings
    };
  }

  function compactPayload(input){
    const cfg=normaliseConfig(input);
    const payload={v:VERSION,s:compactSettings(cfg.settings)};
    const school=B.compact(cfg.school);if(Object.keys(school).length)payload.i=school;
    if(cfg.customVocabulary.length)payload.x=cfg.customVocabulary;
    if(cfg.schoolUsageKey)payload.u=cfg.schoolUsageKey;
    return payload;
  }

  function encode(input){
    const token=PREFIX+utf8ToBase64Url(JSON.stringify(compactPayload(input)));
    if(token.length>MAX_TOKEN_LENGTH)throw new Error('This puzzle setup is too large for one parent link. Remove some personal vocabulary entries or simplify the pack.');
    return token;
  }

  function decode(token){
    const raw=String(token||'').trim();
    if(!raw.startsWith(PREFIX))throw new Error('Unsupported puzzle practice link');
    if(raw.length>MAX_TOKEN_LENGTH)throw new Error('Puzzle practice link is too large');
    let payload;
    try{payload=JSON.parse(base64UrlToUtf8(raw.slice(PREFIX.length)));}catch(_){throw new Error('Puzzle practice link is not valid');}
    if(!payload||Number(payload.v)!==VERSION)throw new Error('Unsupported puzzle practice link version');
    return {
      settings:publicSettings(payload.s||{}),
      customVocabulary:expandVocabulary(payload.x),
      schoolUsageKey:SU?.validSchoolKey?.(payload.u)||'',
      school:B.expand(payload.i)
    };
  }

  function buildLink(input,origin){
    const base=String(origin||'https://99studio.uk').replace(/\/+$/,'')||'https://99studio.uk';
    return base+'/practice/puzzles/#p='+encodeURIComponent(encode(input));
  }

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function websiteCardHtml(link,title,summary){
    const href=esc(link),name=esc(title||'Maths puzzle practice'),detail=esc(summary||'Printable puzzle pack + answers');
    return '<a href="'+href+'" target="_blank" rel="noopener" referrerpolicy="origin" style="box-sizing:border-box;display:flex;align-items:center;gap:14px;width:100%;max-width:560px;margin:10px 0;padding:14px 16px;border:1px solid #d6e1e4;border-radius:14px;background:#ffffff;color:#24343b;text-decoration:none;font-family:Arial,Helvetica,sans-serif;box-shadow:0 2px 8px rgba(36,52,59,.08);">'+
      '<img src="https://99studio.uk/assets/99club/images/99club-studio-shield.png" alt="" width="58" height="58" style="display:block;width:58px;height:58px;object-fit:contain;flex:0 0 58px;border:0;">'+
      '<span style="display:block;min-width:0;flex:1 1 auto;"><strong style="display:block;margin:0 0 4px;font-size:18px;line-height:1.15;color:#24343b;">'+name+'</strong><span style="display:block;font-size:13px;line-height:1.35;color:#65747b;">'+detail+'</span></span>'+
      '<span aria-hidden="true" style="box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:#147d75;color:#ffffff;font-size:20px;line-height:1;font-weight:700;">→</span>'+
    '</a>';
  }

  const api={PREFIX,VERSION,MAX_TOKEN_LENGTH,MAX_CUSTOM_VOCAB,publicSettings,compactSettings,compactVocabulary,normaliseConfig,compactPayload,encode,decode,buildLink,websiteCardHtml};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99GamesParentPractice=api;
}(typeof window!=='undefined'?window:globalThis));
