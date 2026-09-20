---
layout: default
title: "Privacy & Analytics"
description: "How 99 Club Studio handles saved browser data, analytics, shared practice links and contact information."
permalink: /privacy/
sidebar: false
sitemap: true
---

<div id="main" class="tt99-page-main" role="main">
  <article class="splash">
    <section class="page__content">
      <div class="tt99-guide">
        <div class="tt99-guide-hero">
          <div>
            <span class="tt99-eyebrow">99 Club Studio</span>
            <h1>Privacy &amp; analytics</h1>
            <p>A plain-English summary of what stays on your device, what can be measured, and what is shared when you create public practice links.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/">← Back to 99 Club Studio</a>
        </div>

        <section class="tt99-guide-section">
          <h2>Your worksheets and saved settings</h2>
          <p>99 Club Studio creates worksheets, puzzle packs and answers in your browser. It also saves some settings locally so you can continue your work on the same browser.</p>
          <p>Generated questions and answers, uploaded logos, saved presets and custom vocabulary are not sent to Google Analytics as event data.</p>
        </section>

        <section class="tt99-guide-section tt99-guide-highlight">
          <h2>Google Analytics</h2>
          <p>Google Analytics is loaded only if you choose <strong>Allow analytics</strong>. If you do not allow it, the worksheets and games continue to work normally.</p>
          <p>If analytics is allowed, 99 Club Studio records ordinary site statistics and a limited set of product actions, such as which sections are used, which type of worksheet or puzzle pack is downloaded, and which online games are started or completed.</p>
          <p>99 Club Studio does not send pupil names, school names, teacher names, uploaded logos, worksheet questions, answers, custom vocabulary or contact-form text to Google Analytics.</p>
          <p>If a school name has been entered, analytics may use a random identifier to group activity from that staff browser without sending the school name itself. When a referring website is available, only the website origin (for example <code>https://school.example</code>) is kept rather than the full page address.</p>
          <p>Analytics is used to understand and improve 99 Club Studio, not to personalise advertising.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Your analytics choice</h2>
          <p>You can change your analytics choice later using the <strong>Privacy &amp; analytics</strong> control at the bottom of the site. Turning analytics off does not restrict the worksheets or games.</p>
          <p>Google provides the analytics service and processes analytics information under its own terms. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy &amp; Terms</a>.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Shared practice links and school widgets</h2>
          <p>Parent-practice links contain the settings needed to reproduce the school-selected activity. They do not require a pupil or parent account.</p>
          <p>99 Club practice links do not include pupil names, parent details, teacher notes, scores or progress history. Puzzle links also leave out generated puzzle seeds and school/class personalisation. If a shared Word Search or Crossword uses custom vocabulary, the terms and definitions needed for that activity may be included in the shared link.</p>
          <p>The dedicated parent-practice pages and embedded school widgets do not load the Studio Google Analytics code.</p>
          <p>Anything deliberately placed in a public widget — such as a school name, logo, selected activities or shared vocabulary — should be treated as public information.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Hosting</h2>
          <p>99 Club Studio is hosted using GitHub Pages. As with other web hosting services, the hosting infrastructure can receive standard technical request information needed to deliver and protect the site, such as IP address, browser information and the requested page.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Data saved on this device</h2>
          <p>Studio uses browser storage for things such as school/class personalisation, saved worksheet settings, custom vocabulary, widget drafts and online-game records. This information stays with that browser profile until it is replaced or cleared.</p>
          <div class="tt99-guide-note"><strong>Using a shared computer?</strong> Save any configuration files you need before clearing Studio data.</div>
          <p><button type="button" class="tt99-secondary" id="tt99-clear-local-data">Clear 99 Club Studio data from this device</button></p>
          <p id="tt99-clear-local-status" role="status" aria-live="polite"></p>
        </section>

        <section class="tt99-guide-section">
          <h2>Support / Ko-fi</h2>
          <p>Teacher-facing pages may offer an optional <strong>Buy me a coffee</strong> panel provided by Ko-fi. It is loaded only when you choose to open it. Any information you provide there is handled by Ko-fi under its own terms and privacy practices.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Contact form</h2>
          <p>If you send a message through the Contact form, the name, email address and message you enter are sent through FormSubmit so the message can be delivered. The form also sends the 99 Club Studio page origin and path so a bug report can be associated with the relevant area of the site. Query strings and URL fragments are not included.</p>
          <p>Please do not include pupil personal information in contact messages.</p>
        </section>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">


<script>
(function(){
  'use strict';
  const button=document.getElementById('tt99-clear-local-data');
  const status=document.getElementById('tt99-clear-local-status');
  if(!button)return;

  function clearPrefixedStorage(store){
    let removed=0;
    try{
      const keys=[];
      for(let i=0;i<store.length;i++){const key=store.key(i);if(key&&key.startsWith('tt99-'))keys.push(key);}
      keys.forEach(key=>{store.removeItem(key);removed++;});
    }catch(_){}
    return removed;
  }

  function clearAnalyticsCookies(){
    try{
      const names=document.cookie.split(';').map(x=>x.split('=')[0].trim()).filter(name=>/^_ga(?:_|$)/.test(name));
      const domains=['',location.hostname,'.'+location.hostname.replace(/^www\./,'')];
      names.forEach(name=>domains.forEach(domain=>{
        document.cookie=name+'=; Max-Age=0; path=/; SameSite=Lax'+(domain?'; domain='+domain:'');
      }));
    }catch(_){}
  }

  button.addEventListener('click',async()=>{
    if(!confirm('Clear saved 99 Club Studio settings, vocabulary, widget drafts, game records, analytics choice and Studio caches from this browser? Download any school configuration backups you need first.'))return;
    const removed=clearPrefixedStorage(localStorage)+clearPrefixedStorage(sessionStorage);
    clearAnalyticsCookies();
    try{
      if('caches' in window){
        const names=await caches.keys();
        await Promise.all(names.filter(name=>name.startsWith('tt99-studio-')).map(name=>caches.delete(name)));
      }
    }catch(_){}
    if(status)status.textContent='99 Club Studio browser data cleared ('+removed+' saved items). Reloading with fresh settings…';
    window.setTimeout(()=>location.reload(),700);
  });
})();
</script>
