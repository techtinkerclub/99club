/* 99 Club Studio · Games & Puzzles UI behaviour patch v1.34.0
 * Keeps configuration local to each game, contextualises vocabulary,
 * shortens crowded header metadata and adds preview overflow diagnostics.
 */
(function(global){
  'use strict';

  const root=document.getElementById('tt99-games-root');
  const G=global.TT99Games;
  if(!root||!G||root.dataset.uiV134Booted==='1')return;
  root.dataset.uiV134Booted='1';

  const VOCAB_OPEN_KEY='tt99-games-vocab-manager-open-v134';
  let scheduled=false,overflowFrame=0;

  function safeStorageGet(key,fallback=''){
    try{return global.localStorage?.getItem(key)??fallback;}catch(e){return fallback;}
  }
  function safeStorageSet(key,value){
    try{global.localStorage?.setItem(key,String(value));}catch(e){}
  }

  function summaryForTopics(ids,topics){
    const unique=[...new Set((ids||[]).filter(Boolean))];
    const labels=unique.map(id=>topics?.[id]?.label||id).filter(Boolean);
    const total=Object.keys(topics||{}).filter(id=>!String(id).startsWith('__tt99_')).length;
    if(!labels.length)return 'Maths topics';
    if(total&&unique.length>=total)return 'All maths topics';
    if(labels.length>4)return `${labels.length} selected maths topics`;
    return labels.join(' · ');
  }

  function patchPdfHeader(){
    const PDF=global.TT99GamesPDF;
    if(!PDF?.buildDocument||PDF.__uiV134HeaderPatch)return;
    const baseBuild=PDF.buildDocument.bind(PDF);
    PDF.buildDocument=function(opts={}){
      const settings=opts.settings||{},topics=opts.topics||{},ids=Array.isArray(settings.topics)?settings.topics:[];
      if(ids.length<=4)return baseBuild(opts);
      const key='__tt99_topic_summary__',label=summaryForTopics(ids,topics);
      return baseBuild({...opts,settings:{...settings,topics:[key]},topics:{...topics,[key]:{label,years:[1,2,3,4,5,6]}}});
    };
    PDF.__uiV134HeaderPatch=true;
  }

  function cleanTopicTiles(){
    const grid=root.querySelector('.tt99-games-topic-grid');
    if(!grid)return;
    grid.classList.add('tt99-topics-v134');
    grid.querySelectorAll('.tt99-game-topic span > small').forEach(el=>el.remove());
  }

  function removeInternalNotes(){
    root.querySelectorAll('.tt99-games-help').forEach(el=>{
      if(/Arithmetic Domino Chain has been removed/i.test(el.textContent||''))el.remove();
    });
  }

  function moveActiveConfiguration(){
    const panel=root.querySelector('.tt99-engine-panel');
    if(!panel)return;
    const card=root.querySelector('.tt99-engine-card.is-active');
    if(!card)return;
    panel.classList.add('tt99-engine-panel-inline');
    if(card.nextElementSibling!==panel)card.insertAdjacentElement('afterend',panel);
  }

  function moveVocabularyManager(){
    const card=root.querySelector('.tt99-vocab-card');
    const category=root.querySelector('[data-category-toggle="vocabulary"]')?.closest('.tt99-game-category');
    if(!card||!category)return;

    if(card.dataset.v134Prepared!=='1'){
      card.dataset.v134Prepared='1';
      card.classList.remove('tt99-games-card');
      card.classList.add('tt99-vocab-inline-v134');
      const header=card.querySelector('.tt99-games-step');
      const mine=card.querySelectorAll('[data-delete-vocab]').length;
      const builtIn=Array.isArray(G.VOCABULARY)?G.VOCABULARY.length:0;
      const details=document.createElement('details');
      details.className='tt99-vocab-manager-v134';
      details.open=safeStorageGet(VOCAB_OPEN_KEY,'0')==='1';
      const summary=document.createElement('summary');
      summary.innerHTML=`<span><strong>Manage vocabulary</strong><small>Shared by Maths Word Search and Maths Crossword · ${builtIn} built-in${mine?` · ${mine} mine`:''}</small></span><em>${details.open?'Close':'Open'}</em>`;
      const body=document.createElement('div');
      body.className='tt99-vocab-manager-v134-body';
      [...card.children].filter(node=>node!==header).forEach(node=>body.appendChild(node));
      header?.remove();
      details.append(summary,body);
      card.appendChild(details);
      details.addEventListener('toggle',()=>{
        safeStorageSet(VOCAB_OPEN_KEY,details.open?'1':'0');
        const state=details.querySelector('summary em');if(state)state.textContent=details.open?'Close':'Open';
      });
    }

    const library=category.querySelector('.tt99-engine-library');
    if(library){
      if(library.nextElementSibling!==card)library.insertAdjacentElement('afterend',card);
    }else if(card.parentElement!==category){
      category.appendChild(card);
    }
  }

  function selectedTopicInfo(){
    const inputs=[...root.querySelectorAll('[data-topic]:checked')];
    const ids=inputs.map(el=>el.dataset.topic).filter(Boolean);
    const labels=ids.map(id=>G.TOPICS?.[id]?.label||id);
    return {ids,labels,long:labels.join(' · '),summary:summaryForTopics(ids,G.TOPICS||{})};
  }

  function shortenPreviewMetadata(){
    const info=selectedTopicInfo();
    if(info.ids.length<=4||!info.long||info.long===info.summary)return;
    root.querySelectorAll('.tt99-game-paper-identity p').forEach(el=>{
      const text=el.textContent||'';
      if(text.includes(info.long))el.textContent=text.replace(info.long,info.summary);
    });
    const toolbar=root.querySelector('.tt99-games-preview-toolbar > div:first-child > span:first-of-type');
    if(toolbar&&toolbar.textContent.includes(info.long))toolbar.textContent=toolbar.textContent.replace(info.long,info.summary);
  }

  function auditPreviewOverflow(){
    cancelAnimationFrame(overflowFrame);
    overflowFrame=requestAnimationFrame(()=>{
      root.querySelectorAll('.tt99-game-activity').forEach(activity=>{
        const overflowing=activity.scrollWidth>activity.clientWidth+2||activity.scrollHeight>activity.clientHeight+2;
        const next=overflowing?'true':'false';
        if(activity.dataset.tt99Overflow!==next)activity.dataset.tt99Overflow=next;
      });
    });
  }

  function enhance(){
    cleanTopicTiles();
    removeInternalNotes();
    moveActiveConfiguration();
    moveVocabularyManager();
    shortenPreviewMetadata();
    auditPreviewOverflow();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;enhance();});
  }

  patchPdfHeader();
  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
