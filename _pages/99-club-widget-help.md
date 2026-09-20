---
layout: default
title: "School Website Widgets – Step-by-Step Guide"
description: "A detailed, platform-neutral guide for teachers and school website editors using 99 Club Studio school website widgets."
permalink: /schools/widgets/
sidebar: false
sitemap: true
---

<div id="main" class="tt99-page-main" role="main">
  <article class="splash">
    <section class="page__content">
      <div class="tt99-guide">
        <div class="tt99-guide-hero">
          <div>
            <span class="tt99-eyebrow">99 Club Studio · Widget deep-dive</span>
            <h1>School website widgets – detailed guide</h1>
            <p>This page is the detailed widget-only reference. If you are deciding between a normal link, school button/card, PNG image, website pack or widget, start with the complete <a href="/schools/"><strong>School Website Integration Help</strong></a>.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/widget/builder/">Open Widget Builder</a>
        </div>

        <div class="tt99-guide-note"><strong>The most important thing to know:</strong> 99 Club Studio never changes your school website by itself. Studio creates an embed code. An authorised member of school staff must paste that code into the school website editor and publish the page.</div>

        <nav class="tt99-guide-nav" aria-label="Widget help topics">
          <a href="#choose">Choose the right method</a>
          <a href="#words">Website words explained</a>
          <a href="#club">99 Club Widget</a>
          <a href="#games">Maths Games Widget</a>
          <a href="#website">Put it on the website</a>
          <a href="#fresh">Fresh worksheets</a>
          <a href="#update">Change it later</a>
          <a href="#backup">Save & hand over</a>
          <a href="#vocabulary">Vocabulary</a>
          <a href="#troubleshooting">Troubleshooting</a>
          <a href="#checklist">Publish checklist</a>
        </nav>

        <section id="choose" class="tt99-guide-section tt99-guide-highlight">
          <h2>First: choose the easiest method for your school</h2>
          <p>99 Club Studio offers several ways to put home practice on a school website. A widget is convenient because one embedded panel can contain several Club levels, puzzle packs or online games. It is not the only option.</p>
          <div class="tt99-guide-steps">
            <article><b>1</b><h3>Plain link or school-made button</h3><p><strong>Simplest and most compatible.</strong> Copy a parent-practice link from Studio and attach it to a normal button or text link in the school website editor.</p></article>
            <article><b>2</b><h3>PNG card image</h3><p>Download a ready-made card image, upload it to the school website, then make that image link to the matching practice URL.</p></article>
            <article><b>3</b><h3>Website card HTML</h3><p>Useful when the website editor accepts custom HTML. Paste the supplied card code into a Custom HTML or Code block.</p></article>
            <article><b>4</b><h3>School website widget</h3><p><strong>Best when you want several choices in one neat panel.</strong> Paste one iframe/embed code into a Custom HTML, Embed or Code block.</p></article>
          </div>
          <p>If your school website blocks iframe/embed code, nothing is broken: use the plain-link, PNG-card or website-card route instead.</p>
        </section>

        <section id="words" class="tt99-guide-section">
          <h2>Website words explained in plain English</h2>
          <p>Different school website systems use different names. You may see one or more of these:</p>
          <ul>
            <li><strong>Website editor / CMS:</strong> the system you log into to change pages on the school website.</li>
            <li><strong>Page:</strong> the school webpage where you want the practice choices to appear.</li>
            <li><strong>Block / content block:</strong> a section you add to a page, such as Text, Image, Button, Embed or HTML.</li>
            <li><strong>Custom HTML / Code / Embed:</strong> the type of block that lets you paste the widget code supplied by 99 Club Studio.</li>
            <li><strong>Embed code:</strong> the small piece of text beginning with <code>&lt;iframe</code> that displays the 99 Studio widget.</li>
            <li><strong>Widget URL:</strong> the web address inside the embed code. It contains the public widget configuration.</li>
            <li><strong>Preview:</strong> a way to check the page before publishing it for parents.</li>
            <li><strong>Publish / Save / Update:</strong> the website editor's action that makes your changes live.</li>
          </ul>
          <div class="tt99-guide-note"><strong>If your editor does not have a block called "Embed":</strong> look for names such as <em>Custom HTML</em>, <em>HTML</em>, <em>Code</em>, <em>Source</em>, <em>External content</em> or <em>iframe</em>. If none of those exist, use the PNG or plain-link method.</div>
        </section>

        <section id="club" class="tt99-guide-section">
          <h2>Create a 99 Club Widget</h2>
          <p>The 99 Club Widget is for 11 Club through 99 Club and the Bronze, Silver, Gold, Platinum and Diamond post-99 challenges. Each level keeps the school-selected maths rules.</p>
          <ol>
            <li>Open the main <a href="/">99 Club Studio</a> worksheet generator.</li>
            <li>Add the school name and logo if you want them used in the widget.</li>
            <li>Choose the ruleset scheme your school uses and configure the Club levels normally.</li>
            <li>Open <strong>Create parent links</strong>.</li>
            <li>Find <strong>Alternative: 99 Club Widget</strong> and choose <strong>Open widget builder</strong>.</li>
            <li>The Widget Builder opens separately and imports the current Club rules, school name and a compact copy of the logo.</li>
            <li>Under <strong>Widget type</strong>, leave <strong>99 Club</strong> selected.</li>
            <li>Under <strong>School identity</strong>, check the school name and logo. You can replace or remove the logo here without changing the main worksheet setup.</li>
            <li>Under <strong>99 Club levels</strong>, tick only the levels you want parents to see. Use <strong>All</strong> or <strong>None</strong> if that is faster.</li>
            <li>Check the <strong>Parent preview</strong> on the right-hand side.</li>
            <li>When ready, choose <strong>Copy embed code</strong>.</li>
          </ol>
          <div class="tt99-guide-note"><strong>Changing the tick boxes changes only visibility.</strong> To change the actual maths rules for a Club level, return to the normal 99 Club editor, change the rules there, then reopen the Widget Builder from <strong>Create parent links</strong>.</div>
        </section>

        <section id="games" class="tt99-guide-section">
          <h2>Create a Maths Games Widget</h2>
          <p>The Maths Games Widget can contain two kinds of parent choice: <strong>printable puzzle packs</strong> and <strong>online games</strong>. You may use either or both.</p>

          <h3>Add a printable puzzle pack</h3>
          <ol>
            <li>Open <a href="/games/">Maths Games &amp; Puzzles</a>.</li>
            <li>Choose the year range, curriculum topics, puzzle types and difficulty/settings you want.</li>
            <li>If you use <strong>My vocabulary</strong>, add or review the terms and definitions before sharing.</li>
            <li>Add the school name and logo if required.</li>
            <li>Open <strong>Create parent link</strong> / <strong>Share this puzzle setup</strong>.</li>
            <li>Choose <strong>Open widget builder</strong>. The current locked pack is added automatically.</li>
            <li>The Widget Builder opens as a <strong>Maths Games Widget</strong> and adds that locked puzzle pack.</li>
            <li>To add a second different pack, return to Maths Games &amp; Puzzles, change the setup, create the new parent link and add that pack too.</li>
          </ol>
          <p>A widget can currently contain up to four separately configured printable packs. For example, a school could offer <em>Year 4 Arithmetic</em>, <em>Upper KS2 Number Logic</em> and <em>Vocabulary Practice</em> as separate parent choices.</p>

          <h3>Add online games</h3>
          <ol>
            <li>In the Widget Builder, find <strong>Online games</strong>.</li>
            <li>Tick only the games you want parents to see.</li>
            <li>Keep the list purposeful. A smaller curated set is usually easier for families than the full catalogue.</li>
            <li>If the widget has both printable packs and online games, choose which section should open first under <strong>Default section</strong>.</li>
          </ol>
        </section>

        <section id="branding" class="tt99-guide-section tt99-guide-highlight">
          <h2>School name and logo</h2>
          <p>The school name and logo are deliberately visible in the public widget so parents can recognise that the practice has been selected by their school.</p>
          <p>The Widget Builder creates a smaller web copy of the uploaded logo so the embed code remains practical. The school name and compact logo are stored inside the public widget configuration. Do not use a logo you do not have permission to publish.</p>
          <p>The school identity in the widget is separate from the school website itself. Removing a logo from the Widget Builder does not remove images from the school website media library, and changing the school website logo does not automatically change an existing 99 Studio widget.</p>
        </section>

        <section id="website" class="tt99-guide-section">
          <h2>Put the widget on the school website</h2>
          <p>The exact buttons vary between website systems, but the process is normally the same.</p>
          <ol>
            <li>In 99 Club Studio, finish the widget and check the <strong>Parent preview</strong>.</li>
            <li>Choose <strong>Copy embed code</strong>.</li>
            <li>Open the school's normal website editor and sign in with your authorised account.</li>
            <li>Open the page where the widget should appear, or create a new page if appropriate.</li>
            <li>Add a block that accepts external/embed code. It may be called <strong>Embed</strong>, <strong>Custom HTML</strong>, <strong>HTML</strong>, <strong>Code</strong> or similar.</li>
            <li>Paste the complete code from 99 Club Studio. Do not remove the beginning <code>&lt;iframe</code> or the ending <code>&lt;/iframe&gt;</code>.</li>
            <li>Save the block.</li>
            <li>Use the website editor's <strong>Preview</strong> function if available.</li>
            <li>Check that the widget shows the correct school name/logo and the expected Club levels, puzzle packs or games.</li>
            <li>Publish or update the school webpage.</li>
            <li>Open the public school webpage in a normal browser and test it again.</li>
          </ol>
          <div class="tt99-guide-note"><strong>Do not paste the embed code into an ordinary text paragraph.</strong> If the page literally shows text such as <code>&lt;iframe src=...</code>, the code has been pasted into the wrong type of block. Remove it and use an Embed/HTML/Code block instead.</div>
        </section>

        <section id="fresh" class="tt99-guide-section">
          <h2>Does the same link make a new worksheet every time?</h2>
          <p><strong>Yes - when the parent presses the download button.</strong> The published link keeps the school's settings fixed, but the worksheet or puzzle content is generated fresh in the parent's browser.</p>
          <h3>99 Club</h3>
          <p>A parent clicks a Club level in the widget and sees a simple parent-practice page. When they press <strong>Download a new worksheet + answers</strong>, Studio generates a fresh set of questions using the school's fixed rules. Pressing the button again creates another fresh worksheet.</p>
          <h3>Printable puzzle packs</h3>
          <p>A parent clicks the selected puzzle pack and sees a simple summary. When they press <strong>Download a new puzzle pack + answers</strong>, Studio generates fresh puzzles using the locked school-selected years, topics, engines and difficulty settings. Pressing again creates another fresh pack.</p>
          <p>The school therefore publishes one stable-looking choice, while families can generate repeated practice without the teacher uploading new PDFs every week.</p>
        </section>

        <section id="update" class="tt99-guide-section tt99-guide-highlight">
          <h2>Change a widget later</h2>
          <p>99 Club Studio does not hold school accounts and does not remotely edit the school website. Updating a live widget is therefore a deliberate two-stage process.</p>
          <ol>
            <li>Open the current school widget in the school's website editor and copy its existing embed code or widget URL.</li>
            <li>Open the <a href="/widget/builder/">Widget Builder</a>.</li>
            <li>Find <strong>Import / handover</strong>.</li>
            <li>Paste the existing widget URL or full embed code.</li>
            <li>Choose <strong>Recreate existing widget</strong>.</li>
            <li>Studio reconstructs an editable copy of the public configuration.</li>
            <li>Make the changes and check the Parent preview.</li>
            <li>Choose <strong>Copy embed code</strong> again.</li>
            <li>In the school website editor, replace the old widget embed with the new one.</li>
            <li>Preview, publish and test the public page.</li>
          </ol>
          <div class="tt99-guide-note"><strong>Recreating a widget does not change the live school website.</strong> Someone could copy a public widget and make their own version, but they cannot alter what appears on the school's website without authorised access to the school's website editor.</div>
        </section>

        <section id="backup" class="tt99-guide-section">
          <h2>Save a backup and hand the job to another member of staff</h2>
          <p>The builder remembers its current draft in the browser, but browser storage should not be treated as the school's permanent record.</p>
          <ol>
            <li>In the Widget Builder choose <strong>Save widget setup</strong>.</li>
            <li>Store the downloaded JSON file somewhere appropriate for school operational files rather than only in Downloads.</li>
            <li>If another member of staff takes over, they can open the Widget Builder and choose <strong>Restore widget setup</strong>.</li>
          </ol>
          <p>If the backup file has been lost, the published widget itself can still be reconstructed by copying its public URL/embed code and using <strong>Recreate existing widget</strong>.</p>
          <p>The school should also keep the separate <strong>Save school configuration</strong> backup for 99 Club rules and/or <strong>Save puzzle setup</strong> backups for important puzzle configurations. Those files preserve the editable source settings; the widget is the public presentation layer.</p>
        </section>

        <section id="vocabulary" class="tt99-guide-section">
          <h2>Custom vocabulary: useful, but remember it is public</h2>
          <p>Maths Games &amp; Puzzles can use school-entered terms and definitions in vocabulary activities such as Word Search and Crossword. When a shared puzzle pack needs those entries, the relevant terms and definitions are included in its locked public parent-practice link so the activity can be reproduced.</p>
          <p>The Widget Builder clearly marks packs that contain public vocabulary, for example <strong>7 public vocab entries</strong>.</p>
          <ul>
            <li>Use curriculum vocabulary, mathematical terminology, definitions and similar teaching content.</li>
            <li>Do not put pupil names, email addresses, parent information, internal comments, passwords or other private information into vocabulary intended for a public widget.</li>
            <li>If a vocabulary pack changes, create a new locked pack and update the website widget.</li>
          </ul>
        </section>

        <section id="privacy" class="tt99-guide-section">
          <h2>What is public and what is not?</h2>
          <p>A school website is public, so anything required to display the widget must be treated as public information.</p>
          <ul>
            <li><strong>Public in a widget:</strong> selected Club levels, maths-rule differences needed for those levels, selected online game IDs, locked puzzle-pack links, school name, compact school logo and any custom vocabulary required by a shared puzzle pack.</li>
            <li><strong>Not required:</strong> pupil accounts, parent accounts, teacher passwords, school website passwords, class lists, pupil scores or pupil progress records.</li>
            <li><strong>Publishing control:</strong> 99 Club Studio creates the widget code, but only someone who can edit the school's website can make that widget appear or change on the school's public page.</li>
          </ul>
          <p>See the main <a href="/privacy/">Privacy &amp; analytics</a> page for wider site information.</p>
        </section>

        <section id="troubleshooting" class="tt99-guide-section">
          <h2>Troubleshooting</h2>

          <h3>I pasted the code and the page shows &lt;iframe...&gt; as text</h3>
          <p>You have probably used an ordinary Text block. Remove that text and add an Embed, Custom HTML, HTML or Code block instead.</p>

          <h3>The website editor removes the iframe or says embeds are not allowed</h3>
          <p>Your website platform or school policy may block external embeds. Use the existing plain-link, PNG-card or website-card method instead. These are fully supported alternatives, not second-class fallbacks.</p>

          <h3>The widget is too short and has a scrollbar</h3>
          <p>Some website editors overwrite iframe dimensions. If the editor exposes a height setting, increase it. If the editor strips all sizing controls, the PNG/card route may give a cleaner result.</p>

          <h3>The widget is extremely narrow</h3>
          <p>Check that the widget has been added to a normal full-width content area rather than a narrow sidebar or small column.</p>

          <h3>The logo looks wrong</h3>
          <p>Return to the Widget Builder, remove the logo and choose it again. Simple PNG, JPEG or WebP school marks work best. Then copy the updated embed and replace the old one on the school website.</p>

          <h3>I changed the Club rules but the website still uses the old rules</h3>
          <p>Published links are intentional snapshots. Reopen the widget from the current 99 Club setup, create the revised widget embed and replace the old embed on the school website.</p>

          <h3>I changed a puzzle pack but parents still get the old version</h3>
          <p>The existing locked pack keeps its old settings. Add the revised puzzle setup to the Maths Games Widget, remove the old pack if necessary, then publish the new widget embed.</p>

          <h3>I am taking over from another teacher and do not have their files</h3>
          <p>If the widget is still live, copy its URL/embed code from the school website editor and use <strong>Recreate existing widget</strong>. For deeper editing of Club or puzzle rules, restore the school's saved configuration files if available, or configure the source activities again in Studio.</p>

          <h3>The widget works in preview but not on the public page</h3>
          <p>First confirm that the school page was actually published rather than only saved as a draft. Then check whether the public website applies stricter embed/security rules than the editor preview. If it does, use the plain-link or PNG method.</p>
        </section>

        <section id="checklist" class="tt99-guide-section tt99-guide-highlight">
          <h2>Before publishing: teacher-friendly checklist</h2>
          <ul>
            <li>Correct school name shown?</li>
            <li>Correct school logo shown?</li>
            <li>Only the intended 99 Club levels visible?</li>
            <li>Only the intended puzzle packs and online games visible?</li>
            <li>Any public custom vocabulary checked for private/pupil information?</li>
            <li>Each Club link opens the expected Club level?</li>
            <li>A test 99 Club PDF downloads and contains fresh questions + answers?</li>
            <li>Each printable puzzle pack opens with the expected year/topics/games?</li>
            <li>A test puzzle pack downloads and contains fresh puzzles + answers?</li>
            <li>Online games open correctly?</li>
            <li>Widget tested on both a phone and a desktop/laptop?</li>
            <li>School webpage saved/published, not left as a draft?</li>
            <li>Widget setup JSON saved somewhere sensible for staff handover?</li>
            <li>School's normal website/safeguarding/data-protection approval process followed?</li>
          </ul>
        </section>

        <section class="tt99-guide-section">
          <h2>If you are still unsure which route to use</h2>
          <p>Use the simplest route that your school website editor supports reliably:</p>
          <ol>
            <li><strong>Normal link/button</strong> if you want maximum compatibility.</li>
            <li><strong>PNG card + link</strong> if you want something visual without custom code.</li>
            <li><strong>Website card HTML</strong> if the editor supports custom HTML but you do not need a multi-choice panel.</li>
            <li><strong>Widget</strong> if the editor supports iframe/embed code and you want several school-selected choices in one tidy panel.</li>
          </ol>
          <p>All four routes lead to the same school-selected parent-practice system. The difference is only how the choices are presented on the school website.</p>
        </section>

        <div class="tt99-guide-note"><strong>One final reassurance:</strong> if you make a mistake while experimenting in the Widget Builder, you have not changed the school website. Nothing becomes live until an authorised website editor deliberately replaces/pastes the embed and publishes the school page.</div>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">
