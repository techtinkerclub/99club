---
layout: default
title: "99 Club home practice – guide for schools"
description: "Step-by-step guide for adding school-led 99 Club practice links, website cards and PNG card images to a school website."
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
            <h1>Adding 99 Club home practice to a school website</h1>
            <p>A practical guide for maths leads, website administrators and school IT teams.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/">← Back to 99 Club Studio</a>
        </div>

        <section class="tt99-guide-section tt99-guide-highlight">
          <h2>What this feature does</h2>
          <p>A teacher or maths lead chooses the 99 Club rules in Studio first. Studio then creates a locked parent-practice link for that club. Parents opening the link do not see the rule editor: they see a simple page that creates a fresh printable worksheet and matching answers using the school-selected rules.</p>
          <p>The school website only links to 99 Club Studio. It does not need a plugin, JavaScript, iframe, login integration or access to the school content-management system.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Recommended option: use your website's own card or button</h2>
          <p>This is the simplest and most compatible route. In 99 Club Studio, open <strong>Create parent links</strong>, find the required club and choose <strong>Copy link</strong>. In the school website editor, create a normal button, image tile or card and paste that URL as its destination.</p>
          <p>This keeps all styling inside the school's own CMS and is the option most likely to work with restrictive school website platforms.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Option 2: use the ready-made website card HTML</h2>
          <ol>
            <li>Set the required 99 Club rules in Studio.</li>
            <li>Open <strong>Create parent links</strong>.</li>
            <li>Find the club required, including Bronze, Silver, Gold, Platinum or Diamond if needed.</li>
            <li>Choose <strong>Copy website card</strong>.</li>
            <li>In the school CMS, add a <strong>Custom HTML</strong>, <strong>Code</strong> or equivalent block.</li>
            <li>Paste the copied card and preview the page before publishing.</li>
          </ol>
          <p>The card contains only a normal <code>&lt;a&gt;</code> hyperlink, the club badge image, text and inline styling. It contains no script or iframe. If the CMS removes the styling or blocks remote images, use the plain link or PNG method instead.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Option 3: use a downloadable PNG card image</h2>
          <p>This is useful when the website editor supports images and links but does not allow custom HTML.</p>
          <ol>
            <li>In Studio, configure the required club and open <strong>Create parent links</strong>.</li>
            <li>Choose <strong>Download card image</strong> for that club. Studio creates a high-resolution PNG containing the badge, club name and a short summary of the selected practice.</li>
            <li>Choose <strong>Copy link</strong> for the same club.</li>
            <li>Upload the PNG to the school website in the normal way.</li>
            <li>Add the PNG to the page and make the image a link.</li>
            <li>Paste the copied 99 Club practice URL as the image destination.</li>
            <li>Add useful alternative text, for example <code>33 Club home practice – printable worksheet and answers</code>.</li>
            <li>Publish the page and test the image from a phone and a desktop browser.</li>
          </ol>
          <div class="tt99-guide-note"><strong>The PNG itself does not contain the clickable link.</strong> The school website administrator must attach the matching practice URL to the uploaded image. This keeps the image usable in ordinary school website systems.</div>
        </section>

        <section class="tt99-guide-section">
          <h2>Save the school's club configuration</h2>
          <p>Studio automatically remembers club edits in the current browser, but browser storage is not a long-term backup. After configuring the school's 11–99 and post-99 challenges, open <strong>Create parent links</strong> and choose <strong>Save school configuration</strong>.</p>
          <p>The downloaded JSON file contains a snapshot of the rules for all 14 parent-practice levels in the currently selected ruleset scheme, plus the print orientation and school name. It does not contain pupil data, generated worksheets, scores or teacher notes.</p>
          <p>On another computer or after browser data has been cleared, use <strong>Restore school configuration</strong>. Existing custom presets and unrelated schemes are left alone; the saved club rules are restored into the selected scheme.</p>
          <div class="tt99-guide-note"><strong>Keep this file somewhere independent of the browser.</strong> It is the easiest way to preserve the work involved in configuring every club.</div>
        </section>

        <section class="tt99-guide-section">
          <h2>Download the complete website pack</h2>
          <p><strong>Download website pack</strong> creates one ZIP file for the school website administrator. It contains:</p>
          <ul>
            <li>all 14 PNG card images, from 11 Club through Diamond;</li>
            <li><code>practice-links.csv</code>, matching every club to its locked practice URL;</li>
            <li>a short <code>README.html</code> with implementation instructions; and</li>
            <li><code>99-club-school-configuration.json</code>, so the club rules used to create the pack can be restored later.</li>
          </ul>
          <p>If the website administrator does not need the images, <strong>Copy all links</strong> provides the same club-to-URL mapping directly from Studio for pasting into an email, document or website editor.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Important when the school changes the rules</h2>
          <p>Each parent-practice URL is a snapshot of the maths rules at the moment it is created. This is intentional: a link already published by a school must not silently change because Studio defaults change later.</p>
          <p>If the maths lead changes a club's rules, create a <strong>new parent link</strong> and replace the old website link. If the visible description on an HTML or PNG card has changed as well, copy or download a fresh card too. An old published link will continue to use the old rules.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>What parents see</h2>
          <p>Parents see the 99 Club badge, the club name, question count, target time and print layout, followed by one main button to download a new worksheet and answers. Every download creates new questions from the same fixed rules.</p>
          <p>Parents do not need an account and do not see the Studio rule editor.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Privacy and security</h2>
          <p>The practice link deliberately excludes pupil names, parent details, teacher names, uploaded school logos, worksheet dates, scores, progress history, teacher notes and generated question seeds. If a school name has been entered in Studio, the link can contain an opaque school-level key for future aggregate usage statistics; the school name itself is not placed in the parent URL.</p>
          <p>The parent-practice page does not load Google Analytics or advertising code, does not ask for a login and does not request pupil or parent information. School-level usage telemetry is currently disabled and no collection endpoint is configured.</p>
          <p>The wider 99 Club Studio website has a separate <a href="/privacy/">Privacy &amp; analytics</a> page.</p>
        </section>

        <section class="tt99-guide-section">
          <h2>Before publishing: quick check</h2>
          <ul>
            <li>Open every club link once and check that the correct club name and rules are shown.</li>
            <li>Generate one PDF and confirm that the worksheet and answers download correctly.</li>
            <li>If using a PNG, confirm that clicking the image opens the matching practice link.</li>
            <li>Add meaningful alt text to image links.</li>
            <li>Check the page on a phone as well as a desktop computer.</li>
            <li>If the school has its own website, safeguarding or data-protection approval process, follow that process before publishing the external links.</li>
          </ul>
        </section>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">
