/* 99 Club Studio - school-level usage telemetry scaffold.
 * Privacy boundary:
 * - organisation/source-site analytics, not pupil/parent tracking
 * - no persistent visitor ID or cookies
 * - staff-side Studio pages may remember one random organisation key locally
 *   so public school resources can share a stable opaque identifier
 * - no worksheet questions, answers, seeds, full URLs, page paths or free text
 * - referrers are reduced to scheme + host only (origin)
 * - parent links may carry only an opaque school-level key and optional widget integration ID
 * Network transmission remains disabled unless TT99_SCHOOL_USAGE_CONFIG.enabled
 * is explicitly switched on and an endpoint is configured.
 */
(function(global){
  'use strict';

  const cfg=global.TT99_SCHOOL_USAGE_CONFIG||{};
  const SCHEMA_VERSION=Number(cfg.schemaVersion)||2;
  const KEY_PREFIX='sch_';

  function cleanSchoolName(value){
    return String(value==null?'':value)
      .replace(/[\u0000-\u001f\u007f]/g,' ')
      .replace(/\s+/g,' ')
      .trim()
      .slice(0,120);
  }

  function normaliseSchoolName(value){
    return cleanSchoolName(value)
      .normalize?.('NFKD')
      ?.replace(/[\u0300-\u036f]/g,'')
      ?.toLowerCase()
      ?.replace(/&/g,' and ')
      ?.replace(/[^a-z0-9]+/g,' ')
      ?.replace(/\s+/g,' ')
      ?.trim() || cleanSchoolName(value).toLowerCase();
  }

  const SCHOOL_KEY_STORE='tt99-school-keys-v1';
  const volatileSchoolKeys={};

  function randomSchoolKey(){
    try{
      const bytes=new Uint8Array(10);
      global.crypto?.getRandomValues?.(bytes);
      if(bytes.some(Boolean)){
        let s='';
        for(const b of bytes)s+=b.toString(36).padStart(2,'0');
        return (KEY_PREFIX+s.replace(/[^a-z0-9]/gi,'')).slice(0,19).toLowerCase();
      }
    }catch(_){}
    return KEY_PREFIX+(Date.now().toString(36)+Math.random().toString(36).slice(2,12)).slice(0,16);
  }

  function readSchoolKeyMap(){
    try{
      const parsed=JSON.parse(global.localStorage?.getItem(SCHOOL_KEY_STORE)||'{}');
      return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
    }catch(_){return {};}
  }

  function makeSchoolKey(name){
    const normal=normaliseSchoolName(name);
    if(!normal)return '';
    const cached=validSchoolKey(volatileSchoolKeys[normal]);
    if(cached)return cached;
    const map=readSchoolKeyMap(),existing=validSchoolKey(map[normal]);
    if(existing){volatileSchoolKeys[normal]=existing;return existing;}
    const key=randomSchoolKey();
    volatileSchoolKeys[normal]=key;
    try{
      map[normal]=key;
      global.localStorage?.setItem(SCHOOL_KEY_STORE,JSON.stringify(map));
    }catch(_){}
    return key;
  }

  function validSchoolKey(value){
    const key=String(value||'').trim();
    return /^sch_[a-z0-9]{8,16}$/i.test(key)?key.toLowerCase():'';
  }

  function schoolDescriptor(name){
    const schoolName=cleanSchoolName(name);
    const schoolKey=makeSchoolKey(schoolName);
    return schoolKey?{schoolKey,schoolName}:null;
  }

  function cleanId(value,max=80){
    const s=String(value==null?'':value).trim();
    return /^[a-zA-Z0-9_-]+$/.test(s)&&s.length<=max?s:'';
  }

  function cleanIntegrationId(value){
    const s=String(value||'').trim().toLowerCase();
    return /^wid_[a-z0-9]{8,32}$/.test(s)?s:'';
  }

  function cleanOrigin(value){
    const text=String(value||'').trim();
    if(!text)return '';
    try{
      const base=global.location?.href||'https://99studio.uk/';
      const url=new URL(text,base);
      if(!/^https?:$/.test(url.protocol))return '';
      return url.origin.slice(0,180);
    }catch(_){return '';}
  }

  function referrerOrigin(){
    try{
      const origin=cleanOrigin(global.document?.referrer||'');
      const own=cleanOrigin(global.location?.origin||'');
      return origin&&origin!==own?origin:'';
    }catch(_){return '';}
  }

  function usageContext(input){
    const c=input&&typeof input==='object'?input:{};
    const integrationId=cleanIntegrationId(c.integrationId||c.integration_id||c.via);
    const sourceOrigin=cleanOrigin(c.sourceOrigin||c.source_origin)||referrerOrigin();
    return {
      integrationId,
      sourceOrigin,
      sourceKind:integrationId?'widget':(sourceOrigin?'referrer':'direct')
    };
  }

  function appendAttribution(out,context){
    const ctx=usageContext(context);
    if(ctx.integrationId)out.integration_id=ctx.integrationId;
    if(ctx.sourceOrigin)out.source_origin=ctx.sourceOrigin;
    out.source_kind=ctx.sourceKind;
    return out;
  }

  function practicePayload(eventName,config){
    const c=config&&typeof config==='object'?config:{};
    const r=c.rules&&typeof c.rules==='object'?c.rules:{};
    const schoolKey=validSchoolKey(c.schoolUsageKey||c.schoolKey||c.schoolUsage?.schoolKey);
    const ctx=usageContext(c.usageContext||c);
    const event=String(eventName||'').trim();
    if(!/^(practice_open|practice_download)$/.test(event))return null;
    if(!schoolKey&&!ctx.sourceOrigin&&!ctx.integrationId)return null;
    const out={
      schema_version:SCHEMA_VERSION,
      event,
      school_key:schoolKey||undefined,
      club_id:cleanId(c.clubId)||'unknown',
      scheme_id:cleanId(c.schemeId)||'unknown',
      question_count:Number.isFinite(Number(r.questionCount))?Number(r.questionCount):undefined,
      mode:cleanId(r.mode)||'unknown',
      orientation:c.orientation==='landscape'?'landscape':'portrait'
    };
    appendAttribution(out,ctx);
    Object.keys(out).forEach(k=>out[k]===undefined&&delete out[k]);
    return out;
  }

  function puzzlePracticePayload(eventName,config){
    const c=config&&typeof config==='object'?config:{};
    const s=c.settings&&typeof c.settings==='object'?c.settings:{};
    const schoolKey=validSchoolKey(c.schoolUsageKey||c.schoolKey||c.schoolUsage?.schoolKey);
    const ctx=usageContext(c.usageContext||c);
    const event=String(eventName||'').trim();
    if(!/^(puzzle_practice_open|puzzle_practice_download)$/.test(event))return null;
    if(!schoolKey&&!ctx.sourceOrigin&&!ctx.integrationId)return null;
    const gameIds=(Array.isArray(s.selectedEngines)?s.selectedEngines:[]).map(id=>cleanId(id)).filter(Boolean).slice(0,50);
    const topicIds=(Array.isArray(s.topics)?s.topics:[]).map(id=>cleanId(id)).filter(Boolean).slice(0,20);
    const gameDifficulties=gameIds.map(id=>{
      const value=cleanId(s.engineSettings?.[id]?.difficulty)||'standard';
      return id+':'+value;
    });
    const out={
      schema_version:SCHEMA_VERSION,
      event,
      school_key:schoolKey||undefined,
      game_ids:gameIds,
      game_count:gameIds.length,
      topic_ids:topicIds,
      game_difficulties:gameDifficulties,
      sheet_count:Number.isFinite(Number(s.sheets))?Number(s.sheets):undefined,
      activities_per_sheet:Number.isFinite(Number(s.activitiesPerSheet))?Number(s.activitiesPerSheet):undefined,
      worked_examples:s.workedExamples==='front'?1:0,
      custom_vocabulary_count:Array.isArray(c.customVocabulary)?Math.min(999,c.customVocabulary.length):0
    };
    appendAttribution(out,ctx);
    Object.keys(out).forEach(k=>out[k]===undefined&&delete out[k]);
    return out;
  }

  function studioUsagePayload(action,schoolName,data){
    const d=schoolDescriptor(schoolName);
    const extra=data&&typeof data==='object'?data:{};
    const sourceOrigin=cleanOrigin(extra.sourceOrigin||extra.source_origin)||referrerOrigin();
    if(!d&&!sourceOrigin)return null;
    const cleanAction=cleanId(action,60);
    if(!cleanAction)return null;
    const out={
      schema_version:SCHEMA_VERSION,
      event:'studio_use',
      action:cleanAction,
      school_key:d?.schoolKey||undefined,
      area:cleanId(extra.area,40)||undefined,
      source_origin:sourceOrigin||undefined
    };
    Object.keys(out).forEach(k=>out[k]===undefined&&delete out[k]);
    return out;
  }

  function widgetPayload(eventName,context){
    const c=context&&typeof context==='object'?context:{};
    const event=String(eventName||'').trim();
    if(!/^(widget_open|widget_item_open)$/.test(event))return null;
    const schoolKey=validSchoolKey(c.schoolKey);
    const sourceOrigin=cleanOrigin(c.sourceOrigin)||referrerOrigin();
    const integrationId=cleanIntegrationId(c.integrationId);
    if(!schoolKey&&!sourceOrigin&&!integrationId)return null;
    const out={
      schema_version:SCHEMA_VERSION,
      event,
      school_key:schoolKey||undefined,
      source_origin:sourceOrigin||undefined,
      source_kind:'widget',
      integration_id:integrationId||undefined,
      widget_type:cleanId(c.widgetType,20)||'unknown',
      club_count:Number.isFinite(Number(c.clubCount))?Math.max(0,Number(c.clubCount)):undefined,
      puzzle_pack_count:Number.isFinite(Number(c.puzzlePackCount))?Math.max(0,Number(c.puzzlePackCount)):undefined,
      online_game_count:Number.isFinite(Number(c.onlineGameCount))?Math.max(0,Number(c.onlineGameCount)):undefined,
      item_type:cleanId(c.itemType,30)||undefined,
      item_id:cleanId(c.itemId,80)||undefined
    };
    Object.keys(out).forEach(k=>out[k]===undefined&&delete out[k]);
    return out;
  }

  function enabled(){
    return cfg.enabled===true && /^https:\/\//i.test(String(cfg.endpoint||'').trim());
  }

  async function sendPayload(payload){
    if(!payload||!enabled())return false;
    const endpoint=String(cfg.endpoint).trim();
    const body=JSON.stringify(payload);
    try{
      if(global.navigator?.sendBeacon){
        const blob=new Blob([body],{type:'application/json'});
        if(global.navigator.sendBeacon(endpoint,blob))return true;
      }
    }catch(_){}
    try{
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body,
        credentials:'omit',
        cache:'no-store',
        keepalive:true,
        referrerPolicy:'no-referrer'
      });
      return !!response.ok;
    }catch(_){return false;}
  }

  function trackPractice(eventName,config){
    return Promise.resolve(sendPayload(practicePayload(eventName,config)));
  }

  function trackPuzzlePractice(eventName,config){
    return Promise.resolve(sendPayload(puzzlePracticePayload(eventName,config)));
  }

  function trackWidget(eventName,context){
    return Promise.resolve(sendPayload(widgetPayload(eventName,context)));
  }

  function trackStudio(action,schoolName,data){
    const registration=registrationPayload(schoolName);
    const usage=studioUsagePayload(action,schoolName,data);
    if(!registration&&!usage)return Promise.resolve(false);
    return Promise.all([
      registration?sendPayload(registration):Promise.resolve(false),
      usage?sendPayload(usage):Promise.resolve(false)
    ]).then(values=>values.some(Boolean));
  }

  function registrationPayload(name){
    const d=schoolDescriptor(name);
    if(!d)return null;
    return {schema_version:SCHEMA_VERSION,event:'school_register',school_key:d.schoolKey,school_name:d.schoolName};
  }

  function registerSchool(name){
    return sendPayload(registrationPayload(name));
  }

  const api={
    enabled,
    cleanSchoolName,
    normaliseSchoolName,
    makeSchoolKey,
    validSchoolKey,
    schoolDescriptor,
    cleanOrigin,
    referrerOrigin,
    cleanIntegrationId,
    usageContext,
    practicePayload,
    puzzlePracticePayload,
    studioUsagePayload,
    widgetPayload,
    registrationPayload,
    registerSchool,
    trackStudio,
    trackPractice,
    trackPuzzlePractice,
    trackWidget
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99SchoolUsage=api;
}(typeof window!=='undefined'?window:globalThis));
