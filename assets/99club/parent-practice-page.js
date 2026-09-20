(function(){
  'use strict';

  const root=document.getElementById('tt99-practice-root');
  const G=window.TT99Generator;
  const L=window.TT99PDFLayout;
  const PP=window.TT99ParentPractice;
  const SU=window.TT99SchoolUsage;
  if(!root||!G||!L||!PP)return;

  const BADGES={
    '11':'11club.png','22':'22club.png','33':'33club.png','44':'44club.png','55':'55club.png',
    '66':'66club.png','77':'77club.png','88':'88club.png','99':'99club.png',
    bronze:'bronzeclub.png',silver:'silverclub.png',gold:'goldclub.png',platinum:'platinumclub.png',diamond:'diamondclub.png'
  };

  const CLUB_NAMES={
    '11':'11 Club','22':'22 Club','33':'33 Club','44':'44 Club','55':'55 Club',
    '66':'66 Club','77':'77 Club','88':'88 Club','99':'99 Club',
    bronze:'Bronze Club',silver:'Silver Club',gold:'Gold Club',platinum:'Platinum Club',diamond:'Diamond Club'
  };

  let config=null;
  let badgeCache=null;

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }

  function tokenFromLocation(){
    const hash=String(location.hash||'');
    const match=hash.match(/(?:^#|&)p=([^&]+)/);
    return match?decodeURIComponent(match[1]):'';
  }

  function isTeacherPreview(){
    try{return new URLSearchParams(location.search).get('preview')==='1';}
    catch(_){return false;}
  }

  function teacherPreviewBar(){
    if(!isTeacherPreview())return '';
    return '<div class="tt99-practice-previewbar"><div><strong>Teacher preview</strong><span> · This is the parent-facing practice page.</span></div><a href="/">← Back to 99 Club Studio</a></div>';
  }

  function schoolUsageContext(){
    let via='';
    try{via=new URLSearchParams(location.search).get('via')||'';}catch(_){}
    return {
      integrationId:SU?.cleanIntegrationId?.(via)||'',
      sourceOrigin:SU?.referrerOrigin?.()||''
    };
  }

  function challengeName(){
    const id=String(config&&config.clubId||'99').toLowerCase();
    return String(config&&config.rules&&config.rules.name || CLUB_NAMES[id] || (id.replace(/(^|[-_])([a-z])/g,(_,a,b)=>a+b.toUpperCase())+' Club'));
  }

  function badgeUrl(){
    const file=BADGES[String(config&&config.clubId||'').toLowerCase()];
    return file?'/assets/99club/images/'+file:'/assets/99club/images/99club-studio-shield.png';
  }

  function formatTime(minutes){
    const n=Number(minutes);
    if(!Number.isFinite(n))return 'School selected';
    if(n<1)return Math.round(n*60)+' sec';
    return (Number.isInteger(n)?n:String(n))+' min';
  }

  function render(){
    const r=config.rules;
    root.innerHTML=
      '<main class="tt99-practice-shell">'+
        teacherPreviewBar()+
        '<section class="tt99-practice-card" aria-labelledby="tt99-practice-title">'+
          '<div class="tt99-practice-brand">'+
            '<img src="/assets/99club/images/99club-studio-shield.png" alt="">'+
            '<div class="tt99-practice-brand-copy"><b>99 Club Studio</b><span>School-led printable practice</span></div>'+
          '</div>'+
          '<span class="tt99-practice-kicker">Practice link</span>'+
          '<h1 id="tt99-practice-title">'+esc(challengeName())+'</h1>'+
          '<p class="tt99-practice-summary">The maths rules for this practice link were fixed before it was shared. You do not need to choose or change any worksheet settings.</p>'+
          '<div class="tt99-practice-badge"><img src="'+esc(badgeUrl())+'" alt="'+esc(challengeName())+' badge"></div>'+
          '<div class="tt99-practice-details">'+
            '<div class="tt99-practice-detail"><b>'+esc(r.questionCount)+'</b><span>questions</span></div>'+
            '<div class="tt99-practice-detail"><b>'+esc(formatTime(r.timeMinutes))+'</b><span>target time</span></div>'+
            '<div class="tt99-practice-detail"><b>'+esc(config.orientation==='landscape'?'Landscape':'Portrait')+'</b><span>print layout</span></div>'+
          '</div>'+
          '<button type="button" id="tt99-practice-download" class="tt99-practice-download">Download a new worksheet + answers</button>'+
          '<p class="tt99-practice-note">Every download creates a fresh practice sheet using the same fixed maths rules.</p>'+
          '<div id="tt99-practice-status" class="tt99-practice-status" role="status" aria-live="polite" hidden></div>'+

        '</section>'+
        '<div class="tt99-practice-foot">99 Studio · No sign-in required · <a href="/privacy/" target="_blank" rel="noopener">Privacy</a></div>'+
      '</main>';

    root.querySelector('#tt99-practice-download').addEventListener('click',downloadPractice);
  }

  function renderError(message){
    root.innerHTML=
      '<main class="tt99-practice-shell">'+teacherPreviewBar()+'<section class="tt99-practice-card tt99-practice-error">'+
      '<span class="tt99-practice-kicker">99 Studio</span>'+
      '<h1>This practice link cannot be opened</h1>'+
      '<p class="tt99-practice-summary">'+esc(message||'The link is incomplete or uses a format this version of 99 Studio does not recognise.')+'</p>'+
      '</section></main>';
  }

  function setStatus(message,isError){
    const el=root.querySelector('#tt99-practice-status');
    if(!el)return;
    el.hidden=!message;
    el.textContent=message||'';
    el.classList.toggle('is-error',!!isError);
  }

  function randomSheet(){
    const baseSeed=G.newSeed(config.clubId||'practice');
    const seed=baseSeed+'-V1';
    const questions=G.generateQuestions(config.rules,seed);
    if(!Array.isArray(questions)||questions.length<Number(config.rules.questionCount)){
      throw new Error('This preset could not create enough valid questions. Please ask the school for an updated practice link.');
    }
    const token=String(baseSeed).split('-').pop().toUpperCase();
    const club=String(config.clubId||'PRACTICE').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,12)||'PRACTICE';
    return {seed:seed,code:'HOME-'+club+'-'+token+'-A',questions:questions,actions:[]};
  }

  function imageUrlToJpeg(url,maxSize){
    return new Promise(function(resolve,reject){
      const img=new Image();
      img.onload=function(){
        try{
          const scale=Math.min(1,maxSize/Math.max(img.naturalWidth,img.naturalHeight));
          const w=Math.max(1,Math.round(img.naturalWidth*scale));
          const h=Math.max(1,Math.round(img.naturalHeight*scale));
          const canvas=document.createElement('canvas');
          canvas.width=w;canvas.height=h;
          const ctx=canvas.getContext('2d');
          ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
          resolve({imageDataUrl:canvas.toDataURL('image/jpeg',0.92),width:w,height:h});
        }catch(err){reject(err);}
      };
      img.onerror=function(){reject(new Error('badge'));};
      img.src=url;
    });
  }

  async function badgeForPdf(){
    if(badgeCache)return badgeCache;
    try{badgeCache=await imageUrlToJpeg(badgeUrl(),320);return badgeCache;}
    catch(err){return null;}
  }

  async function downloadPractice(){
    const button=root.querySelector('#tt99-practice-download');
    if(button){button.disabled=true;button.textContent='Creating PDF…';}
    setStatus('',false);
    try{
      const sheet=randomSheet();
      const badge=await badgeForPdf();
      const doc=L.buildDocument({
        rules:config.rules,
        sheets:[sheet],
        school:{},
        kind:'both',
        orientation:config.orientation,
        qrByVariant:[],
        teacherNote:'',
        badge:badge||{},
        answerContext:{label:'Answer copy',message:'Answers for the practice sheet on the previous page.'}
      });
      doc.save(L.filename(config.rules,'both',config.orientation));
      if(!isTeacherPreview())SU?.trackPractice?.('practice_download',config);
      setStatus('PDF created. Click the button again whenever you want another fresh practice sheet.',false);
    }catch(err){
      console.error(err);
      setStatus(err&&err.message?err.message:'The PDF could not be created in this browser. Please refresh and try again.',true);
    }finally{
      if(button){button.disabled=false;button.textContent='Download another worksheet + answers';}
    }
  }

  try{
    const token=tokenFromLocation();
    if(!token)throw new Error('This link does not contain a practice preset.');
    config=PP.decode(token);
    config.usageContext=schoolUsageContext();
    render();
    if(!isTeacherPreview())SU?.trackPractice?.('practice_open',config);
  }catch(err){
    renderError(err&&err.message);
  }
}());
