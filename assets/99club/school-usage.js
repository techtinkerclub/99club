/* 99 Club Studio - school-level usage telemetry scaffold.
 * Privacy boundary:
 * - no pupil/parent identifiers
 * - no persistent visitor ID, cookies or localStorage
 * - no worksheet questions, answers, seeds, URLs or free text
 * - parent links may carry only an opaque school-level key
 * Network transmission remains disabled unless TT99_SCHOOL_USAGE_CONFIG.enabled
 * is explicitly switched on and an endpoint is configured.
 */
(function(global){
  'use strict';

  const cfg=global.TT99_SCHOOL_USAGE_CONFIG||{};
  const SCHEMA_VERSION=Number(cfg.schemaVersion)||1;
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

  function hash32(text,seed){
    let h=(seed>>>0)||2166136261;
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619)>>>0;
    }
    return h>>>0;
  }

  function makeSchoolKey(name){
    const normal=normaliseSchoolName(name);
    if(!normal)return '';
    const a=hash32(normal,2166136261).toString(36).padStart(7,'0');
    const b=hash32(normal,2246822519).toString(36).padStart(7,'0');
    return (KEY_PREFIX+a+b).slice(0,19);
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

  function practicePayload(eventName,config){
    const c=config&&typeof config==='object'?config:{};
    const r=c.rules&&typeof c.rules==='object'?c.rules:{};
    const schoolKey=validSchoolKey(c.schoolUsageKey||c.schoolKey||c.schoolUsage?.schoolKey);
    if(!schoolKey)return null;
    const event=String(eventName||'').trim();
    if(!/^(practice_open|practice_download)$/.test(event))return null;
    const out={
      schema_version:SCHEMA_VERSION,
      event,
      school_key:schoolKey,
      club_id:cleanId(c.clubId)||'unknown',
      scheme_id:cleanId(c.schemeId)||'unknown',
      question_count:Number.isFinite(Number(r.questionCount))?Number(r.questionCount):undefined,
      mode:cleanId(r.mode)||'unknown',
      orientation:c.orientation==='landscape'?'landscape':'portrait'
    };
    Object.keys(out).forEach(k=>out[k]===undefined&&delete out[k]);
    return out;
  }

  function puzzlePracticePayload(eventName,config){
    const c=config&&typeof config==='object'?config:{};
    const s=c.settings&&typeof c.settings==='object'?c.settings:{};
    const schoolKey=validSchoolKey(c.schoolUsageKey||c.schoolKey||c.schoolUsage?.schoolKey);
    if(!schoolKey)return null;
    const event=String(eventName||'').trim();
    if(!/^(puzzle_practice_open|puzzle_practice_download)$/.test(event))return null;
    const gameIds=(Array.isArray(s.selectedEngines)?s.selectedEngines:[]).map(id=>cleanId(id)).filter(Boolean).slice(0,50);
    const out={
      schema_version:SCHEMA_VERSION,
      event,
      school_key:schoolKey,
      game_ids:gameIds,
      game_count:gameIds.length,
      min_year:Number.isFinite(Number(s.minYear))?Number(s.minYear):undefined,
      max_year:Number.isFinite(Number(s.maxYear))?Number(s.maxYear):undefined,
      sheet_count:Number.isFinite(Number(s.sheets))?Number(s.sheets):undefined,
      activities_per_sheet:Number.isFinite(Number(s.activitiesPerSheet))?Number(s.activitiesPerSheet):undefined,
      worked_examples:s.workedExamples==='front'?1:0
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
    const payload=practicePayload(eventName,config);
    if(!payload)return Promise.resolve(false);
    return sendPayload(payload);
  }

  function trackPuzzlePractice(eventName,config){
    const payload=puzzlePracticePayload(eventName,config);
    if(!payload)return Promise.resolve(false);
    return sendPayload(payload);
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
    practicePayload,
    puzzlePracticePayload,
    registrationPayload,
    registerSchool,
    trackPractice,
    trackPuzzlePractice
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99SchoolUsage=api;
}(typeof window!=='undefined'?window:globalThis));
