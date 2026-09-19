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
          <p>99 Club Studio loads the Google tag using Google Consent Mode with analytics storage set to <strong>denied</strong> by default. While analytics storage is denied, Google may receive consent-aware cookieless measurement signals. If you choose <strong>Allow analytics</strong>, analytics storage is then granted and Google Analytics 4 can provide ordinary website statistics such as page views, sessions, broad traffic source/referrer information, approximate geographic reporting, device/browser information and navigation through the site.</p>
          <p>Studio also sends a limited set of product events so we can understand which parts of the free tool are useful. Examples include the type of worksheet PDF downloaded, the selected 99 Club challenge, which puzzle engines are added to or downloaded in a games pack, which online games are started or completed, use of the school-sharing tools, widget-builder actions and PWA install/update actions.</p>
          <p>When a school name has been entered in Studio, consented product events can include a stable <strong>opaque school key</strong> derived from that name. The school name itself is not sent to Google Analytics. When the browser supplies an external referrer, Studio can also include the <strong>referring website origin</strong> (for example <code>https://school.example</code>). The path, query string and fragment of the referring page are deliberately discarded.</p>
          <p>Online games opened from a school widget can carry a non-personal widget integration ID so aggregate game usage can be associated with that integration. The ID does not identify a pupil, parent or device.</p>
          <div class="tt99-guide-note"><strong>Not sent as Google Analytics event data:</strong> pupil names, school names, teacher names, uploaded logos, worksheet question text, answers, custom vocabulary, full referring page URLs, contact-form text, recreation codes or generated puzzle seeds.</div>
          <p>Advertising-related Google consent remains disabled in the Studio implementation. Analytics is used to improve 99 Club Studio, not to personalise advertising.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Your choice</h2>
          <p>Analytics storage is not granted unless you allow analytics. You can change your choice later using the <strong>Privacy & analytics</strong> control at the bottom of the site. Choosing not to allow analytics does not restrict the worksheets or games.</p>
          <p>Google provides the analytics service and processes analytics information under its own service and privacy terms. You can read Google's privacy information at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy & Terms</a>.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Parent practice links</h2>
          <p>The dedicated 99 Club parent-practice page at <code>/practice/</code> and puzzle-practice page at <code>/practice/puzzles/</code> are separate from the main Studio interfaces. Their links carry the teaching/generation settings needed to reproduce the school-selected practice. If a school name has been entered when the link is created, the link can also carry an opaque school-level key derived from that name. The school name itself is not placed in the parent URL.</p>
          <p>99 Club parent links exclude pupil names, parent details, teacher names, uploaded logos, worksheet dates, teacher notes, scores, progress history and generated question seeds. Puzzle-practice links likewise exclude school/class names, worksheet dates, logos and generated puzzle seeds. If a shared Word Search or Crossword setup uses relevant entries from <strong>My vocabulary</strong>, those terms and definitions may be included in the puzzle-practice link so that the intended activity can be reproduced.</p>
          <p>The parent-practice pages do not load the Studio Google Analytics code and do not ask for a login or personal information. Worksheet/puzzle generation and PDF creation happen in the browser.</p>
          <p>A separate first-party school-level usage telemetry scaffold exists so that aggregate use of school-issued resources can be measured without creating parent or pupil profiles. Its prepared event model covers Studio use, widget opens/clicks, 99 Club practice opens/downloads and puzzle-practice opens/downloads. It can carry an opaque school key, an origin-only referring website such as <code>https://school.example</code>, and a non-personal widget integration ID. A separate registration event can associate the opaque key with the public school/organisation name entered by the teacher.</p>
          <p>For ordinary school links/buttons/PNG cards, the referring website origin is available only when the browser and school website permit a referrer. Ready-made 99 Studio HTML cards explicitly request <strong>origin-only</strong> referrer information; the full school page path is not requested. For embedded widgets, the generated iframe likewise requests only the embedding website origin.</p>
          <p><strong>This first-party school-level telemetry is currently disabled and has no collection endpoint configured, so these school-usage events are not currently transmitted.</strong> Before it is enabled, this notice and the school integration documentation will be reviewed against the final endpoint, retention and opt-out design.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Contact form</h2>
          <p>If you choose to send a message through the Contact form, the details you type are sent through FormSubmit so the message can be delivered. Please do not include pupil personal information.</p>
        </section>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">
