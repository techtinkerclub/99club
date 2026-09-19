(function(){
  'use strict';

  const root=document.getElementById('tt99-puzzle-practice-root');
  const G=window.TT99Games;
  const PDF=window.TT99GamesPDF;
  const PP=window.TT99GamesParentPractice;
  const SU=window.TT99SchoolUsage;
  if(!root||!G||!PDF||!PP)return;

  let config=null;

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function tokenFromLocation(){
    const hash=String(location.hash||''),m=hash.match(/(?:^#|&)p=([^&]+)/);
    return m?decodeURIComponent(m[1]):'';
  }

  function newSeed(){
    const a=new Uint32Array(2);
    if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);
    else{a[0]=Date.now();a[1]=Math.floor(Math.random()*2**32);}
    return 'GP-'+a[0].toString(36)+a[1].toString(36);
  }

  function yearLabel(){
    const s=config.settings;
    return s.minYear===s.maxYear?'Year '+s.minYear:'Years '+s.minYear+'–'+s.maxYear;
  }

  function topicLabel(){
    return (config.settings.topics||[]).map(id=>G.TOPICS[id]?.label||id).join(' · ');
  }

  function selectedEngines(){
    return G.selectedCompatibleEngines(config.settings);
  }

  function gameNames(){
    return selectedEngines().map(id=>G.ENGINES[id]?.title||id);
  }

  function render(){
    const s=config.settings,names=gameNames(),activityCount=Number(s.sheets||1)*Number(s.activitiesPerSheet||1);
    root.innerHTML=
      '<main class="tt99-practice-shell">'+
        '<section class="tt99-practice-card" aria-labelledby="tt99-puzzle-practice-title">'+
          '<div class="tt99-practice-brand">'+
            '<img src="/assets/99club/images/99club-studio-shield.png" alt="">'+
            '<div class="tt99-practice-brand-copy"><b>99 Club Studio</b><span>School-led printable practice</span></div>'+
          '</div>'+
          '<span class="tt99-practice-kicker">Puzzle practice link</span>'+
          '<h1 id="tt99-puzzle-practice-title">Maths Games &amp; Puzzles</h1>'+
          '<p class="tt99-practice-summary">The puzzle choices and difficulty settings were fixed before this link was shared. You do not need to configure anything.</p>'+
          '<div class="tt99-puzzle-practice-details">'+
            '<div class="tt99-practice-detail"><b>'+esc(yearLabel())+'</b><span>age range</span></div>'+
            '<div class="tt99-practice-detail"><b>'+esc(activityCount)+'</b><span>activities</span></div>'+
            '<div class="tt99-practice-detail"><b>'+esc(names.length)+'</b><span>puzzle types</span></div>'+
          '</div>'+
          '<div class="tt99-puzzle-practice-list" aria-label="Puzzle types">'+names.map(name=>'<span>'+esc(name)+'</span>').join('')+'</div>'+
          '<p class="tt99-puzzle-practice-topics">'+esc(topicLabel())+'</p>'+
          '<button type="button" id="tt99-puzzle-practice-download" class="tt99-practice-download">Download a new puzzle pack + answers</button>'+
          '<p class="tt99-practice-note">Every download creates fresh puzzles using the same fixed school-selected settings.</p>'+
          '<div id="tt99-puzzle-practice-status" class="tt99-practice-status" role="status" aria-live="polite" hidden></div>'+
          '<div class="tt99-practice-privacy"><strong>No sign-in and no pupil profile.</strong> This page does not ask for a name, email, score or progress data. Puzzle generation and PDF creation happen in this browser.</div>'+
        '</section>'+
        '<div class="tt99-practice-foot">99 Club Studio · <a href="/privacy/" target="_blank" rel="noopener">privacy information</a></div>'+
      '</main>';

    root.querySelector('#tt99-puzzle-practice-download')?.addEventListener('click',download);
  }

  function renderError(message){
    root.innerHTML='<main class="tt99-practice-shell"><section class="tt99-practice-card tt99-practice-error"><span class="tt99-practice-kicker">99 Club Studio</span><h1>This puzzle-practice link cannot be opened</h1><p class="tt99-practice-summary">'+esc(message||'The link is incomplete or no longer supported.')+'</p></section></main>';
  }

  function status(message,error){
    const el=root.querySelector('#tt99-puzzle-practice-status');if(!el)return;
    el.hidden=!message;el.textContent=message||'';el.classList.toggle('is-error',!!error);
  }

  function download(){
    const button=root.querySelector('#tt99-puzzle-practice-download');
    if(button){button.disabled=true;button.textContent='Creating PDF…';}
    status('',false);
    try{
      const seed=newSeed();
      const pack=G.generatePack(config.settings,seed,config.customVocabulary||[]);
      if(!pack?.sheets?.length)throw new Error('This practice link could not generate a valid puzzle pack.');
      const doc=PDF.buildDocument({pack,settings:config.settings,kind:'both',topics:G.TOPICS,seed});
      doc.save(PDF.filename(config.settings,'both'));
      SU?.trackPuzzlePractice?.('puzzle_practice_download',config);
      status('PDF created. Click again whenever you want another fresh puzzle pack.',false);
    }catch(err){
      console.error(err);
      status(err?.message||'The puzzle pack could not be created in this browser. Please refresh and try again.',true);
    }finally{
      if(button){button.disabled=false;button.textContent='Download another puzzle pack + answers';}
    }
  }

  try{
    const token=tokenFromLocation();if(!token)throw new Error('This link does not contain a puzzle-practice setup.');
    config=PP.decode(token);
    if(!G.selectedCompatibleEngines(config.settings).length)throw new Error('This puzzle-practice setup does not contain any compatible puzzle types.');
    render();
    SU?.trackPuzzlePractice?.('puzzle_practice_open',config);
  }catch(err){renderError(err?.message);}
}());
