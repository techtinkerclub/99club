---
layout: default
title: "Information for schools"
description: "How 99 Club Studio parent practice links work, what schools need to add to their website, and the privacy and security design."
permalink: /schools/
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
            <h1>Information for schools</h1>
            <p>Parent practice links are designed to let a school choose the maths rules while keeping the parent experience very simple.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/">← Back to 99 Club Studio</a>
        </div>

        <section class="tt99-guide-section tt99-guide-highlight">
          <h2>What the school website needs</h2>
          <p>The recommended setup is just a normal HTTPS link from the school website to a 99 Club Studio parent-practice page. The school does not need to install a plugin, add JavaScript, embed an iframe, connect an account or give 99 Club Studio access to its website or content-management system.</p>
          <p>99 Club Studio can also provide optional ready-made button HTML. That button is still only an ordinary <code>&lt;a&gt;</code> hyperlink with inline styling; it contains no script, iframe or executable integration.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>School-led practice</h2>
          <p>A teacher or maths lead selects the 99 Club challenge and rules in Studio, then creates a parent-practice link. The link carries the maths configuration, not an account. Parents opening it see a stripped-down page with one main action: create a fresh printable worksheet and matching answers.</p>
          <p>Each download uses the same fixed rules but generates new questions. Parents do not see the normal rule editor and cannot alter the preset through the parent page.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>What is not put into the practice link</h2>
          <p>Parent-practice links deliberately exclude pupil names, parent details, school names, teacher names, uploaded logos, worksheet dates, scores, progress history, teacher notes and generated question seeds.</p>
          <div class="tt99-guide-note"><strong>No school or pupil account is required.</strong> The maths rules are carried in the part of the link after <code>#</code> and interpreted in the browser when the parent opens the page.</div>
        </section>

        <section class="tt99-guide-section">
          <h2>Parent-practice page privacy</h2>
          <p>The dedicated <code>/practice/</code> page is intentionally separate from the main Studio interface. It does not load the Studio analytics or advertising code, does not ask for a login, and does not request a pupil name, email address, score or progress information. Worksheet generation and PDF creation happen in the browser.</p>
          <p>The wider 99 Club Studio website has a separate <a href="/privacy/">Privacy &amp; analytics</a> page describing analytics choices on the main site.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Useful wording for a school website</h2>
          <p><strong>99 Club home practice:</strong> Use the button for your child's current club to generate a fresh printable practice sheet and matching answers. The maths settings have been chosen in advance; no account or sign-in is required.</p>
          <p>If your school or IT provider has its own website, safeguarding or data-protection approval process, it should of course apply that process before publishing any external link.</p>
        </section>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">
