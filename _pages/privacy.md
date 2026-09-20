---
layout: default
title: "Privacy & Analytics"
description: "How 99 Club Studio handles local worksheet data, analytics consent and contact-form information."
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
            <h1>Privacy & analytics</h1>
            <p>What 99 Club Studio keeps on your device, what analytics can collect, and what is deliberately excluded.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/">← Back to 99 Club Studio</a>
        </div>

        <section class="tt99-guide-section">
          <h2>Worksheet and pupil data stay local</h2>
          <p>99 Club Studio generates worksheets and games in your browser. School names, class labels, teacher names, uploaded logos, worksheet questions, answers, saved presets and recreation data are not deliberately sent to Google Analytics.</p>
          <p>Some Studio settings are saved in your browser so that your work can be restored on the same device. These local settings are part of the tool itself and are separate from analytics.</p>
        </section>

        <section class="tt99-guide-section tt99-guide-highlight">
          <h2>Google Analytics</h2>
          <p>99 Club Studio uses a <strong>basic-consent</strong> analytics setup. The Google Analytics library is not requested from Google unless you explicitly choose <strong>Allow analytics</strong>. If you allow it, Google Analytics 4 can provide ordinary website statistics such as page views, sessions, broad traffic source/referrer information, approximate geographic reporting, device/browser information and navigation through the site.</p>
          <p>Studio also sends a limited set of product events so we can understand which parts of the free tool are useful. Examples include the type of worksheet PDF downloaded, the selected 99 Club challenge, which puzzle engines are added to or downloaded in a games pack, which online games are started or completed, use of the school-sharing tools, widget-builder actions and PWA install/update actions.</p>
          <p>When a school name has been entered in Studio, consented product events can include a stable <strong>opaque school key</strong> derived from that name. The school name itself is not sent to Google Analytics. When the browser supplies an external referrer, Studio can also include the <strong>referring website origin</strong> (for example <code>https://school.example</code>). The path, query string and fragment of the referring page are deliberately discarded.</p>
          <p>Online games opened from a school widget can carry a non-personal widget integration ID so aggregate game usage can be associated with that integration. The ID does not identify a pupil, parent or device.</p>
          <div class="tt99-guide-note"><strong>Not sent as Google Analytics event data:</strong> pupil names, school names, teacher names, uploaded logos, worksheet question text, answers, custom vocabulary, full referring page URLs, contact-form text, recreation codes or generated puzzle seeds.</div>
          <p>Advertising-related Google consent remains disabled in the Studio implementation. Analytics is used to improve 99 Club Studio, not to personalise advertising.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Your choice</h2>
          <p>Google Analytics is not loaded unless you allow analytics. You can change your choice later using the <strong>Privacy & analytics</strong> control at the bottom of the site. Choosing not to allow analytics does not restrict the worksheets or games.</p>
          <p>Google provides the analytics service and processes analytics information under its own service and privacy terms. You can read Google's privacy information at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy & Terms</a>.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Parent practice links</h2>
          <p>The dedicated 99 Club parent-practice page at <code>/practice/</code> and puzzle-practice page at <code>/practice/puzzles/</code> are separate from the main Studio interfaces. Their links carry the teaching/generation settings needed to reproduce the school-selected practice. If a school name has been entered when the link is created, the link can also carry an opaque school-level key derived from that name. The school name itself is not placed in the parent URL.</p>
          <p>99 Club parent links exclude pupil names, parent details, teacher names, uploaded logos, worksheet dates, teacher notes, scores, progress history and generated question seeds. Puzzle-practice links likewise exclude school/class names, worksheet dates, logos and generated puzzle seeds. If a shared Word Search or Crossword setup uses relevant entries from <strong>My vocabulary</strong>, those terms and definitions may be included in the puzzle-practice link so that the intended activity can be reproduced.</p>
          <p>The parent-practice pages do not load the Studio Google Analytics code and do not ask for a login or personal information. Worksheet/puzzle generation and PDF creation happen in the browser.</p>
          <p>A separate first-party school-level usage telemetry scaffold exists so that aggregate use of school-issued resources can be measured without creating parent or pupil profiles. Its prepared event model covers Studio use, widget opens/clicks, 99 Club practice opens/downloads and puzzle-practice opens/downloads. Staff-side Studio pages now create a random opaque organisation key rather than deriving one predictably from the school name. Public widgets can be associated by their non-personal integration ID and the origin-only referring website such as <code>https://school.example</code>. A separate registration event can associate a staff-created opaque key with the public school/organisation name entered by the teacher.</p>
          <p>For ordinary school links/buttons/PNG cards, the referring website origin is available only when the browser and school website permit a referrer. Ready-made 99 Studio HTML cards explicitly request <strong>origin-only</strong> referrer information; the full school page path is not requested. For embedded widgets, the generated iframe likewise requests only the embedding website origin.</p>
          <p><strong>This first-party school-level telemetry is currently disabled and has no collection endpoint configured, so these school-usage events are not currently transmitted.</strong> Before it is enabled, this notice and the school integration documentation will be reviewed against the final endpoint, retention and opt-out design.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Hosting</h2>
          <p>99 Club Studio is hosted using GitHub Pages. As with ordinary web hosting, GitHub may process technical request information such as IP addresses for delivery, security and abuse prevention under GitHub's own terms and privacy practices.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Clear local Studio data</h2>
          <p>School names, class labels, teacher names, uploaded logos, saved worksheet settings and personal vocabulary are normally kept in this browser rather than stored in a 99 Studio account. On a shared computer you can remove 99 Studio's locally saved settings and caches below.</p>
          <button type="button" id="tt99-clear-local-data" class="tt99-secondary">Clear 99 Studio data on this device</button>
          <p id="tt99-clear-local-status" role="status" aria-live="polite"></p>
        </section>

        <section class="tt99-guide-section">
          <h2>Contact form</h2>
          <p>If you choose to send a message through the Contact form, the details you type are sent through FormSubmit so the message can be delivered. The form also sends only the current 99 Studio page path (for example <code>/games/</code>) so a bug report can be placed in context; query strings and URL fragments are not sent. Please do not include pupil personal information.</p>
        </section>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">

<script>
(function(){
  const button=document.getElementById('tt99-clear-local-data');
  const status=document.getElementById('tt99-clear-local-status');
  if(!button)return;
  button.addEventListener('click',async()=>{
    if(!confirm('Clear saved 99 Studio settings, vocabulary, analytics choice and offline caches from this browser?'))return;
    try{
      for(let i=localStorage.length-1;i>=0;i--){
        const key=localStorage.key(i)||'';
        if(/^(tt99|99club)/i.test(key))localStorage.removeItem(key);
      }
      for(let i=sessionStorage.length-1;i>=0;i--){
        const key=sessionStorage.key(i)||'';
        if(/^(tt99|99club)/i.test(key))sessionStorage.removeItem(key);
      }
      if('caches' in window){
        const names=await caches.keys();
        await Promise.all(names.filter(name=>name.startsWith('tt99-')).map(name=>caches.delete(name)));
      }
      status.textContent='Local 99 Studio data cleared. Reloading…';
      setTimeout(()=>location.reload(),350);
    }catch(_){
      status.textContent='Some browser data could not be cleared automatically. You can also clear site data for 99studio.uk in your browser settings.';
    }
  });
})();
</script>
