/* 99 Club Studio · Maths Games & Puzzles UI v1.10.3 — school-led parent puzzle sharing + portable setup */
(function(){
  'use strict';
  const G=window.TT99Games,PDF=window.TT99GamesPDF,GPP=window.TT99GamesParentPractice,SU=window.TT99SchoolUsage,root=document.getElementById('tt99-games-root');
  if(!G||!root)return;
  function analyticsContext(){
    const schoolName=String(state?.settings?.personalisation?.schoolName||'').trim();
    return {
      school_key:SU?.makeSchoolKey?.(schoolName)||undefined,
      source_origin:SU?.referrerOrigin?.()||undefined,
      app_mode:(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true)?'pwa':'browser'
    };
  }
  const track=(name,params)=>window.TT99Analytics?.track(name,{...analyticsContext(),...(params||{})});

  const SETTINGS_KEY='tt99-games-settings-v4',LEGACY_KEYS=['tt99-games-settings-v3','tt99-games-settings-v2','tt99-games-settings-v1'],VOCAB_KEY='tt99-games-vocab-v1';
  const DEFAULTS={
    minYear:3,maxYear:4,topics:['calculation'],sheets:1,activitiesPerSheet:2,includeAnswers:true,workedExamples:'none',selectedEngines:['wordsearch','pyramid'],
    personalisation:{schoolName:'',packTitle:'Maths Games & Puzzles',classLabel:'',worksheetDate:'',logoDataUrl:'',logoWidth:0,logoHeight:0},
    engineSettings:{
      wordsearch:{difficulty:'standard',clueMode:'words_definitions',wordCount:'auto',gridSize:'auto',directionMode:'auto'},
      pyramid:{difficulty:'standard',levels:'auto',clueLevel:'balanced'},
      crossword:{difficulty:'standard',wordCount:'auto',gridSize:'auto',wordBank:'auto'},
      magic:{difficulty:'standard',gridSize:'auto',puzzleType:'auto',numberPattern:'auto',clueLevel:'balanced'},
      sudoku:{difficulty:'standard',gridSize:'auto',puzzleStyle:'auto',clueLevel:'balanced'}
    }
  };
  const GAME_CATEGORIES=[
    {id:'vocabulary',label:'Vocabulary & language',description:'Words, definitions and mathematical terminology.',engines:['wordsearch','crossword']},
    {id:'patterns',label:'Number patterns & structures',description:'Number relationships, sequences and visual arithmetic structures.',engines:['pyramid','magic','arithmagon','magicshape','numbertrail','numberwheels','diagonalpath']},
    {id:'arithmetic',label:'Arithmetic & calculation',description:'Calculation, inverse reasoning and numerical problem solving.',engines:['maze','propertymaze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid','kakuro','arithmeticcages','sumplete','squaresearch','insertops']},
    {id:'algebra',label:'Algebra & relationships',description:'Unknowns, functions and balancing relationships.',engines:['symbols','functionmachine','balance','mobilebalance']},
    {id:'geometry',label:'Geometry & measurement',description:'Shape, perimeter and spatial reasoning.',engines:['perimeterregions']},
    {id:'logic',label:'Number logic & grids',description:'Compact logic puzzles with short rules and validated solutions.',engines:['sudoku','futoshiki','nonogram','numberpath','colourlogic']}
  ];
  const ENGINE_CATEGORY=Object.fromEntries(GAME_CATEGORIES.flatMap(cat=>cat.engines.map(id=>[id,cat.id])));
  const initialSettings=loadSettings();
  const initialOpen=new Set(GAME_CATEGORIES.filter(cat=>cat.engines.some(id=>initialSettings.selectedEngines.includes(id))).map(cat=>cat.id));
  if(!initialOpen.size)initialOpen.add('vocabulary');
  const state={settings:initialSettings,customVocabulary:loadVocabulary(),seed:newSeed(),previewAnswers:false,activeEngine:'',openCategories:initialOpen,personalisationOpen:false,replaceCounter:0,status:'Choose the maths, include the games you want, then configure each game separately.'};
  state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);

  // Preview replacement controls are delegated so late UI patches and every
  // re-render keep working reliably, including installed/mobile Safari.
  if(root.dataset.previewReplaceDelegated!=='1'){
    root.dataset.previewReplaceDelegated='1';
    root.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-replace-activity],[data-replace-word]');
      if(!btn||!root.contains(btn))return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      if(btn.dataset.replaceActivity!=null)replaceActivity(btn.dataset.replaceActivity);
      else if(btn.dataset.replaceWord!=null)replaceWord(btn.dataset.replaceWord);
    },true);
  }

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cap(s){return String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1);}
  function loadSettings(){
    try{let raw=localStorage.getItem(SETTINGS_KEY);if(!raw)for(const key of LEGACY_KEYS){raw=localStorage.getItem(key);if(raw)break;}return G.normalizeSettings({...DEFAULTS,...JSON.parse(raw||'{}')});}catch(e){return G.normalizeSettings(DEFAULTS);}
  }
  function loadVocabulary(){try{return G.sanitizeCustomVocabulary(JSON.parse(localStorage.getItem(VOCAB_KEY)||'[]'));}catch(e){return [];}}
  function save(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings));localStorage.setItem(VOCAB_KEY,JSON.stringify(state.customVocabulary));}catch(e){}}
  function newSeed(){const a=new Uint32Array(2);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);else{a[0]=Date.now();a[1]=Math.floor(Math.random()*2**32);}return `G-${a[0].toString(36)}${a[1].toString(36)}`;}
  function yearRangeLabel(){const s=state.settings;return s.minYear===s.maxYear?`Year ${s.minYear}`:`Years ${s.minYear}–${s.maxYear}`;}
  function topicLabels(ids=state.settings.topics){return ids.map(id=>G.TOPICS[id]?.label||id).join(' · ');}
  function refreshPack(reseed=false){if(reseed)state.seed=newSeed();state.settings=G.normalizeSettings(state.settings);state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);state.replaceCounter=0;save();}
  function builtInCount(topic){return G.vocabularyCountForTopic(topic);}
  function mineCount(topic){return state.customVocabulary.filter(x=>x.topic===topic).length;}
  function topicAvailable(id){const ys=G.TOPICS[id].years||[];return ys.some(y=>y>=state.settings.minYear&&y<=state.settings.maxYear);}
  function compatibleSet(){return new Set(G.compatibleEngines(state.settings));}
  function selectedCompatible(){return G.selectedCompatibleEngines(state.settings);}
  function engineSettings(id){return state.settings.engineSettings[id]||G.ENGINES[id]?.defaultSettings||{};}
  function personalisation(){return state.settings.personalisation||{};}
  function uniqueMeta(parts){const seen=new Set();return (parts||[]).filter(Boolean).filter(value=>{const key=String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'');if(!key||seen.has(key))return false;seen.add(key);return true;});}
  function humanDate(value){if(!value)return '';const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return String(value);const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});}
  function categorySelected(cat,eligible=compatibleSet()){return cat.engines.filter(id=>eligible.has(id)&&state.settings.selectedEngines.includes(id));}
  function selectedEngineCount(){return selectedCompatible().length;}
  function puzzleShareConfig(){
    const schoolUsageKey=SU?.makeSchoolKey?.(personalisation().schoolName)||'';
    return {settings:G.clone(state.settings),customVocabulary:G.clone(state.customVocabulary),schoolUsageKey};
  }
  function puzzleShareLink(){
    if(!GPP)return {link:'',error:'Parent puzzle sharing is unavailable in this build.'};
    try{return {link:GPP.buildLink(puzzleShareConfig(),location.origin),error:''};}
    catch(err){return {link:'',error:err?.message||'This puzzle setup could not be turned into a parent link.'};}
  }
  function puzzleShareTitle(){
    const title=String(personalisation().packTitle||'Maths Games & Puzzles').trim();
    return title||'Maths Games & Puzzles';
  }
  function puzzleShareSummary(){
    const names=selectedCompatible().map(id=>G.ENGINES[id]?.title||id);
    const head=`${yearRangeLabel()} · ${names.length} puzzle type${names.length===1?'':'s'} · ${state.settings.sheets*state.settings.activitiesPerSheet} activities`;
    const sample=names.slice(0,3).join(', ');
    return sample?`${head} · ${sample}${names.length>3?' + more':''}`:head;
  }
  function puzzleShareWebsiteCard(teacherPreview=false){
    const {link}=puzzleShareLink();
    const target=teacherPreview?puzzleSharePreviewLinkFromLink(link):link;
    return target&&GPP?GPP.websiteCardHtml(target,puzzleShareTitle(),puzzleShareSummary()):'';
  }
  function puzzleSharePreviewLinkFromLink(link){
    if(!link)return '';
    try{
      const url=new URL(link,location.origin);
      url.searchParams.set('preview','1');
      return url.href;
    }catch(_){return link;}
  }
  function puzzleSharePreviewLink(){
    return puzzleSharePreviewLinkFromLink(puzzleShareLink().link);
  }
  function renderPuzzleParentModal(){
    if(!GPP)return '';
    const selected=selectedCompatible();
    const built=puzzleShareLink();
    const preview=built.link?puzzleShareWebsiteCard(true):'';
    const previewLink=built.link?puzzleSharePreviewLink():'';
    let vocabRelevant=0;try{vocabRelevant=GPP.compactVocabulary?GPP.compactVocabulary(state.customVocabulary,GPP.publicSettings(state.settings)).length:0;}catch(_){}
    return `<div id="tt99-puzzle-parent-modal" class="tt99-parent-modal" hidden><button type="button" class="tt99-parent-backdrop" data-puzzle-parent-close aria-label="Close puzzle sharing"></button><section class="tt99-parent-card" role="dialog" aria-modal="true" aria-labelledby="tt99-puzzle-parent-title"><button type="button" class="tt99-parent-close" data-puzzle-parent-close aria-label="Close puzzle sharing">×</button><span class="tt99-parent-kicker">School-led home practice</span><h2 id="tt99-puzzle-parent-title">Share this puzzle setup</h2><p>Parents get a simple page that creates a fresh puzzle pack and matching answers using these puzzle choices and difficulty settings.</p><div class="tt99-parent-helpbar"><div><strong>Putting this on your school website?</strong><small>See every supported method — plain links, school buttons, ready-made cards, PNG images, website packs and widgets — with step-by-step instructions and troubleshooting.</small></div><a href="/schools/" target="_blank" rel="noopener">School website integration help</a></div><div class="tt99-parent-notice">If this setup uses entries from <strong>My vocabulary</strong>, the terms and definitions needed for those activities are included in the shared link. <a href="/privacy/" target="_blank" rel="noopener">Privacy information</a>.</div>${built.error?`<div class="tt99-status">${esc(built.error)}</div>`:`<div class="tt99-parent-current"><strong>Current puzzle setup</strong><small>${esc(puzzleShareSummary())}${vocabRelevant?` · ${vocabRelevant} personal vocabulary entr${vocabRelevant===1?'y':'ies'} included`:''}</small><div class="tt99-parent-website-preview" aria-label="Preview of the school website puzzle card">${preview}</div><div class="tt99-parent-link-row"><input id="tt99-puzzle-parent-link" type="text" readonly value="${esc(built.link)}" aria-label="Puzzle parent practice link"><button type="button" id="tt99-puzzle-copy-link">Copy link</button><a href="${esc(previewLink)}" target="_blank" rel="noopener" id="tt99-puzzle-open-parent">Open parent view</a></div><div class="tt99-parent-card-tools"><button type="button" id="tt99-puzzle-copy-card">Copy website card</button><button type="button" id="tt99-puzzle-download-card">Download card image</button></div></div>`}<div class="tt99-parent-pack"><div class="tt99-parent-pack__copy"><strong>Save, restore or hand over this setup</strong><small>Your puzzle choices are already remembered automatically in this browser. These files make the setup portable and safe to hand to another member of staff or a website administrator.</small></div><div class="tt99-parent-pack__actions"><button type="button" id="tt99-puzzle-download-web-pack" ${built.link?'':'disabled'}>Download website pack</button><button type="button" id="tt99-puzzle-save-config">Save puzzle setup</button><label class="tt99-parent-restore">Restore puzzle setup<input id="tt99-puzzle-restore-config" type="file" accept="application/json,.json"></label></div></div><div class="tt99-parent-pack"><div class="tt99-parent-pack__copy"><strong>Alternative: Maths Games Widget</strong><small>Open the Widget Builder with this puzzle setup already included as one parent choice. If the pack uses My vocabulary, the relevant terms and definitions are included with the shared activity.</small></div><div class="tt99-parent-pack__actions"><button type="button" id="tt99-puzzle-widget-add" >Open widget builder</button></div></div><div id="tt99-puzzle-parent-status" class="tt99-status" role="status" aria-live="polite" hidden></div><div class="tt99-parent-footer"><span>One shared link represents the whole current puzzle pack. Configure another pack and save/share it separately if the school wants several different home-practice choices.</span></div></section></div>`;
  }


  function puzzleSafeDateStamp(){
    const d=new Date(),pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function puzzleDownloadBlob(filename,blob){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function puzzleDownloadJson(filename,data){
    puzzleDownloadBlob(filename,new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
  }
  async function puzzleReadTextFile(file){
    if(file?.text)return file.text();
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error||new Error('Could not read file.'));reader.readAsText(file);
    });
  }
  function puzzleConfigData(){
    return {
      kind:'tt99-school-puzzle-config',
      configVersion:1,
      app:'99 Club Studio',
      engineVersion:G.VERSION,
      savedAt:new Date().toISOString(),
      settings:G.clone(state.settings),
      customVocabulary:G.clone(state.customVocabulary)
    };
  }
  function puzzleConfigFilename(){
    const school=String(personalisation().schoolName||'school').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'school';
    return `99-club-${school}-puzzle-setup-${puzzleSafeDateStamp()}.json`;
  }
  function savePuzzleConfig(){
    puzzleDownloadJson(puzzleConfigFilename(),puzzleConfigData());
  }
  async function restorePuzzleConfig(file){
    const d=JSON.parse(await puzzleReadTextFile(file));
    if(!d||d.kind!=='tt99-school-puzzle-config'||Number(d.configVersion)!==1||!d.settings||typeof d.settings!=='object')throw new Error('That file is not a valid 99 Club puzzle setup.');
    state.settings=G.normalizeSettings(d.settings);
    state.customVocabulary=G.sanitizeCustomVocabulary(d.customVocabulary||[]);
    state.activeEngine='';
    state.openCategories=new Set(GAME_CATEGORIES.filter(cat=>cat.engines.some(id=>state.settings.selectedEngines.includes(id))).map(cat=>cat.id));
    if(!state.openCategories.size)state.openCategories.add('vocabulary');
    state.seed=newSeed();state.replaceCounter=0;
    state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);
    save();
    state.status='Puzzle setup restored. All puzzle choices, difficulty settings, pack settings, personalisation and saved vocabulary from the file are now active.';
    render();
  }
  function puzzleLoadImage(url){
    return new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not load the 99 Club Studio badge.'));img.src=url;
    });
  }
  function puzzleRoundedRect(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function puzzleWrapText(ctx,text,maxWidth,maxLines=2){
    const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';
    for(const word of words){
      const test=line?line+' '+word:word;
      if(ctx.measureText(test).width<=maxWidth||!line)line=test;
      else{lines.push(line);line=word;if(lines.length===maxLines-1)break;}
    }
    if(lines.length<maxLines&&line)lines.push(line);
    const consumed=lines.join(' ').split(/\s+/).filter(Boolean).length;
    if(consumed<words.length&&lines.length){
      let last=lines[lines.length-1];
      while(last&&ctx.measureText(last+'…').width>maxWidth)last=last.replace(/\s+\S+$/,'');
      lines[lines.length-1]=(last||lines[lines.length-1])+'…';
    }
    return lines;
  }
  async function createPuzzleShareCardBlob(){
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=260;const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.shadowColor='rgba(36,52,59,.10)';ctx.shadowBlur=16;ctx.shadowOffsetY=5;
    puzzleRoundedRect(ctx,14,14,1172,232,32);ctx.fillStyle='#ffffff';ctx.fill();ctx.shadowColor='transparent';ctx.lineWidth=3;ctx.strokeStyle='#d6e1e4';ctx.stroke();
    try{
      const badge=await puzzleLoadImage('/assets/99club/images/99club-studio-shield.png'),max=150,scale=Math.min(max/badge.naturalWidth,max/badge.naturalHeight),w=Math.round(badge.naturalWidth*scale),h=Math.round(badge.naturalHeight*scale);
      ctx.drawImage(badge,55+(150-w)/2,55+(150-h)/2,w,h);
    }catch(_){}
    ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='#24343b';ctx.font='700 46px Arial, sans-serif';ctx.fillText(puzzleShareTitle(),230,105);
    ctx.fillStyle='#65747b';ctx.font='400 28px Arial, sans-serif';puzzleWrapText(ctx,puzzleShareSummary(),760,2).forEach((line,i)=>ctx.fillText(line,230,153+i*38));
    ctx.fillStyle='#147d75';ctx.beginPath();ctx.arc(1105,130,44,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 44px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('→',1105,127);
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not create the puzzle-card image.')),'image/png'));
  }
  function puzzleCardFilename(){
    const title=puzzleShareTitle().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'maths-puzzle-practice';
    return title+'-home-practice.png';
  }
  async function downloadPuzzleShareCard(){
    puzzleDownloadBlob(puzzleCardFilename(),await createPuzzleShareCardBlob());
  }
  let puzzleCrcTable=null;
  function puzzleCrc32(bytes){
    if(!puzzleCrcTable){
      puzzleCrcTable=new Uint32Array(256);
      for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);puzzleCrcTable[n]=c>>>0;}
    }
    let crc=0xffffffff;for(const b of bytes)crc=puzzleCrcTable[(crc^b)&0xff]^(crc>>>8);return (crc^0xffffffff)>>>0;
  }
  function puzzleDosDateTime(date=new Date()){
    const year=Math.max(1980,date.getFullYear());
    return {time:((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((Math.floor(date.getSeconds()/2))&31),date:(((year-1980)&127)<<9)|(((date.getMonth()+1)&15)<<5)|(date.getDate()&31)};
  }
  function puzzleZipHeader(size,writer){const out=new Uint8Array(size),view=new DataView(out.buffer);writer(view);return out;}
  async function puzzleZip(entries){
    const encoder=new TextEncoder(),locals=[],centrals=[];let offset=0;
    for(const entry of entries){
      const nameBytes=encoder.encode(entry.name),data=entry.data instanceof Blob?new Uint8Array(await entry.data.arrayBuffer()):(entry.data instanceof Uint8Array?entry.data:encoder.encode(String(entry.data??''))),crc=puzzleCrc32(data),dt=puzzleDosDateTime(entry.date||new Date());
      const local=puzzleZipHeader(30+nameBytes.length,view=>{view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);view.setUint16(8,0,true);view.setUint16(10,dt.time,true);view.setUint16(12,dt.date,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,nameBytes.length,true);view.setUint16(28,0,true);new Uint8Array(view.buffer,30,nameBytes.length).set(nameBytes);});
      const central=puzzleZipHeader(46+nameBytes.length,view=>{view.setUint32(0,0x02014b50,true);view.setUint16(4,20,true);view.setUint16(6,20,true);view.setUint16(8,0x0800,true);view.setUint16(10,0,true);view.setUint16(12,dt.time,true);view.setUint16(14,dt.date,true);view.setUint32(16,crc,true);view.setUint32(20,data.length,true);view.setUint32(24,data.length,true);view.setUint16(28,nameBytes.length,true);view.setUint16(30,0,true);view.setUint16(32,0,true);view.setUint16(34,0,true);view.setUint16(36,0,true);view.setUint32(38,0,true);view.setUint32(42,offset,true);new Uint8Array(view.buffer,46,nameBytes.length).set(nameBytes);});
      locals.push(local,data);centrals.push(central);offset+=local.length+data.length;
    }
    const centralSize=centrals.reduce((n,x)=>n+x.length,0),eocd=puzzleZipHeader(22,view=>{view.setUint32(0,0x06054b50,true);view.setUint16(4,0,true);view.setUint16(6,0,true);view.setUint16(8,entries.length,true);view.setUint16(10,entries.length,true);view.setUint32(12,centralSize,true);view.setUint32(16,offset,true);view.setUint16(20,0,true);});
    return new Blob([...locals,...centrals,eocd],{type:'application/zip'});
  }
  function puzzleWebsitePackReadme(link){
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>99 Club puzzle-practice website pack</title><style>body{font:16px/1.55 Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#24343b}h1,h2{color:#0d5e58}code{background:#f1f5f5;padding:2px 5px;border-radius:4px}.note{padding:12px 14px;background:#eef8f6;border-left:4px solid #147d75}</style></head><body><h1>Maths puzzle-practice website pack</h1><p>This pack contains a ready-made image card, the matching parent-practice link and a restoreable copy of the puzzle setup that created it.</p><h2>Website setup</h2><ol><li>Upload <code>${esc(puzzleCardFilename())}</code> to the school website.</li><li>Make the image clickable.</li><li>Use the URL in <code>practice-link.txt</code> as its destination.</li><li>Add alt text such as “Maths puzzle home practice – printable puzzle pack and answers”.</li><li>Open the link once and download a test PDF before publishing.</li></ol><div class="note"><strong>If the puzzle choices or difficulty settings change:</strong> create a new parent link and replace the old website link. If the visible card description changes, replace the PNG too. Existing links deliberately keep their original settings.</div><p>Full guide: <a href="https://99studio.uk/schools/#puzzle-practice">https://99studio.uk/schools/#puzzle-practice</a></p></body></html>`;
  }
  async function downloadPuzzleWebsitePack(){
    const built=puzzleShareLink();if(!built.link)throw new Error(built.error||'Could not create a parent puzzle link.');
    const entries=[
      {name:puzzleCardFilename(),data:await createPuzzleShareCardBlob()},
      {name:'practice-link.txt',data:puzzleShareTitle()+'\n'+built.link+'\n'},
      {name:'README.html',data:puzzleWebsitePackReadme(built.link)},
      {name:'99-club-puzzle-configuration.json',data:JSON.stringify(puzzleConfigData(),null,2)+'\n'}
    ];
    puzzleDownloadBlob(`99-club-puzzle-website-pack-${puzzleSafeDateStamp()}.zip`,await puzzleZip(entries));
  }

  function render(){
    const eligible=compatibleSet();
    if(state.activeEngine&&!eligible.has(state.activeEngine))state.activeEngine='';
    root.classList.toggle('include-answers',state.settings.includeAnswers);root.classList.toggle('preview-answers',state.previewAnswers);
    root.innerHTML=`
      <div class="tt99-games-shell">
        <section class="tt99-games-hero"><div><span class="tt99-eyebrow">99 Club Studio</span><h1>Maths Games &amp; Puzzles</h1><p>Choose the maths, select the games you want, then build a printable pack. Each game keeps its own difficulty and options.</p></div><nav class="tt99-games-nav" aria-label="99 Club Studio sections"><a href="/">99 Club</a></nav></section>
              <div class="tt99-games-workspace"><aside class="tt99-games-controls">${renderMathsCard()}${renderGamesCard()}${renderPackCard()}${renderPersonaliseCard()}${renderVocabularyManager()}</aside>
          <main class="tt99-games-preview">${renderPreviewToolbar()}<div class="tt99-games-preview-stack tt99-games-pupil-pages">${renderPupilPreview()}</div><div class="tt99-games-preview-stack tt99-games-answer-pages">${renderPages(true)}</div></main></div>
        ${renderPuzzleParentModal()}
      </div>`;
    bind();
  }

  function renderMathsCard(){
    const s=state.settings,topics=Object.entries(G.TOPICS).map(([id,m])=>{const selected=s.topics.includes(id),available=topicAvailable(id);return `<label class="tt99-game-topic ${selected?'is-selected':''} ${available?'':'is-unavailable'}" title="${available?'':'Outside the selected year range'}"><input type="checkbox" data-topic="${id}" ${selected?'checked':''} ${available?'':'disabled'}><span>${esc(m.label)}<small>${builtInCount(id)} built-in${mineCount(id)?` · ${mineCount(id)} mine`:''}</small></span></label>`;}).join('');
    return `<section class="tt99-games-card"><div class="tt99-games-step"><span>1</span><div><h2>Choose the maths</h2><p>These are pack-level choices. Game difficulty is configured separately for each puzzle type.</p></div></div><div class="tt99-games-grid2"><label class="tt99-field"><span>From year</span><select id="games-min-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${s.minYear===y?'selected':''}>Year ${y}</option>`).join('')}</select></label><label class="tt99-field"><span>To year</span><select id="games-max-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${s.maxYear===y?'selected':''}>Year ${y}</option>`).join('')}</select></label></div><span class="tt99-field-label tt99-games-topic-label">Topics</span><div class="tt99-games-topic-grid">${topics}</div></section>`;
  }

  function renderGamesCard(){
    const eligible=compatibleSet(),selected=new Set(state.settings.selectedEngines),visible=Object.values(G.ENGINES).filter(e=>!e.hiddenFromLibrary);
    const renderCard=e=>{const ok=eligible.has(e.id),on=selected.has(e.id)&&ok,active=state.activeEngine===e.id;return `<article class="tt99-engine-card ${on?'is-selected':''} ${active?'is-active':''} ${ok?'':'is-incompatible'}"><label class="tt99-engine-include"><input type="checkbox" data-engine-select="${e.id}" ${on?'checked':''} ${ok?'':'disabled'}><span class="tt99-engine-check"></span><span><b>${esc(e.title)}</b><small>${esc(GAME_CATEGORIES.find(c=>c.id===ENGINE_CATEGORY[e.id])?.label||e.group||'Game')}</small></span></label><div class="tt99-engine-summary">${renderEngineSummary(e.id)}</div><button type="button" class="tt99-engine-configure" data-configure-engine="${e.id}" ${ok?'':'disabled'}>${active?'Done':'Configure'}</button>${!ok?`<p class="tt99-engine-compatibility">Not a good fit for the selected year/topic combination.</p>`:''}</article>`;};
    const groups=GAME_CATEGORIES.map(cat=>{const list=cat.engines.map(id=>G.ENGINES[id]).filter(e=>e&&!e.hiddenFromLibrary),compatible=list.filter(e=>eligible.has(e.id)),selectedIds=compatible.filter(e=>selected.has(e.id)).map(e=>e.id),open=state.openCategories.has(cat.id);return `<section class="tt99-game-category ${selectedIds.length?'has-selection':''} ${open?'is-open':''}"><div class="tt99-game-category-head"><button type="button" class="tt99-game-category-toggle" data-category-toggle="${cat.id}" aria-expanded="${open}"><span class="tt99-category-chevron">${open?'▾':'▸'}</span><span><strong>${esc(cat.label)}</strong><small>${esc(cat.description)}</small></span><em>${selectedIds.length}/${compatible.length} selected</em></button><div class="tt99-category-actions"><button type="button" data-category-select="${cat.id}" ${compatible.length?'':'disabled'}>Select compatible</button><button type="button" data-category-clear="${cat.id}" ${selectedIds.length?'':'disabled'}>Clear</button></div></div>${open?`<div class="tt99-engine-library">${list.map(renderCard).join('')}</div>`:''}</section>`;}).join('');
    const selectedIds=selectedCompatible(),tray=selectedIds.length?selectedIds.map(id=>`<div class="tt99-selected-engine"><div><strong>${esc(G.ENGINES[id].title)}</strong><div class="tt99-engine-summary">${renderEngineSummary(id)}</div></div><div><button type="button" data-configure-engine="${id}">Configure</button><button type="button" data-remove-engine="${id}" aria-label="Remove ${esc(G.ENGINES[id].title)}">×</button></div></div>`).join(''):`<p class="tt99-selected-empty">No games selected yet. Open a category and choose one or more compatible games.</p>`;
    return `<section class="tt99-games-card"><div class="tt99-games-step"><span>2</span><div><h2>Choose &amp; configure games</h2><p>Categories work like the Custom selector: they stay open while you choose games and highlight when they contain selections.</p></div></div><div class="tt99-games-library-tools"><span>${visible.filter(e=>eligible.has(e.id)).length} compatible games</span><button type="button" class="tt99-ghost" id="games-clear-all" ${selectedIds.length?'':'disabled'}>Clear all games</button></div><div class="tt99-game-categories">${groups}</div><div class="tt99-selected-games"><div class="tt99-selected-games-head"><strong>Selected games</strong><span>${selectedIds.length}</span></div>${tray}</div>${renderEngineConfiguration()}<p class="tt99-games-help">Arithmetic Domino Chain has been removed from the one-player library for now; it makes more sense later as a cut-and-match classroom resource than as a pencil puzzle.</p></section>`;
  }

  function directionSummary(o){return o.directionMode==='straight'?'Straight only':o.directionMode==='diagonal'?'Straight + diagonal':o.directionMode==='all'?'Any direction':'Directions: auto';}
  function difficultySummary(o){if(o?.difficulty!=='mixed')return cap(o?.difficulty||'standard');const w=o.difficultyWeights||{easy:25,standard:50,challenge:25};return `Mixed ${w.easy}/${w.standard}/${w.challenge}`;}
  function optionLabel(e,key,value){const spec=(e.settingsSchema||[]).find(x=>x.id===key),opts=spec?.options||[];for(const opt of opts){if(typeof opt==='string'&&opt===value)return cap(opt);if(opt&&typeof opt==='object'&&String(opt.value)===String(value))return opt.label;}return value==='auto'?'Auto':String(value??'');}
  function renderEngineSummary(id){
    const o=engineSettings(id);
    if(id==='wordsearch'){const clue=o.clueMode==='definitions'?'Definitions only':'Words + definitions',terms=o.wordCount==='auto'?'Auto terms':`${o.wordCount} terms`,grid=o.gridSize==='auto'?'Auto grid':`${o.gridSize}×${o.gridSize}`;return `<span>${difficultySummary(o)}</span><span>${clue}</span><span>${terms}</span><span>${grid}</span><span>${directionSummary(o)}</span>`;}
    if(id==='pyramid'){const levels=o.levels==='auto'?'Auto levels':`${o.levels} levels`,clues=o.clueLevel==='more'?'More clues':o.clueLevel==='fewer'?'Fewer clues':'Balanced clues';return `<span>${difficultySummary(o)}</span><span>${levels}</span><span>${clues}</span>`;}
    if(id==='crossword'){const words=o.wordCount==='auto'?'Auto answers':`${o.wordCount} answers`,grid=o.gridSize==='auto'?'Auto grid':`${o.gridSize}×${o.gridSize}`,bank=o.wordBank==='show'?'Word bank shown':o.wordBank==='hide'?'No word bank':'Word bank: auto';return `<span>${difficultySummary(o)}</span><span>${words}</span><span>${grid}</span><span>${bank}</span>`;}
    if(id==='magic'){const size=o.gridSize==='auto'?'Auto size':`${o.gridSize}×${o.gridSize}`,types={auto:'Mixed variants',missing:'Fill missing values',check:'Is it magic?',repair:'Spot & fix error',transform:'Transform square'},numbers={auto:'Numbers: auto',classic:'Classic numbers',shifted:'Shifted consecutive',scaled:'Scaled sequence',decimal:'Decimal sequence'};return `<span>${difficultySummary(o)}</span><span>${size}</span><span>${types[o.puzzleType]||o.puzzleType}</span><span>${numbers[o.numberPattern]||o.numberPattern}</span>`;}
    if(id==='sudoku'){const size=o.gridSize==='auto'?'Auto size':`${o.gridSize}×${o.gridSize}`,style=o.puzzleStyle==='sudoku'?'Sudoku':o.puzzleStyle==='latin'?'Latin Square':'Style: auto',clues=o.clueLevel==='more'?'More clues':o.clueLevel==='fewer'?'Fewer clues':'Balanced clues';return `<span>${difficultySummary(o)}</span><span>${size}</span><span>${style}</span><span>${clues}</span>`;}
    const e=G.ENGINES[id];if(e&&(G.ARITH?.DEFINITIONS?.[id]||G.NUMLOGIC?.DEFINITIONS?.[id])){const parts=[difficultySummary(o)];for(const spec of (e.settingsSchema||[])){if(spec.id==='difficulty'||parts.length>=4)continue;parts.push(optionLabel(e,spec.id,o[spec.id]));}return parts.map(x=>`<span>${esc(x)}</span>`).join('');}
    return '';
  }

  function mixedDifficultyControls(id){const o=engineSettings(id),w=o.difficultyWeights||{easy:25,standard:50,challenge:25};if(o.difficulty!=='mixed')return '';return `<div class="tt99-mixed-difficulty"><div class="tt99-mixed-head"><strong>Difficulty mix</strong><small>Applied across all generated ${esc(G.ENGINES[id]?.title||'puzzles')} of this type. Standard uses the remaining percentage.</small></div><div class="tt99-mixed-weights"><label><span>Easy</span><input type="number" min="0" max="100" step="5" value="${w.easy}" data-mix-edge="${id}:easy"><b>${w.easy}%</b></label><label class="is-derived"><span>Standard</span><input type="number" value="${w.standard}" readonly tabindex="-1"><b>${w.standard}%</b></label><label><span>Challenge</span><input type="number" min="0" max="100" step="5" value="${w.challenge}" data-mix-edge="${id}:challenge"><b>${w.challenge}%</b></label></div><div class="tt99-mixed-presets"><button type="button" data-mix-preset="${id}:25:50:25">Balanced</button><button type="button" data-mix-preset="${id}:50:40:10">Gentle</button><button type="button" data-mix-preset="${id}:15:70:15">Mostly standard</button><button type="button" data-mix-preset="${id}:10:40:50">Challenge-heavy</button></div></div>`;}
  function difficultyChoices(id,current){const descriptions={wordsearch:{easy:'Fewer/simpler placements',standard:'Balanced puzzle',challenge:'Denser puzzle'},pyramid:{easy:'Smaller numbers',standard:'Balanced numbers',challenge:'Larger/deeper puzzle'},crossword:{easy:'Fewer answers + support',standard:'Balanced clues',challenge:'Denser/no word bank'},magic:{easy:'3×3 with more support',standard:'Mixed 3×3 reasoning',challenge:'Harder values + 4×4 options'},sudoku:{easy:'4×4 / 6×6 with more clues',standard:'Balanced 6×6 logic',challenge:'Can use full 9×9 Sudoku'}};const custom=G.ENGINES[id]?.difficultyDescriptions||{},choices=['easy','standard','challenge','mixed'];return `<div class="tt99-engine-choice4">${choices.map(d=>`<button type="button" data-engine-difficulty="${id}:${d}" class="${current===d?'is-selected':''}"><b>${cap(d)}</b><small>${d==='mixed'?'Weighted mix across generated puzzles':custom[d]||descriptions[id]?.[d]||''}</small></button>`).join('')}</div>${mixedDifficultyControls(id)}`;}

  function renderEngineConfiguration(){
    const id=state.activeEngine,e=G.ENGINES[id];if(!e||!compatibleSet().has(id))return '';const o=engineSettings(id);
    if(id==='wordsearch')return `<div class="tt99-engine-panel"><div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" class="tt99-engine-done" data-close-engine>Done</button></div><label class="tt99-field-label">Difficulty</label>${difficultyChoices(id,o.difficulty)}<div class="tt99-engine-panel-grid">
      <label class="tt99-field"><span>Clue style</span><select data-engine-option="wordsearch:clueMode"><option value="words_definitions" ${o.clueMode==='words_definitions'?'selected':''}>Words + definitions</option><option value="definitions" ${o.clueMode==='definitions'?'selected':''}>Definitions only</option></select><small>${o.clueMode==='definitions'?'Pupils work out each term before finding it.':'Pupils see each term together with its mathematical meaning.'}</small></label>
      <label class="tt99-field"><span>Number of terms</span><select data-engine-option="wordsearch:wordCount">${['auto','6','8','10','12'].map(v=>`<option value="${v}" ${o.wordCount===v?'selected':''}>${v==='auto'?'Auto for difficulty':v}</option>`).join('')}</select></label>
      <label class="tt99-field"><span>Grid size</span><select data-engine-option="wordsearch:gridSize">${['auto','12','14','16'].map(v=>`<option value="${v}" ${o.gridSize===v?'selected':''}>${v==='auto'?'Auto for difficulty':`${v} × ${v}`}</option>`).join('')}</select></label>
      <label class="tt99-field"><span>Word directions</span><select data-engine-option="wordsearch:directionMode"><option value="auto" ${o.directionMode==='auto'?'selected':''}>Auto for difficulty</option><option value="straight" ${o.directionMode==='straight'?'selected':''}>Left→right + top→bottom</option><option value="diagonal" ${o.directionMode==='diagonal'?'selected':''}>Straight + diagonals</option><option value="all" ${o.directionMode==='all'?'selected':''}>Any direction incl. backwards</option></select><small>Easy defaults to straight words, Standard adds diagonals, Challenge can use all 8 directions including reversed/upwards words.</small></label>
    </div></div>`;
    if(id==='pyramid')return `<div class="tt99-engine-panel"><div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" class="tt99-engine-done" data-close-engine>Done</button></div><label class="tt99-field-label">Difficulty</label>${difficultyChoices(id,o.difficulty)}<div class="tt99-engine-panel-grid"><label class="tt99-field"><span>Pyramid levels</span><select data-engine-option="pyramid:levels">${['auto','3','4','5','6','7'].map(v=>`<option value="${v}" ${o.levels===v?'selected':''}>${v==='auto'?'Auto for year/difficulty':v}</option>`).join('')}</select></label><label class="tt99-field"><span>How many clues?</span><select data-engine-option="pyramid:clueLevel"><option value="more" ${o.clueLevel==='more'?'selected':''}>More clues</option><option value="balanced" ${o.clueLevel==='balanced'?'selected':''}>Balanced</option><option value="fewer" ${o.clueLevel==='fewer'?'selected':''}>Fewer clues</option></select></label></div></div>`;
    if(id==='crossword')return `<div class="tt99-engine-panel"><div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" class="tt99-engine-done" data-close-engine>Done</button></div><label class="tt99-field-label">Difficulty</label>${difficultyChoices(id,o.difficulty)}<div class="tt99-engine-panel-grid"><label class="tt99-field"><span>Number of answers</span><select data-engine-option="crossword:wordCount">${['auto','6','8','10','12'].map(v=>`<option value="${v}" ${o.wordCount===v?'selected':''}>${v==='auto'?'Auto for difficulty':v}</option>`).join('')}</select></label><label class="tt99-field"><span>Grid size</span><select data-engine-option="crossword:gridSize">${['auto','13','15','17'].map(v=>`<option value="${v}" ${o.gridSize===v?'selected':''}>${v==='auto'?'Auto for difficulty':`${v} × ${v}`}</option>`).join('')}</select></label><label class="tt99-field"><span>Word bank</span><select data-engine-option="crossword:wordBank"><option value="auto" ${o.wordBank==='auto'?'selected':''}>Auto (shown on Easy)</option><option value="show" ${o.wordBank==='show'?'selected':''}>Show word bank</option><option value="hide" ${o.wordBank==='hide'?'selected':''}>Definitions only</option></select><small>Crossword clues come from the same curated term/definition database as Word Search.</small></label></div></div>`;
    if(id==='magic')return `<div class="tt99-engine-panel"><div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" class="tt99-engine-done" data-close-engine>Done</button></div><label class="tt99-field-label">Difficulty</label>${difficultyChoices(id,o.difficulty)}<div class="tt99-engine-panel-grid"><label class="tt99-field"><span>Square size</span><select data-engine-option="magic:gridSize"><option value="auto" ${o.gridSize==='auto'?'selected':''}>Auto for difficulty</option><option value="3" ${o.gridSize==='3'?'selected':''}>3 × 3</option><option value="4" ${o.gridSize==='4'?'selected':''}>4 × 4</option></select><small>Auto keeps younger/easier packs at 3×3 and can introduce 4×4 in Challenge.</small></label><label class="tt99-field"><span>Puzzle style</span><select data-engine-option="magic:puzzleType"><option value="auto" ${o.puzzleType==='auto'?'selected':''}>Mixed variants</option><option value="missing" ${o.puzzleType==='missing'?'selected':''}>Fill missing values</option><option value="check" ${o.puzzleType==='check'?'selected':''}>Check: is it a magic square?</option><option value="repair" ${o.puzzleType==='repair'?'selected':''}>Spot &amp; fix the error</option><option value="transform" ${o.puzzleType==='transform'?'selected':''}>Transform the square</option></select></label><label class="tt99-field"><span>Number pattern</span><select data-engine-option="magic:numberPattern"><option value="auto" ${o.numberPattern==='auto'?'selected':''}>Auto for year/topic</option><option value="classic" ${o.numberPattern==='classic'?'selected':''}>Classic 1–9 / 1–16</option><option value="shifted" ${o.numberPattern==='shifted'?'selected':''}>Shifted consecutive numbers</option><option value="scaled" ${o.numberPattern==='scaled'?'selected':''}>Scaled arithmetic sequence</option><option value="decimal" ${o.numberPattern==='decimal'?'selected':''}>Decimal sequence (Y4+)</option></select></label><label class="tt99-field"><span>Clues shown</span><select data-engine-option="magic:clueLevel"><option value="more" ${o.clueLevel==='more'?'selected':''}>More clues</option><option value="balanced" ${o.clueLevel==='balanced'?'selected':''}>Balanced</option><option value="fewer" ${o.clueLevel==='fewer'?'selected':''}>Fewer clues</option></select><small>Used for missing-value and transform variants.</small></label></div></div>`;
    if(id==='sudoku')return `<div class="tt99-engine-panel"><div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" class="tt99-engine-done" data-close-engine>Done</button></div><label class="tt99-field-label">Difficulty</label>${difficultyChoices(id,o.difficulty)}<div class="tt99-engine-panel-grid"><label class="tt99-field"><span>Grid size</span><select data-engine-option="sudoku:gridSize"><option value="auto" ${o.gridSize==='auto'?'selected':''}>Auto for year/difficulty</option><option value="4" ${o.gridSize==='4'?'selected':''}>4 × 4</option><option value="6" ${o.gridSize==='6'?'selected':''}>6 × 6</option><option value="9" ${o.gridSize==='9'?'selected':''}>9 × 9</option></select><small>Auto uses 4×4 for younger pupils, 6×6 through most KS2, and can introduce full 9×9 Sudoku for older Challenge packs.</small></label><label class="tt99-field"><span>Puzzle style</span><select data-engine-option="sudoku:puzzleStyle"><option value="auto" ${o.puzzleStyle==='auto'?'selected':''}>Mixed Sudoku / Latin Square</option><option value="sudoku" ${o.puzzleStyle==='sudoku'?'selected':''}>Sudoku (rows, columns + boxes)</option><option value="latin" ${o.puzzleStyle==='latin'?'selected':''}>Latin Square (rows + columns)</option></select></label><label class="tt99-field"><span>Clues shown</span><select data-engine-option="sudoku:clueLevel"><option value="more" ${o.clueLevel==='more'?'selected':''}>More clues</option><option value="balanced" ${o.clueLevel==='balanced'?'selected':''}>Balanced</option><option value="fewer" ${o.clueLevel==='fewer'?'selected':''}>Fewer clues</option></select><small>Every generated puzzle is checked to keep a unique solution.</small></label></div></div>`;
    if(G.ARITH?.DEFINITIONS?.[id]||G.NUMLOGIC?.DEFINITIONS?.[id]){const fields=(e.settingsSchema||[]).filter(spec=>spec.id!=='difficulty').map(spec=>{const opts=(spec.options||[]).map(opt=>{const value=typeof opt==='string'?opt:opt.value,label=typeof opt==='string'?cap(opt):opt.label;return `<option value="${esc(value)}" ${String(o[spec.id])===String(value)?'selected':''}>${esc(label)}</option>`;}).join('');return `<label class="tt99-field"><span>${esc(spec.label||spec.id)}</span><select data-engine-option="${id}:${spec.id}">${opts}</select>${spec.help?`<small>${esc(spec.help)}</small>`:''}</label>`;}).join('');return `<div class="tt99-engine-panel"><div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" class="tt99-engine-done" data-close-engine>Done</button></div><label class="tt99-field-label">Difficulty</label>${difficultyChoices(id,o.difficulty)}<div class="tt99-engine-panel-grid">${fields}</div></div>`;}
    return '';
  }

  function renderPackCard(){const s=state.settings,selected=selectedCompatible(),ready=selected.length>0,disabled=PDF&&ready?'':'disabled';return `<section class="tt99-games-card"><div class="tt99-games-step"><span>3</span><div><h2>Build the pack</h2><p>${!selected.length?'Choose at least one compatible game above.':selected.length===1?`Every activity will use ${esc(G.ENGINES[selected[0]].title)}.`:selected.length<=5?`Activities will rotate through ${selected.map(id=>esc(G.ENGINES[id].title)).join(', ')}.`:`Activities will rotate through ${selected.length} selected games.`}</p></div></div><input type="hidden" id="games-sheets" value="${s.sheets}"><input type="hidden" id="games-activities" value="${s.activitiesPerSheet}"><div class="tt99-games-grid2"><label class="tt99-field wide"><span>Worked examples</span><select id="games-worked"><option value="none" ${s.workedExamples==='none'?'selected':''}>None</option><option value="front" ${s.workedExamples==='front'?'selected':''}>At front — one example for each selected game</option></select><small>Examples use separate, simpler data and explain the goal, rules, steps, tip and common mistake.</small></label></div><div class="tt99-games-actions tt99-games-actions-single"><button type="button" class="tt99-primary" id="games-new-version" ${ready?'':'disabled'}>Generate new version</button></div><div class="tt99-games-download-heading"><strong>Download PDFs</strong><small>Like the main 99 Club: pupil sheets, matching answers, or one combined pack.</small></div><div class="tt99-downloads tt99-games-downloads"><button id="games-pdf-student" class="tt99-download" ${disabled}><b>Pupil sheets PDF</b><span>${s.workedExamples==='front'?'Worked examples + pupil sheets':'Pupil sheets only'}</span></button><button id="games-pdf-answer" class="tt99-download" ${disabled}><b>Answer key PDF</b><span>Matching completed games</span></button><button id="games-pdf-both" class="tt99-download tt99-download--accent" ${disabled}><b>Pupil sheets + answers</b><span>One complete PDF</span></button></div><div class="tt99-parent-share"><div><strong>School-led parent puzzle practice</strong><small>Share this complete puzzle setup as a simple parent link, website card or downloadable website pack. Parents see the school-selected settings without the puzzle editor.</small></div><button type="button" class="tt99-secondary" id="games-parent-share" ${ready&&GPP?'':'disabled'}>Create parent link</button></div><div class="tt99-status">${esc(state.status)}</div></section>`;}

  function renderPersonaliseCard(){const p=personalisation();return `<section class="tt99-games-card tt99-personalise-card"><details id="games-personalisation" ${state.personalisationOpen?'open':''}><summary><div class="tt99-games-step"><span>4</span><div><h2>Personalise the pack</h2><p>Optional. School details and logo are remembered on this browser.</p></div></div><span class="tt99-details-state">${state.personalisationOpen?'Hide':'Open'}</span></summary><div class="tt99-personalise-body"><div class="tt99-games-grid2"><label class="tt99-field wide"><span>Pack title</span><input type="text" maxlength="100" data-personal="packTitle" value="${esc(p.packTitle||'Maths Games & Puzzles')}" placeholder="Maths Games & Puzzles"></label><label class="tt99-field wide"><span>School name</span><input type="text" maxlength="100" data-personal="schoolName" value="${esc(p.schoolName||'')}" placeholder="e.g. Oakfield Primary School"></label><label class="tt99-field"><span>Class / year label</span><input type="text" maxlength="80" data-personal="classLabel" value="${esc(p.classLabel||'')}" placeholder="e.g. Year 5 · 5B"></label><label class="tt99-field"><span>Date on sheet</span><input type="date" data-personal="worksheetDate" value="${esc(p.worksheetDate||'')}"><small>Leave blank to omit the date.</small></label></div><div class="tt99-personal-date-actions"><button type="button" class="tt99-ghost" id="games-date-today">Use today</button><button type="button" class="tt99-ghost" id="games-date-clear" ${p.worksheetDate?'':'disabled'}>Remove date</button></div><div class="tt99-games-logo-row"><div class="tt99-games-logo-preview">${p.logoDataUrl?`<img src="${p.logoDataUrl}" alt="School logo preview">`:'<span>LOGO</span>'}</div><div><label class="tt99-secondary tt99-games-logo-upload"><input id="games-logo" type="file" accept="image/png,image/jpeg,image/webp"><span>${p.logoDataUrl?'Replace school logo':'Add school logo'}</span></label>${p.logoDataUrl?'<button type="button" class="tt99-ghost" id="games-remove-logo">Remove logo</button>':''}<small>PNG, JPG or WebP. Resized locally for print.</small></div></div></div></details></section>`;}

  function renderVocabularyManager(){
    const mine=state.customVocabulary,byTopic=Object.entries(G.TOPICS).map(([id,m])=>{const entries=mine.filter(x=>x.topic===id);return `<details class="tt99-vocab-topic" ${entries.length?'open':''}><summary><span>${esc(m.label)}</span><small>${builtInCount(id)} built-in · ${entries.length} mine</small></summary>${entries.length?`<div class="tt99-vocab-mine-list">${entries.map(x=>`<div><span><b>${esc(x.term)}</b><small>${esc(x.definition)} · Y${x.minYear}${x.maxYear!==x.minYear?`–${x.maxYear}`:''}</small></span><button type="button" data-delete-vocab="${mine.indexOf(x)}" aria-label="Delete ${esc(x.term)}">×</button></div>`).join('')}</div>`:`<p class="tt99-vocab-empty">No personal entries for this topic.</p>`}</details>`;}).join('');
    return `<section class="tt99-games-card tt99-vocab-card"><div class="tt99-games-step"><span>5</span><div><h2>Vocabulary library</h2><p><strong>${G.VOCABULARY.length} curated built-in entries</strong> power both Word Search and Crossword. <strong>My vocabulary</strong> is yours only and never changes the public catalogue.</p></div></div><details class="tt99-vocab-add"><summary>Add my term + definition</summary><div class="tt99-vocab-add-body"><label class="tt99-field"><span>Topic</span><select id="vocab-topic">${Object.entries(G.TOPICS).map(([id,m])=>`<option value="${id}">${esc(m.label)}</option>`).join('')}</select></label><label class="tt99-field"><span>Term</span><input id="vocab-term" type="text" maxlength="50" placeholder="e.g. denominator"></label><label class="tt99-field wide"><span>Definition</span><textarea id="vocab-definition" maxlength="260" placeholder="e.g. The number below the fraction line."></textarea></label><label class="tt99-field"><span>From year</span><select id="vocab-min-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}">Year ${y}</option>`).join('')}</select></label><label class="tt99-field"><span>To year</span><select id="vocab-max-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${y===6?'selected':''}>Year ${y}</option>`).join('')}</select></label><button type="button" class="tt99-secondary" id="vocab-add">Add to My vocabulary</button></div></details><div class="tt99-vocab-summary">${byTopic}</div><div class="tt99-vocab-portability"><button type="button" class="tt99-secondary" id="vocab-export">Export my vocabulary</button><label class="tt99-secondary tt99-vocab-import">Import vocabulary file<input type="file" id="vocab-import" accept="application/json,.json"></label><button type="button" class="tt99-ghost" id="vocab-clear" ${mine.length?'':'disabled'}>Clear my vocabulary</button></div><small class="tt99-games-help">Portable files contain only your personal entries. Importing merges them with anything already stored on this browser.</small></section>`;}

  function renderPreviewToolbar(){const selected=selectedCompatible(),p=personalisation();return `<div class="tt99-games-preview-toolbar"><div><strong>${esc(p.packTitle||'Maths Games & Puzzles')}</strong><span>${esc(yearRangeLabel())} · ${esc(topicLabels())} · ${selected.length?selected.map(id=>esc(G.ENGINES[id].title)).join(' + '):'No games selected'} · ${state.settings.sheets} sheet${state.settings.sheets===1?'':'s'}</span><span class="tt99-preview-edit-hint">Use ↻ beside an activity to replace only that puzzle. Word Search also lets you replace one individual term + definition.</span></div><div class="tt99-games-preview-toggle"><button type="button" data-preview="pupil" class="${state.previewAnswers?'':'is-active'}">Pupil</button><button type="button" data-preview="answers" class="${state.previewAnswers?'is-active':''}">Answers</button></div></div>`;}
  function emptyPreview(){return `<div class="tt99-games-empty-preview"><strong>Choose at least one game</strong><span>Your pupil and answer previews will appear here once a compatible game is selected.</span></div>`;}
  function renderPupilPreview(){if(!state.pack.sheets?.length)return emptyPreview();return `${state.settings.workedExamples==='front'&&state.pack.workedExamples?.length?renderWorkedExamplesPages():''}${renderPages(false)}`;}
  function paperHeader(kind,index=0){const p=personalisation(),isAnswer=kind==='answers',worked=kind==='worked',school=p.schoolName||'99 Club Studio · Maths Games & Puzzles',title=p.packTitle||'Maths Games & Puzzles',meta=uniqueMeta([worked?'Worked examples':isAnswer?`Teacher answers ${index}`:`Pupil sheet ${index}`,p.classLabel,yearRangeLabel(),topicLabels(),humanDate(p.worksheetDate)]).join(' · '),right=worked?'Read these before you begin':isAnswer?'Answer key':'Name: __________________________';return `<header class="tt99-game-paper-header">${p.logoDataUrl?`<div class="tt99-game-paper-logo"><img src="${p.logoDataUrl}" alt=""></div>`:''}<div class="tt99-game-paper-identity"><span>${esc(school)}</span><h2>${esc(title)}</h2><p>${esc(meta)}</p></div><div class="tt99-game-name-line">${esc(right)}</div></header>`;}
  function renderWorkedExamplesPages(){const chunks=[];for(let i=0;i<state.pack.workedExamples.length;i+=2)chunks.push(state.pack.workedExamples.slice(i,i+2));return chunks.map((chunk,pageIndex)=>`<article class="tt99-game-paper tt99-worked-page">${paperHeader('worked',pageIndex+1)}<div class="tt99-worked-grid count-${chunk.length}">${chunk.map(renderWorkedExample).join('')}</div><footer><span>Worked examples use separate practice data</span><span>99studio.uk/games/</span></footer></article>`).join('');}
  function renderWorkedExample(ex){
    const ruleList=(ex.rules||[]).length?`<div class="tt99-worked-rules"><h4>Rules</h4><ul>${ex.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:'';
    const steps=`<div class="tt99-worked-steps"><h4>Worked steps</h4><ol>${(ex.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`;
    const notes=`${ex.tip?`<p class="tt99-worked-tip"><strong>Tip:</strong> ${esc(ex.tip)}</p>`:''}${ex.commonMistake?`<p class="tt99-worked-watch"><strong>Watch out:</strong> ${esc(ex.commonMistake)}</p>`:''}`;
    let visual='';
    if(ex.kind==='pyramid'){
      const rows=ex.rows.map((row,r)=>`<div class="tt99-pyramid-row" style="--cells:${row.length}">${row.map((n,c)=>`<span class="${ex.exampleMissing===`${r}:${c}`?'worked-missing':''}">${ex.exampleMissing===`${r}:${c}`?'?':n}</span>`).join('')}</div>`).join('');visual=`<div class="tt99-worked-pyramid">${rows}</div>`;
    }else if(ex.kind==='crossword'){
      visual=`<p><strong>Clue:</strong> ${esc(ex.clue)} <strong>${esc(ex.enumeration||'')}</strong></p><div class="tt99-worked-answer">${ex.answer.split('').map(ch=>`<span>${ch}</span>`).join('')}</div>`;
    }else if(ex.kind==='magic'){
      visual=`<div class="tt99-worked-magic"><span class="tt99-magic-total">Magic total: ${esc(ex.magicSum)}</span><div class="tt99-magic-grid" style="--magic-size:3">${ex.displayGrid.flatMap((row,r)=>row.map((v,c)=>`<span class="${v==null?'blank':''}">${v==null?'?':esc(v)}</span>`)).join('')}</div></div>`;
    }else if(ex.kind==='sudoku'){
      visual=`<div class="tt99-worked-sudoku">${sudokuGridHTML(ex.displayGrid,false,ex.style,ex.boxRows,ex.boxCols,ex.solutionGrid,true)}</div>`;
    }else if(ex.kind==='kakuro'){
      visual=`<div class="tt99-worked-logic-mini kakuro"><span class="clue">4</span><span>1</span><span>3</span></div><p class="tt99-worked-mini-caption">A two-cell run totalling 4 must use two different digits: 1 and 3.</p>`;
    }else if(ex.kind==='futoshiki'){
      visual=`<div class="tt99-worked-logic-mini futoshiki"><span>1</span><i>&lt;</i><span>2</span><i>&lt;</i><span>3</span><i>&lt;</i><span>4</span></div><p class="tt99-worked-mini-caption">The inequality point faces the smaller number; every row also uses each number once.</p>`;
    }else if(ex.kind==='arithmeticcages'){
      visual=`<div class="tt99-worked-cage-mini"><i>6×</i><span>2</span><span>3</span></div><p class="tt99-worked-mini-caption">The two cells make 6 because 2 × 3 = 6.</p>`;
    }else if(ex.kind==='nonogram'){
      visual=`<div class="tt99-worked-nonogram-mini"><b>2 1</b><span class="fill"></span><span class="fill"></span><span></span><span class="fill"></span><span></span></div><p class="tt99-worked-mini-caption">Clue 2 1 means two shaded cells, at least one gap, then one shaded cell.</p>`;
    }else if(ex.kind==='numberpath'){
      visual=`<div class="tt99-worked-numberpath-mini">${[1,2,3,6,5,4,7,8,9].map(v=>`<span>${v}</span>`).join('')}</div><p class="tt99-worked-mini-caption">Consecutive numbers touch along an edge as the path winds through the grid.</p>`;
    }else if(G.ARITH?.DEFINITIONS?.[ex.kind]||G.NUMLOGIC?.DEFINITIONS?.[ex.kind]){
      visual=`<div class="tt99-worked-arithmetic-badge"><strong>${esc(G.ENGINES[ex.kind]?.title||ex.kind)}</strong><span>The worked steps below show one complete example before pupils start the generated puzzle.</span></div>`;
    }else{
      const hits=new Set(Array.from({length:ex.answer.length},(_,i)=>`${ex.start+i}:${ex.row}`));const grid=`<div class="tt99-word-grid worked" style="--grid-size:${ex.size}">${ex.grid.flatMap((row,y)=>row.map((c,x)=>`<span class="${hits.has(`${x}:${y}`)?'hit':''}">${c}</span>`)).join('')}</div>`;visual=`<p>${ex.mode==='definitions'?`<strong>Definition:</strong> ${esc(ex.definition)} ${G.needsEnumeration(ex.term)?`<strong>${esc(ex.enumeration)}</strong>`:''}`:`<strong>${esc(ex.term)}</strong> — ${esc(ex.definition)}`}</p>${grid}`;
    }
    return `<section class="tt99-worked-example"><h3>${esc(ex.title.replace(' worked example',''))}</h3>${ex.goal?`<p class="tt99-worked-goal"><strong>Goal:</strong> ${esc(ex.goal)}</p>`:''}${visual}${ruleList}${steps}${notes}</section>`;
  }

  function renderPages(answers){if(!state.pack.sheets?.length)return emptyPreview();return state.pack.sheets.map((sheet,si)=>`<article class="tt99-game-paper ${answers?'is-answer':''}">${paperHeader(answers?'answers':'pupil',sheet.index)}<div class="tt99-game-activities count-${sheet.activities.length}">${sheet.activities.map((a,ai)=>renderActivity(a,answers,ai+1,si,ai)).join('')}</div><footer><span>Generated locally · ${esc(state.seed)}</span><span>99studio.uk/games/</span></footer></article>`).join('');}

  function activityReplaceButton(si,ai){return `<button type="button" class="tt99-preview-replace tt99-replace-activity" data-replace-activity="${si}:${ai}" title="Replace only this activity" aria-label="Replace only this activity">↻</button>`;}
  function wordReplaceButton(si,ai,wi){return `<button type="button" class="tt99-preview-replace tt99-replace-word" data-replace-word="${si}:${ai}:${wi}" title="Replace only this term and definition" aria-label="Replace this term and definition">↻</button>`;}
  function renderActivity(a,answers,index,si,ai){if(a.error)return `<section class="tt99-game-activity tt99-game-error">${activityReplaceButton(si,ai)}<h3>${index}. ${esc(a.title||'Activity')}</h3><p>${esc(a.error)}</p></section>`;if(a.engineId==='pyramid')return renderPyramid(a,answers,index,si,ai);if(a.engineId==='crossword')return renderCrossword(a,answers,index,si,ai);if(a.engineId==='magic')return renderMagic(a,answers,index,si,ai);if(a.engineId==='sudoku')return renderSudoku(a,answers,index,si,ai);if(G.ARITH?.DEFINITIONS?.[a.engineId])return renderArithmeticActivity(a,answers,index,si,ai);if(G.NUMLOGIC?.DEFINITIONS?.[a.engineId])return renderNumberLogicActivity(a,answers,index,si,ai);return renderWordSearch(a,answers,index,si,ai);}

  function renderWordSearch(a,answers,index,si,ai){
    const answerCells=new Set((a.placements||[]).flatMap(p=>p.cells.map(([x,y])=>`${x}:${y}`))),grid=`<div class="tt99-word-grid size-${a.size}" style="--grid-size:${a.size}">${a.grid.flatMap((row,y)=>row.map((c,x)=>`<span class="${answers&&answerCells.has(`${x}:${y}`)?'hit':''}">${c}</span>`)).join('')}</div>`;
    let clues='';if(a.mode==='definitions')clues=`<ol class="tt99-word-clues">${a.placements.map((p,wi)=>`<li><span>${esc(p.definition)}${G.needsEnumeration(p.term)?` <strong>${esc(G.answerEnumeration(p.term))}</strong>`:''}</span>${wordReplaceButton(si,ai,wi)}</li>`).join('')}</ol>`;else clues=`<div class="tt99-word-pairs">${a.placements.map((p,wi)=>`<div><span class="tt99-word-pair-copy"><b>${esc(p.term)}</b><span>${esc(p.definition)}</span></span>${wordReplaceButton(si,ai,wi)}</div>`).join('')}</div>`;
    const answersList=answers?`<div class="tt99-word-answer-list"><strong>Hidden words:</strong> ${a.placements.map(p=>esc(p.term)).join(' · ')}</div>`:'',label=a.mode==='definitions'?'Definitions only':'Words + definitions',instruction=a.instruction||'Use the clue list to find every maths word.';
    return `<section class="tt99-game-activity tt99-wordsearch">${activityReplaceButton(si,ai)}<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Maths Word Search</h3></div><small>${esc(a.difficulty)} · ${label}</small></div><p class="tt99-game-instruction">${instruction}</p><p class="tt99-word-direction-tip">${esc(a.directionTip||a.directionLabel||'')}</p><div class="tt99-word-layout">${grid}<div class="tt99-word-side">${clues}${answersList}</div></div></section>`;
  }
  function renderPyramid(a,answers,index,si,ai){const missing=new Set(a.missingSet||[]),rows=a.rows.map((row,r)=>`<div class="tt99-pyramid-row" style="--cells:${row.length}">${row.map((n,c)=>{const key=`${r}:${c}`,wasMissing=missing.has(key),blank=wasMissing&&!answers,cls=[blank?'blank':'',answers&&wasMissing?'answer-fill':''].filter(Boolean).join(' ');return `<span class="${cls}">${blank?'':n}</span>`;}).join('')}</div>`).join('');return `<section class="tt99-game-activity tt99-pyramid">${activityReplaceButton(si,ai)}<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Number Pyramid</h3></div><small>${esc(a.difficulty)}</small></div><p class="tt99-game-instruction">${esc(a.instruction)}</p><div class="tt99-pyramid-wrap">${rows}</div>${answers?'<p class="tt99-pyramid-answer-note">Completed values are highlighted.</p>':''}</section>`;}

  function magicGridHTML(grid,answers,highlightKey='',forceAll=false,answerKeys=[]){const n=grid?.length||3,answersSet=new Set(answerKeys||[]);return `<div class="tt99-magic-grid" style="--magic-size:${n}">${grid.flatMap((row,r)=>row.map((v,c)=>{const key=`${r}:${c}`,blank=v==null&&!answers&&!forceAll,classes=[blank?'blank':'',answers&&highlightKey===key?'answer-highlight':'',answers&&answersSet.has(key)?'answer-fill':''].filter(Boolean).join(' ');return `<span class="${classes}">${blank?'':esc(v)}</span>`;})).join('')}</div>`;}
  function renderMagic(a,answers,index,si,ai){
    const info={missing:'Fill missing values',check:'Is it a magic square?',repair:'Spot & fix error',transform:'Transform square'}[a.puzzleType]||'Magic Square';
    let body='';
    if(a.puzzleType==='transform'){
      const target=answers?a.solutionGrid:a.displayGrid;
      body=`<div class="tt99-magic-transform"><div><small>Starting square</small>${magicGridHTML(a.sourceGrid,true,'',true)}</div><div class="tt99-magic-operation">${esc(a.transform?.label||'Transform')}</div><div><small>New square</small>${magicGridHTML(target,answers,'',false,a.missingSet||[])}<span>${answers?`New magic total: <b>${esc(G.formatNumber(a.magicSum))}</b>`:'New magic total: __________'}</span></div></div>`;
    }else{
      const shown=a.puzzleType==='check'?a.displayGrid:(answers?a.solutionGrid:a.displayGrid),answerKeys=a.puzzleType==='missing'?(a.missingSet||[]):a.puzzleType==='repair'?[a.wrongCell]:[];
      let prompt='';
      if(a.puzzleType==='check')prompt=answers?`<span class="tt99-magic-check-answer">${esc(a.checkEvidence||'')}</span>`:'<span>Magic square? <b>Yes / No</b></span><span class="tt99-magic-evidence-line">Evidence: ____________________</span>';
      else if(a.puzzleType==='repair')prompt=answers?`<span>${esc(a.answerText)}</span>`:'<span>Find the incorrect value and replace it.</span>';
      else prompt=`<span>Magic total: ${esc(G.formatNumber(a.magicSum))}</span>`;
      body=`<div class="tt99-magic-main">${magicGridHTML(shown,answers,a.puzzleType==='repair'?a.wrongCell:'',false,answerKeys)}<div class="tt99-magic-side"><strong>${info}</strong>${prompt}</div></div>`;
    }
    return `<section class="tt99-game-activity tt99-magic">${activityReplaceButton(si,ai)}<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Magic Squares</h3></div><small>${esc(a.difficulty)} · ${esc(info)}</small></div><p class="tt99-game-instruction">${esc(a.instruction)}</p>${body}</section>`;
  }

  function sudokuGridHTML(grid,answers,style,boxRows,boxCols,solutionGrid=null,worked=false){
    const n=grid?.length||4,boxR=boxRows||(n===9?3:2),boxC=boxCols||(n===9?3:n===6?3:2);
    return `<div class="tt99-sudoku-grid size-${n} ${style==='latin'?'is-latin':'is-sudoku'} ${worked?'worked':''}" style="--sudoku-size:${n}">${grid.flatMap((row,r)=>row.map((v,c)=>{
      const shown=answers&&solutionGrid?solutionGrid[r][c]:v,wasBlank=!v,classes=[wasBlank?'blank':'given',style==='sudoku'&&(c+1)%boxC===0&&c<n-1?'box-right':'',style==='sudoku'&&(r+1)%boxR===0&&r<n-1?'box-bottom':'',answers&&wasBlank?'answer-fill':''].filter(Boolean).join(' ');
      return `<span class="${classes}">${shown||''}</span>`;
    })).join('')}</div>`;
  }
  function renderSudoku(a,answers,index,si,ai){
    const label=a.style==='latin'?'Latin Square':'Sudoku',rules=a.style==='latin'?`Rows + columns · use 1–${a.size}`:`Rows + columns + boxes · use 1–${a.size}`;
    return `<section class="tt99-game-activity tt99-sudoku">${activityReplaceButton(si,ai)}<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>${label}</h3></div><small>${esc(a.difficulty)} · ${esc(rules)}</small></div><p class="tt99-game-instruction">${esc(a.instruction)}</p><div class="tt99-sudoku-wrap">${sudokuGridHTML(a.displayGrid,answers,a.style,a.boxRows,a.boxCols,a.solutionGrid)}</div>${answers?'<p class="tt99-sudoku-answer-note">Completed grid shown above.</p>':''}</section>`;
  }

  function renderCrossword(a,answers,index,si,ai){
    const starts=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!starts.has(k))starts.set(k,e.number);}
    const cells=a.grid.flatMap((row,y)=>row.map((ch,x)=>{if(!ch)return '';const n=starts.get(`${x}:${y}`);return `<span class="open ${answers?'answer-fill':''}" style="grid-column:${x+1};grid-row:${y+1}">${n?`<i>${n}</i>`:''}${answers?`<b>${ch}</b>`:''}</span>`;}).join('')).join('');
    const across=(a.entries||[]).filter(e=>e.dir==='across'),down=(a.entries||[]).filter(e=>e.dir==='down'),clueList=(label,items)=>`<div class="tt99-crossword-clue-group"><h4>${label}</h4><ol>${items.map(e=>`<li value="${e.number}">${esc(e.clue)} ${esc(e.enumeration||G.answerEnumeration(e.term))}</li>`).join('')}</ol></div>`,bank=a.wordBank&&!answers?`<div class="tt99-crossword-bank"><strong>Word bank:</strong> ${a.entries.map(e=>esc(e.term)).sort().join(' · ')}</div>`:'';
    return `<section class="tt99-game-activity tt99-crossword">${activityReplaceButton(si,ai)}<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Maths Crossword</h3></div><small>${esc(a.difficulty)}${a.wordBank?' · word bank':''}</small></div><p class="tt99-game-instruction">${esc(a.instruction||'Solve the clues and complete the crossword.')}</p><div class="tt99-crossword-layout"><div class="tt99-crossword-grid" style="--cw:${a.width};--ch:${a.height}">${cells}</div><div class="tt99-crossword-clues">${clueList('Across',across)}${clueList('Down',down)}${bank}</div></div></section>`;
  }

  function arithmeticHead(a,index){return `<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>${esc(a.title)}</h3></div><small>${esc(a.difficulty||'')}</small></div><p class="tt99-game-instruction">${esc(a.instruction||'')}</p>`;}
  function arithmagonSVG(a,answers){
    const coords=a.coords||[],corners=answers?a.corners:a.displayCorners,links=a.links||[],displayLinks=answers?links.map(x=>x.value):(a.displayLinks||links.map(x=>x.value)),centre=coords.length?coords.reduce((acc,p)=>[acc[0]+p[0],acc[1]+p[1]],[0,0]).map(v=>v/coords.length):[50,50];let lines='',nodes='';
    const opPoint=(link,p,q,mx,my)=>{let vx,vy;if(link.diagonal){const dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy)||1;vx=-dy/len;vy=dx/len;const tcx=centre[0]-mx,tcy=centre[1]-my;if(Math.hypot(tcx,tcy)<.5){if(vy>0||(Math.abs(vy)<.01&&vx<0)){vx=-vx;vy=-vy;}}else if(vx*tcx+vy*tcy>0){vx=-vx;vy=-vy;}}else{vx=mx-centre[0];vy=my-centre[1];const len=Math.hypot(vx,vy)||1;vx/=len;vy/=len;}const off=link.diagonal?12:12.5;return [mx+vx*off,my+vy*off];};
    links.forEach((link,i)=>{const p=coords[link.a],q=coords[link.b],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,wasBlank=(a.displayLinks||[])[i]==null,cls=answers&&wasBlank?'answer-fill':'',[opx,opy]=opPoint(link,p,q,mx,my);lines+=`<line class="${link.diagonal?'diagonal':''}" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`;nodes+=`<g class="edge ${cls}"><circle cx="${mx}" cy="${my}" r="7.6"/><text x="${mx}" y="${my+2.5}">${displayLinks[i]==null?'':esc(displayLinks[i])}</text><text class="op" x="${opx}" y="${opy+2}">${link.operation==='add'?'+':'×'}</text></g>`;});
    coords.forEach((p,i)=>{const wasBlank=(a.displayCorners||[])[i]==null,cls=answers&&wasBlank?'answer-fill':'';nodes+=`<g class="corner ${cls}"><circle cx="${p[0]}" cy="${p[1]}" r="8.7"/><text x="${p[0]}" y="${p[1]+3}">${corners[i]==null?'':esc(corners[i])}</text></g>`;});
    return `<svg class="tt99-arithmagon-svg" viewBox="0 0 100 100" aria-label="Arithmagon">${lines}${nodes}</svg>`;
  }
  function renderArithmagon(a,answers,index,si,ai){const rule=a.operationMode==='mixed_within'?'Each connection shows + or ×':a.operation==='add'?'Each connection adds its corners':'Each connection multiplies its corners';return `<section class="tt99-game-activity tt99-arithmagon">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-arithmagon-wrap">${arithmagonSVG(a,answers)}<div class="tt99-arithmetic-side"><strong>Rule</strong><span>${rule}</span><small>${answers?'Filled answers are highlighted.':'Use inverse facts when a corner is missing.'}</small></div></div></section>`;}

  function magicShapeSVG(a,answers){const vals=answers&&a.puzzleType!=='check'?a.solutionValues:a.displayValues,hidden=new Set(a.hiddenIndices||[]);let lines='',nodes='';for(const line of a.lines||[])for(let k=0;k<line.length-1;k++){const p=a.coords[line[k]],q=a.coords[line[k+1]];lines+=`<line x1="${p[0]*100}" y1="${p[1]*100}" x2="${q[0]*100}" y2="${q[1]*100}"/>`;}a.coords.forEach((p,i)=>{const cls=[answers&&a.brokenIndex===i?'bad':'',answers&&(hidden.has(i)||a.puzzleType==='repair'&&a.brokenIndex===i)?'answer-fill':''].filter(Boolean).join(' ');nodes+=`<g class="node ${cls}"><circle cx="${p[0]*100}" cy="${p[1]*100}" r="5.8"/><text x="${p[0]*100}" y="${p[1]*100+2.3}">${vals[i]==null?'':esc(vals[i])}</text></g>`;});return `<svg class="tt99-magicshape-svg" viewBox="-8 -8 116 116">${lines}${nodes}</svg>`;}
  function renderMagicShape(a,answers,index,si,ai){let evidence;if(a.puzzleType==='check')evidence=answers?`<strong>${a.isMagic?'Yes — it is magic.':'No — at least one line total is different.'}</strong><small>Line totals: ${(a.lineSums||[]).join(', ')}</small>`:'<strong>Magic? Yes / No</strong><small>Show enough addition to prove it.</small>';else if(a.puzzleType==='repair')evidence=answers?`<strong>Corrected value: ${esc(a.correctValue)}</strong><small>The repaired shape now has equal line totals.</small>`:'<strong>Find the wrong value</strong><small>Correct it so all marked lines match.</small>';else evidence=`<strong>Magic total: ${esc(a.target)}</strong><small>${answers?'Filled answers are highlighted.':'Every marked line must match.'}</small>`;return `<section class="tt99-game-activity tt99-magicshape">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-magicshape-wrap">${magicShapeSVG(a,answers)}<div class="tt99-arithmetic-side">${evidence}</div></div></section>`;}

  function renderMaze(a,answers,index,si,ai){
    const routeSet=new Map((a.path||[]).map((p,i)=>[`${p[0]}:${p[1]}`,i]));
    const grid=(a.grid||[]).flatMap((row,y)=>row.map((cell,x)=>{
      if(!cell)return '<span class="empty"></span>';
      const routeIndex=routeSet.get(`${x}:${y}`),onRoute=routeIndex!==undefined;
      const cls=['tt99-maze-cell',cell.kind,answers&&onRoute?'correct-route':''].filter(Boolean).join(' ');
      let main='';if(cell.kind==='start')main='START';else if(cell.kind==='finish')main='FINISH';else main=esc(G.formatNumber(cell.value));
      const step=answers&&cell.kind==='answer'&&cell.step?`<i>${cell.step}</i>`:'';
      return `<span class="${cls}">${step}<b>${main}</b></span>`;
    }).join('')).join('');
    const questions=(a.steps||[]).map((s,i)=>`<li><b>${i+1}.</b><span>${esc(s.question)}</span>${answers?`<strong>${esc(G.formatNumber(s.answer))}</strong>`:''}</li>`).join('');
    return `<section class="tt99-game-activity tt99-maze">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-maze-layout"><div class="tt99-maze-grid" style="--maze-size:${a.size||5}">${grid}</div><div class="tt99-maze-questions"><h4>Questions</h4><ol>${questions}</ol>${answers?'<small>Highlighted cells show the correct route from START to FINISH.</small>':''}</div></div></section>`;
  }

  function renderPropertyMaze(a,answers,index,si,ai){
    const route=new Set((a.solutionPath||[]).map(([r,c])=>`${r}:${c}`)),start=`${a.start?.[0]}:${a.start?.[1]}`,finish=`${a.finish?.[0]}:${a.finish?.[1]}`;
    const cells=(a.grid||[]).flatMap((row,r)=>row.map((v,c)=>{const k=`${r}:${c}`,isStart=k===start,isFinish=k===finish,onRoute=route.has(k),cls=['tt99-propertymaze-cell',isStart?'start':'',isFinish?'finish':'',answers&&onRoute?'correct-route':''].filter(Boolean).join(' '),label=isStart?'START':isFinish?'FINISH':G.formatNumber(v);return `<span class="${cls}"><b>${esc(label)}</b></span>`;})).join('');
    const rule=a.rule?.shortLabel||a.rule?.label||'Number property';
    return `<section class="tt99-game-activity tt99-propertymaze">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-propertymaze-layout"><div class="tt99-propertymaze-grid" style="--propertymaze-size:${a.size||5}">${cells}</div><aside class="tt99-propertymaze-side"><small>Use only</small><strong>${esc(rule)}</strong><span>${answers?`Highlighted squares show the unique route.${a.deadEndCount?` ${a.deadEndCount} matching dead end${a.deadEndCount===1?'':'s'} ${a.deadEndCount===1?'is':'are'} not part of the route.`:''}`:(a.deadEndCount?`${a.deadEndCount} matching dead end${a.deadEndCount===1?' is':'s are'} deliberate.`:'All matching squares belong to the route in this version.')}</span></aside></div></section>`;
  }

  function renderCrossnumber(a,answers,index,si,ai){const starts=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!starts.has(k))starts.set(k,e.number);}const cells=a.grid.flatMap((row,y)=>row.map((ch,x)=>{if(!ch)return '';const n=starts.get(`${x}:${y}`);return `<span class="open ${answers?'answer-fill':''}" style="grid-column:${x+1};grid-row:${y+1}">${n?`<i>${n}</i>`:''}${answers?`<b>${ch}</b>`:''}</span>`;}).join('')).join(''),across=a.entries.filter(e=>e.dir==='across'),down=a.entries.filter(e=>e.dir==='down'),ratio=(a.width||1)/Math.max(1,a.height||1),shape=ratio<.78?'is-tall':ratio>1.28?'is-wide':'is-balanced',clues=(label,list)=>`<div class="tt99-crossword-clue-group"><h4>${label}</h4><ol>${list.map(e=>`<li value="${e.number}">${esc(e.clue)}</li>`).join('')}</ol></div>`;return `<section class="tt99-game-activity tt99-crossnumber">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-crossword-layout"><div class="tt99-crossword-grid ${shape}" style="--cw:${a.width};--ch:${a.height}">${cells}</div><div class="tt99-crossword-clues">${clues('Across',across)}${clues('Down',down)}</div></div></section>`;}

  function renderNumberSearch(a,answers,index,si,ai){
    const hit=new Set((a.placements||[]).flatMap(p=>(p.cells||[]).map(([x,y])=>`${x}:${y}`))),grid=`<div class="tt99-numbersearch-grid" style="--ns-size:${a.size}">${a.grid.flatMap((row,y)=>row.map((d,x)=>`<span class="${answers&&hit.has(`${x}:${y}`)?'hit':''}">${esc(d)}</span>`)).join('')}</div>`,questions=`<ol class="tt99-numbersearch-questions">${(a.placements||[]).map((q,i)=>`<li><span>${esc(q.question)}</span><b>${answers?`= ${esc(G.formatNumber(q.answer))}`:'= ______'}</b></li>`).join('')}</ol>`;
    return `<section class="tt99-game-activity tt99-numbersearch">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<p class="tt99-numbersearch-tip">${esc(a.directionTip||'')}</p><div class="tt99-numbersearch-layout">${grid}<div class="tt99-numbersearch-side">${questions}${answers?'<small>Highlighted digits show the intended answer placements.</small>':''}</div></div></section>`;
  }

  function renderEquationCrossgrid(a,answers,index,si,ai){
    const solution=a.solutionGrid||[],shown=answers?solution:(a.displayGrid||solution),hidden=new Set(a.hiddenKeys||[]),cells=shown.flatMap((row,r)=>row.map((value,c)=>{const key=`${r}:${c}`,sol=solution?.[r]?.[c],block=sol==='#',isOp=['+','-','×','÷','='].includes(sol),answerFill=answers&&hidden.has(key),display=value==='-'?'−':value;return `<span class="${block?'block':isOp?'operator':'number'} ${value==null?'blank':''} ${answerFill?'answer-fill':''}">${block?'':value==null?'':esc(display)}</span>`;})).join('');
    return `<section class="tt99-game-activity tt99-equationcrossgrid">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-equation-crossgrid" style="--crossgrid-size:${a.size||solution.length||5}">${cells}</div>${answers?'<p class="tt99-crossgrid-answer-note">Completed cells are highlighted.</p>':''}</section>`;
  }

  function renderNumberTrail(a,answers,index,si,ai){const vals=answers?a.values:a.displayValues,cols=a.values.length<=12?4:5,cells=vals.map((v,i)=>`<span class="${answers&&a.displayValues?.[i]==null?'answer-fill':''}"><i>${i+1}</i><b>${v==null?'':esc(G.formatNumber(v))}</b></span>`).join('');return `<section class="tt99-game-activity tt99-numbertrail">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-trail-grid" style="--trail-cols:${cols}">${cells}</div></section>`;}

  function renderTarget(a,answers,index,si,ai){return `<section class="tt99-game-activity tt99-target">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-target-list">${a.challenges.map((c,i)=>`<div><span class="num">${i+1}</span><span class="given">${c.numbers.map(n=>`<b>${n}</b>`).join(' ')}</span><strong>Target ${c.target}</strong><span class="work">${answers?esc(c.solution):'________________________'}</span></div>`).join('')}</div></section>`;}

  function renderBrokenCalc(a,answers,index,si,ai){return `<section class="tt99-game-activity tt99-brokencalc">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-calc-keys">${a.keys.map(k=>`<b>${esc(k)}</b>`).join('')}</div><div class="tt99-target-list compact">${a.targets.map((t,i)=>`<div><span class="num">${i+1}</span><strong>Make ${t.target}</strong><span class="work">${answers?esc(t.solution):'________________________'}</span></div>`).join('')}</div></section>`;}

  function renderSymbols(a,answers,index,si,ai){
    const symbols=a.symbols||a.names||[],values=a.values||[],letters=a.letters||[],code=a.code||[],clues=a.clues||(a.equations||[]).map(e=>e.text),letterFor=s=>{const i=symbols.indexOf(s);return i>=0?letters[i]||'':'';},codeHtml=code.map(s=>`<span><b>${esc(s)}</b></span>`).join(''),answerHtml=code.map(s=>`<span class="${answers?'answer-fill':''}">${answers?`<b>${esc(letterFor(s))}</b>`:''}</span>`).join(''),clueHtml=clues.map((q,i)=>`<div><small>Clue ${i+1}</small>${esc(q)}</div>`).join(''),locks=symbols.map((s,i)=>`<span>${esc(s)} = ${answers?`<b>${esc(values[i])}</b> → ${esc(letters[i])}`:'____'}</span>`).join(''),definition=answers&&a.definition?`<p class="tt99-print-decoder-definition"><strong>${esc(a.word)}:</strong> ${esc(a.definition)}</p>`:'',alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alphabetRows=[alphabet.slice(0,13),alphabet.slice(13)].map(row=>`<span>${[...row].map(ch=>`${ch}=${ch.charCodeAt(0)-64}`).join(' · ')}</span>`).join('');
    return `<section class="tt99-game-activity tt99-symbols tt99-symbol-decoder-print" style="--decoder-count:${Math.max(1,code.length)};--decoder-symbol-count:${Math.max(1,symbols.length)}">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-print-decoder-message"><small>${a.theme==='science'?'Science word':a.theme==='maths'?'Maths word':'Maths / science word'} · secret message</small><div class="tt99-print-decoder-code">${codeHtml}</div><small class="tt99-print-decoder-answer-label">Write the word</small><div class="tt99-print-decoder-answer">${answerHtml}</div><div class="tt99-print-decoder-alphabet"><strong>Letter code</strong>${alphabetRows}</div>${definition}</div><div class="tt99-print-decoder-clues">${clueHtml}</div><div class="tt99-print-decoder-locks">${locks}</div></section>`;
  }

  function renderDomino(a,answers,index,si,ai){const list=answers?a.ordered:a.dominoes;return `<section class="tt99-game-activity tt99-domino">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-domino-grid">${list.map((d,i)=>`<div class="tt99-domino-card">${answers?`<i>${i+1}</i>`:''}<span>${esc(d.left)}</span><span>${esc(d.right)}</span></div>`).join('')}</div></section>`;}

  function renderOperationGrid(a,answers,index,si,ai){
    let codeIndex=0;
    const showOp=op=>op==='-'?'−':op;
    const rows=a.rows.map((r,i)=>{const parts=String(r.text||'').split('□');let equation='';for(let j=0;j<parts.length;j++){equation+=`<span class="tt99-lock-text">${esc(parts[j])}</span>`;if(j<parts.length-1){const op=r.ops?.[j]||'',slotIndex=codeIndex++;equation+=`<span class="tt99-op-slot ${answers?'answer-fill':''}" data-code-slot="${slotIndex}">${answers?esc(showOp(op)):''}</span>`;}}return `<div class="tt99-operation-lock"><span class="tt99-lock-number">${i+1}</span><div class="tt99-lock-equation">${equation}</div></div>`;}).join('');
    const code=(a.code||a.rows.flatMap(r=>r.ops||[])).map((op,i)=>`<span class="${answers?'answer-fill':''}">${answers?esc(showOp(op)):(i+1)}</span>`).join('');
    return `<section class="tt99-game-activity tt99-operationgrid">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-operation-locks">${rows}</div><div class="tt99-operation-code"><strong>Unlock code</strong><div>${code}</div><small>Copy the operation signs from the locks in order.</small></div></section>`;
  }

  function wheelSVG(item,answers){
    const n=item.inputs.length,cx=80,cy=80,innerR=38,outerR=66;let marks='';
    for(let i=0;i<n;i++){const ang=-Math.PI/2+i*2*Math.PI/n,ix=cx+Math.cos(ang)*innerR,iy=cy+Math.sin(ang)*innerR,ox=cx+Math.cos(ang)*outerR,oy=cy+Math.sin(ang)*outerR,input=answers?item.inputs[i]:item.displayInputs[i],out=answers?item.outputs[i]:item.displayOutputs[i],inFill=answers&&item.displayInputs[i]==null,outFill=answers&&item.displayOutputs[i]==null;marks+=`<line x1="${ix}" y1="${iy}" x2="${ox}" y2="${oy}"/><g class="inner ${inFill?'answer-fill':''}"><circle cx="${ix}" cy="${iy}" r="10"/><text x="${ix}" y="${iy+3}">${input==null?'':esc(input)}</text></g><g class="outer ${out==null?'blank':''} ${outFill?'answer-fill':''}"><circle cx="${ox}" cy="${oy}" r="11"/><text x="${ox}" y="${oy+3}">${out==null?'':esc(out)}</text></g>`;}
    return `<svg class="tt99-wheel-svg" viewBox="0 0 160 160" aria-label="Rule wheel">${marks}<g class="centre"><circle cx="80" cy="80" r="20"/><text x="80" y="75">RULE</text><text class="rule-text" x="80" y="87">${esc(item.rule)}</text></g></svg>`;
  }
  function factorWebSVG(item,answers){
    const pairs=item.pairs||[],shown=item.displayPairs||pairs.map(()=>[null,null]),n=Math.max(3,pairs.length),cx=110,cy=110,centreR=25,pairRX=76,pairRY=62,pairW=66,pairH=27,fieldW=24,opW=15;let spokes='',units='';
    for(let i=0;i<n;i++){
      const ang=-Math.PI/2+i*2*Math.PI/n,px=cx+Math.cos(ang)*pairRX,py=cy+Math.sin(ang)*pairRY,dx=px-cx,dy=py-cy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,source=answers&&pairs[i]?pairs[i]:(shown[i]||[null,null]),left=source?.[0],right=source?.[1],fillL=answers&&shown[i]?.[0]==null,fillR=answers&&shown[i]?.[1]==null,halfW=pairW/2,halfH=pairH/2,tx=Math.abs(ux)>1e-9?halfW/Math.abs(ux):Infinity,ty=Math.abs(uy)>1e-9?halfH/Math.abs(uy):Infinity,t=Math.min(tx,ty)+1.3,startX=cx+ux*(centreR+2),startY=cy+uy*(centreR+2),endX=px-ux*t,endY=py-uy*t,capsuleX=px-halfW,capsuleY=py-halfH,leftSep=px-opW/2,rightSep=px+opW/2;
      spokes+=`<line class="factor-spoke" x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}"/>`;
      units+=`<g class="petal factor-pair-unit"><rect class="factor-pair-capsule" x="${capsuleX}" y="${capsuleY}" width="${pairW}" height="${pairH}" rx="9"/><rect class="factor-field ${fillL?'answer-fill':''}" x="${capsuleX+1}" y="${capsuleY+1}" width="${fieldW}" height="${pairH-2}" rx="8"/><rect class="factor-field ${fillR?'answer-fill':''}" x="${capsuleX+pairW-fieldW-1}" y="${capsuleY+1}" width="${fieldW}" height="${pairH-2}" rx="8"/><line class="factor-divider" x1="${leftSep}" y1="${capsuleY+4}" x2="${leftSep}" y2="${capsuleY+pairH-4}"/><line class="factor-divider" x1="${rightSep}" y1="${capsuleY+4}" x2="${rightSep}" y2="${capsuleY+pairH-4}"/><text class="factor-value ${fillL?'answer-fill-text':''}" x="${capsuleX+fieldW/2+1}" y="${py}" dominant-baseline="middle">${left==null?'':esc(left)}</text><text class="factor-op" x="${px}" y="${py}" dominant-baseline="middle">×</text><text class="factor-value ${fillR?'answer-fill-text':''}" x="${capsuleX+pairW-fieldW/2-1}" y="${py}" dominant-baseline="middle">${right==null?'':esc(right)}</text></g>`;
    }
    const centre=answers?item.centre:item.displayCentre,centreFill=answers&&item.displayCentre==null;return `<svg class="tt99-factor-svg" viewBox="0 0 220 220" aria-label="Factor pair web">${spokes}${units}<g class="centre ${centreFill?'answer-fill':''}"><circle cx="${cx}" cy="${cy}" r="${centreR}"/><text class="centre-label" x="${cx}" y="${cy-7}" text-anchor="middle" dominant-baseline="middle">FACTOR PAIRS</text><text class="centre-value" x="${cx}" y="${cy+9}" text-anchor="middle" dominant-baseline="middle">${centre==null?'':esc(centre)}</text></g></svg>`;
  }
  function diamondSVG(item,answers){const hidden=new Set(item.hidden||[]),val=k=>answers?item[k]:(hidden.has(k)?'':item[k]),cls=k=>answers&&hidden.has(k)?'answer-fill':'',nodes=[['top',80,28,'PRODUCT'],['left',28,80,''],['right',132,80,''],['bottom',80,132,'SUM']];let body='<path class="diamond-shape" d="M80 28 L132 80 L80 132 L28 80 Z"/>';for(const [k,x,y,label] of nodes){body+=`<g class="diamond-node ${cls(k)}"><circle cx="${x}" cy="${y}" r="16"/><text class="value" x="${x}" y="${y+3}" text-anchor="middle">${esc(val(k))}</text>${label?`<text class="label ${k==='top'?'product-label':'sum-label'}" x="${x}" y="${k==='top'?y-19:y+19}" text-anchor="middle">${label}</text>`:''}</g>`;}return `<svg class="tt99-diamond-svg" viewBox="0 0 160 160" aria-label="Sum and product diamond">${body}</svg>`;}
  function renderNumberWheels(a,answers,index,si,ai){let body='';
    const countClass=`items-${a.items.length}`;
    if(a.style==='wheel')body=`<div class="tt99-wheel-items visual ${countClass}">${a.items.map(item=>`<div class="tt99-wheel-visual">${wheelSVG(item,answers)}</div>`).join('')}</div>`;
    else if(a.style==='factor')body=`<div class="tt99-factor-items visual ${countClass}" style="--factor-cols:${a.items.length===6?2:a.items.length>=5?3:a.items.length<=3?a.items.length:2}">${a.items.map(item=>`<div class="tt99-factor-visual">${factorWebSVG(item,answers)}</div>`).join('')}</div>`;
    else body=`<div class="tt99-diamond-items visual ${countClass}">${a.items.map(item=>`<div class="tt99-diamond-visual">${diamondSVG(item,answers)}</div>`).join('')}</div>`;
    return `<section class="tt99-game-activity tt99-numberwheels">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}${body}</section>`;
  }

  function renderFunctionMachine(a,answers,index,si,ai){const rule=a.operations.map(o=>`${o.op}${o.value}`).join(' → ');return `<section class="tt99-game-activity tt99-functionmachine">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-machine-rule"><span>INPUT</span>${a.operations.map(o=>`<b>${o.op} ${o.value}</b>`).join('<i>→</i>')}<span>OUTPUT</span></div><table class="tt99-machine-table"><thead><tr><th>Input</th><th>Output</th></tr></thead><tbody>${a.rows.map(r=>`<tr><td class="${answers&&r.hide==='input'?'answer-fill':''}">${answers||r.hide!=='input'?r.input:'____'}</td><td class="${answers&&r.hide==='output'?'answer-fill':''}">${answers||r.hide!=='output'?r.output:'____'}</td></tr>`).join('')}</tbody></table></section>`;}

  function renderBalance(a,answers,index,si,ai){
    const paper=a.paper||{},rows=paper.rows||a.rows||[],f=paper.finalChallenge||a.finalChallenge||{},labels='ABCDEFGHIJKLMNOPQRSTUVWXYZ',label=i=>rows[i]?.weightLabel||labels[i]||String(i+1),side=s=>rows.map((r,i)=>({r,i})).filter(x=>f.solutionSides?.[x.i]===s),slot=(r,i,compact=false)=>`<span class="tt99-balance-paper-weight ${compact?'compact':''} ${answers?'answer-fill':''}"><i>${esc(label(i))}</i><b>${answers?esc(r.answer):''}</b></span>`,cards=rows.map((r,i)=>{const raw=String(r.display),parts=raw.split('□'),before=parts[0]||'',after=parts.slice(1).join('□');return `<div class="tt99-balance-print-card"><small>Weight ${esc(label(i))}</small><div class="tt99-balance-print-equation"><span>${esc(before)}</span>${slot(r,i)}<span>${esc(after)}</span></div></div>`;}).join(''),results=rows.map((r,i)=>slot(r,i,true)).join(''),pan=(name,items)=>`<div class="tt99-balance-paper-pan"><small>${name}</small><div class="tt99-balance-paper-pan-slots">${[0,1].map(j=>{const item=items[j];return item&&answers?`<span class="filled"><b>${esc(label(item.i))}</b><em>${esc(item.r.answer)}</em></span>`:'<span class="blank">____</span>';}).join('')}</div><strong>Total ${answers?esc(f.target):'____'}</strong></div>`,left=side('L'),right=side('R');
    return `<section class="tt99-game-activity tt99-balance tt99-balance-lab-print">${activityReplaceButton(si,ai)}${arithmeticHead({...a,title:'Balance Lab',instruction:'Find the value of each weight so both sides of every equation are equal.'},index)}<div class="tt99-balance-print-list">${cards}</div><div class="tt99-balance-print-results"><strong>Your weights</strong>${results}</div><div class="tt99-balance-print-final"><small>${answers?'Final balance · example solution':'Final balance'}</small><p>Use A, B, C and D exactly once. Put two weights on each side, then add the totals.</p><div class="tt99-balance-paper-scale">${pan('Left',left)}<div class="tt99-balance-paper-centre"><span class="beam"></span><span class="stand">▲</span><b>=</b></div>${pan('Right',right)}</div></div></section>`;
  }


  function renderColourLogic(a,answers,index,si,ai){
    const key=`<div class="tt99-cl-print-key">${(a.colors||[]).map(c=>`<span><b>${esc(c.id)}</b>${esc(c.name)}</span>`).join('')}</div>`,rules=`<ol class="tt99-cl-print-rules">${(a.clues||[]).map(c=>`<li>${esc(c.text)}</li>`).join('')}</ol>`;
    let body='';
    if(a.variant==='row'){
      body=`<div class="tt99-cl-print-row">${key}<div class="tt99-cl-paper-row" style="--cl-count:${a.solution.length}">${a.solution.map(v=>`<span>${answers?esc(v):''}</span>`).join('')}</div>${rules}</div>`;
    }else{
      body=`<div class="tt99-cl-paper-layout"><div><div class="tt99-cl-paper-grid" style="--cl-n:${a.size}">${a.solutionGrid.flat().map(v=>`<span>${answers?esc(v):''}</span>`).join('')}</div>${key}</div>${rules}</div>`;
    }
    return `<section class="tt99-game-activity tt99-colourlogic-print">${activityReplaceButton(si,ai)}${logicHead(a,index)}${body}</section>`;
  }

  function mobileShapeSvg(id,cx,cy,size){if(id==='circle')return `<circle class="s-circle" cx="${cx}" cy="${cy}" r="${size*.46}"/>`;if(id==='square')return `<rect class="s-square" x="${cx-size*.45}" y="${cy-size*.45}" width="${size*.9}" height="${size*.9}" rx="2"/>`;if(id==='triangle')return `<path class="s-triangle" d="M ${cx} ${cy-size*.52} L ${cx+size*.52} ${cy+size*.45} L ${cx-size*.52} ${cy+size*.45} Z"/>`;if(id==='diamond')return `<path class="s-diamond" d="M ${cx} ${cy-size*.55} L ${cx+size*.5} ${cy} L ${cx} ${cy+size*.55} L ${cx-size*.5} ${cy} Z"/>`;return `<path class="s-star" d="M ${cx} ${cy-size*.56} L ${cx+size*.16} ${cy-size*.18} L ${cx+size*.55} ${cy-size*.17} L ${cx+size*.25} ${cy+size*.08} L ${cx+size*.35} ${cy+size*.48} L ${cx} ${cy+size*.25} L ${cx-size*.35} ${cy+size*.48} L ${cx-size*.25} ${cy+size*.08} L ${cx-size*.55} ${cy-size*.17} L ${cx-size*.16} ${cy-size*.18} Z"/>`;}
  function mobileLeaves(n){return n.type==='group'?1:mobileLeaves(n.left)+mobileLeaves(n.right);}
  function mobileDepth(n){return n.type==='group'?1:1+Math.max(mobileDepth(n.left),mobileDepth(n.right));}
  function mobilePaperSvg(a){let parts=[];function rec(n,x0,x1,y){const cx=(x0+x1)/2;if(n.type==='group'){parts.push(`<line class="string" x1="${cx}" y1="${y-8}" x2="${cx}" y2="${y+7+n.count*19}"/>`);for(let i=0;i<n.count;i++)parts.push(mobileShapeSvg(n.shape,cx,y+15+i*19,14));return;}const ll=mobileLeaves(n.left),rr=mobileLeaves(n.right),split=x0+(x1-x0)*ll/(ll+rr),lc=(x0+split)/2,rc=(split+x1)/2;parts.push(`<line class="bar" x1="${lc}" y1="${y}" x2="${rc}" y2="${y}"/><circle class="pivot" cx="${cx}" cy="${y}" r="2.4"/><line class="string" x1="${lc}" y1="${y}" x2="${lc}" y2="${y+25}"/><line class="string" x1="${rc}" y1="${y}" x2="${rc}" y2="${y+25}"/>`);rec(n.left,x0,split,y+34);rec(n.right,split,x1,y+34);}rec(a.tree,12,488,34);return `<svg class="tt99-mobile-paper-svg" viewBox="0 0 500 ${Math.max(165,mobileDepth(a.tree)*58+50)}">${a.topTotal!=null?`<g class="top-total"><circle cx="250" cy="14" r="13"/><text x="250" y="18">${esc(a.topTotal)}</text><line x1="250" y1="27" x2="250" y2="34"/></g>`:`<line class="string" x1="250" y1="8" x2="250" y2="34"/>`}${parts.join('')}</svg>`;}
  function renderMobileBalance(a,answers,index,si,ai){
    const vals=(a.shapeIds||[]).map(id=>{const m=a.shapeMeta[id]||{label:id};const given=a.givens?.[id]!=null;return `<span><svg viewBox="0 0 40 40">${mobileShapeSvg(id,20,20,18)}</svg><b>${esc(m.label)}</b><em>${given||answers?esc(a.values[id]):'____'}</em></span>`;}).join('');
    return `<section class="tt99-game-activity tt99-mobilebalance-print">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-mobile-paper-wrap">${mobilePaperSvg(a)}<div class="tt99-mobile-paper-values">${vals}</div></div></section>`;
  }

  function logicHead(a,index){return `<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>${esc(a.title)}</h3></div><small>${esc(a.difficulty||'')}</small></div><p class="tt99-game-instruction">${esc(a.instruction||'')}</p>`;}

  function renderKakuro(a,answers,index,si,ai){
    const n=a.size,given=new Map((a.givens||[]).map(g=>[`${g.r}:${g.c}`,g.v]));
    const cell=(r,c)=>{if(a.mask[r][c]){const v=answers?a.solutionGrid[r][c]:given.get(`${r}:${c}`);const fill=answers&&!given.has(`${r}:${c}`);return `<span class="play ${fill?'answer-fill':''}">${v?`<b>${esc(v)}</b>`:''}</span>`;}const clue=a.clueCells?.[`${r}:${c}`]||{};return `<span class="block ${clue.across||clue.down?'has-clue':''}">${clue.down?`<i class="down">${esc(clue.down)}</i>`:''}${clue.across?`<i class="across">${esc(clue.across)}</i>`:''}</span>`;};
    return `<section class="tt99-game-activity tt99-kakuro">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class="tt99-kakuro-grid" style="--logic-n:${n}">${Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>cell(r,c)).join('')).join('')}</div>${answers?'<p class="tt99-logic-answer-note">Completed cross-sums shown above.</p>':''}</section>`;
  }

  function renderFutoshiki(a,answers,index,si,ai){
    const n=a.size,parts=[];for(let r=0;r<2*n-1;r++)for(let c=0;c<2*n-1;c++){if(r%2===0&&c%2===0){const rr=r/2,cc=c/2,v=answers?a.solutionGrid[rr][cc]:a.displayGrid[rr][cc];const wasGiven=!!a.displayGrid[rr][cc],fill=answers&&!wasGiven;parts.push(`<span class="cell ${wasGiven?'given':''} ${fill?'answer-fill':''}">${v||''}</span>`);}else if(r%2===0&&c%2===1){const sign=a.hSigns[r/2]?.[(c-1)/2]||'';parts.push(`<span class="sign horizontal">${esc(sign)}</span>`);}else if(r%2===1&&c%2===0){const sign=a.vSigns[(r-1)/2]?.[c/2]||'';parts.push(`<span class="sign vertical">${sign==='^'?'∧':sign==='v'?'∨':''}</span>`);}else parts.push('<span class="gap"></span>');}
    return `<section class="tt99-game-activity tt99-futoshiki">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class="tt99-futoshiki-grid" style="--logic-wide:${2*n-1}">${parts.join('')}</div>${answers?'<p class="tt99-logic-answer-note">Completed inequality grid shown above.</p>':''}</section>`;
  }

  function renderArithmeticCages(a,answers,index,si,ai){
    const n=a.size,cageAt=new Map();(a.cages||[]).forEach((cg,i)=>cg.cells.forEach(([r,c])=>cageAt.set(`${r}:${c}`,i)));const first=new Map();(a.cages||[]).forEach((cg,i)=>{const sorted=cg.cells.slice().sort((x,y)=>x[0]-y[0]||x[1]-y[1]);first.set(i,sorted[0].join(':'));});
    const cells=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++){const ci=cageAt.get(`${r}:${c}`),cg=a.cages[ci],top=r===0||cageAt.get(`${r-1}:${c}`)!==ci,left=c===0||cageAt.get(`${r}:${c-1}`)!==ci,right=c===n-1||cageAt.get(`${r}:${c+1}`)!==ci,bottom=r===n-1||cageAt.get(`${r+1}:${c}`)!==ci,styles=[top?'top':'',right?'right':'',bottom?'bottom':'',left?'left':''].filter(Boolean).join(' '),label=first.get(ci)===`${r}:${c}`?`${G.formatNumber(cg.target)}${cg.op==='='?'':cg.op}`:'',v=answers?a.solutionGrid[r][c]:'';cells.push(`<span class="cage-cell ${styles} ${answers?'answer-fill':''}">${label?`<i>${esc(label)}</i>`:''}${v?`<b>${esc(v)}</b>`:''}</span>`);}
    return `<section class="tt99-game-activity tt99-arithmetic-cages">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class="tt99-cage-grid" style="--logic-n:${n}">${cells.join('')}</div>${answers?'<p class="tt99-logic-answer-note">Completed cage grid shown above.</p>':''}</section>`;
  }

  function renderNonogram(a,answers,index,si,ai){
    const n=a.size,maxRow=Math.max(...a.rowClues.map(x=>x.length)),maxCol=Math.max(...a.colClues.map(x=>x.length)),parts=[];
    parts.push(`<span class="corner" style="grid-column:1 / span ${maxRow};grid-row:1 / span ${maxCol}"></span>`);
    for(let c=0;c<n;c++){const clues=a.colClues[c];for(let k=0;k<maxCol;k++){const v=clues[clues.length-maxCol+k];parts.push(`<span class="col-clue" style="grid-column:${maxRow+c+1};grid-row:${k+1}">${v&&v!==0?esc(v):''}</span>`);}}
    for(let r=0;r<n;r++){const clues=a.rowClues[r];for(let k=0;k<maxRow;k++){const v=clues[clues.length-maxRow+k];parts.push(`<span class="row-clue" style="grid-column:${k+1};grid-row:${maxCol+r+1}">${v&&v!==0?esc(v):''}</span>`);}for(let c=0;c<n;c++){const fill=answers&&a.solutionGrid[r][c],majorC=(c>0&&c%5===0)?' major-c':'',majorR=(r>0&&r%5===0)?' major-r':'';parts.push(`<span class="pixel ${fill?'filled':''}${majorC}${majorR}" style="grid-column:${maxRow+c+1};grid-row:${maxCol+r+1}"></span>`);}}
    return `<section class="tt99-game-activity tt99-nonogram">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class="tt99-nonogram-grid" style="--ng-cols:${maxRow+n};--ng-rows:${maxCol+n};--ng-clue-cols:${maxRow};--ng-clue-rows:${maxCol}">${parts.join('')}</div>${answers?'<p class="tt99-logic-answer-note">Shaded solution shown above.</p>':'<p class="tt99-nonogram-key">Shade certain squares; use a small × for squares you prove are empty.</p>'}</section>`;
  }

  function renderNumberPath(a,answers,index,si,ai){const n=a.size,cells=a.solutionGrid.flatMap((row,r)=>row.map((v,c)=>{const shown=answers?v:a.displayGrid[r][c];const wasGiven=!!a.displayGrid[r][c],fill=answers&&!wasGiven;return `<span class="${wasGiven?'given':''} ${fill?'answer-fill':''}">${shown||''}</span>`;})).join('');return `<section class="tt99-game-activity tt99-numberpath">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class="tt99-numberpath-grid" style="--logic-n:${n}">${cells}</div>${answers?'<p class="tt99-logic-answer-note">Completed path shown above.</p>':''}</section>`;}

  function renderSumplete(a,answers,index,si,ai){
    const n=a.size,parts=[];
    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        const keep=!!a.solutionMask?.[r]?.[c],cls=answers?(keep?'answer-keep':'answer-cross'):'';
        parts.push(`<span class="value ${cls}">${esc(G.formatNumber(a.valueGrid?.[r]?.[c]))}</span>`);
      }
      parts.push(`<span class="target row-target" title="Row target">${esc(G.formatNumber(a.rowTargets?.[r]))}</span>`);
    }
    for(let c=0;c<n;c++)parts.push(`<span class="target col-target" title="Column target">${esc(G.formatNumber(a.colTargets?.[c]))}</span>`);
    parts.push('<span class="corner">SUM</span>');
    return `<section class="tt99-game-activity tt99-sumplete">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class="tt99-sumplete-grid" style="--sumplete-n:${n}">${parts.join('')}</div>${answers?'<p class="tt99-sumplete-key">Crossed numbers are removed; highlighted numbers are kept.</p>':'<p class="tt99-sumplete-key">Targets on the right are row sums; targets underneath are column sums.</p>'}</section>`;
  }


  function renderExtraActivity(a,answers,index,si,ai){
    const replace=activityReplaceButton(si,ai);
    const head=`<div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>${esc(a.title||'Puzzle')}</h3></div><small>${esc(cap(a.difficulty||'standard'))}</small></div>`;
    if(a.engineId==='diagonalpath'){
      const n=a.size,grid=answers?a.solutionGrid:a.displayGrid;
      return `<section class="tt99-game-activity tt99-extra-preview tt99-extra-diagonal">${replace}${head}<p class="tt99-game-instruction">${esc(a.instruction)}</p><div class="tt99-extra-path-grid" style="--n:${n}">${grid.flatMap((row,r)=>row.map((v,c)=>`<span class="${!answers&&v?'given':answers&&!a.displayGrid[r][c]?'answer-fill':''}">${v||''}</span>`)).join('')}</div></section>`;
    }
    if(a.engineId==='squaresearch'){
      const n=a.size,over=answers?(a.matches||[]).map(m=>`<i style="--r:${m.r};--c:${m.c}"></i>`).join(''):'';
      return `<section class="tt99-game-activity tt99-extra-preview tt99-extra-squaresearch">${replace}${head}<p class="tt99-game-instruction">${esc(a.instruction)}</p><div class="tt99-extra-search-target">Target <strong>${a.target}</strong></div><div class="tt99-extra-search-grid" style="--n:${n}">${a.grid.flatMap(row=>row.map(v=>`<span>${v}</span>`)).join('')}${over}</div></section>`;
    }
    if(a.engineId==='insertops'){
      const parts=[];for(let i=0;i<a.numbers.length;i++){parts.push(`<b>${a.numbers[i]}</b>`);if(i<a.numbers.length-1)parts.push(`<span class="${answers?'answer-fill':'blank-op'}">${answers?esc(a.solutionOps[i]):'□'}</span>`);}
      return `<section class="tt99-game-activity tt99-extra-preview tt99-extra-insertops">${replace}${head}<p class="tt99-game-instruction">${esc(a.instruction)}</p><div class="tt99-extra-op-equation">${parts.join('')}<b>=</b><strong>${a.target}</strong></div><p class="tt99-extra-op-rule">Allowed signs: ${a.allowedOps.map(esc).join(' · ')}</p></section>`;
    }
    if(a.engineId==='perimeterregions'){
      const n=a.size,clueMap=new Map((a.clues||[]).map(q=>[q.idx,q.perimeter])),cells=[];
      for(let i=0;i<n*n;i++){const r=Math.floor(i/n),cc=i%n,own=a.solutionOwner[i],top=answers&&r>0&&a.solutionOwner[i-n]!==own,right=answers&&cc<n-1&&a.solutionOwner[i+1]!==own,bottom=answers&&r<n-1&&a.solutionOwner[i+n]!==own,left=answers&&cc>0&&a.solutionOwner[i-1]!==own;cells.push(`<span style="${top?'border-top-width:3px;':''}${right?'border-right-width:3px;':''}${bottom?'border-bottom-width:3px;':''}${left?'border-left-width:3px;':''}">${clueMap.get(i)||''}</span>`);}
      return `<section class="tt99-game-activity tt99-extra-preview tt99-extra-perimeter">${replace}${head}<p class="tt99-game-instruction">${esc(a.instruction)}</p><div class="tt99-extra-perimeter-grid" style="--n:${n}">${cells.join('')}</div></section>`;
    }
    return '';
  }

  function renderNumberLogicActivity(a,answers,index,si,ai){if(a.engineId==='diagonalpath'||a.engineId==='perimeterregions')return renderExtraActivity(a,answers,index,si,ai);if(a.engineId==='kakuro')return renderKakuro(a,answers,index,si,ai);if(a.engineId==='futoshiki')return renderFutoshiki(a,answers,index,si,ai);if(a.engineId==='arithmeticcages')return renderArithmeticCages(a,answers,index,si,ai);if(a.engineId==='nonogram')return renderNonogram(a,answers,index,si,ai);if(a.engineId==='numberpath')return renderNumberPath(a,answers,index,si,ai);if(a.engineId==='sumplete')return renderSumplete(a,answers,index,si,ai);return `<section class="tt99-game-activity">${activityReplaceButton(si,ai)}${logicHead(a,index)}</section>`;}

  function renderArithmeticActivity(a,answers,index,si,ai){if(a.engineId==='squaresearch'||a.engineId==='insertops')return renderExtraActivity(a,answers,index,si,ai);if(a.engineId==='arithmagon')return renderArithmagon(a,answers,index,si,ai);if(a.engineId==='magicshape')return renderMagicShape(a,answers,index,si,ai);if(a.engineId==='maze')return renderMaze(a,answers,index,si,ai);if(a.engineId==='propertymaze')return renderPropertyMaze(a,answers,index,si,ai);if(a.engineId==='crossnumber')return renderCrossnumber(a,answers,index,si,ai);if(a.engineId==='numbersearch')return renderNumberSearch(a,answers,index,si,ai);if(a.engineId==='equationcrossgrid')return renderEquationCrossgrid(a,answers,index,si,ai);if(a.engineId==='numbertrail')return renderNumberTrail(a,answers,index,si,ai);if(a.engineId==='target')return renderTarget(a,answers,index,si,ai);if(a.engineId==='brokencalc')return renderBrokenCalc(a,answers,index,si,ai);if(a.engineId==='symbols')return renderSymbols(a,answers,index,si,ai);if(a.engineId==='domino')return renderDomino(a,answers,index,si,ai);if(a.engineId==='operationgrid')return renderOperationGrid(a,answers,index,si,ai);if(a.engineId==='numberwheels')return renderNumberWheels(a,answers,index,si,ai);if(a.engineId==='functionmachine')return renderFunctionMachine(a,answers,index,si,ai);if(a.engineId==='balance')return renderBalance(a,answers,index,si,ai);if(a.engineId==='mobilebalance')return renderMobileBalance(a,answers,index,si,ai);if(a.engineId==='colourlogic')return renderColourLogic(a,answers,index,si,ai);return `<section class="tt99-game-activity">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}</section>`;}

  function bindPuzzleParentEvents(){
    if(!GPP)return;
    const openButton=root.querySelector('#games-parent-share');
    const modal=root.querySelector('#tt99-puzzle-parent-modal');
    if(!modal)return;
    const status=modal.querySelector('#tt99-puzzle-parent-status');
    const setStatus=message=>{if(!status)return;status.hidden=!message;status.textContent=message||'';};
    const close=()=>{modal.hidden=true;document.body.classList.remove('tt99-parent-open');openButton?.focus();};
    const open=()=>{
      modal.hidden=false;document.body.classList.add('tt99-parent-open');setStatus('');
      SU?.trackStudio?.('parent_share_open',personalisation().schoolName||'',{area:'games'});
      track('puzzle_parent_share_open',{game_count:selectedCompatible().length,sheet_count:Number(state.settings.sheets)||0});
      window.setTimeout(()=>modal.querySelector('.tt99-parent-close')?.focus(),0);
    };
    const copy=async(text,message)=>{
      try{
        if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
        else{
          const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
          if(!document.execCommand('copy'))throw new Error('copy');area.remove();
        }
        setStatus(message);
      }catch(_){setStatus('Could not copy automatically. Select the link above and copy it manually.');}
    };
    openButton?.addEventListener('click',open);
    modal.querySelectorAll('[data-puzzle-parent-close]').forEach(btn=>btn.addEventListener('click',close));
    modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
    modal.querySelector('#tt99-puzzle-parent-link')?.addEventListener('click',e=>e.currentTarget.select());
    modal.querySelector('#tt99-puzzle-copy-link')?.addEventListener('click',()=>{
      const built=puzzleShareLink();if(!built.link)return setStatus(built.error);
      copy(built.link,'Parent puzzle-practice link copied.');
      track('puzzle_parent_share_action',{action:'copy_link',game_count:selectedCompatible().length});
    });
    modal.querySelector('#tt99-puzzle-open-parent')?.addEventListener('click',()=>track('puzzle_parent_share_action',{action:'open_parent_view',game_count:selectedCompatible().length}));
    modal.querySelector('#tt99-puzzle-copy-card')?.addEventListener('click',()=>{
      const card=puzzleShareWebsiteCard();if(!card)return setStatus(puzzleShareLink().error);
      copy(card,'Puzzle website card HTML copied.');
      track('puzzle_parent_share_action',{action:'copy_card',game_count:selectedCompatible().length});
    });
    modal.querySelector('#tt99-puzzle-download-card')?.addEventListener('click',async e=>{
      const btn=e.currentTarget;btn.disabled=true;
      try{await downloadPuzzleShareCard();setStatus('Puzzle website card image downloaded.');track('puzzle_parent_share_action',{action:'download_card',game_count:selectedCompatible().length});}
      catch(err){setStatus(err?.message||'Could not create the puzzle website card image.');}
      finally{btn.disabled=false;}
    });
    modal.querySelector('#tt99-puzzle-save-config')?.addEventListener('click',()=>{
      savePuzzleConfig();setStatus('Puzzle setup downloaded. Keep this setup file if you want to restore the same puzzle configuration later.');
      track('puzzle_parent_share_action',{action:'save_config',game_count:selectedCompatible().length});
    });
    modal.querySelector('#tt99-puzzle-restore-config')?.addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{await restorePuzzleConfig(file);track('puzzle_parent_share_action',{action:'restore_config',game_count:selectedCompatible().length});}
      catch(err){setStatus(err?.message||'That puzzle setup could not be restored.');e.target.value='';}
    });
    modal.querySelector('#tt99-puzzle-download-web-pack')?.addEventListener('click',async e=>{
      const btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent='Preparing pack…';setStatus('Creating the image card, link and restorable puzzle setup…');
      try{await downloadPuzzleWebsitePack();setStatus('Puzzle website pack downloaded.');track('puzzle_parent_share_action',{action:'download_website_pack',game_count:selectedCompatible().length});}
      catch(err){console.error(err);setStatus(err?.message||'The puzzle website pack could not be created in this browser.');}
      finally{btn.disabled=false;btn.textContent=old;}
    });
    modal.querySelector('#tt99-puzzle-widget-add')?.addEventListener('click',()=>{
      const built=puzzleShareLink();
      if(!built.link){setStatus(built.error||'This puzzle setup cannot be shared yet.');return;}
      let personalCount=0;
      try{personalCount=GPP.compactVocabulary?GPP.compactVocabulary(state.customVocabulary,GPP.publicSettings(state.settings)).length:0;}catch(_){}
      try{
        const p=personalisation();
        const handoff={
          kind:'puzzle',handoffVersion:1,widgetType:'games',link:built.link,
          minYear:Number(state.settings.minYear)||1,maxYear:Number(state.settings.maxYear)||6,
          gameCount:selectedCompatible().length,vocabCount:personalCount,
          schoolName:String(p.schoolName||'').trim(),logoDataUrl:String(p.logoDataUrl||'')
        };
        localStorage.setItem('tt99-widget-handoff-v1',JSON.stringify(handoff));
        window.open('/widget/builder/?type=games','_blank','noopener,noreferrer');
        setStatus(personalCount
          ?'Maths Games Widget builder opened with this pack and its '+personalCount+' public vocabulary entr'+(personalCount===1?'y':'ies')+'.'
          :'Maths Games Widget builder opened in a new tab with this puzzle pack.');
        track('puzzle_parent_share_action',{action:'open_widget_builder',game_count:selectedCompatible().length});
      }catch(err){
        setStatus('Could not prepare the widget builder from this browser.');
      }
    });;

  }

  function bind(){
    const regen=(msg,reseed=false)=>{refreshPack(reseed);state.status=msg;render();};
    root.querySelector('#games-min-year')?.addEventListener('change',e=>{state.settings.minYear=Number(e.target.value);if(state.settings.maxYear<state.settings.minYear)state.settings.maxYear=state.settings.minYear;pruneTopics();regen('Year range updated.');});
    root.querySelector('#games-max-year')?.addEventListener('change',e=>{state.settings.maxYear=Number(e.target.value);if(state.settings.minYear>state.settings.maxYear)state.settings.minYear=state.settings.maxYear;pruneTopics();regen('Year range updated.');});
    root.querySelectorAll('[data-topic]').forEach(el=>el.addEventListener('change',()=>{const ids=[...root.querySelectorAll('[data-topic]:checked')].map(x=>x.dataset.topic);state.settings.topics=ids.length?ids:[el.dataset.topic];regen(ids.length?'Topic selection updated.':'At least one topic is kept selected.');}));
    root.querySelectorAll('[data-category-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.categoryToggle;if(state.openCategories.has(id))state.openCategories.delete(id);else state.openCategories.add(id);render();}));
    root.querySelectorAll('[data-category-select]').forEach(btn=>btn.addEventListener('click',()=>{const cat=GAME_CATEGORIES.find(c=>c.id===btn.dataset.categorySelect),eligible=compatibleSet(),set=new Set(state.settings.selectedEngines);for(const id of cat?.engines||[])if(eligible.has(id))set.add(id);state.settings.selectedEngines=[...set];regen(`${cat?.label||'Category'}: compatible games selected.`);}));
    root.querySelectorAll('[data-category-clear]').forEach(btn=>btn.addEventListener('click',()=>{const cat=GAME_CATEGORIES.find(c=>c.id===btn.dataset.categoryClear),ids=new Set(cat?.engines||[]);state.settings.selectedEngines=state.settings.selectedEngines.filter(id=>!ids.has(id));if(ids.has(state.activeEngine))state.activeEngine='';regen(`${cat?.label||'Category'} cleared.`);}));
    root.querySelector('#games-clear-all')?.addEventListener('click',()=>{state.settings.selectedEngines=[];state.activeEngine='';regen('All games cleared. Choose any compatible games to build a new pack.');});
    root.querySelectorAll('[data-engine-select]').forEach(el=>el.addEventListener('change',()=>{const id=el.dataset.engineSelect,selected=new Set(state.settings.selectedEngines);if(el.checked)selected.add(id);else selected.delete(id);state.settings.selectedEngines=[...selected];if(!el.checked&&state.activeEngine===id)state.activeEngine='';track('game_pack_selection',{game_id:id,selection_action:el.checked?'add':'remove',selection_source:'individual',difficulty:state.settings.engineSettings?.[id]?.difficulty||'standard'});regen(el.checked?`${G.ENGINES[id].title} added to this pack.`:`${G.ENGINES[id].title} removed from this pack.`);}));
    root.querySelectorAll('[data-remove-engine]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.removeEngine;state.settings.selectedEngines=state.settings.selectedEngines.filter(x=>x!==id);if(state.activeEngine===id)state.activeEngine='';regen(`${G.ENGINES[id]?.title||'Game'} removed from this pack.`);}));
    root.querySelectorAll('[data-configure-engine]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.configureEngine;state.activeEngine=state.activeEngine===id?'':id;const cat=ENGINE_CATEGORY[id];if(cat)state.openCategories.add(cat);render();}));root.querySelector('[data-close-engine]')?.addEventListener('click',()=>{state.activeEngine='';render();});
    root.querySelectorAll('[data-engine-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{const [id,value]=btn.dataset.engineDifficulty.split(':');state.settings.engineSettings[id].difficulty=value;if(value==='mixed'&&!state.settings.engineSettings[id].difficultyWeights)state.settings.engineSettings[id].difficultyWeights={easy:25,standard:50,challenge:25};track('game_difficulty_selected',{game_id:id,difficulty:value,context:'worksheet_pack'});regen(`${G.ENGINES[id].title} difficulty updated.`);}));
    root.querySelectorAll('[data-mix-edge]').forEach(el=>el.addEventListener('change',()=>{const [id,key]=el.dataset.mixEdge.split(':'),w={...(state.settings.engineSettings[id].difficultyWeights||{easy:25,standard:50,challenge:25})},v=Math.max(0,Math.min(100,Number(el.value)||0));w[key]=v;const other=key==='easy'?'challenge':'easy';if(w.easy+w.challenge>100)w[other]=Math.max(0,100-v);w.standard=100-w.easy-w.challenge;state.settings.engineSettings[id].difficultyWeights=w;regen(`${G.ENGINES[id].title} mixed-difficulty weights updated.`);}));
    root.querySelectorAll('[data-mix-preset]').forEach(btn=>btn.addEventListener('click',()=>{const [id,easy,standard,challenge]=btn.dataset.mixPreset.split(':');state.settings.engineSettings[id].difficultyWeights={easy:Number(easy),standard:Number(standard),challenge:Number(challenge)};regen(`${G.ENGINES[id].title} mixed-difficulty preset applied.`);}));
    root.querySelectorAll('[data-engine-option]').forEach(el=>el.addEventListener('change',()=>{const [id,key]=el.dataset.engineOption.split(':');state.settings.engineSettings[id][key]=el.value;regen(`${G.ENGINES[id].title} setup updated.`);}));
    root.querySelector('#games-sheets')?.addEventListener('change',e=>{state.settings.sheets=Number(e.target.value);regen('Sheet count updated.');});root.querySelector('#games-activities')?.addEventListener('change',e=>{state.settings.activitiesPerSheet=Number(e.target.value);regen('Activities per sheet updated.');});root.querySelector('#games-worked')?.addEventListener('change',e=>{state.settings.workedExamples=e.target.value;regen(e.target.value==='front'?'Worked examples will be placed at the front of the pupil pack.':'Worked examples removed from the pack.');});
    const details=root.querySelector('#games-personalisation');details?.addEventListener('toggle',()=>{state.personalisationOpen=details.open;});
    root.querySelectorAll('[data-personal]').forEach(el=>el.addEventListener('change',()=>{state.settings.personalisation[el.dataset.personal]=el.value;state.settings=G.normalizeSettings(state.settings);save();state.status='Pack personalisation updated.';render();}));
    root.querySelector('#games-date-today')?.addEventListener('click',()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');state.settings.personalisation.worksheetDate=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;save();state.status='Today’s date added to the pack.';render();});
    root.querySelector('#games-date-clear')?.addEventListener('click',()=>{state.settings.personalisation.worksheetDate='';save();state.status='Date removed from the pack.';render();});
    root.querySelector('#games-logo')?.addEventListener('change',handleLogo);root.querySelector('#games-remove-logo')?.addEventListener('click',()=>{Object.assign(state.settings.personalisation,{logoDataUrl:'',logoWidth:0,logoHeight:0});save();state.status='School logo removed.';render();});
    root.querySelector('#games-new-version')?.addEventListener('click',()=>regen('Fresh puzzle version generated with the same teaching settings.',true));root.querySelector('#games-pdf-student')?.addEventListener('click',()=>downloadGamesPDF('student'));root.querySelector('#games-pdf-answer')?.addEventListener('click',()=>downloadGamesPDF('answers'));root.querySelector('#games-pdf-both')?.addEventListener('click',()=>downloadGamesPDF('both'));root.querySelectorAll('[data-preview]').forEach(btn=>btn.addEventListener('click',()=>{state.previewAnswers=btn.dataset.preview==='answers';render();}));
    bindPuzzleParentEvents();

    root.querySelector('#vocab-add')?.addEventListener('click',addVocabulary);root.querySelectorAll('[data-delete-vocab]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.deleteVocab);state.customVocabulary.splice(i,1);refreshPack(false);state.status='Personal vocabulary entry removed from this browser.';render();}));root.querySelector('#vocab-export')?.addEventListener('click',exportVocabulary);root.querySelector('#vocab-import')?.addEventListener('change',importVocabulary);root.querySelector('#vocab-clear')?.addEventListener('click',()=>{if(!state.customVocabulary.length)return;if(confirm('Clear all My vocabulary entries stored in this browser?')){state.customVocabulary=[];refreshPack(false);state.status='My vocabulary cleared. Built-in vocabulary was not changed.';render();}});
  }

  async function handleLogo(e){const file=e.target.files?.[0];if(!file)return;if(file.size>8*1024*1024){state.status='Logo is too large. Please choose an image under 8 MB.';render();return;}try{const result=await imageFileToJpeg(file,360);Object.assign(state.settings.personalisation,{logoDataUrl:result.dataUrl,logoWidth:result.width,logoHeight:result.height});save();state.status='School logo added.';render();}catch(err){state.status='That logo could not be read. Try a PNG, JPG or WebP.';render();}}
  function imageFileToJpeg(file,maxSize){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,maxSize/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve({dataUrl:c.toDataURL('image/jpeg',0.9),width:w,height:h});};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image'));};img.src=url;});}

  function downloadGamesPDF(kind){
    if(!PDF){state.status='PDF exporter is not available. Refresh the page and try again.';render();return;}
    try{
      const doc=PDF.buildDocument({pack:state.pack,settings:state.settings,kind,topics:G.TOPICS,seed:state.seed});
      doc.save(PDF.filename(state.settings,kind));
      const activityCounts={};
      for(const sheet of (state.pack?.sheets||[]))for(const activity of (sheet.activities||[])){
        const id=String(activity.engineId||'unknown');
        activityCounts[id]=(activityCounts[id]||0)+1;
      }
      const totalActivities=Object.values(activityCounts).reduce((sum,n)=>sum+Number(n||0),0);
      track('game_pack_download',{
        pdf_kind:kind,
        sheet_count:Number(state.settings.sheets)||0,
        activity_count:totalActivities,
        game_count:Object.keys(activityCounts).length,
        worked_examples:state.settings.workedExamples==='front'?1:0
      });
      Object.entries(activityCounts).forEach(([id,count])=>track('game_in_download',{
        game_id:id,
        pdf_kind:kind,
        activity_count:count,
        difficulty:state.settings.engineSettings?.[id]?.difficulty||'standard'
      }));
      SU?.trackStudio?.('game_pack_download',personalisation().schoolName||'',{area:'games'});
      state.status=kind==='student'?'Pupil sheets PDF created.':kind==='answers'?'Answer key PDF created.':'Combined pupil + answers PDF created.';
      render();
    }catch(err){
      console.error(err);
      state.status='PDF generation failed in this browser. Please refresh and try again.';
      render();
    }
  }

  function replaceActivity(key){const [si,ai]=String(key).split(':').map(Number),activity=state.pack.sheets?.[si]?.activities?.[ai];if(!activity)return;const seed=`${state.seed}:manual-activity:${si}:${ai}:${++state.replaceCounter}`,profile=state.settings.engineSettings?.[activity.engineId],generationSettings=profile?.difficulty==='mixed'&&['easy','standard','challenge'].includes(activity.difficulty)&&G.settingsWithDifficulty?G.settingsWithDifficulty(state.settings,activity.engineId,activity.difficulty):state.settings;state.pack.sheets[si].activities[ai]=G.generateActivity(activity.engineId,generationSettings,seed,state.customVocabulary);state.status=`Activity ${ai+1} on sheet ${si+1} replaced with another ${G.ENGINES[activity.engineId]?.title||'game'} using the same difficulty.`;render();}
  function replaceWord(key){const [si,ai,wi]=String(key).split(':').map(Number),activity=state.pack.sheets?.[si]?.activities?.[ai];if(!activity||activity.engineId!=='wordsearch')return;const before=activity.placements?.[wi]?.term||'term',seed=`${state.seed}:manual-word:${si}:${ai}:${wi}:${++state.replaceCounter}`,profile=state.settings.engineSettings?.wordsearch,generationSettings=profile?.difficulty==='mixed'&&['easy','standard','challenge'].includes(activity.difficulty)&&G.settingsWithDifficulty?G.settingsWithDifficulty(state.settings,'wordsearch',activity.difficulty):state.settings,next=G.replaceWordSearchEntry(activity,wi,generationSettings,seed,state.customVocabulary);state.pack.sheets[si].activities[ai]=next;const after=next.placements?.[wi]?.term||before;state.status=after!==before?`Replaced “${before}” with “${after}”. The other selected terms were kept; the grid was rebuilt at the same difficulty to fit the new word.`:'No alternative term was available for that selection.';render();}
  function pruneTopics(){const kept=state.settings.topics.filter(topicAvailable);state.settings.topics=kept.length?kept:[Object.keys(G.TOPICS).find(topicAvailable)||'calculation'];}
  function addVocabulary(){const topic=root.querySelector('#vocab-topic')?.value,term=root.querySelector('#vocab-term')?.value||'',definition=root.querySelector('#vocab-definition')?.value||'',minYear=Number(root.querySelector('#vocab-min-year')?.value)||1,maxYear=Number(root.querySelector('#vocab-max-year')?.value)||6,clean=G.sanitizeCustomVocabulary([{topic,term,definition,minYear,maxYear:Math.max(minYear,maxYear)}]);if(!clean.length){state.status='Add a term and definition. Terms need 2–24 letters and must use normal words only. Numerals or mathematical symbols are not suitable for Word Search / Crossword grids.';render();return;}const merged=G.sanitizeCustomVocabulary([...state.customVocabulary,...clean]);if(merged.length===state.customVocabulary.length){state.status='That personal term already exists in this topic.';render();return;}state.customVocabulary=merged;refreshPack(false);state.status=`Added “${clean[0].term}” to My vocabulary on this browser.`;render();}
  function exportVocabulary(){const payload={kind:'tt99-vocabulary',version:1,exportedAt:new Date().toISOString(),entries:state.customVocabulary},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='99club-my-vocabulary.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);state.status=`Exported ${state.customVocabulary.length} personal vocabulary entr${state.customVocabulary.length===1?'y':'ies'}.`;render();}
  async function importVocabulary(e){const file=e.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),entries=Array.isArray(parsed)?parsed:parsed.entries;if(!Array.isArray(entries))throw new Error('format');const clean=G.sanitizeCustomVocabulary(entries);state.customVocabulary=G.sanitizeCustomVocabulary([...state.customVocabulary,...clean]);refreshPack(false);state.status=`Imported ${clean.length} valid personal vocabulary entr${clean.length===1?'y':'ies'} locally.`;render();}catch(err){state.status='That file is not a valid 99 Club vocabulary JSON file.';render();}}

  window.addEventListener('load',()=>{
    track('studio_open',{area:'games'});
    SU?.trackStudio?.('studio_open',personalisation().schoolName||'',{area:'games'});
  },{once:true});
  render();
})();
