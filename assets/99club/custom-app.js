(function(){
  'use strict';
  const G = window.TT99Generator;
  const P = window.TT99SimplePDF;
  const L = window.TT99PDFLayout;
  const root = document.getElementById('tt99-root');
  if (!root || !G || !P || !L) return;

  const STORAGE_KEY = 'tt99-custom-settings-v1';
  const LEGACY_MAIN_STORAGE_KEY = 'tt99-settings-v1';
  const CUSTOM_KEY = 'tt99-custom-presets-v1';
  const VERSION = '1.23.0';
  const APP_NAME = '99 Club Studio · Custom Worksheets';
  const APP_URL = 'https://99studio.uk/tools/99-club/custom/';
  const GENERATION_VERSION = 1;
  const MAX_PRINT_QR_VERSION = 14;
  const MAX_TEACHER_NOTE = 240;
  const PRE_RESTORE_KEY = 'tt99-pre-restore-snapshot-v1';
  const Q = window.TT99QR;
  const SU = window.TT99SchoolUsage;
  const ADVANCED_CHALLENGE_IDS = new Set(['bronze','silver','gold','platinum','diamond']);
  const BADGE_IMAGE_BY_CLUB = {
    '11':'11club.png','22':'22club.png','33':'33club.png','44':'44club.png','55':'55club.png','66':'66club.png','77':'77club.png','88':'88club.png','99':'99club.png',
    bronze:'bronzeclub.png',silver:'silverclub.png',gold:'goldclub.png',platinum:'platinumclub.png',diamond:'diamondclub.png'
  };
  const badgeImageCache = new Map();
  const ALL_TABLES = Array.from({length:12},(_,i)=>i+1);
  const LEGACY_FAMILY_ORDER = ['addition','subtraction','multiply','divide','missing_number','square','square_root','cube','bodmas','scaled_multiply','scaled_divide','fraction_of','percentage_of','negative_numbers','roman_numerals','angle_facts','simple_algebra'];
  const FAMILY_ORDER = Array.isArray(G.FAMILY_ORDER) ? G.FAMILY_ORDER.slice() : LEGACY_FAMILY_ORDER.slice();
  // v1.22.2c: recover the graphical Angles & turns families safely in browsers.
  // custom-angles.js loads before this file and registers the families with the generator;
  // this defensive merge also covers catalogue snapshots made before that registration.
  Object.keys(window.TT99CustomAngles?.ANGLE_FAMILIES || {}).forEach(id=>{ if(!FAMILY_ORDER.includes(id)) FAMILY_ORDER.push(id); });
  // Preserve historical compact-recreation family codes; append new families only after the old prefix.
  const COMPACT_FAMILY_ORDER = Array.isArray(G.FAMILY_COMPACT_ORDER) ? G.FAMILY_COMPACT_ORDER.slice() : FAMILY_ORDER.slice();
  const QUESTION_KIND_ORDER = ['double','repeated_addition',...LEGACY_FAMILY_ORDER,...COMPACT_FAMILY_ORDER.filter(f=>!LEGACY_FAMILY_ORDER.includes(f)&&!['double','repeated_addition'].includes(f))];
  const FRACTION_DENOMINATOR_CHOICES = Array.from({length:11}, (_,i)=>i+2);
  const PERCENTAGE_STEP_CHOICES = Array.from({length:20}, (_,i)=>(i+1)*5);
  const CODE_ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const SCHEME_CODE={classic:'C',addition_first:'AF',arithmetic_first:'AR',missing_number:'MN',tables_first:'TF'};
  const ADVANCED_CODE={bronze:'BRZ',silver:'SLV',gold:'GLD',platinum:'PLT',diamond:'DIA'};
  const ADVANCED_CODE_REV=Object.fromEntries(Object.entries(ADVANCED_CODE).map(([k,v])=>[v,k]));
  const SCHEME_CODE_REV=Object.fromEntries(Object.entries(SCHEME_CODE).map(([k,v])=>[v,k]));
  function randomStudioToken(length=6){
    const bytes=new Uint8Array(length);
    if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);
    else for(let i=0;i<length;i++)bytes[i]=Math.floor(Math.random()*256);
    let out='';for(const b of bytes)out+=CODE_ALPHABET[b%CODE_ALPHABET.length];return out;
  }
  function newStudioSeed(clubId){return `${clubId}-${randomStudioToken(6)}`;}
  const HELP_TEXT = {
    customWorksheet: ['Custom worksheet','Use this for starters, quizzes, homework and targeted practice. Choose direct numerical or concise mathematical prompts, give topics relative weights and set the number of questions. Contextual story word problems are deliberately excluded until they have a separate, richer problem engine.'],
    wholeNumberRange: ['Whole-number difficulty','Sets the upper size used by place-value, rounding, number-property and larger calculation families. An optional Year generation profile can adjust this, and you can override it.'],
    decimalSettings: ['Decimal difficulty','Primary pupils work with tenths and hundredths from Year 4 and with thousandths / up to 3 decimal places in Year 5–6. These controls cap the generated decimal precision and size.'],
    ratioSettings: ['Ratio settings','Controls the size of ratio parts and quantities used in Year 6 equivalent-ratio, scale-factor and unequal-sharing questions.'],
    scheme: ['Ruleset scheme','A scheme changes the default 11–99 progression. Classic 99 Club is the standard starting point. Other schemes are optional alternatives; your edits are remembered separately for each scheme and challenge.'],
    challenge: ['Challenge','Choose the level you want to generate. Bronze, Silver, Gold, Platinum and Diamond are post-99 presets with progressively broader mental-maths content.'],
    perfectAttempts: ['Perfect attempts to advance','How many perfect scores a pupil should achieve before moving on. The Classic scheme now defaults to three; changing this updates the instruction printed on the sheet.'],
    consecutiveAttempts: ['Consecutive perfect attempts','When enabled, the required perfect scores must happen in a row. Leave this off when successful attempts can be accumulated across separate sessions.'],
    questionType: ['Question type','Controls the broad generator mode. “Mixed mental arithmetic” lets you combine several question families and set their relative frequency.'],
    unaided: ['Independent / unaided wording','When enabled, the worksheet instruction states that the challenge should be completed independently and without help.'],
    families: ['Question families','Choose which kinds of questions can appear on a mixed mental-arithmetic sheet. A family that is switched off will not be generated.'],
    weights: ['Relative question mix','Weight means frequency, not difficulty. A family with weight 4 appears about twice as often as one with weight 2. Weights do not need to add to 100; the app shows the approximate percentage and question count.'],
    teacherNote: ['Teacher note','Optional short note for your own future reference. It is printed only at the end of teacher answer sheets, never on pupil worksheets. The note is saved with browser backups/setup files and Full recreation codes, but is deliberately omitted from the compact answer-sheet QR.'],
    arithmeticRanges: ['Arithmetic ranges','These limits control the number pool for addition, subtraction and related advanced families. The answer limit prevents ordinary arithmetic questions from growing beyond the selected size.'],
    negativeAnswers: ['Negative subtraction answers','Allows subtraction facts whose result is below zero. Leave this off for a conventional primary arithmetic sheet.'],
    tables: ['Tables included','Select the multiplication-table families available to multiplication, division and missing-number questions. Named Bronze–Diamond challenges always use all 1–12 tables, so this control is intentionally hidden there.'],
    advancedCore: ['Core challenge maths','Bronze, Silver, Gold, Platinum and Diamond have defining core content. Those core families stay enabled and all basic multiplication/division facts use tables 1–12. You can still change weights, ranges and optional extra families.'],
    factorRange: ['Factor / quotient range','For multiplication this controls the second factor; for division it controls the quotient. Together with the selected tables it defines the fact pool.'],
    multiplyShare: ['Multiplication share','For a mixed multiplication/division challenge, this sets the target proportion of multiplication questions. The remainder are division questions.'],
    missingNumber: ['Missing-number rules','Choose which operations are used and where the blank may appear. For example: 7 × ___ = 42 or 42 ÷ ___ = 7.'],
    powers: ['Powers & radicals','Squares use n², cubes use n³, and square-root questions use exact roots such as √81 = 9. The base ranges control the numbers used to construct those facts.'],
    bodmas: ['Order of operations','Builds expressions that test the order in which operations are carried out. You can choose the permitted operations and whether bracketed expressions are included.'],
    scaled: ['Scaled multiplication / division','Extends known multiplication and division facts by powers of ten, for example 6 × 70 or 4200 ÷ 60. Scaled base ranges are separate from ordinary 1–12 table facts, so changing them does not alter the core multiplication/division families.'],
    roman: ['Roman numerals','Sets the largest whole number used for Roman-numeral conversion questions. This is independent of the ordinary arithmetic answer range.'],
    algebra: ['Simple algebra','Controls the largest unknown value and coefficient used in simple algebra questions. These settings are independent of ordinary multiplication-table facts.'],
    fractionDenominators: ['Fraction denominators','A selected denominator can generate any proper fraction with that denominator, not only a unit fraction. Selecting 5 can therefore produce 1/5, 2/5, 3/5 or 4/5 of a suitable quantity.'],
    customDenominators: ['Custom denominators','Add extra whole-number denominators as a comma-separated list, for example 13, 15, 20. The generator still chooses quantities that give whole-number answers.'],
    fractionQuantity: ['Fraction quantity range','Sets the smallest and largest whole quantity used in “fraction of” questions. The generator only keeps combinations that give a whole-number answer.'],
    percentages: ['Percentages included','Choose the percentage facts that may appear. The standard selector offers 5% steps; only the percentages you enable are used.'],
    customPercentages: ['Custom percentages','Add extra whole-number percentages from 1% to 100%, separated by commas. You can type 37, 42 or 37%, 42%. The generator pairs them with quantities that give whole-number answers.'],
    percentageQuantity: ['Percentage quantity range','Sets the smallest and largest quantity used in percentage questions. Unsuitable combinations that would produce a non-whole answer are skipped.'],
    angleFacts: ['Angle facts','Generates missing-angle facts based on the selected totals: 90° for a right angle, 180° for a straight line, and 360° for a full turn.'],
    duplicates: ['Duplicate handling','“Exact duplicates” avoids the same question appearing twice where possible. Reversed multiplication duplicates treats facts such as 3 × 7 and 7 × 3 as the same fact.'],
    replaceQuestion: ['Replace one question','Use the circular-arrow button in the preview to swap a question you do not want. The new question stays in the same mathematical family—for example a fraction is replaced by another fraction and a square root by another square root.'],
    savePreset: ['Save as reusable preset','Stores the current rule combination as a custom challenge in this browser. It does not upload anything or alter the built-in preset.'],
    resetChallenge: ['Reset this challenge','Restores only the currently selected scheme + challenge to its built-in default rules. Other edited challenges are kept.'],
    resetScheme: ['Reset scheme','Restores every edited 11–99 challenge in the selected scheme. It does not remove your saved custom presets.'],
    layout: ['Page layout','Portrait uses the traditional taller worksheet. Landscape uses the wider page to give questions more horizontal space and, where possible, larger working text. The maths and sheet code do not change.'],
    variants: ['Equivalent versions','Creates up to four equivalent sheets from the same rules. Each version has its own reproducible sheet code and matching answer key.'],
    sheetCode: ['Sheet code','A short reference printed on every sheet. For a standard preset it can rebuild the same questions. If the sheet used edited rules, use the Full recreation code or the QR as well so Studio also knows those rules.'],
    exportSettings: ['Export / import one setup','Use this when you want to move or share one particular setup. The file includes the current rules and exact worksheet versions, but it does not replace the rest of your saved browser work when imported.'],
    browserStorage: ['Saved in this browser','Studio remembers your work automatically on this browser. This is convenient, but it is not an online account: clearing site data, using private browsing, changing browser profile or moving device can remove it. Download a Full backup for anything important.'],
    fullBackup: ['Full backup','Use this as your safety copy. It contains all Studio data saved in this browser, including reusable presets, challenge edits, the current exact sheets and school personalisation/logo. Restore it on this or another browser when you need everything back.'],
    portableCode: ['Full recreation code','Use this to recreate one exact worksheet on another browser without sending a setup file. It contains the worksheet rules and a compact description of the final reviewed question set/order. Superseded review changes are never carried forward. The school logo is not included.'],
    answerQr: ['Recreation QR on answer sheets','Adds a QR to the teacher answer copy only. Scan it to reopen the final reviewed worksheet with the same rules and question order. Studio stores compact final-state references rather than your edit history, so repeated replacements do not steadily make the QR denser. School names and logos are not included, and pupil worksheets never receive the QR.'],
    saveSafety: ['How saving works','For normal weekly use, Studio saves automatically in this browser. Save a reusable preset when you want a rule set again, export one setup when you want to share that setup, and download a Full backup when you want a safety copy of everything.']
  };
  const state = {
    schemeId: 'classic',
    clubId: 'worksheet',
    rules: G.clone(G.OPEN_WORKSHEET_PRESET),
    ruleOverrides: {},
    seed: newStudioSeed('worksheet'),
    variants: 1,
    orientation: 'portrait',
    sheets: [],
    previewVariant: 0,
    previewAnswers: false,
    workspaceView: 'balanced',
    includeAnswerQr: true,
    teacherNote: '',
    school: { schoolName:'', yearGroup:'', className:'', teacherName:'', worksheetDate:'', logoDataUrl:'', logoWidth:0, logoHeight:0 },
    customPresets: loadCustomPresets(),
    advancedOpen: true,
    status: '',
    rulesError: ''
  };
  function analyticsContext(){
    return {
      school_key:SU?.makeSchoolKey?.(state.school?.schoolName||'')||undefined,
      source_origin:SU?.referrerOrigin?.()||undefined,
      app_mode:(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true)?'pwa':'browser'
    };
  }
  function track(name,params){
    window.TT99Analytics?.track(name,{...analyticsContext(),...(params||{})});
  }
  const openCurriculumStrands = new Set();

  root.addEventListener('click',e=>{
    const workspaceViewButton=e.target.closest('[data-workspace-view]');
    if(workspaceViewButton){
      e.preventDefault();
      setWorkspaceView(workspaceViewButton.dataset.workspaceView);
      return;
    }
    const reviewRow=e.target.closest('.tt99-svg-row-review');
    if(reviewRow && !e.target.closest('[data-replace]')){
      const wasActive=reviewRow.classList.contains('is-review-active');
      root.querySelectorAll('.tt99-svg-row-review.is-review-active').forEach(row=>row.classList.remove('is-review-active'));
      if(!wasActive)reviewRow.classList.add('is-review-active');
      return;
    }
    const help=e.target.closest('[data-help-key]');
    if(help){ e.preventDefault(); e.stopPropagation(); const key=help.dataset.helpKey; const pop=root.querySelector('#tt99-help-popover'); const same=help.getAttribute('aria-expanded')==='true' && pop && !pop.hidden; if(same)closeHelp(); else showHelp(help,key); return; }
    if(e.target.closest('.tt99-help-close')){e.preventDefault();closeHelp();return;}
    if(!e.target.closest('#tt99-help-popover'))closeHelp();
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeHelp(); });
  addEventListener('resize',closeHelp);
  addEventListener('scroll',closeHelp,{passive:true});

  migrateLegacyMainCustomWorkspace();
  const restoredExactSheets = restoreSettings();
  if (!restoredExactSheets) generateAll();
  else { refreshSheetCodes(); refreshRulesError(); persist(); }
  render();
  window.addEventListener('load',()=>{
    track('studio_open',{area:'custom'});
    SU?.trackStudio?.('studio_open',state.school?.schoolName||'',{area:'custom'});
  },{once:true});
  setTimeout(loadRecreationFromLocation,0);

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cleanTeacherNote(value){ return String(value==null?'':value).slice(0,MAX_TEACHER_NOTE); }
  function helpButton(key){ const item=HELP_TEXT[key]; if(!item)return ''; return `<button type="button" class="tt99-help-btn" data-help-key="${esc(key)}" aria-label="Help: ${esc(item[0])}" aria-expanded="false">?</button>`; }
  function helpLabel(text,key){ return `<span class="tt99-label-help"><span>${esc(text)}</span>${helpButton(key)}</span>`; }
  function badgeFilenameForClub(clubId){ return BADGE_IMAGE_BY_CLUB[String(clubId||'').toLowerCase()] || ''; }
  function badgeUrlForClub(clubId){ const file=badgeFilenameForClub(clubId); return file ? `/assets/99club/images/${file}` : ''; }
  function currentBadgeName(){ return String(state.rules?.name || state.clubId || '99 Club'); }
  function renderHeaderBadge(){
    const url=badgeUrlForClub(state.clubId);
    if(!url)return `<div class="tt99-paper-badge is-fallback"><span>${esc(currentBadgeName())}</span></div>`;
    return `<div class="tt99-paper-badge"><img src="${esc(url)}" alt="${esc(currentBadgeName())} badge"></div>`;
  }
  function showHelp(button,key){
    const item=HELP_TEXT[key], pop=root.querySelector('#tt99-help-popover'); if(!item||!pop)return;
    root.querySelectorAll('[data-help-key]').forEach(b=>b.setAttribute('aria-expanded','false'));
    pop.innerHTML=`<div class="tt99-help-popover__head"><strong>${esc(item[0])}</strong><button type="button" class="tt99-help-close" aria-label="Close help">×</button></div><p>${esc(item[1])}</p>`;
    pop.hidden=false; button.setAttribute('aria-expanded','true');
    const r=button.getBoundingClientRect(), gap=9, width=Math.min(330,innerWidth-24);
    pop.style.width=`${width}px`; let left=Math.min(innerWidth-width-12,Math.max(12,r.left+r.width/2-width/2));
    let top=r.bottom+gap; const h=pop.offsetHeight||180; if(top+h>innerHeight-12)top=Math.max(12,r.top-gap-h);
    pop.style.left=`${left}px`; pop.style.top=`${top}px`;
  }
  function closeHelp(){ const pop=root.querySelector('#tt99-help-popover'); if(pop)pop.hidden=true; root.querySelectorAll('[data-help-key]').forEach(b=>b.setAttribute('aria-expanded','false')); }
  function loadCustomPresets(){ try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch(e){ return []; } }
  function saveCustomPresets(){ try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.customPresets)); } catch(e) {} }
  function isNamedAdvanced(clubId=state.clubId){ return ADVANCED_CHALLENGE_IDS.has(clubId); }
  function isOpenWorksheet(clubId=state.clubId){
    const id=String(clubId);
    if(id==='worksheet')return true;
    const saved=state.customPresets.find(p=>String(p.id)===id);
    return !!(saved && saved.progressionEnabled===false);
  }
  function advancedCoreFamilies(clubId=state.clubId){
    const base=G.CHALLENGE_PRESETS[clubId];
    return base && base.mode==='family_mix' ? (base.families||[]).slice() : [];
  }
  function constrainNamedChallengeRules(input,clubId=state.clubId){
    let r=G.normalizeRules(input);
    if(!isNamedAdvanced(clubId)) return r;
    const base=G.normalizeRules(G.CHALLENGE_PRESETS[clubId]);
    const hadScaled=(r.families||[]).some(f=>f==='scaled_multiply'||f==='scaled_divide');
    const hadAlgebra=(r.families||[]).includes('simple_algebra');
    const hadRoman=(r.families||[]).includes('roman_numerals');
    r.mode=base.mode;
    r.tables=ALL_TABLES.slice();
    r.factorMin=1;r.factorMax=12;
    if(base.mode==='family_mix'){
      const core=base.families||[];
      const extras=(r.families||[]).filter(f=>!core.includes(f));
      r.families=[...core,...extras];
      const previous=r.familyWeights||{};
      r.familyWeights=Object.fromEntries(r.families.map(f=>[f,previous[f]||base.familyWeights?.[f]||1]));
    }
    // Remove legacy cross-coupling where old factor/arithmetic controls fed unrelated families.
    // Preserve the old value only when that family is actually present so existing intentional
    // advanced edits migrate naturally; otherwise keep the named preset's neutral defaults.
    if(!hadScaled){r.scaledBaseMin=base.scaledBaseMin;r.scaledBaseMax=base.scaledBaseMax;}
    if(!hadAlgebra){r.algebraUnknownMax=base.algebraUnknownMax;r.algebraCoefficientMax=base.algebraCoefficientMax;}
    if(!hadRoman){r.romanMax=base.romanMax;}
    return G.normalizeRules(r);
  }
  function normalizeForContext(input,clubId=state.clubId){ return constrainNamedChallengeRules(input,clubId); }
  function getSchemeById(id){ return G.SCHEME_PRESETS[id] || G.SCHEME_PRESETS.classic; }
  function getScheme(){ return getSchemeById(state.schemeId); }
  function getSchemePreset(id){ return getScheme().presets[id]; }
  function getBasePreset(schemeId,id){
    const scheme=getSchemeById(schemeId);
    return scheme.presets[id] || G.CHALLENGE_PRESETS[id] || (id==='worksheet' ? G.OPEN_WORKSHEET_PRESET : null) || state.customPresets.find(p => p.id === id);
  }
  function getPreset(id){ return getBasePreset(state.schemeId,id); }
  function overrideKey(schemeId=state.schemeId,clubId=state.clubId){ return clubId==='worksheet' ? 'open::worksheet' : `${schemeId}::${clubId}`; }
  function canonical(value){
    if(Array.isArray(value))return value.map(canonical);
    if(value && typeof value==='object')return Object.keys(value).sort().reduce((o,k)=>(o[k]=canonical(value[k]),o),{});
    return value;
  }
  function sameRules(a,b,clubId=state.clubId){ return JSON.stringify(canonical(normalizeForContext(a,clubId)))===JSON.stringify(canonical(normalizeForContext(b,clubId))); }
  function hasRuleOverride(schemeId=state.schemeId,clubId=state.clubId){ return !!state.ruleOverrides[overrideKey(schemeId,clubId)]; }
  function loadRulesFor(schemeId,clubId){
    const base=getBasePreset(schemeId,clubId) || G.CLASSIC_PRESETS['33'];
    const saved=state.ruleOverrides[overrideKey(schemeId,clubId)];
    return normalizeForContext(G.clone(saved || base),clubId);
  }
  function commitCurrentRules(){
    const base=getBasePreset(state.schemeId,state.clubId);
    if(!base)return;
    const key=overrideKey();
    const normalized=normalizeForContext(state.rules,state.clubId);
    state.rules=normalized;
    if(sameRules(normalized,base,state.clubId)) delete state.ruleOverrides[key];
    else state.ruleOverrides[key]=G.clone(normalized);
  }
  function schemeHasOverrides(schemeId=state.schemeId){ return Object.keys(state.ruleOverrides).some(k=>k.startsWith(`${schemeId}::`)); }
  function validExactSheets(sheets,variants,rules){
    return Array.isArray(sheets) && sheets.length===variants && sheets.every(x=>x&&typeof x.seed==='string'&&typeof x.code==='string'&&Array.isArray(x.questions)&&x.questions.length===rules.questionCount);
  }
  function refreshRulesError(){
    const shortest=state.sheets.length?Math.min(...state.sheets.map(s=>s.questions.length)):0;
    if(state.rules.mode==='family_mix' && !(state.rules.families||[]).length){state.rulesError='No topics selected. Choose at least one topic before generating or downloading.';return;}
    state.rulesError=shortest<state.rules.questionCount?`These rules are too restrictive to create ${state.rules.questionCount} valid questions (currently ${shortest}). Widen one or more ranges or enable another question family.`:'';
  }
  function migrateLegacyMainCustomWorkspace(){
    try{
      if(localStorage.getItem(STORAGE_KEY))return;
      const raw=localStorage.getItem(LEGACY_MAIN_STORAGE_KEY);if(!raw)return;
      const s=JSON.parse(raw);
      const saved=(state.customPresets||[]).find(p=>String(p.id)===String(s?.clubId||''));
      const open=String(s?.clubId||'')==='worksheet' || s?.rules?.progressionEnabled===false || saved?.progressionEnabled===false;
      if(open)localStorage.setItem(STORAGE_KEY,raw);
    }catch(e){}
  }
  function settingsPayload(includeLogo=true,includeSheets=true){
    const school={...state.school};
    if(!includeLogo){school.logoDataUrl='';school.logoWidth=0;school.logoHeight=0;}
    return {
      schemeId:state.schemeId,clubId:state.clubId,rules:state.rules,ruleOverrides:state.ruleOverrides,
      variants:state.variants,orientation:state.orientation,seed:state.seed,previewVariant:state.previewVariant,
      previewAnswers:state.previewAnswers,workspaceView:state.workspaceView,includeAnswerQr:state.includeAnswerQr,teacherNote:state.teacherNote,school,
      sheets:includeSheets?state.sheets:undefined
    };
  }
  function restoreSettings(){
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.schemeId='classic';
      if (s.ruleOverrides && typeof s.ruleOverrides==='object' && !Array.isArray(s.ruleOverrides)) state.ruleOverrides=G.clone(s.ruleOverrides);
      const requestedId=String(s.clubId||'worksheet');
      const saved=(state.customPresets||[]).find(p=>String(p.id)===requestedId);
      state.clubId = (requestedId==='worksheet' || saved?.progressionEnabled===false) ? requestedId : 'worksheet';
      const base=getBasePreset(state.schemeId,state.clubId) || G.OPEN_WORKSHEET_PRESET;
      if(s.rules && typeof s.rules==='object' && s.rules.progressionEnabled===false){
        state.rules=normalizeForContext(G.clone(s.rules),state.clubId); commitCurrentRules();
      } else state.rules=normalizeForContext(G.clone(base),state.clubId);
      state.variants = Math.min(4, Math.max(1, Number(s.variants) || 1));
      state.orientation = s.orientation === 'landscape' ? 'landscape' : 'portrait';
      state.school = { ...state.school, ...(s.school || {}) };
      state.seed = s.seed || newStudioSeed(state.clubId);
      state.previewVariant=Math.max(0,Math.min(state.variants-1,Number(s.previewVariant)||0));
      state.previewAnswers=!!s.previewAnswers;
      state.workspaceView=['options','preview'].includes(s.workspaceView)?s.workspaceView:'balanced';
      state.includeAnswerQr=s.includeAnswerQr!==false;
      state.teacherNote=cleanTeacherNote(s.teacherNote||'');
      if(validExactSheets(s.sheets,state.variants,state.rules)){state.sheets=G.clone(s.sheets);refreshSheetCodes();return true;}
    } catch(e) {}
    return false;
  }
  function persist(){
    const payload = settingsPayload(true,true);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch(e) {
      // Logo may exceed browser quota; keep text settings and exact worksheets first.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({...payload,school:{...payload.school,logoDataUrl:'',logoWidth:0,logoHeight:0}})); }
      catch(ignore) {
        // Last-resort fallback keeps configuration even if exact question sets exceed quota.
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsPayload(false,false))); } catch(ignore2) {}
      }
    }
  }

  function functionalRules(rules,clubId=state.clubId){
    const r=G.clone(normalizeForContext(rules,clubId));
    for(const k of ['id','name','tagline','sourceSchemeId','sourceClubId'])delete r[k];
    return r;
  }
  function ruleFingerprint(rules,clubId=state.clubId){
    const bytes=new TextEncoder().encode(JSON.stringify(canonical(functionalRules(rules,clubId))));
    let h=2166136261>>>0;for(const b of bytes){h^=b;h=Math.imul(h,16777619)>>>0;}
    let out='';for(let i=0;i<4;i++){out=CODE_ALPHABET[h%CODE_ALPHABET.length]+out;h=Math.floor(h/CODE_ALPHABET.length);}return out;
  }
  function codePrefix(schemeId=state.schemeId,clubId=state.clubId,edited=(hasRuleOverride(schemeId,clubId)||String(clubId).startsWith('custom-'))){
    let base;if(String(clubId)==='worksheet')base='WKS';
    else if(ADVANCED_CODE[clubId])base=ADVANCED_CODE[clubId];
    else if(/^\d+$/.test(String(clubId)))base=`${SCHEME_CODE[schemeId]||'C'}${clubId}`;
    else base='CUS';
    return edited?`${base}X`:base;
  }
  function displayCode(seed,schemeId=state.schemeId,clubId=state.clubId,rules=state.rules){
    const m=String(seed).match(/-([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5,6})-V([1-4])$/i);
    if(!m)return String(seed).replace(/-V(\d+)$/,'-$1');
    const edited=hasRuleOverride(schemeId,clubId)||String(clubId).startsWith('custom-');
    const prefix=codePrefix(schemeId,clubId,edited),letter=String.fromCharCode(64+Number(m[2]));
    return `${prefix}-G${GENERATION_VERSION}-${m[1].toUpperCase()}-${letter}${edited?`-R${ruleFingerprint(rules,clubId)}`:''}`;
  }
  function refreshSheetCodes(){
    if(!Array.isArray(state.sheets))return;
    state.sheets.forEach(s=>{if(s&&s.seed)s.code=displayCode(s.seed,state.schemeId,state.clubId,state.rules);});
  }
  function generateAll(){
    state.rules = normalizeForContext(state.rules,state.clubId);
    state.sheets = Array.from({length: state.variants}, (_, i) => {
      const variantSeed = `${state.seed}-V${i+1}`;
      return { seed: variantSeed, code: displayCode(variantSeed,state.schemeId,state.clubId,state.rules), questions: G.generateQuestions(state.rules, variantSeed), actions: [] };
    });
    refreshRulesError();
    state.previewVariant = Math.min(state.previewVariant, state.sheets.length - 1);
    persist();
  }
  function newQuestions(){ state.seed = newStudioSeed(state.clubId === 'custom' ? 'C' : state.clubId); generateAll(); state.status='New equivalent questions generated.'; render(); }
  function compactSheetActions(actions){
    const out=[];let segmentStart=0;
    for(const a of (Array.isArray(actions)?actions:[])){
      if(!Array.isArray(a)||!a.length)continue;
      if(a[0]==='s'&&a[1]){out.push(['s',a[1]]);segmentStart=out.length;continue;}
      if(a[0]==='r'||a[0]==='k'){
        const idx=Number(a[1]);if(!Number.isInteger(idx))continue;
        let found=-1;for(let i=out.length-1;i>=segmentStart;i--){if((out[i][0]==='r'||out[i][0]==='k')&&Number(out[i][1])===idx){found=i;break;}}
        const clean=a[0]==='k'?['k',idx,a[2]||'']:['r',idx,a[2],a[3],a[4],a[5]||''];
        if(found>=0)out[found]=clean;else out.push(clean);
      }
    }
    return out;
  }

  function shuffleCurrent(){
    state.sheets = state.sheets.map(s=>{
      const token=randomStudioToken(5);
      const actions=compactSheetActions([...(Array.isArray(s.actions)?s.actions:[]),['s',token]]);
      return { ...s, questions:G.shuffleQuestions(s.questions, `${s.seed}:${token}`), actions };
    });
    persist();state.status='Question order shuffled. The recreation recipe keeps only the compact steps needed to rebuild the current sheet.'; render();
  }

  function workspaceViewClass(){
    return state.workspaceView==='options'?'is-options-focus':state.workspaceView==='preview'?'is-preview-focus':'is-balanced';
  }
  function renderWorkspaceViewSwitcher(){
    const current=state.workspaceView||'balanced';
    const button=(value,label,title)=>`<button type="button" data-workspace-view="${value}" class="${current===value?'is-active':''}" aria-pressed="${current===value?'true':'false'}" title="${title}">${label}</button>`;
    return `<div class="tt99-workspace-view-switcher" aria-label="Workspace panel size"><span>Workspace</span>${button('options','Options','Give more room to worksheet options')}${button('balanced','Balanced','Use the normal 99 Club panel proportions')}${button('preview','Preview','Give more room to the worksheet preview')}</div>`;
  }
  function setWorkspaceView(value){
    const next=['options','balanced','preview'].includes(value)?value:'balanced';
    state.workspaceView=next;
    persist();
    const workspace=root.querySelector('.tt99-workspace--custom');
    if(workspace){
      workspace.classList.remove('is-options-focus','is-balanced','is-preview-focus');
      workspace.classList.add(workspaceViewClass());
    }
    root.querySelectorAll('[data-workspace-view]').forEach(btn=>{
      const active=btn.dataset.workspaceView===next;
      btn.classList.toggle('is-active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function render(){
    root.innerHTML = `
      <div class="tt99-shell tt99-shell--custom">
        <section class="tt99-custom-hero" aria-labelledby="tt99-custom-title">
          <div><span class="tt99-eyebrow">99 Club Studio</span><div class="tt99-custom-title-row"><h1 id="tt99-custom-title">Custom Worksheets</h1><span class="tt99-beta-pill">Beta</span></div><p>Build targeted starters, homework, quizzes and retrieval practice. This workspace is separate so new curriculum, visual and future word-problem generators can grow without changing the stable 99 Club workflow.</p></div>
          <div class="tt99-custom-hero-actions">
            <a class="tt99-secondary tt99-custom-back" href="/">← Back to 99 Club</a><a class="tt99-secondary tt99-custom-back" href="/games/">Games &amp; puzzles</a>
          </div>
        </section>
        <div class="tt99-custom-intro-note"><strong>Build exactly what you need.</strong><span>Custom Worksheets now starts with no topics selected. Choose freely across the curriculum catalogue; supported charts, pie charts, coordinates and angle geometry use deterministic generated visuals.</span></div>
        ${renderWorkspaceViewSwitcher()}
        <div class="tt99-workspace tt99-workspace--custom ${workspaceViewClass()}">
          <aside class="tt99-controls">
            ${renderStepPersonalise()}
            ${renderSavedWorksheetPresets()}
            ${renderStepRules()}
            ${renderStepGenerate()}
          </aside>
          <main class="tt99-preview-panel">
            ${renderPreviewToolbar()}
            <div class="tt99-preview-wrap">${renderPaper()}</div>
            <div class="tt99-privacy"><strong>Private by design.</strong> Questions, names and school logos are processed only on this device.</div>
          </main>
        </div>
        <div id="tt99-help-popover" class="tt99-help-popover" role="dialog" aria-live="polite" hidden></div>
      </div>`;
    bindEvents();
  }

  function renderSavedWorksheetPresets(){
    const saved=(state.customPresets||[]).filter(p=>p.progressionEnabled===false);
    if(!saved.length)return '';
    return `<section class="tt99-card tt99-card--saved-custom"><div class="tt99-saved-custom-head"><div><strong>Saved worksheet setups</strong><small>Reuse a topic mix you saved in this browser.</small></div><button type="button" class="tt99-linkbtn" id="tt99-new-custom-setup">Start fresh</button></div><div class="tt99-saved-custom-grid">${saved.map(p=>`<div class="tt99-custom-wrap">${clubCard(p,true)}<button type="button" class="tt99-custom-delete" data-delete-preset="${esc(p.id)}" aria-label="Delete ${esc(p.name)} preset" title="Delete saved worksheet setup">×</button></div>`).join('')}</div></section>`;
  }

  function renderStepClub(){
    const scheme=getScheme();
    const classics = Object.keys(scheme.presets).map(id => clubCard(scheme.presets[id])).join('');
    const challenges = Object.values(G.CHALLENGE_PRESETS).map(p => clubCard(p)).join('');
    const customs = state.customPresets.map(p => `<div class="tt99-custom-wrap">${clubCard(p, true)}<button type="button" class="tt99-custom-delete" data-delete-preset="${esc(p.id)}" aria-label="Delete ${esc(p.name)} preset" title="Delete custom preset">×</button></div>`).join('');
    const schemeOptions=Object.values(G.SCHEME_PRESETS).map(x=>`<option value="${esc(x.id)}" ${x.id===state.schemeId?'selected':''}>${esc(x.name)}</option>`).join('');
    return `<section class="tt99-card">
      <div class="tt99-step"><span>2</span><div><h2>Choose what to make ${helpButton('challenge')}</h2><p>Use the flexible worksheet for ordinary classroom practice, or choose a 99 Club challenge.</p></div></div>
      <div class="tt99-club-section-label">Flexible classroom worksheet ${helpButton('customWorksheet')}</div>
      <div class="tt99-open-choice">${clubCard(G.OPEN_WORKSHEET_PRESET)}</div>
      <div class="tt99-club-section-label tt99-club-section-label--advanced">99 Club progression</div>
      <label class="tt99-field tt99-scheme-select">${helpLabel('Ruleset scheme','scheme')}<select id="tt99-scheme">${schemeOptions}</select><small>${esc(scheme.tagline)}</small></label>
      <div class="tt99-club-grid">${classics}</div>
      <div class="tt99-club-section-label tt99-club-section-label--advanced">Post-99 challenges</div>
      <div class="tt99-club-grid tt99-club-grid--advanced">${challenges}</div>
      ${customs?`<div class="tt99-club-section-label tt99-club-section-label--advanced">Saved reusable preset</div><div class="tt99-club-grid">${customs}</div>`:''}
    </section>`;
  }

  function clubCard(p, custom=false){
    const selected = state.clubId === p.id;
    const edited=hasRuleOverride(state.schemeId,p.id);
    const badge=custom?(edited?'Custom · Edited':'Custom'):(edited?'Edited':'');
    return `<button type="button" class="tt99-club ${selected?'is-selected':''} ${custom?'is-custom':''} ${edited?'is-edited':''}" data-club="${esc(p.id)}" aria-pressed="${selected}">
      <strong>${esc(p.name)}</strong><span>${esc(p.tagline || 'Saved reusable preset')}</span>${badge?`<em>${esc(badge)}</em>`:''}
    </button>`;
  }

  function renderStepPersonalise(){
    const s=state.school;
    return `<section class="tt99-card">
      <div class="tt99-step"><span>1</span><div><h2>Personalise the sheet</h2><p>Optional. These details are remembered on this browser.</p></div></div>
      <div class="tt99-form-grid">
        ${field('School name','schoolName',s.schoolName,'e.g. Oakfield Primary School','wide')}
        ${field('Year group','yearGroup',s.yearGroup,'e.g. Year 4')}
        ${field('Class','className',s.className,'e.g. 4B')}
        ${field('Teacher','teacherName',s.teacherName,'e.g. Mrs Patel')}
        <label class="tt99-field"><span>Date on sheet</span><input data-school="worksheetDate" type="date" value="${esc(s.worksheetDate)}"></label>
      </div>
      <div class="tt99-logo-row">
        <div class="tt99-logo-preview">${s.logoDataUrl?`<img src="${s.logoDataUrl}" alt="School logo preview">`:'<span>LOGO</span>'}</div>
        <div><label class="tt99-upload"><input id="tt99-logo" type="file" accept="image/png,image/jpeg,image/webp"><span>${s.logoDataUrl?'Replace school logo':'Add school logo'}</span></label>${s.logoDataUrl?'<button type="button" class="tt99-linkbtn" id="tt99-remove-logo">Remove logo</button>':''}<small>PNG, JPG or WebP. Resized locally for print.</small></div>
      </div>
    </section>`;
  }
  function field(label,key,value,placeholder,cls=''){ return `<label class="tt99-field ${cls}"><span>${label}</span><input data-school="${key}" type="text" maxlength="80" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`; }

  function customRulesSummary(r){
    const topics=Array.isArray(r.families)?r.families.length:0;
    const year=Number(r.curriculumYear)||0;
    const timing=r.timeEnabled===false?'Untimed':`${Number(r.timeMinutes)||5} min`;
    return `${Number(r.questionCount)||0} questions · ${topics} topic${topics===1?'':'s'} · ${timing}${year?` · Year ${year} generation profile`:''}`;
  }

  function renderStepRules(){
    const r=state.rules;
    const edited=hasRuleOverride();
    const open=isOpenWorksheet();
    return `<section class="tt99-card">
      <div class="tt99-step tt99-step--rules"><span>2</span><div><h2>Build the worksheet</h2><p id="tt99-summary">${esc(customRulesSummary(r))}</p>${edited?`<small class="tt99-rule-state">Edited ${open?'worksheet setup':'for this scheme + challenge'}</small>`:''}${state.rulesError?`<div class="tt99-rule-error">${esc(state.rulesError)}</div>`:''}</div></div>
      <div class="tt99-rule-actions">
        <button type="button" class="tt99-secondary" id="tt99-toggle-rules">${state.advancedOpen?'Hide worksheet options':'Choose topics & options'}</button>
        <span class="tt99-action-help-wrap"><button type="button" class="tt99-ghost" id="tt99-reset-rules" ${edited?'':'disabled'}>Reset worksheet</button>${helpButton('resetChallenge')}</span>
        ${open?'':`<span class="tt99-action-help-wrap"><button type="button" class="tt99-ghost" id="tt99-reset-scheme" ${schemeHasOverrides()?'':'disabled'}>Reset scheme</button>${helpButton('resetScheme')}</span>`}
      </div>
      ${state.advancedOpen ? renderAdvancedRules() : ''}
    </section>`;
  }

  function renderAdvancedRules(){
    const r=state.rules;
    const namedAdvanced=isNamedAdvanced();
    const open=isOpenWorksheet();
    const mathModes=[
      ['double','Doubling'],['repeated_addition','Repeated addition'],['addition','Addition'],['add_subtract','Addition & subtraction'],
      ['multiply','Multiplication'],['divide','Division'],['mixed','Mixed × and ÷'],['missing_number','Missing-number facts'],['family_mix','Mixed mental arithmetic']
    ];
    const hasFamily=(...ids)=>r.mode==='family_mix' && ids.some(id=>r.families.includes(id));
    const tableFamilies=['multiply','divide','missing_number','fact_families','distributive_law','correspondence'];
    const needTables=['multiply','divide','mixed','missing_number'].includes(r.mode) || hasFamily(...tableFamilies);
    const needArithmetic=['addition','add_subtract'].includes(r.mode) || hasFamily('addition','subtraction','negative_numbers','add_sub_missing','number_bonds','three_addends','fact_families');
    const needSubtraction=r.mode==='add_subtract' || hasFamily('subtraction');
    const needMissing=r.mode==='missing_number' || hasFamily('missing_number');
    const needSquares=hasFamily('square','square_root');
    const needCubes=hasFamily('cube');
    const needBodmas=hasFamily('bodmas');
    const needScaled=hasFamily('scaled_multiply','scaled_divide');
    const needFractionOf=hasFamily('fraction_of');
    const needAnyFractions=hasFamily('fraction_of','equivalent_fractions','simplify_fractions','fraction_compare','mixed_improper','fraction_add_subtract','fraction_multiply_whole','fraction_multiply','fraction_divide_whole','fraction_sequences');
    const needPercentages=hasFamily('percentage_of');
    const needAngles=hasFamily('angle_facts');
    const needRoman=hasFamily('roman_numerals');
    const needAlgebra=hasFamily('simple_algebra');
    const needWholeNumbers=hasFamily('number_words','place_value','compare_numbers','rounding_whole','rounding_custom','number_sequences','more_less','partition_number','odd_even','factor_check','multiple_check','factor_pairs','common_factors','common_multiples','prime_numbers','number_bonds','three_addends','fact_families','distributive_law','correspondence','long_division','powers_of_10','add_sub_missing','multidigit_add_subtract','multidigit_multiply','division_remainders','estimate_calculation');
    const needDecimals=hasFamily('decimal_place_value','decimal_compare','decimal_rounding','decimal_scale','decimal_add_subtract','decimal_multiply','decimal_divide','fraction_decimal_percent','decimal_to_fraction','fraction_to_decimal','fraction_division_decimal','percentage_compare','powers_of_10');
    const needRatios=hasFamily('ratio_missing','ratio_share','scale_factor','unit_rate');
    const needCoordinates=hasFamily('coordinates','coordinate_reflection');
    const needStats=hasFamily('mean');
    return `<div class="tt99-advanced">
      ${namedAdvanced?`<div class="tt99-core-note"><strong>${esc(r.name)} core maths is fixed ${helpButton('advancedCore')}</strong><span>All basic multiplication/division uses tables 1–12 and the families that define this named challenge stay enabled. Change weights and meaningful ranges, or add optional extras. Save as a custom preset if you want a completely different structure.</span></div>`:''}
      <div class="tt99-advanced-section"><span class="tt99-field-label">${open?'Worksheet settings':'Challenge settings'}</span>
        <div class="tt99-form-grid">
          ${open?textRuleField('Worksheet title','worksheetTitle',r.worksheetTitle||'Maths Practice','e.g. Morning Starter'):''}
          ${open?`<label class="tt99-field"><span>Generation profile (optional)</span><select data-rule="curriculumYear"><option value="0" ${!r.curriculumYear?'selected':''}>Mixed / custom</option>${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${Number(r.curriculumYear)===y?'selected':''}>Year ${y}</option>`).join('')}</select><small>This adjusts age-sensitive ranges for selected topics. It never selects topics for you.</small></label>`:''}
          <label class="tt99-field"><span>Number of questions</span><input data-rule="questionCount" type="number" min="1" max="200" value="${r.questionCount}"></label>
          ${open?`<label class="tt99-check tt99-check--field"><input data-rule-check="timeEnabled" type="checkbox" ${r.timeEnabled!==false?'checked':''}><span>Timed worksheet</span></label>${r.timeEnabled!==false?`<label class="tt99-field"><span>Time limit (minutes)</span><input data-rule="timeMinutes" type="number" min="0.25" max="60" step="0.25" value="${r.timeMinutes}"></label>`:''}`:`<label class="tt99-field"><span>Time limit (minutes)</span><input data-rule="timeMinutes" type="number" min="0.25" max="60" step="0.25" value="${r.timeMinutes}"></label><label class="tt99-field">${helpLabel('Perfect attempts to advance','perfectAttempts')}<input data-rule="perfectAttempts" type="number" min="1" max="10" value="${r.perfectAttempts}"></label>${namedAdvanced?`<label class="tt99-field tt99-readonly-field"><span>Challenge structure</span><div>${r.mode==='family_mix'?'Mixed mental arithmetic':'Mixed × and ÷'}</div><small>Fixed for the named challenge.</small></label>`:`<label class="tt99-field">${helpLabel('Question type','questionType')}<select data-rule="mode">${mathModes.map(([v,l])=>`<option value="${v}" ${r.mode===v?'selected':''}>${l}</option>`).join('')}</select></label>`}`}
        </div>
        ${open?'':`<label class="tt99-check"><input data-rule-check="consecutivePerfectAttempts" type="checkbox" ${r.consecutivePerfectAttempts?'checked':''}><span>Perfect attempts must be consecutive ${helpButton('consecutiveAttempts')}</span></label>`}
        <label class="tt99-check"><input data-rule-check="unaided" type="checkbox" ${r.unaided?'checked':''}><span>State that the sheet should be completed independently/unaided ${helpButton('unaided')}</span></label>
      </div>
      ${r.mode==='family_mix'?renderFamilySelector(r)+renderFamilyWeights(r):''}
      <details class="tt99-custom-advanced-settings"><summary><b>Advanced difficulty & number ranges</b><span>Usually leave these at the year/profile defaults</span></summary><div class="tt99-custom-advanced-settings__body">
      ${r.mode==='double'?`<div class="tt99-inline-fields">${numField('Smallest number','numberMin',r.numberMin,0,100)}${numField('Largest number','numberMax',r.numberMax,0,100)}</div>`:''}
      ${r.mode==='repeated_addition'?`<div class="tt99-inline-fields">${numField('Smallest addend','addendMin',r.addendMin,0,100)}${numField('Largest addend','addendMax',r.addendMax,0,100)}${numField('Minimum repeats','repeatsMin',r.repeatsMin,2,20)}${numField('Maximum repeats','repeatsMax',r.repeatsMax,2,20)}</div>`:''}
      ${needWholeNumbers?`<div class="tt99-advanced-section"><span class="tt99-field-label">Whole-number difficulty ${helpButton('wholeNumberRange')}</span><div class="tt99-inline-fields">${numField('Largest whole number','wholeNumberMax',r.wholeNumberMax||1000,20,10000000)}</div></div>`:''}
      ${needArithmetic?`<div class="tt99-advanced-section"><span class="tt99-field-label">Arithmetic ranges ${helpButton('arithmeticRanges')}</span><div class="tt99-inline-fields">${numField('Smallest arithmetic operand','arithmeticOperandMin',r.arithmeticOperandMin,0,5000)}${numField('Largest arithmetic operand','arithmeticOperandMax',r.arithmeticOperandMax,1,5000)}${numField('Arithmetic answer limit','arithmeticMax',r.arithmeticMax,1,5000)}</div>${needSubtraction?`<label class="tt99-check"><input data-rule-check="allowNegativeAnswers" type="checkbox" ${r.allowNegativeAnswers?'checked':''}><span>Allow subtraction questions with negative answers ${helpButton('negativeAnswers')}</span></label>`:''}</div>`:''}
      ${needTables&&!namedAdvanced?renderTableSelector(r):''}
      ${needTables&&!namedAdvanced?`<div class="tt99-inline-fields tt99-inline-fields--with-help"><span class="tt99-inline-help">${helpButton('factorRange')}</span>${numField('Smallest factor / quotient','factorMin',r.factorMin,0,100)}${numField('Largest factor / quotient','factorMax',r.factorMax,0,100)}</div>`:''}
      ${r.mode==='mixed'?`<div class="tt99-advanced-section"><span class="tt99-field-label">Multiplication / division mix ${helpButton('multiplyShare')}</span><label class="tt99-field tt99-percent"><span>Multiplication share <b>${r.multiplyPercent}%</b></span><input data-rule="multiplyPercent" type="range" min="0" max="100" step="5" value="${r.multiplyPercent}"></label></div>`:''}
      ${needMissing?`<div class="tt99-advanced-section"><span class="tt99-field-label">Missing-number rules ${helpButton('missingNumber')}</span>${renderStringChoiceSelector('Operations','missingOperation',[['multiply','Multiplication'],['divide','Division']],r.missingNumberOperations)}${renderStringChoiceSelector('Where the blank can appear','missingPosition',[['multiply_first','First factor'],['multiply_second','Second factor'],['multiply_result','Product / result'],['divide_dividend','Dividend'],['divide_divisor','Divisor'],['divide_result','Quotient / result']],r.missingNumberPositions)}</div>`:''}
      ${(needSquares||needCubes)?`<div class="tt99-advanced-section"><span class="tt99-field-label">Powers & radicals ${helpButton('powers')}</span>${needSquares?`<div class="tt99-inline-fields">${numField('Smallest square/root base','squareMin',r.squareMin,0,50)}${numField('Largest square/root base','squareMax',r.squareMax,0,50)}</div>`:''}${needCubes?`<div class="tt99-inline-fields">${numField('Smallest cube base','cubeMin',r.cubeMin,0,20)}${numField('Largest cube base','cubeMax',r.cubeMax,0,20)}</div>`:''}<small class="tt99-help">Square roots are marked as extension rather than statutory primary content.</small></div>`:''}
      ${needBodmas?`<div class="tt99-advanced-section"><span class="tt99-field-label">Order of operations ${helpButton('bodmas')}</span><div class="tt99-inline-fields">${numField('Largest base number','bodmasMax',r.bodmasMax,2,30)}</div>${renderStringChoiceSelector('Operations allowed','bodmasOperation',[['add','+ addition'],['subtract','− subtraction'],['multiply','× multiplication'],['divide','÷ division']],r.bodmasOperations)}<label class="tt99-check"><input data-rule-check="bodmasUseBrackets" type="checkbox" ${r.bodmasUseBrackets?'checked':''}><span>Include bracketed expressions</span></label></div>`:''}
      ${needScaled?`<div class="tt99-advanced-section"><span class="tt99-field-label">Scaled multiplication / division ${helpButton('scaled')}</span><div class="tt99-inline-fields">${numField('Smallest scaled base','scaledBaseMin',r.scaledBaseMin,0,100)}${numField('Largest scaled base','scaledBaseMax',r.scaledBaseMax,0,100)}</div>${renderChoiceSelector('Scale factors','scaledMultiplier',[10,100,1000],r.scaledMultipliers,n=>`×${n}`)}</div>`:''}
      ${needAnyFractions?`<div class="tt99-advanced-section"><span class="tt99-field-label">Fractions ${helpButton('fractionDenominators')}</span>${renderChoiceSelector('Fraction denominators','fractionDenominator',FRACTION_DENOMINATOR_CHOICES,r.fractionDenominators,n=>`${n}`,'fractionDenominators')}${customListField('Add custom denominators','tt99-custom-denominators',r.fractionDenominators.filter(n=>!FRACTION_DENOMINATOR_CHOICES.includes(n)).join(', '),'e.g. 13, 15, 20','Whole-number denominators from 2 to 100. Separate values with commas.','customDenominators')}${needFractionOf?`<div class="tt99-inline-fields tt99-inline-fields--with-help"><span class="tt99-inline-help">${helpButton('fractionQuantity')}</span>${numField('Smallest quantity','fractionQuantityMin',r.fractionQuantityMin,1,5000)}${numField('Largest quantity','fractionQuantityMax',r.fractionQuantityMax,1,5000)}</div>`:''}</div>`:''}
      ${needPercentages?`<div class="tt99-advanced-section"><span class="tt99-field-label">Percentages of quantities ${helpButton('percentages')}</span>${renderChoiceSelector('Percentages included','percentageChoice',PERCENTAGE_STEP_CHOICES,r.percentageChoices,n=>`${n}%`,'percentages')}${customListField('Add custom percentages','tt99-custom-percentages',r.percentageChoices.filter(n=>!PERCENTAGE_STEP_CHOICES.includes(n)).map(n=>`${n}%`).join(', '),'e.g. 15%, 37%, 42%','Whole-number percentages from 1% to 100%. Separate values with commas; the % sign is optional.','customPercentages')}<div class="tt99-inline-fields tt99-inline-fields--with-help"><span class="tt99-inline-help">${helpButton('percentageQuantity')}</span>${numField('Smallest quantity','percentageQuantityMin',r.percentageQuantityMin,10,5000)}${numField('Largest quantity','percentageQuantityMax',r.percentageQuantityMax,10,5000)}</div></div>`:''}
      ${needDecimals?`<div class="tt99-advanced-section"><span class="tt99-field-label">Decimals ${helpButton('decimalSettings')}</span><div class="tt99-inline-fields">${numField('Maximum decimal places','decimalPlacesMax',r.decimalPlacesMax||2,1,3)}${numField('Largest whole-number part','decimalWholeMax',r.decimalWholeMax||100,1,10000)}</div><small class="tt99-help">Up to 3 decimal places is statutory in upper KS2; individual families still use age-appropriate constructions.</small></div>`:''}
      ${needRatios?`<div class="tt99-advanced-section"><span class="tt99-field-label">Ratio & proportion ${helpButton('ratioSettings')}</span><div class="tt99-inline-fields">${numField('Largest ratio part','ratioPartMax',r.ratioPartMax||8,2,30)}${numField('Largest shared/scaled quantity','ratioQuantityMax',r.ratioQuantityMax||120,10,5000)}</div></div>`:''}
      ${needRoman?`<div class="tt99-advanced-section"><span class="tt99-field-label">Roman numerals ${helpButton('roman')}</span><div class="tt99-inline-fields">${numField('Largest Roman-numeral value','romanMax',r.romanMax,10,3999)}</div></div>`:''}
      ${needAlgebra?`<div class="tt99-advanced-section"><span class="tt99-field-label">Simple algebra ${helpButton('algebra')}</span><div class="tt99-inline-fields">${numField('Largest unknown value','algebraUnknownMax',r.algebraUnknownMax,5,100)}${numField('Largest coefficient','algebraCoefficientMax',r.algebraCoefficientMax,2,50)}</div></div>`:''}
      ${needAngles?`<div class="tt99-advanced-section"><span class="tt99-field-label">Angle facts ${helpButton('angleFacts')}</span>${renderChoiceSelector('Whole-turn / angle totals','angleTotal',[90,180,360],r.angleTotals,n=>`${n}°`)}</div>`:''}
      ${needCoordinates?`<div class="tt99-advanced-section"><span class="tt99-field-label">Coordinates</span><div class="tt99-inline-fields">${numField('Largest coordinate value','coordinateMax',r.coordinateMax||12,4,100)}</div><label class="tt99-check"><input data-rule-check="coordinateFourQuadrants" type="checkbox" ${r.coordinateFourQuadrants?'checked':''}><span>Use all four quadrants (Year 6)</span></label></div>`:''}
      ${needStats?`<div class="tt99-advanced-section"><span class="tt99-field-label">Statistics</span><div class="tt99-inline-fields">${numField('Largest data value','statsValueMax',r.statsValueMax||30,5,1000)}</div></div>`:''}
      </div></details>
      <div class="tt99-check-row">
        <label class="tt99-check"><input data-rule-check="avoidExactDuplicates" type="checkbox" ${r.avoidExactDuplicates?'checked':''}><span>Avoid exact duplicate questions where possible ${helpButton('duplicates')}</span></label>
        ${['multiply','mixed'].includes(r.mode) || hasFamily('multiply')?`<label class="tt99-check"><input data-rule-check="avoidReversedDuplicates" type="checkbox" ${r.avoidReversedDuplicates?'checked':''}><span>Treat 3 × 7 and 7 × 3 as duplicates ${helpButton('duplicates')}</span></label>`:''}
      </div>
      <div class="tt99-save-preset"><span class="tt99-save-preset-help">${helpButton('savePreset')}</span><input id="tt99-preset-name" type="text" maxlength="40" placeholder="Preset name, e.g. Year 5 Decimals Starter"><button type="button" id="tt99-save-preset" class="tt99-secondary">Save as reusable preset</button></div>
    </div>`;
  }

  function renderFamilySelector(r){
    const core=isNamedAdvanced()?advancedCoreFamilies():[];
    const meta=G.FAMILY_META||{};
    const strandOrder=['Number & place value','Number properties','Calculation','Fractions','Decimals & percentages','Ratio & proportion','Measurement','Geometry','Algebra','Statistics','Extension'];
    function yearsText(m){const ys=(m?.years||[]);if(!ys.length)return m?.extension?'Extension':'';return ys.length===1?`Y${ys[0]}`:`Y${Math.min(...ys)}–${Math.max(...ys)}`;}
    function grouped(ids,locked=false){
      return strandOrder.map(strand=>{
        const list=ids.filter(f=>(meta[f]?.strand||'Other')===strand);if(!list.length)return '';
        const selected=list.filter(f=>r.families.includes(f)).length;
        const shouldOpen=locked || openCurriculumStrands.has(strand);
        const chips=list.map(f=>locked?`<span class="tt99-family-locked">${esc(G.FAMILY_LABELS[f]||f)} <small>${esc(yearsText(meta[f]))}</small><b aria-hidden="true">✓</b></span>`:`<label title="${esc(`${strand} · ${yearsText(meta[f])}`)}"><input type="checkbox" data-family="${f}" ${r.families.includes(f)?'checked':''}><span>${esc(G.FAMILY_LABELS[f]||f)}<small>${esc(yearsText(meta[f]))}</small></span></label>`).join('');
        const strandActions=!locked&&selected?`<div class="tt99-family-strand-actions"><button type="button" class="tt99-linkbtn" data-clear-family-strand="${esc(strand)}">Clear selected in ${esc(strand)}</button></div>`:'';
        return `<details class="tt99-family-strand ${selected?'has-selected':''}" data-strand="${esc(strand)}" ${shouldOpen?'open':''}><summary><b>${esc(strand)}</b><small>${locked?`${list.length} core`:`${selected}/${list.length} selected`}</small></summary>${strandActions}<div class="tt99-family-chips ${locked?'tt99-family-chips--locked':''}">${chips}</div></details>`;
      }).join('');
    }
    if(core.length){const extras=FAMILY_ORDER.filter(f=>!core.includes(f));return `<div class="tt99-family-select"><span class="tt99-field-label">Question families ${helpButton('families')}</span><div class="tt99-family-group-label">Core families — always included</div>${grouped(core,true)}<div class="tt99-family-group-label">Optional extras</div>${grouped(extras,false)}<small>Named challenges keep their defining core families. Optional extras can be added or removed; use the weights below to control frequency.</small></div>`;}
    const selectedTotal=r.families.length;
    const selectionTools=isOpenWorksheet()?`<div class="tt99-family-selection-tools"><div><b>${selectedTotal} topic${selectedTotal===1?'':'s'} selected</b><small>Nothing is selected automatically. Open any category and choose exactly the content you want.</small></div><button type="button" class="tt99-secondary" id="tt99-clear-all-families" ${selectedTotal?'':'disabled'}>Clear all selections</button></div>`:'';
    return `<div class="tt99-family-select"><span class="tt99-field-label">Choose topics ${helpButton('families')}</span>${selectionTools}${grouped(FAMILY_ORDER,false)}<small>Choose freely across the curriculum catalogue. Weights control frequency, not difficulty. Supported charts, pie charts, coordinate and angle geometry use generated visuals; other diagram-heavy topics remain staged until their dedicated renderers are ready.</small></div>`;
  }
  function renderFamilyWeights(r){
    if(!r.families.length)return `<div class="tt99-family-weights-empty"><b>Topic weights will appear here after you select at least one topic.</b></div>`;
    const total=r.families.reduce((sum,f)=>sum+(Number(r.familyWeights[f])||1),0)||1;
    const rows=r.families.map(f=>{const w=Number(r.familyWeights[f])||1;const pct=100*w/total;const count=Math.round(r.questionCount*w/total);return `<label><span>${esc(G.FAMILY_LABELS[f]||f)}<small>≈ ${pct.toFixed(pct<10?1:0)}% · ${count} q</small></span><input type="number" min="1" max="20" step="1" value="${w}" data-family-weight="${esc(f)}"></label>`;}).join('');
    const open=r.families.length<=12;
    return `<details class="tt99-family-weights" ${open?'open':''}><summary><span class="tt99-field-label">Adjust topic weights ${helpButton('weights')}</span><small>${r.families.length} topic${r.families.length===1?'':'s'} selected</small></summary><div>${rows}</div><p class="tt99-family-weight-note"><strong>Weight is frequency, not difficulty.</strong> Weights set the relative mix and do not need to add to 100. Percentages and question counts are estimates for the current sheet size.</p></details>`;
  }
  function renderChoiceSelector(label,key,choices,selected,labelFn,helpKey=''){
    const set=new Set((selected||[]).map(Number));
    return `<div class="tt99-choice-select"><span class="tt99-field-label">${esc(label)} ${helpButton(helpKey)}</span><div>${choices.map(n=>`<label><input type="checkbox" data-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${n}" ${set.has(n)?'checked':''}><span>${esc(labelFn(n))}</span></label>`).join('')}</div></div>`;
  }
  function renderStringChoiceSelector(label,key,choices,selected){
    const set=new Set((selected||[]).map(String));
    const attr=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
    return `<div class="tt99-choice-select"><span class="tt99-field-label">${esc(label)}</span><div>${choices.map(([value,text])=>`<label><input type="checkbox" data-${attr}="${esc(value)}" ${set.has(value)?'checked':''}><span>${esc(text)}</span></label>`).join('')}</div></div>`;
  }

  function numField(label,key,value,min,max){ return `<label class="tt99-field"><span>${label}</span><input data-rule="${key}" type="number" min="${min}" max="${max}" value="${value}"></label>`; }
  function textRuleField(label,key,value,placeholder=''){ return `<label class="tt99-field wide"><span>${esc(label)}</span><input data-rule="${esc(key)}" type="text" maxlength="60" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`; }
  function customListField(label,id,value,placeholder,help,helpKey=''){ return `<label class="tt99-field tt99-custom-list">${helpLabel(label,helpKey)}<input id="${esc(id)}" type="text" spellcheck="false" value="${esc(value)}" placeholder="${esc(placeholder)}"><small>${esc(help)}</small></label>`; }
  function renderTableSelector(r){
    return `<div class="tt99-table-select"><span class="tt99-field-label">Tables included ${helpButton('tables')}</span><div class="tt99-table-chips">${Array.from({length:12},(_,i)=>i+1).map(n=>`<label><input type="checkbox" data-table="${n}" ${r.tables.includes(n)?'checked':''}><span>${n}×</span></label>`).join('')}</div><div class="tt99-mini-actions"><button type="button" data-tables-action="all">1–12</button><button type="button" data-tables-action="core">2, 3, 5, 10</button><button type="button" data-tables-action="single">2× only</button></div></div>`;
  }

  function renderStepGenerate(){
    const shortCodeNeedsRules=hasRuleOverride() || state.clubId.startsWith('custom-');
    const canUndo=hasPreRestoreSnapshot();
    return `<section class="tt99-card tt99-card--action">
      <div class="tt99-step"><span>3</span><div><h2>Review, generate and download</h2><p>Create up to four equivalent versions. Answer keys use matching sheet codes.</p></div></div>
      <div class="tt99-layout-control"><span class="tt99-field-label">Page layout ${helpButton('layout')}</span><div class="tt99-layout-picker" role="group" aria-label="Page layout">
        <button type="button" class="tt99-layout-option ${state.orientation==='portrait'?'is-selected':''}" data-page-orientation="portrait" aria-pressed="${state.orientation==='portrait'}"><span class="tt99-page-icon tt99-page-icon--portrait" aria-hidden="true"></span><span><b>Portrait</b><small>Classic worksheet layout</small></span></button>
        <button type="button" class="tt99-layout-option ${state.orientation==='landscape'?'is-selected':''}" data-page-orientation="landscape" aria-pressed="${state.orientation==='landscape'}"><span class="tt99-page-icon tt99-page-icon--landscape" aria-hidden="true"></span><span><b>Landscape</b><small>Wider, larger working text</small></span></button>
      </div></div>
      <label class="tt99-field tt99-variants-control">${helpLabel('Equivalent versions','variants')}<select id="tt99-variants">${[1,2,3,4].map(n=>`<option value="${n}" ${state.variants===n?'selected':''}>${n} ${n===1?'version':'versions'}</option>`).join('')}</select></label>
      <label class="tt99-check tt99-answer-qr"><input id="tt99-answer-qr" type="checkbox" ${state.includeAnswerQr?'checked':''}><span><b>Recreation QR on answer sheets ${helpButton('answerQr')}</b><small>Recommended. Teacher copies can be scanned back into 99 Club Studio; pupil worksheets never include the QR. School personalisation is not embedded in the QR.</small></span></label>
      <label class="tt99-teacher-note"><span class="tt99-field-label">Teacher note ${helpButton('teacherNote')}</span><textarea id="tt99-teacher-note" rows="3" maxlength="${MAX_TEACHER_NOTE}" placeholder="Optional note for the answer sheet, e.g. revisit decimal place value next week.">${esc(state.teacherNote)}</textarea><small><span>Printed only on teacher answer sheets.</span><b id="tt99-teacher-note-count">${state.teacherNote.length} / ${MAX_TEACHER_NOTE}</b></small></label>
      <div class="tt99-action-row"><button type="button" class="tt99-primary" id="tt99-new" ${state.rulesError?'disabled':''}>Generate new questions</button><button type="button" class="tt99-secondary" id="tt99-shuffle" ${state.rulesError?'disabled':''}>Shuffle order</button></div>
      <div class="tt99-recreate"><div><strong>Recreate from sheet code ${helpButton('sheetCode')}</strong><small>${shortCodeNeedsRules?'This sheet uses customised rules. The short code alone is not enough on another browser; use the Full recreation code or the teacher QR so those rules travel with the sheet.':'For an unchanged built-in challenge, this short code is enough to rebuild the same questions.'}</small></div><div><input id="tt99-sheet-code" type="text" maxlength="100" spellcheck="false" placeholder="e.g. C99-G1-7FK2M9-A"><button type="button" id="tt99-recreate" class="tt99-secondary">Recreate</button></div></div>
      <div class="tt99-downloads"><button id="tt99-pdf-student" class="tt99-download" ${state.rulesError?'disabled':''}><b>Worksheet PDF</b><span>Pupil sheets only</span></button><button id="tt99-pdf-answer" class="tt99-download" ${state.rulesError?'disabled':''}><b>Answer key PDF</b><span>Matching answers${state.includeAnswerQr?' + QR':''}</span></button><button id="tt99-pdf-both" class="tt99-download tt99-download--accent" ${state.rulesError?'disabled':''}><b>Worksheet + answers</b><span>One complete PDF</span></button></div>
      <div class="tt99-save-safety"><div><strong>Saved automatically on this browser ${helpButton('saveSafety')}</strong><small>You can carry on without saving manually. Download a Full backup before clearing site data, changing browser/device, or whenever you want a safety copy of everything.</small></div><button type="button" class="tt99-secondary" id="tt99-backup-all">Download full backup</button></div>
      <details class="tt99-portability"><summary>Save, import, reuse & move your work ${helpButton('browserStorage')}</summary>
        <div class="tt99-portability__body">
          <div class="tt99-save-map"><div><b>Reuse rules</b><span>Save as a reusable preset in Step 3.</span></div><div><b>Move one setup</b><span>Export / import the current setup below.</span></div><div><b>Protect everything</b><span>Use Full backup above.</span></div><div><b>Recreate one sheet</b><span>Use its sheet code, full recreation code, or teacher QR.</span></div></div>
          <div class="tt99-portable-block"><div><strong>Full recreation code ${helpButton('portableCode')}</strong><small>Copy/paste method for one exact reviewed worksheet. It includes the rules, final question order and teacher note, but not the school logo.</small></div><button type="button" class="tt99-secondary" id="tt99-copy-full-code">Copy full recreation code</button><div class="tt99-portable-load"><textarea id="tt99-full-code" rows="3" spellcheck="false" placeholder="Paste a TT99R recreation code here"></textarea><button type="button" class="tt99-secondary" id="tt99-load-full-code">Recreate</button></div></div>
          <div class="tt99-portable-block"><div><strong>Full browser backup ${helpButton('fullBackup')}</strong><small>Your complete Studio safety copy: reusable presets, challenge edits, exact sheets, school details and logo. Restore it when moving browser/device or recovering cleared site data.</small></div><div class="tt99-config-actions"><label class="tt99-linkbtn tt99-import">Restore full backup<input id="tt99-restore-backup" type="file" accept="application/json,.json"></label>${canUndo?'<button type="button" class="tt99-linkbtn" id="tt99-undo-restore">Undo last restore</button>':''}</div></div>
          <div class="tt99-portable-block"><div><strong>One setup file ${helpButton('exportSettings')}</strong><small>A file for this one current setup. Use it to archive or share one challenge without replacing the rest of the recipient's saved Studio work.</small></div><div class="tt99-config-actions"><button type="button" class="tt99-linkbtn" id="tt99-export-settings">Export this setup</button><label class="tt99-linkbtn tt99-import">Import a setup<input id="tt99-import-settings" type="file" accept="application/json,.json"></label></div></div>
        </div>
      </details>
      ${state.status?`<div class="tt99-status" role="status">${esc(state.status)}</div>`:''}
    </section>`;
  }

  function renderPreviewToolbar(){
    return `<div class="tt99-preview-toolbar"><div><strong>Print preview</strong><span>${esc(state.previewAnswers?'Answer key':'Pupil worksheet')} · Use ↻ beside a question to replace it with another of the same type.</span><span class="tt99-preview-mobile-hint">On a phone, swipe sideways to inspect the page. Tap a question to show its ↻ replacement control.</span></div><div class="tt99-preview-tabs">${state.sheets.map((s,i)=>`<button data-preview-variant="${i}" class="${i===state.previewVariant?'is-active':''}">Version ${String.fromCharCode(65+i)}</button>`).join('')}</div><div class="tt99-preview-mode"><button data-preview-mode="student" class="${!state.previewAnswers?'is-active':''}">Worksheet</button><button data-preview-mode="answers" class="${state.previewAnswers?'is-active':''}">Answers</button></div></div>`;
  }

  function renderPaper(){
    const sheet=state.sheets[state.previewVariant];
    if(!sheet)return '';
    if(!(state.rules.families||[]).length)return `<div class="tt99-empty-preview"><div><b>Your worksheet is empty by design.</b><span>Open a category on the left and select the exact topics you want. Nothing is preselected.</span></div></div>`;
    let qrMatrix=null;
    if(state.previewAnswers&&state.includeAnswerQr){
      try{qrMatrix=qrResultForVariant(state.previewVariant)?.matrix||null;}catch(err){qrMatrix=null;}
    }
    return L.renderPreviewSvg({
      rules:state.rules,
      sheet,
      school:state.school,
      answers:state.previewAnswers,
      orientation:state.orientation,
      qrMatrix,
      badgeUrl:badgeUrlForClub(state.clubId),
      teacherNote:state.teacherNote
    });
  }
  function bindEvents(){
    root.querySelector('#tt99-scheme')?.addEventListener('change',e=>selectScheme(e.target.value));
    root.querySelectorAll('[data-club]').forEach(btn=>btn.addEventListener('click',()=>selectClub(btn.dataset.club)));
    root.querySelectorAll('[data-delete-preset]').forEach(btn=>btn.addEventListener('click',()=>deletePreset(btn.dataset.deletePreset)));
    root.querySelectorAll('[data-school]').forEach(input=>input.addEventListener('input',()=>{ state.school[input.dataset.school]=input.value; persist(); softRenderPaper(); }));
    const logo=root.querySelector('#tt99-logo'); if(logo) logo.addEventListener('change',handleLogo);
    root.querySelector('#tt99-remove-logo')?.addEventListener('click',()=>{ state.school.logoDataUrl='';state.school.logoWidth=0;state.school.logoHeight=0;persist();render(); });
    root.querySelector('#tt99-toggle-rules')?.addEventListener('click',()=>{state.advancedOpen=!state.advancedOpen;render();});
    root.querySelector('#tt99-reset-rules')?.addEventListener('click',resetRules);
    root.querySelector('#tt99-reset-scheme')?.addEventListener('click',resetScheme);
    root.querySelectorAll('[data-rule]').forEach(input=>input.addEventListener(input.type==='range'?'input':'change',()=>ruleChanged(input.dataset.rule,input.value)));
    root.querySelectorAll('[data-rule-check]').forEach(input=>input.addEventListener('change',()=>ruleChanged(input.dataset.ruleCheck,input.checked)));
    root.querySelectorAll('[data-family]').forEach(input=>input.addEventListener('change',e=>familiesChanged(e)));
    root.querySelectorAll('details.tt99-family-strand').forEach(d=>d.addEventListener('toggle',()=>{const strand=d.dataset.strand;if(!strand)return;if(d.open)openCurriculumStrands.add(strand);else openCurriculumStrands.delete(strand);}));
    root.querySelector('#tt99-clear-all-families')?.addEventListener('click',clearAllFamilies);
    root.querySelectorAll('[data-clear-family-strand]').forEach(btn=>btn.addEventListener('click',()=>clearFamilyStrand(btn.dataset.clearFamilyStrand)));
    root.querySelector('#tt99-new-custom-setup')?.addEventListener('click',()=>{state.clubId='worksheet';state.rules=normalizeForContext(G.clone(G.OPEN_WORKSHEET_PRESET),'worksheet');state.ruleOverrides={};openCurriculumStrands.clear();state.seed=newStudioSeed('worksheet');state.advancedOpen=true;generateAll();state.status='Fresh Custom Worksheet setup started with no topics selected.';render();});
    root.querySelectorAll('[data-family-weight]').forEach(input=>input.addEventListener('change',()=>familyWeightChanged(input.dataset.familyWeight,input.value)));
    root.querySelectorAll('[data-fraction-denominator]').forEach(input=>input.addEventListener('change',fractionChoicesChanged));
    root.querySelector('#tt99-custom-denominators')?.addEventListener('change',fractionChoicesChanged);
    root.querySelectorAll('[data-percentage-choice]').forEach(input=>input.addEventListener('change',percentageChoicesChanged));
    root.querySelector('#tt99-custom-percentages')?.addEventListener('change',percentageChoicesChanged);
    root.querySelectorAll('[data-scaled-multiplier]').forEach(input=>input.addEventListener('change',scaledMultiplierChoicesChanged));
    root.querySelectorAll('[data-angle-total]').forEach(input=>input.addEventListener('change',angleTotalChoicesChanged));
    root.querySelectorAll('[data-missing-operation]').forEach(input=>input.addEventListener('change',missingOperationChoicesChanged));
    root.querySelectorAll('[data-missing-position]').forEach(input=>input.addEventListener('change',missingPositionChoicesChanged));
    root.querySelectorAll('[data-bodmas-operation]').forEach(input=>input.addEventListener('change',bodmasOperationChoicesChanged));
    root.querySelectorAll('[data-table]').forEach(input=>input.addEventListener('change',tablesChanged));
    root.querySelectorAll('[data-tables-action]').forEach(btn=>btn.addEventListener('click',()=>tableAction(btn.dataset.tablesAction)));
    root.querySelector('#tt99-save-preset')?.addEventListener('click',savePreset);
    root.querySelectorAll('[data-page-orientation]').forEach(btn=>btn.addEventListener('click',()=>setOrientation(btn.dataset.pageOrientation)));
    root.querySelector('#tt99-variants')?.addEventListener('change',e=>{state.variants=Number(e.target.value);generateAll();render();});
    root.querySelector('#tt99-answer-qr')?.addEventListener('change',e=>{state.includeAnswerQr=!!e.target.checked;persist();render();});
    root.querySelector('#tt99-teacher-note')?.addEventListener('input',e=>{state.teacherNote=cleanTeacherNote(e.target.value);if(e.target.value!==state.teacherNote)e.target.value=state.teacherNote;const count=root.querySelector('#tt99-teacher-note-count');if(count)count.textContent=`${state.teacherNote.length} / ${MAX_TEACHER_NOTE}`;persist();softRenderPaper();});
    root.querySelector('#tt99-new')?.addEventListener('click',newQuestions);
    root.querySelector('#tt99-shuffle')?.addEventListener('click',shuffleCurrent);
    root.querySelector('#tt99-recreate')?.addEventListener('click',recreateFromCode);
    root.querySelector('#tt99-sheet-code')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();recreateFromCode();}});
    root.querySelectorAll('[data-preview-variant]').forEach(btn=>btn.addEventListener('click',()=>{state.previewVariant=Number(btn.dataset.previewVariant);render();}));
    root.querySelectorAll('[data-preview-mode]').forEach(btn=>btn.addEventListener('click',()=>{state.previewAnswers=btn.dataset.previewMode==='answers';render();}));
    root.querySelectorAll('[data-replace]').forEach(btn=>{btn.addEventListener('click',()=>replaceOne(Number(btn.dataset.replace)));btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();replaceOne(Number(btn.dataset.replace));}});});
    root.querySelector('#tt99-pdf-student')?.addEventListener('click',()=>downloadPDF('student'));
    root.querySelector('#tt99-pdf-answer')?.addEventListener('click',()=>downloadPDF('answers'));
    root.querySelector('#tt99-pdf-both')?.addEventListener('click',()=>downloadPDF('both'));
    root.querySelector('#tt99-export-settings')?.addEventListener('click',exportSettings);
    root.querySelector('#tt99-import-settings')?.addEventListener('change',importSettings);
    root.querySelector('#tt99-copy-full-code')?.addEventListener('click',copyFullRecreationCode);
    root.querySelector('#tt99-load-full-code')?.addEventListener('click',loadFullRecreationCode);
    root.querySelector('#tt99-full-code')?.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();loadFullRecreationCode();}});
    root.querySelector('#tt99-backup-all')?.addEventListener('click',downloadFullBackup);
    root.querySelector('#tt99-restore-backup')?.addEventListener('change',restoreFullBackup);
    root.querySelector('#tt99-undo-restore')?.addEventListener('click',undoLastRestore);
  }

  function setOrientation(value){
    const next=value==='landscape'?'landscape':'portrait';
    if(state.orientation===next)return;
    state.orientation=next;
    persist();
    state.status=`${next==='landscape'?'Landscape':'Portrait'} layout selected. Questions and sheet codes are unchanged.`;
    render();
  }

  function selectScheme(id){
    if(!G.SCHEME_PRESETS[id] || id===state.schemeId)return;
    commitCurrentRules();
    state.schemeId=id;
    state.rules=loadRulesFor(state.schemeId,state.clubId);
    state.seed=newStudioSeed(state.clubId);
    generateAll();
    state.status=`${getScheme().name} rules selected. Your edits are remembered separately for each scheme and challenge.`;
    render();
  }

  function selectClub(id){
    const p=getBasePreset(state.schemeId,id); if(!p)return;
    commitCurrentRules();
    state.clubId=id;
    state.rules=loadRulesFor(state.schemeId,id);
    if(id==='worksheet') state.advancedOpen=true;
    state.seed=newStudioSeed(id); state.status=''; generateAll(); render();
  }
  function resetRules(){
    const p=getBasePreset(state.schemeId,state.clubId); if(!p)return;
    delete state.ruleOverrides[overrideKey()];
    state.rules=normalizeForContext(G.clone(p),state.clubId);state.seed=newStudioSeed(state.clubId);generateAll();state.status='This challenge has been reset to its scheme preset.';render();
  }
  function resetScheme(){
    if(!schemeHasOverrides())return;
    if(typeof window.confirm==='function' && !window.confirm(`Reset all edited challenge rules in ${getScheme().name}?`))return;
    const prefix=`${state.schemeId}::`;
    Object.keys(state.ruleOverrides).filter(k=>k.startsWith(prefix)).forEach(k=>delete state.ruleOverrides[k]);
    state.rules=loadRulesFor(state.schemeId,state.clubId);state.seed=newStudioSeed(state.clubId);generateAll();state.status=`All edited rules in ${getScheme().name} have been reset.`;render();
  }
  function ruleChanged(key,value){
    const numeric=['curriculumYear','questionCount','timeMinutes','perfectAttempts','numberMin','numberMax','addendMin','addendMax','repeatsMin','repeatsMax','factorMin','factorMax','multiplyPercent','arithmeticMax','arithmeticOperandMin','arithmeticOperandMax','squareMin','squareMax','cubeMin','cubeMax','bodmasMax','scaledBaseMin','scaledBaseMax','fractionQuantityMin','fractionQuantityMax','percentageQuantityMin','percentageQuantityMax','romanMax','algebraUnknownMax','algebraCoefficientMax','wholeNumberMax','decimalPlacesMax','decimalWholeMax','ratioPartMax','ratioQuantityMax','coordinateMax','statsValueMax'];
    state.rules[key] = numeric.includes(key) ? Number(value) : value;
    state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function setSelectedFamilies(selected,status=''){
    const core=isNamedAdvanced()?advancedCoreFamilies():[];
    const final=[...core,...selected.filter(f=>!core.includes(f))];
    const previous=state.rules.familyWeights||{};
    const base=G.CHALLENGE_PRESETS[state.clubId];
    state.rules.families=final;
    state.rules.familyWeights=Object.fromEntries(final.map(f=>[f,previous[f]||base?.familyWeights?.[f]||1]));
    state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();state.status=status;render();state.advancedOpen=true;
  }
  function familiesChanged(event){
    const strand=event?.target?.closest?.('details.tt99-family-strand')?.dataset?.strand;if(strand)openCurriculumStrands.add(strand);
    const selected=Array.from(root.querySelectorAll('[data-family]:checked')).map(x=>x.dataset.family);
    setSelectedFamilies(selected,selected.length?'':'No topics selected yet. Choose one or more topics from any category.');
  }
  function clearFamilyStrand(strand){
    const meta=G.FAMILY_META||{};
    const remaining=(state.rules.families||[]).filter(f=>(meta[f]?.strand||'Other')!==strand);
    openCurriculumStrands.add(strand);
    setSelectedFamilies(remaining,`Cleared selected topics from ${strand}.`);
  }
  function clearAllFamilies(){
    if(!isOpenWorksheet())return;
    openCurriculumStrands.clear();
    state.rules.curriculumYear=0;
    setSelectedFamilies([], 'All topic selections cleared. Choose anything from the catalogue to start again.');
  }

  function familyWeightChanged(family,value){
    if(!state.rules.families.includes(family))return;
    state.rules.familyWeights={...(state.rules.familyWeights||{}),[family]:Math.max(1,Math.min(20,Number(value)||1))};
    state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }

  function setStringChoices(attr,property,message){
    const selected=Array.from(root.querySelectorAll(`[data-${attr}]:checked`)).map(x=>x.getAttribute(`data-${attr}`));
    if(!selected.length){state.status=message;render();state.advancedOpen=true;return false;}
    state.rules[property]=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;return true;
  }
  function parseCustomWholeNumbers(value,min,max,stripPercent=false){
    const tokens=String(value||'').split(/[;,\s]+/).map(v=>stripPercent?v.replace(/%/g,''):v).filter(Boolean);
    return [...new Set(tokens.map(Number).filter(n=>Number.isInteger(n)&&n>=min&&n<=max))].sort((a,b)=>a-b);
  }
  function fractionChoicesChanged(){
    const chips=Array.from(root.querySelectorAll('[data-fraction-denominator]:checked')).map(x=>Number(x.dataset.fractionDenominator));
    const custom=parseCustomWholeNumbers(root.querySelector('#tt99-custom-denominators')?.value,2,100);
    const selected=[...new Set([...chips,...custom])].sort((a,b)=>a-b);
    if(!selected.length){state.status='Keep at least one fraction denominator selected or enter a custom denominator.';render();state.advancedOpen=true;return;}
    state.rules.fractionDenominators=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function percentageChoicesChanged(){
    const chips=Array.from(root.querySelectorAll('[data-percentage-choice]:checked')).map(x=>Number(x.dataset.percentageChoice));
    const custom=parseCustomWholeNumbers(root.querySelector('#tt99-custom-percentages')?.value,1,100,true);
    const selected=[...new Set([...chips,...custom])].sort((a,b)=>a-b);
    if(!selected.length){state.status='Keep at least one percentage selected or enter a custom percentage.';render();state.advancedOpen=true;return;}
    state.rules.percentageChoices=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function scaledMultiplierChoicesChanged(){
    const selected=Array.from(root.querySelectorAll('[data-scaled-multiplier]:checked')).map(x=>Number(x.dataset.scaledMultiplier));
    if(!selected.length){state.status='Keep at least one scale factor selected.';render();state.advancedOpen=true;return;}
    state.rules.scaledMultipliers=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function angleTotalChoicesChanged(){
    const selected=Array.from(root.querySelectorAll('[data-angle-total]:checked')).map(x=>Number(x.dataset.angleTotal));
    if(!selected.length){state.status='Keep at least one angle total selected.';render();state.advancedOpen=true;return;}
    state.rules.angleTotals=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function missingOperationChoicesChanged(){setStringChoices('missing-operation','missingNumberOperations','Keep multiplication or division enabled for missing-number questions.');}
  function missingPositionChoicesChanged(){setStringChoices('missing-position','missingNumberPositions','Keep at least one blank position enabled.');}
  function bodmasOperationChoicesChanged(){
    const selected=Array.from(root.querySelectorAll('[data-bodmas-operation]:checked')).map(x=>x.dataset.bodmasOperation);
    if(selected.length<2){state.status='Order-of-operations questions need at least two operations selected.';render();state.advancedOpen=true;return;}
    state.rules.bodmasOperations=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function tablesChanged(){ const selected=Array.from(root.querySelectorAll('[data-table]:checked')).map(x=>Number(x.dataset.table)); if(!selected.length){state.status='At least one times table must stay selected.';render();state.advancedOpen=true;return;} state.rules.tables=selected;state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true; }
  function tableAction(action){ state.rules.tables=action==='all'?Array.from({length:12},(_,i)=>i+1):action==='core'?[2,3,5,10]:[2];state.rules=normalizeForContext(state.rules,state.clubId);commitCurrentRules();state.seed=newStudioSeed(state.clubId);generateAll();render();state.advancedOpen=true; }

  function savePreset(){
    if(isOpenWorksheet()&&!(state.rules.families||[]).length){state.status='Select at least one topic before saving a reusable preset.';render();state.advancedOpen=true;return;}
    const input=root.querySelector('#tt99-preset-name'); const name=(input?.value||'').trim(); if(!name){state.status='Give your preset a name first.';render();state.advancedOpen=true;return;}
    commitCurrentRules();
    const currentCustom=state.customPresets.find(p=>p.id===state.clubId);
    const sourceSchemeId=currentCustom?.sourceSchemeId||state.schemeId, sourceClubId=currentCustom?.sourceClubId||state.clubId;
    const id='custom-'+Date.now().toString(36); const preset={...G.clone(state.rules),id,name,tagline:'Saved reusable preset',sourceSchemeId,sourceClubId}; state.customPresets.push(preset);saveCustomPresets();state.clubId=id;state.rules=G.clone(preset);delete state.ruleOverrides[overrideKey()];state.seed=newStudioSeed(id);generateAll();state.status=`Saved “${name}” on this browser.`;render();
  }
  function deletePreset(id){
    const p=state.customPresets.find(x=>x.id===id); if(!p)return;
    state.customPresets=state.customPresets.filter(x=>x.id!==id); saveCustomPresets();
    Object.keys(state.ruleOverrides).filter(k=>k.endsWith(`::${id}`)).forEach(k=>delete state.ruleOverrides[k]);
    if(state.clubId===id){state.clubId='worksheet';state.rules=normalizeForContext(G.clone(G.OPEN_WORKSHEET_PRESET),'worksheet');state.seed=newStudioSeed('worksheet');generateAll();}
    state.status=`Deleted custom preset “${p.name}”.`;render();
  }
  function questionCategoryLabel(q){
    const labels={double:'doubling',repeated_addition:'repeated addition',addition:'addition',subtraction:'subtraction',multiply:'multiplication',divide:'division',missing_number:'missing-number'};
    return G.FAMILY_LABELS[q?.kind] || labels[q?.kind] || 'same-category';
  }
  function replaceOne(index){
    const s=state.sheets[state.previewVariant], before=s.questions[index];
    const token=randomStudioToken(6);
    const next=G.replaceQuestion(s.questions,index,state.rules,`${s.seed}:replace:${index}:${token}`);
    s.questions=next;const q=next[index];
    // Keep a compact recreation recipe: if the same question is replaced repeatedly before
    // a shuffle, only its latest replacement survives in the recipe.
    if(q&&questionSig(q)!==questionSig(before))s.actions=compactSheetActions([...(Array.isArray(s.actions)?s.actions:[]),['k',index,q.key||'']]);
    persist();
    if(q&&questionSig(q)!==questionSig(before))state.status=`Question ${index+1} replaced with another ${questionCategoryLabel(q)} question in Version ${String.fromCharCode(65+state.previewVariant)}.`;
    else state.status=`No different ${questionCategoryLabel(before)} question is available under the current rules.`;
    render();
  }

  function decodeNewSheetCode(raw){
    const code=String(raw||'').trim().toUpperCase();
    const m=code.match(/^([A-Z0-9]+?)(X?)-G(\d+)-([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5,6})-([A-D])(?:-R([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}))?$/);
    if(!m)return null;
    const basePrefix=m[1],edited=m[2]==='X',gen=Number(m[3]),token=m[4],variant=m[5].charCodeAt(0)-64,fingerprint=m[6]||'';
    let schemeId=null,clubId=null;
    if(basePrefix==='WKS'){schemeId=state.schemeId;clubId='worksheet';}
    else if(ADVANCED_CODE_REV[basePrefix]){schemeId=state.schemeId;clubId=ADVANCED_CODE_REV[basePrefix];}
    else if(basePrefix==='CUS'){schemeId=state.schemeId;clubId=String(state.clubId).startsWith('custom-')?state.clubId:null;}
    else{
      const mm=basePrefix.match(/^(AF|AR|MN|TF|C)(11|22|33|44|55|66|77|88|99)$/);
      if(mm){schemeId=SCHEME_CODE_REV[mm[1]];clubId=mm[2];}
    }
    return {code,basePrefix,edited,gen,token,variant,fingerprint,schemeId,clubId};
  }
  function recreateFromCode(){
    const input=root.querySelector('#tt99-sheet-code');
    const code=(input?.value||'').trim();
    const modern=decodeNewSheetCode(code);
    if(modern){
      if(modern.gen!==GENERATION_VERSION){state.status=`Sheet ${modern.code} uses generation G${modern.gen}, which this build cannot recreate. Use its Full recreation code or archived setup file.`;render();return;}
      if(!modern.clubId && modern.basePrefix==='CUS' && modern.fingerprint){
        const matches=state.customPresets.filter(p=>ruleFingerprint(p,p.id)===modern.fingerprint);
        if(matches.length===1)modern.clubId=matches[0].id;
      }
      if(!modern.clubId){state.status='This custom-rule sheet code does not match a reusable preset saved in this browser. Nothing was changed. Use the Full recreation code, teacher QR, or import the saved setup.';render();return;}
      if(modern.schemeId&&G.SCHEME_PRESETS[modern.schemeId])state.schemeId=modern.schemeId;
      state.clubId=modern.clubId;
      if(modern.edited){
        let candidate=loadRulesFor(state.schemeId,state.clubId);
        if(modern.fingerprint && ruleFingerprint(candidate,state.clubId)!==modern.fingerprint && ADVANCED_CHALLENGE_IDS.has(state.clubId)){
          for(const schemeId of Object.keys(G.SCHEME_PRESETS)){
            const possible=loadRulesFor(schemeId,state.clubId);
            if(ruleFingerprint(possible,state.clubId)===modern.fingerprint){state.schemeId=schemeId;candidate=possible;break;}
          }
        }
        state.rules=candidate;
        if(!modern.fingerprint || ruleFingerprint(candidate,state.clubId)!==modern.fingerprint){state.status=`${modern.code} was made with edited/custom rules that are not available here. Nothing was changed. Use the Full recreation code, scan the answer-sheet QR, or import the saved setup.`;render();return;}
      }else{
        if(hasRuleOverride(state.schemeId,state.clubId)){state.status=`${modern.code} is a standard preset sheet, but this browser has edited rules saved for that challenge. Your edits were not overwritten. Export/backup them, then Reset this challenge before recreating the standard code.`;render();return;}
        state.rules=normalizeForContext(G.clone(getBasePreset(state.schemeId,state.clubId)),state.clubId);
      }
      state.seed=`${state.clubId}-${modern.token}`;state.variants=modern.variant;generateAll();state.previewVariant=modern.variant-1;
      state.status=`Recreated ${modern.code}. The code identified the ${state.rules.name} preset, generation G${modern.gen}, and Version ${String.fromCharCode(64+modern.variant)}.`;persist();render();return;
    }
    // Backward compatibility with v1.0-v1.6 numeric sheet codes.
    const legacy=code.match(/^(.+)-(\d+)$/);
    if(!legacy){state.status='Enter a valid sheet code, for example C99-G1-7FK2M9-A.';render();return;}
    const variant=Number(legacy[2]);if(!Number.isInteger(variant)||variant<1||variant>4){state.status='This generator supports worksheet versions A-D (legacy versions 1-4).';render();return;}
    state.seed=legacy[1];state.variants=variant;generateAll();state.previewVariant=variant-1;
    state.status=`Legacy sheet code ${code} recreated using the currently selected rules. Old codes did not identify their rule preset, so keep the matching setup when exact historical reproduction matters.`;persist();render();
  }

  function utf8ToBase64Url(text){
    const bytes=new TextEncoder().encode(text);let binary='';
    for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function base64UrlToUtf8(value){
    let b64=String(value||'').replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
    const binary=atob(b64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function questionSig(q){return JSON.stringify([q?.kind||'',q?.prompt||'',q?.answer,q?.key||'']);}
  function bytesToBase64Url(bytes){
    let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function base64UrlToBytes(value){
    let b64=String(value||'').replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
    const binary=atob(b64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;
  }
  function writeVarUint(out,value){
    let n=Math.max(0,Number(value)||0)>>>0;
    while(n>=128){out.push((n&127)|128);n>>>=7;}out.push(n);
  }
  function readVarUint(bytes,cursor){
    let value=0,shift=0;
    while(cursor.i<bytes.length&&shift<=28){const b=bytes[cursor.i++];value|=(b&127)<<shift;if(!(b&128))return value>>>0;shift+=7;}
    return null;
  }
  function packReplacementRefs(refs){
    const out=[];
    for(const entry of refs){writeVarUint(out,entry[0]);writeVarUint(out,entry[1]);writeVarUint(out,entry[2]);}
    return bytesToBase64Url(Uint8Array.from(out));
  }
  function unpackReplacementRefs(value){
    const bytes=base64UrlToBytes(value),cursor={i:0},out=[];
    while(cursor.i<bytes.length){const pos=readVarUint(bytes,cursor),kind=readVarUint(bytes,cursor),pool=readVarUint(bytes,cursor);if(pos===null||kind===null||pool===null)break;out.push([pos,kind,pool]);}
    return out;
  }
  function packActionRecipe(actions){
    const out=[];
    for(const a of actions){
      if(a[0]===0){out.push(0);writeVarUint(out,a[1]);writeVarUint(out,a[2]);}
      else if(a[0]===1){const token=String(a[1]||'');out.push(1);writeVarUint(out,token.length);for(let i=0;i<token.length;i++)out.push(token.charCodeAt(i)&255);}
    }
    return bytesToBase64Url(Uint8Array.from(out));
  }
  function applyPackedActionRecipe(seed,rules,value){
    let out=G.generateQuestions(rules,seed);const bytes=base64UrlToBytes(value),cursor={i:0},poolCache=new Map();
    function poolFor(kind){if(!poolCache.has(kind))poolCache.set(kind,typeof G.questionPool==='function'?G.questionPool(kind,rules):[]);return poolCache.get(kind);}
    while(cursor.i<bytes.length){
      const op=bytes[cursor.i++];
      if(op===0){const pos=readVarUint(bytes,cursor),poolIndex=readVarUint(bytes,cursor);if(pos===null||poolIndex===null||pos>=out.length)break;const kind=out[pos]?.kind,q=poolFor(kind)[poolIndex];if(q)out[pos]={...q,number:pos+1};}
      else if(op===1){const len=readVarUint(bytes,cursor);if(len===null||cursor.i+len>bytes.length)break;let token='';for(let i=0;i<len;i++)token+=String.fromCharCode(bytes[cursor.i++]);out=G.shuffleQuestions(out,`${seed}:${token}`);}
      else break;
    }
    return out.map((q,i)=>({...q,number:i+1}));
  }
  function actionRecipeForSheet(sheet,rules){
    const actions=compactSheetActions(sheet.actions);if(!actions.length)return null;
    let out=G.generateQuestions(rules,sheet.seed),packed=[],poolCache=new Map(),keyIndexCache=new Map();
    function poolFor(kind){if(!poolCache.has(kind))poolCache.set(kind,typeof G.questionPool==='function'?G.questionPool(kind,rules):[]);return poolCache.get(kind);}
    function indexFor(kind,key){if(!keyIndexCache.has(kind))keyIndexCache.set(kind,new Map(poolFor(kind).map((q,i)=>[q.key,i])));return keyIndexCache.get(kind).get(key) ?? -1;}
    for(const a of actions){
      if(!Array.isArray(a)||!a.length)continue;
      if(a[0]==='k'||a[0]==='i'||a[0]==='r'){
        const pos=Number(a[1]);if(!Number.isInteger(pos)||pos<0||pos>=out.length)return null;
        const kind=out[pos]?.kind;let poolIndex=-1;
        if(a[0]==='i')poolIndex=Number(a[2]);
        else poolIndex=indexFor(kind,a[0]==='k'?a[2]:a[5]);
        const q=poolFor(kind)[poolIndex];if(!q)return null;
        packed.push([0,pos,poolIndex]);out[pos]={...q,number:pos+1};
      }else if(a[0]==='s'&&a[1]){const token=String(a[1]);packed.push([1,token]);out=G.shuffleQuestions(out,`${sheet.seed}:${token}`);}
    }
    if(!sameQuestionSet(out,sheet.questions))return null;
    return {z:packActionRecipe(packed)};
  }
  function applySheetActions(seed,rules,actions){
    let out=G.generateQuestions(rules,seed);
    if(!Array.isArray(actions))return out;
    for(const a of actions){
      if(!Array.isArray(a)||!a.length)continue;
      if(a[0]==='k'){
        const i=Number(a[1]);if(!Number.isInteger(i)||i<0||i>=out.length)continue;
        const q=G.questionByKey(out[i]?.kind,rules,a[2]);if(q)out[i]={...q,number:i+1};
      }else if(a[0]==='i'){
        const i=Number(a[1]);if(!Number.isInteger(i)||i<0||i>=out.length)continue;
        const q=G.questionByPoolIndex(out[i]?.kind,rules,a[2]);if(q)out[i]={...q,number:i+1};
      }else if(a[0]==='r'){
        // Backward compatibility with v1.7 recreation codes that stored the full question.
        const i=Number(a[1]);if(!Number.isInteger(i)||i<0||i>=out.length)continue;
        out[i]={kind:a[2],prompt:a[3],answer:a[4],key:a[5]||'',number:i+1};
      }else if(a[0]==='s'&&a[1]) out=G.shuffleQuestions(out,`${seed}:${a[1]}`);
    }
    return out.map((q,i)=>({...q,number:i+1}));
  }
  function sameQuestionSet(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((q,i)=>questionSig(q)===questionSig(b[i]));}
  function sheetRecipe(sheet,rules){
    // First try a minimal replay recipe built from the already-compacted CURRENT actions.
    // Superseded replacements are removed before encoding, and question keys are converted
    // to numeric pool positions. If the replay does not exactly match the final sheet we fall
    // back to a history-independent final-state recipe below.
    const actionRecipe=actionRecipeForSheet(sheet,rules);
    const base=G.generateQuestions(rules,sheet.seed),buckets=new Map(),order=[],replacementRefs=[],fallback=[],poolIndexCache=new Map();
    base.forEach((q,i)=>{const k=questionSig(q);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(i);});
    function poolIndexFor(q){
      if(!q||!q.kind||!q.key)return -1;
      if(!poolIndexCache.has(q.kind)){
        const pool=typeof G.questionPool==='function'?G.questionPool(q.kind,rules):[];
        poolIndexCache.set(q.kind,new Map(pool.map((item,idx)=>[item.key,idx])));
      }
      return poolIndexCache.get(q.kind).get(q.key) ?? -1;
    }
    sheet.questions.forEach((q,i)=>{
      const list=buckets.get(questionSig(q));
      if(list&&list.length){order.push(list.shift());return;}
      order.push(255);
      const kindCode=QUESTION_KIND_ORDER.indexOf(q.kind),poolIndex=kindCode>=0?poolIndexFor(q):-1;
      if(kindCode>=0&&poolIndex>=0)replacementRefs.push([i,kindCode,poolIndex]);
      else fallback.push([i,q.kind,q.prompt,q.answer,q.key||'']);
    });
    const identity=order.every((v,i)=>v===i||v===255);
    if(identity&&!replacementRefs.length&&!fallback.length)return actionRecipe||null;
    const recipe={};
    if(!identity)recipe.p=bytesToBase64Url(Uint8Array.from(order));
    if(replacementRefs.length)recipe.y=packReplacementRefs(replacementRefs);
    if(fallback.length)recipe.x=fallback; // compatibility escape hatch for an unindexable custom question.
    if(actionRecipe&&JSON.stringify(actionRecipe).length<JSON.stringify(recipe).length)return actionRecipe;
    return recipe;
  }
  function applySheetRecipe(seed,rules,recipe){
    const base=G.generateQuestions(rules,seed);
    if(!recipe)return base;
    // Backward compatibility with older array/action recipes.
    if(Array.isArray(recipe))return recipe.map((entry,i)=>{let q;if(Number.isInteger(entry)&&base[entry])q=G.clone(base[entry]);else if(Array.isArray(entry)&&entry[0]==='Q')q={kind:entry[1],prompt:entry[2],answer:entry[3],key:entry[4]};else q=G.clone(base[i]||base[0]);return {...q,number:i+1};});
    if(typeof recipe!=='object')return base;
    if(Array.isArray(recipe.a))return applySheetActions(seed,rules,recipe.a);
    if(recipe.z)return applyPackedActionRecipe(seed,rules,recipe.z);
    let out=base.map(q=>G.clone(q));
    if(recipe.p){
      try{
        const order=base64UrlToBytes(recipe.p);
        if(order.length===base.length)out=Array.from(order,(idx,i)=>idx!==255&&base[idx]?G.clone(base[idx]):G.clone(base[i]||base[0]));
      }catch(ignore){}
    }
    if(recipe.y){
      try{
        const poolCache=new Map();
        for(const [i,kindCode,poolIndex] of unpackReplacementRefs(recipe.y)){
          const kind=QUESTION_KIND_ORDER[kindCode];if(!kind||!Number.isInteger(i)||i<0||i>=out.length)continue;
          if(!poolCache.has(kind))poolCache.set(kind,typeof G.questionPool==='function'?G.questionPool(kind,rules):[]);
          const q=poolCache.get(kind)[poolIndex];if(q)out[i]=G.clone(q);
        }
      }catch(ignore){}
    }
    // Older v1.8/v1.9 fallback recipes stored full replacement records in x.
    if(Array.isArray(recipe.x))for(const entry of recipe.x){
      if(!Array.isArray(entry)||entry.length<4)continue;const i=Number(entry[0]);if(!Number.isInteger(i)||i<0||i>=out.length)continue;
      out[i]={kind:entry[1],prompt:entry[2],answer:entry[3],key:entry[4]||''};
    }
    return out.map((q,i)=>({...q,number:i+1}));
  }
  function recreationSchool(){return {schoolName:state.school.schoolName,yearGroup:state.school.yearGroup,className:state.school.className,teacherName:state.school.teacherName,worksheetDate:state.school.worksheetDate};}
  function buildFullRecreationCode(){
    const payload={kind:'TT99R',format:3,generationVersion:GENERATION_VERSION,appVersion:VERSION,schemeId:state.schemeId,clubId:state.clubId,rules:state.rules,variants:state.variants,orientation:state.orientation,seed:state.seed,previewVariant:state.previewVariant,previewAnswers:state.previewAnswers,includeAnswerQr:state.includeAnswerQr,teacherNote:state.teacherNote,school:recreationSchool(),recipes:state.sheets.map(s=>sheetRecipe(s,state.rules))};
    return `TT99R3.${utf8ToBase64Url(JSON.stringify(payload))}`;
  }
  async function copyFullRecreationCode(){
    const code=buildFullRecreationCode();
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(code);else{const ta=document.createElement('textarea');ta.value=code;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
      state.status=`Full recreation code copied (${code.length.toLocaleString()} characters).`;
    }catch(err){state.status='The browser blocked automatic copying. The full code has been placed in the box for manual copying.';render();const details=root.querySelector('.tt99-portability');if(details)details.open=true;const box=root.querySelector('#tt99-full-code');if(box){box.value=code;box.focus();box.select();}return;}
    render();
  }
  function ensureImportedCustomPreset(requestedId,rules,tagline='Imported recreation rules'){
    if(!requestedId||getBasePreset(state.schemeId,requestedId))return requestedId;
    const imported={...G.clone(rules),id:requestedId,name:rules.name||'Imported preset',tagline};state.customPresets=state.customPresets.filter(p=>p.id!==requestedId);state.customPresets.push(imported);saveCustomPresets();return requestedId;
  }
  function applyRecreationV3(d,source='Full recreation code'){
    if(!d||d.kind!=='TT99R'||d.format!==3||!d.rules)throw new Error('format');
    if(Number(d.generationVersion||1)!==GENERATION_VERSION)throw new Error('generation');
    if(d.schemeId&&G.SCHEME_PRESETS[d.schemeId])state.schemeId=d.schemeId;
    let requestedId=String(d.clubId||d.rules.id||'').trim()||'33';ensureImportedCustomPreset(requestedId,d.rules);state.clubId=getBasePreset(state.schemeId,requestedId)?requestedId:'33';
    state.rules=normalizeForContext(d.rules,state.clubId);commitCurrentRules();state.variants=Math.min(4,Math.max(1,Number(d.variants)||1));state.orientation=d.orientation==='landscape'?'landscape':'portrait';state.seed=typeof d.seed==='string'&&d.seed?d.seed:newStudioSeed(state.clubId);state.previewVariant=Math.max(0,Math.min(state.variants-1,Number(d.previewVariant)||0));state.previewAnswers=!!d.previewAnswers;state.includeAnswerQr=d.includeAnswerQr!==false;state.teacherNote=cleanTeacherNote(d.teacherNote||'');
    if(d.school)state.school={...state.school,...d.school,logoDataUrl:state.school.logoDataUrl,logoWidth:state.school.logoWidth,logoHeight:state.school.logoHeight};generateAll();
    if(Array.isArray(d.recipes)){state.sheets=state.sheets.map((s,i)=>{const recipe=d.recipes[i];return {...s,questions:applySheetRecipe(s.seed,state.rules,recipe),actions:[]};});refreshSheetCodes();refreshRulesError();persist();}
    state.status=`${source} loaded. Rules, seed and exact final reviewed worksheet were restored.`;render();
  }
  function applyRecreationV2(d,source='Full recreation code'){
    if(!d||d.kind!=='TT99R'||d.format!==2||!d.rules)throw new Error('format');
    if(Number(d.generationVersion||1)!==GENERATION_VERSION)throw new Error('generation');
    if(d.schemeId&&G.SCHEME_PRESETS[d.schemeId])state.schemeId=d.schemeId;
    let requestedId=String(d.clubId||d.rules.id||'').trim()||'33';ensureImportedCustomPreset(requestedId,d.rules);state.clubId=getBasePreset(state.schemeId,requestedId)?requestedId:'33';
    state.rules=normalizeForContext(d.rules,state.clubId);commitCurrentRules();state.variants=Math.min(4,Math.max(1,Number(d.variants)||1));state.orientation=d.orientation==='landscape'?'landscape':'portrait';state.seed=typeof d.seed==='string'&&d.seed?d.seed:newStudioSeed(state.clubId);state.previewVariant=Math.max(0,Math.min(state.variants-1,Number(d.previewVariant)||0));state.previewAnswers=!!d.previewAnswers;state.includeAnswerQr=d.includeAnswerQr!==false;state.teacherNote=cleanTeacherNote(d.teacherNote||'');
    if(d.school)state.school={...state.school,...d.school,logoDataUrl:state.school.logoDataUrl,logoWidth:state.school.logoWidth,logoHeight:state.school.logoHeight};generateAll();
    if(Array.isArray(d.recipes)){state.sheets=state.sheets.map((s,i)=>{const recipe=d.recipes[i];return {...s,questions:applySheetRecipe(s.seed,state.rules,recipe),actions:Array.isArray(recipe?.a)?G.clone(recipe.a):[]};});refreshSheetCodes();refreshRulesError();persist();}
    state.status=`${source} loaded. Rules, seed and exact manual question changes were restored.`;render();
  }
  function applyRecreationV1(d,source='Legacy recreation code'){
    if(!d||d.kind!=='TT99R'||d.format!==1||!d.rules)throw new Error('format');
    if(d.schemeId&&G.SCHEME_PRESETS[d.schemeId])state.schemeId=d.schemeId;let requestedId=String(d.clubId||d.rules.id||'').trim()||'33';ensureImportedCustomPreset(requestedId,d.rules);state.clubId=getBasePreset(state.schemeId,requestedId)?requestedId:'33';state.rules=normalizeForContext(d.rules,state.clubId);commitCurrentRules();state.variants=Math.min(4,Math.max(1,Number(d.variants)||1));state.orientation=d.orientation==='landscape'?'landscape':'portrait';state.seed=typeof d.seed==='string'&&d.seed?d.seed:newStudioSeed(state.clubId);state.previewVariant=Math.max(0,Math.min(state.variants-1,Number(d.previewVariant)||0));state.teacherNote=cleanTeacherNote(d.teacherNote||'');if(d.school)state.school={...state.school,...d.school,logoDataUrl:state.school.logoDataUrl,logoWidth:state.school.logoWidth,logoHeight:state.school.logoHeight};
    if(validExactSheets(d.sheets,state.variants,state.rules)){state.sheets=G.clone(d.sheets);refreshSheetCodes();refreshRulesError();persist();}else generateAll();state.status=`${source} loaded. This was created by an earlier 99 Club Studio/Generator version.`;render();
  }
  function loadFullRecreationCode(rawOverride){
    let raw=typeof rawOverride==='string'?rawOverride.trim():(root.querySelector('#tt99-full-code')?.value||'').trim();
    try{
      const qMatch=raw.match(/[#&]q=([^&]+)/);if(qMatch){loadQrRecreationCode(decodeURIComponent(qMatch[1]));return;}
      const rMatch=raw.match(/[#&]recreate=([^&]+)/);if(rMatch)raw=decodeURIComponent(rMatch[1]);
      if(raw.startsWith('TT99R3.')){applyRecreationV3(JSON.parse(base64UrlToUtf8(raw.slice(7))));return;}
      if(raw.startsWith('TT99R2.')){applyRecreationV2(JSON.parse(base64UrlToUtf8(raw.slice(7))));return;}
      if(raw.startsWith('TT99R1.')){applyRecreationV1(JSON.parse(base64UrlToUtf8(raw.slice(7))));return;}
      throw new Error('prefix');
    }catch(err){state.status=String(err.message)==='generation'?'That recreation code uses a generation version this build cannot reproduce.':'That Full recreation code is not valid.';render();}
  }

  function builtInBaseRules(schemeId,clubId){
    const scheme=G.SCHEME_PRESETS[schemeId];if(scheme?.presets?.[clubId])return normalizeForContext(G.clone(scheme.presets[clubId]),clubId);if(G.CHALLENGE_PRESETS[clubId])return normalizeForContext(G.clone(G.CHALLENGE_PRESETS[clubId]),clubId);if(clubId==='worksheet'&&G.OPEN_WORKSHEET_PRESET)return normalizeForContext(G.clone(G.OPEN_WORKSHEET_PRESET),clubId);return null;
  }
  function diffRules(base,current){
    if(JSON.stringify(canonical(base))===JSON.stringify(canonical(current)))return undefined;
    if(Array.isArray(base)||Array.isArray(current)||!base||!current||typeof base!=='object'||typeof current!=='object')return G.clone(current);
    const out={};for(const k of Object.keys(current)){const d=diffRules(base[k],current[k]);if(d!==undefined)out[k]=d;}return Object.keys(out).length?out:undefined;
  }
  function mergeRules(base,diff){
    if(diff===undefined)return G.clone(base);if(Array.isArray(diff)||!diff||typeof diff!=='object')return G.clone(diff);const out=base&&typeof base==='object'&&!Array.isArray(base)?G.clone(base):{};for(const [k,v] of Object.entries(diff))out[k]=mergeRules(out[k],v);return out;
  }
  function buildQrRecreationCode(variantIndex){
    const isCustom=String(state.clubId).startsWith('custom-');
    let sourceSchemeId=state.schemeId,sourceClubId=state.clubId,base=builtInBaseRules(sourceSchemeId,sourceClubId);
    if(!base && isCustom){
      const preset=state.customPresets.find(p=>p.id===state.clubId);
      if(preset?.sourceSchemeId&&preset?.sourceClubId){sourceSchemeId=preset.sourceSchemeId;sourceClubId=preset.sourceClubId;base=builtInBaseRules(sourceSchemeId,sourceClubId);}
    }
    const currentForDiff=isCustom?functionalRules(state.rules,state.clubId):state.rules;
    const baseForDiff=base?(isCustom?functionalRules(base,sourceClubId):base):null;
    const diff=baseForDiff?diffRules(baseForDiff,currentForDiff):undefined,sheet=state.sheets[variantIndex];
    const d={k:'Q',f:2,g:GENERATION_VERSION,s:state.schemeId,c:isCustom&&base?sourceClubId:state.clubId,z:state.seed,p:variantIndex,o:state.orientation==='landscape'?'l':'p',e:sheetRecipe(sheet,state.rules)};
    if(isCustom&&base)d.u=1;
    if(baseForDiff){if(sourceSchemeId!==state.schemeId||sourceClubId!==d.c)d.b=[sourceSchemeId,sourceClubId];if(diff!==undefined)d.d=diff;}else d.r=state.rules;
    return `TT99Q2.${utf8ToBase64Url(JSON.stringify(d))}`;
  }
  function buildQrRecreationUrl(variantIndex){return `${APP_URL}#q=${buildQrRecreationCode(variantIndex)}`;}
  function qrResultForVariant(variantIndex){
    if(!Q||!state.includeAnswerQr)return null;
    const result=Q.make(buildQrRecreationUrl(variantIndex));
    if(result.version>MAX_PRINT_QR_VERSION)throw new Error('QR too dense for reliable print');
    return result;
  }
  function qrSvgForVariant(variantIndex){try{const r=qrResultForVariant(variantIndex);return r?Q.svg(r,{className:'tt99-qr-svg',label:'Scan to recreate this worksheet'}):'';}catch(err){return '';}}
  function loadQrRecreationCode(raw){
    try{
      const qrRaw=String(raw);const qm=qrRaw.match(/^TT99Q([12])\./);if(!qm)throw new Error('prefix');const qFormat=Number(qm[1]);const d=JSON.parse(base64UrlToUtf8(qrRaw.slice(7)));if(!d||d.k!=='Q'||Number(d.f)!==qFormat||Number(d.g)!==GENERATION_VERSION)throw new Error('format');
      if(d.s&&G.SCHEME_PRESETS[d.s])state.schemeId=d.s;
      let rules,requestedId=String(d.c||'33');
      if(d.r)rules=G.normalizeRules(d.r);
      else{
        const baseSpec=Array.isArray(d.b)&&d.b.length===2?d.b:[state.schemeId,requestedId];
        const base=builtInBaseRules(baseSpec[0],baseSpec[1]);if(!base)throw new Error('base');
        rules=d.d?mergeRules(d.u?functionalRules(base,baseSpec[1]):base,d.d):base;
      }
      if(d.u){
        const baseSpec=Array.isArray(d.b)&&d.b.length===2?d.b:[state.schemeId,requestedId];
        const tempId=`custom-qr-${ruleFingerprint(rules,requestedId).toLowerCase()}`;
        rules={...rules,id:tempId,name:'Recreated custom sheet',tagline:'Imported from teacher QR',sourceSchemeId:baseSpec[0],sourceClubId:baseSpec[1]};
        requestedId=tempId;ensureImportedCustomPreset(requestedId,rules,'Imported from teacher QR');
      }else if(String(requestedId).startsWith('custom-')&&!getBasePreset(state.schemeId,requestedId))ensureImportedCustomPreset(requestedId,rules,'Imported from teacher QR');
      state.clubId=getBasePreset(state.schemeId,requestedId)?requestedId:(getBasePreset(state.schemeId,rules.id)?rules.id:'33');state.rules=normalizeForContext(rules,state.clubId);commitCurrentRules();state.seed=String(d.z||newStudioSeed(state.clubId));const qrVariant=Math.max(0,Math.min(3,Number(d.p)||0));state.variants=Math.min(4,Math.max(qrVariant+1,Number(d.v)||1));state.previewVariant=qrVariant;state.orientation=d.o==='l'?'landscape':'portrait';state.teacherNote='';if(Array.isArray(d.m))state.school={...state.school,schoolName:d.m[0]||'',yearGroup:d.m[1]||'',className:d.m[2]||'',teacherName:d.m[3]||'',worksheetDate:d.m[4]||'',logoDataUrl:state.school.logoDataUrl,logoWidth:state.school.logoWidth,logoHeight:state.school.logoHeight};generateAll();if(d.e){const i=state.previewVariant,stateSheet=state.sheets[i];stateSheet.questions=applySheetRecipe(stateSheet.seed,state.rules,d.e);stateSheet.actions=Array.isArray(d.e?.a)?G.clone(d.e.a):[];refreshSheetCodes();refreshRulesError();persist();}state.previewAnswers=true;state.status='Teacher QR recreation loaded. This exact sheet and its rules are ready in 99 Club Studio.';render();
    }catch(err){state.status='That teacher QR recreation data is not valid or is from an unsupported generation version.';render();}
  }
  function loadRecreationFromLocation(){
    try{const hash=String(location.hash||'');const m=hash.match(/^#q=(.+)$/);if(!m)return;const code=decodeURIComponent(m[1]);loadQrRecreationCode(code);if(history?.replaceState)history.replaceState(null,'',location.pathname+location.search);}catch(e){}
  }

  function downloadJson(filename,data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function safeDateStamp(){return new Date().toISOString().slice(0,10);}
  function fullBackupData(){return {kind:'tt99-full-backup',backupVersion:1,app:'99 Club Studio',appVersion:VERSION,generationVersion:GENERATION_VERSION,savedAt:new Date().toISOString(),customPresets:state.customPresets,settings:settingsPayload(true,true)};}
  function downloadFullBackup(){downloadJson(`99-club-studio-full-backup-${safeDateStamp()}.json`,fullBackupData());state.status='Full backup downloaded. Keep this file somewhere independent of the browser if the saved presets matter.';render();}
  function hasPreRestoreSnapshot(){try{const d=JSON.parse(localStorage.getItem(PRE_RESTORE_KEY)||'null');return !!(d&&d.kind==='tt99-full-backup'&&d.settings);}catch(e){return false;}}
  function applyBackupData(d,statusText){
    if(!d||d.kind!=='tt99-full-backup'||d.backupVersion!==1||!d.settings)throw new Error('backup');state.customPresets=Array.isArray(d.customPresets)?G.clone(d.customPresets):[];saveCustomPresets();const x=d.settings;state.schemeId=x.schemeId&&G.SCHEME_PRESETS[x.schemeId]?x.schemeId:'classic';state.ruleOverrides=x.ruleOverrides&&typeof x.ruleOverrides==='object'&&!Array.isArray(x.ruleOverrides)?G.clone(x.ruleOverrides):{};const requestedId=String(x.clubId||x.rules?.id||'33');state.clubId=getBasePreset(state.schemeId,requestedId)?requestedId:'33';state.rules=normalizeForContext(x.rules||getBasePreset(state.schemeId,state.clubId),state.clubId);commitCurrentRules();state.variants=Math.min(4,Math.max(1,Number(x.variants)||1));state.orientation=x.orientation==='landscape'?'landscape':'portrait';state.seed=typeof x.seed==='string'&&x.seed?x.seed:newStudioSeed(state.clubId);state.previewVariant=Math.max(0,Math.min(state.variants-1,Number(x.previewVariant)||0));state.previewAnswers=!!x.previewAnswers;state.workspaceView=['options','preview'].includes(x.workspaceView)?x.workspaceView:'balanced';state.includeAnswerQr=x.includeAnswerQr!==false;state.teacherNote=cleanTeacherNote(x.teacherNote||'');if(x.school)state.school={...state.school,...x.school};if(validExactSheets(x.sheets,state.variants,state.rules)){state.sheets=G.clone(x.sheets);refreshSheetCodes();refreshRulesError();persist();}else generateAll();state.status=statusText;render();
  }
  function restoreFullBackup(e){
    const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(!d||d.kind!=='tt99-full-backup'||d.backupVersion!==1||!d.settings)throw new Error('backup');try{localStorage.setItem(PRE_RESTORE_KEY,JSON.stringify(fullBackupData()));}catch(ignore){}applyBackupData(d,'Full backup restored. The browser state it replaced is kept as a local safety snapshot; use “Undo last restore” if needed.');}catch(err){state.status='That file is not a valid 99 Club Studio full backup.';render();}};reader.readAsText(file);
  }
  function undoLastRestore(){
    try{const previous=JSON.parse(localStorage.getItem(PRE_RESTORE_KEY)||'null');if(!previous)throw new Error('missing');const current=fullBackupData();localStorage.setItem(PRE_RESTORE_KEY,JSON.stringify(current));applyBackupData(previous,'Last full-backup restore undone. The state you just replaced is now the safety snapshot, so you can swap back again if needed.');}catch(err){state.status='There is no usable pre-restore safety snapshot in this browser.';render();}
  }

  function softRenderPaper(){ const wrap=root.querySelector('.tt99-preview-wrap'); if(wrap)wrap.innerHTML=renderPaper(); const paper=wrap?.querySelector('.tt99-paper'); paper?.querySelectorAll('[data-replace]').forEach(btn=>{btn.addEventListener('click',()=>replaceOne(Number(btn.dataset.replace)));btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();replaceOne(Number(btn.dataset.replace));}});}); }

  async function handleLogo(e){
    const file=e.target.files?.[0]; if(!file)return;
    if(file.size>8*1024*1024){state.status='Logo is too large. Please choose an image under 8 MB.';render();return;}
    try { const result=await imageFileToJpeg(file,360); state.school.logoDataUrl=result.dataUrl; state.school.logoWidth=result.width; state.school.logoHeight=result.height; persist();state.status='School logo added.';render(); }
    catch(err){state.status='That logo could not be read. Try a PNG or JPG.';render();}
  }
  function imageFileToJpeg(file,maxSize){ return new Promise((resolve,reject)=>{ const img=new Image(); const url=URL.createObjectURL(file); img.onload=()=>{ const scale=Math.min(1,maxSize/Math.max(img.naturalWidth,img.naturalHeight)); const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)); const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve({dataUrl:c.toDataURL('image/jpeg',0.9),width:w,height:h});};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image'));};img.src=url;}); }
  function imageUrlToJpeg(url,maxSize){ return new Promise((resolve,reject)=>{ const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>{ const scale=Math.min(1,maxSize/Math.max(img.naturalWidth,img.naturalHeight)); const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)); const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h); resolve({dataUrl:c.toDataURL('image/jpeg',0.92),width:w,height:h}); }; img.onerror=()=>reject(new Error('image')); img.src=url; }); }
  async function badgeImageForPdf(){
    const url=badgeUrlForClub(state.clubId);
    if(!url)return null;
    if(badgeImageCache.has(url)) return badgeImageCache.get(url);
    try{ const result=await imageUrlToJpeg(url,360); badgeImageCache.set(url,result); return result; }
    catch(err){ console.warn('Badge image unavailable',err); return null; }
  }

  async function downloadPDF(kind){
    if(state.rulesError){state.status=state.rulesError;render();return;}
    try {
      let qrOmitted=0;
      const qrByVariant=(state.includeAnswerQr && (kind==='answers'||kind==='both')) ? state.sheets.map((_,i)=>{
        try{return qrResultForVariant(i)?.matrix||null;}catch(err){console.warn('QR omitted for variant',i,err);qrOmitted++;return null;}
      }) : [];
      const badge=await badgeImageForPdf();
      const doc=L.buildDocument({rules:state.rules,sheets:state.sheets,school:state.school,kind,orientation:state.orientation,qrByVariant,teacherNote:state.teacherNote,badge:badge?{imageDataUrl:badge.dataUrl,width:badge.width,height:badge.height}:{}});
      doc.save(L.filename(state.rules,kind,state.orientation));
      track('custom_worksheet_download',{
        pdf_kind:kind,
        variant_count:state.variants,
        question_count:Number(state.rules?.questionCount)||0,
        orientation:state.orientation,
        topic_count:Array.isArray(state.rules?.families)?state.rules.families.length:0,
        curriculum_year:Number(state.rules?.curriculumYear)||0
      });
      SU?.trackStudio?.('custom_worksheet_download',state.school?.schoolName||'',{area:'custom'});
      state.status=qrOmitted?`PDF created. ${qrOmitted} answer-sheet QR ${qrOmitted===1?'code was':'codes were'} omitted because the recreation data was too large.`:'PDF created.'; render();
    } catch(err){ console.error(err); state.status='PDF generation failed in this browser. Please refresh and try again.';render(); }
  }
  function exportSettings(){
    const data={
      kind:'tt99-current-setup',setupVersion:2,app:'99 Club Studio',version:VERSION,generationVersion:GENERATION_VERSION,
      schemeId:state.schemeId,clubId:state.clubId,rules:state.rules,variants:state.variants,
      orientation:state.orientation,includeAnswerQr:state.includeAnswerQr,teacherNote:state.teacherNote,seed:state.seed,
      sheets:state.sheets.map(s=>({seed:s.seed,code:s.code,questions:s.questions,actions:Array.isArray(s.actions)?s.actions:[]})),
      school:{schoolName:state.school.schoolName,yearGroup:state.school.yearGroup,className:state.school.className,teacherName:state.school.teacherName,worksheetDate:state.school.worksheetDate}
    };
    const safe=(state.rules.name||state.clubId||'setup').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
    downloadJson(`99-club-studio-${safe||'setup'}-setup.json`,data);
    state.status='This setup was exported. It carries only the current challenge, exact worksheet versions and personalisation text; it does not contain the school logo, other saved presets or other challenge edits.';render();
  }
  function importSettings(e){
    const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{
      const d=JSON.parse(reader.result);
      if(!d || typeof d!=='object' || !d.rules) throw new Error('settings');
      if(d.generationVersion && Number(d.generationVersion)!==GENERATION_VERSION)throw new Error('generation');
      if(d.schemeId && G.SCHEME_PRESETS[d.schemeId])state.schemeId=d.schemeId;
      let requestedId=String(d.clubId||d.rules.id||'').trim();
      let candidateBase=requestedId?getBasePreset(state.schemeId,requestedId):null;
      const importedRulesRaw=G.normalizeRules(d.rules);
      if(requestedId && !candidateBase){
        const imported={...G.clone(importedRulesRaw),id:requestedId,name:importedRulesRaw.name||'Imported preset',tagline:'Imported custom rules'};
        state.customPresets=state.customPresets.filter(p=>p.id!==requestedId);state.customPresets.push(imported);saveCustomPresets();
        candidateBase=imported;
      }
      state.clubId=requestedId&&getBasePreset(state.schemeId,requestedId)?requestedId:(getBasePreset(state.schemeId,importedRulesRaw.id)?importedRulesRaw.id:'33');
      state.rules=normalizeForContext(importedRulesRaw,state.clubId);commitCurrentRules();
      state.variants=Math.min(4,Math.max(1,Number(d.variants)||1));
      state.orientation=d.orientation==='landscape'?'landscape':'portrait';
      state.includeAnswerQr=d.includeAnswerQr!==false;state.teacherNote=cleanTeacherNote(d.teacherNote||'');
      if(d.school)state.school={...state.school,...d.school,logoDataUrl:state.school.logoDataUrl,logoWidth:state.school.logoWidth,logoHeight:state.school.logoHeight};
      state.seed=typeof d.seed==='string'&&d.seed?d.seed:newStudioSeed(state.clubId);
      const exactSheets=validExactSheets(d.sheets,state.variants,state.rules);
      if(exactSheets){state.sheets=G.clone(d.sheets);refreshSheetCodes();state.previewVariant=0;refreshRulesError();persist();}
      else generateAll();
      state.status=exactSheets?'Setup imported, including the exact worksheet versions. Your other browser-saved presets and challenge edits were left untouched.':'Setup imported. Your other browser-saved presets and challenge edits were left untouched.';render();
    }catch(err){state.status=String(err&&err.message)==='generation'?'That setup uses a worksheet generation version this build does not support.':'That file is not a valid 99 Club Studio setup.';render();}};reader.readAsText(file);
  }


  function formatDate(iso){ if(!iso)return ''; const [y,m,d]=iso.split('-').map(Number); if(!y||!m||!d)return iso; return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(y,m-1,d)); }
})();
