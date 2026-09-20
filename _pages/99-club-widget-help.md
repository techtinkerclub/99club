---
layout: default
title: "School Website Widgets – Step-by-Step Guide"
description: "Step-by-step guidance for adding and maintaining 99 Club Studio widgets on a school website."
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
            <span class="tt99-eyebrow">99 Club Studio · School website widgets</span>
            <h1>School website widgets – detailed guide</h1>
            <p>This page is for schools that have already decided to use a widget. If you are still choosing between links, cards and widgets, start with the <a href="/schools/"><strong>School Website Integration Help</strong></a>.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/widget/builder/">Open Widget Builder</a>
        </div>

        <nav class="tt99-guide-nav" aria-label="Widget help topics">
          <a href="#club">99 Club Widget</a>
          <a href="#games">Maths Games Widget</a>
          <a href="#website">Put it on the website</a>
          <a href="#fresh">Fresh worksheets</a>
          <a href="#update">Change it later</a>
          <a href="#backup">Save & hand over</a>
          <a href="#vocabulary">Vocabulary</a>
          <a href="/privacy/">Privacy</a>
          <a href="#troubleshooting">Troubleshooting</a>
          <a href="#checklist">Publish checklist</a>
        </nav>

        <section id="choose" class="tt99-guide-section tt99-guide-highlight">
          <h2>Before you start</h2>
          <p>A widget is useful when you want several 99 Club levels, puzzle packs or online games in one compact panel. Your school website needs to allow an <strong>Embed</strong>, <strong>iframe</strong>, <strong>Custom HTML</strong> or similar block.</p>
          <p>If your website does not allow embeds, use a normal link/button or PNG card instead. The <a href="/demo/">live fictional demo</a> shows all three approaches.</p>
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
            <li>Choose <strong>Open widget builder</strong>. The current pack is added automatically.</li>
            <li>The Widget Builder opens as a <strong>Maths Games Widget</strong> and adds that puzzle pack.</li>
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
          <p>The school identity in the widget is separate from the school website itself. Removing a logo from the Widget Builder does not remove images from the school website media library, and changing the school website logo does not automatically change an existing 99 Club Studio widget.</p>
        </section>

        <section id="website" class="tt99-guide-section">
          <h2>Put the widget on the school website</h2>
          <p>The exact buttons vary between website systems, but the process is normally the same.</p>
          <ol>
            <li>In 99 Club Studio, finish the widget and check the <strong>Parent preview</strong>.</li>
            <li>Choose <strong>Copy embed code</strong>.</li>
            <li>Open the school's normal website editor and sign in.</li>
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
          <h2>Does the same link make fresh practice?</h2>
          <p><strong>Yes.</strong> The school-selected setup stays the same, but each download creates a fresh worksheet or puzzle pack.</p>
          <h3>99 Club</h3>
          <p>A parent chooses a Club level in the widget, then downloads a new worksheet and answers. Downloading again creates another worksheet using the same school-selected rules.</p>
          <h3>Printable puzzle packs</h3>
          <p>A parent chooses a puzzle pack, then downloads a fresh pack and matching answers using the same selected years, topics, game types and difficulty settings.</p>
        </section>

        <section id="update" class="tt99-guide-section tt99-guide-highlight">
          <h2>Change a widget later</h2>
          <ol>
            <li>Copy the current widget URL or embed code from the school website editor.</li>
            <li>Open the <a href="/widget/builder/">Widget Builder</a> and use <strong>Recreate existing widget</strong>.</li>
            <li>Make the changes and check the Parent preview.</li>
            <li>Copy the new embed code.</li>
            <li>Replace the old embed on the school website, then preview and publish.</li>
          </ol>
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
          <p>The school should also keep the separate <strong>Save school configuration</strong> backup for 99 Club rules and/or <strong>Save puzzle setup</strong> backups for important puzzle configurations. Those files preserve the editable settings used to build the widget.</p>
        </section>

        <section id="vocabulary" class="tt99-guide-section">
          <h2>Custom vocabulary</h2>
          <p>Word Search and Crossword can use school-entered terms and definitions. If a shared pack needs those entries, they are included with that shared activity so it can be reproduced.</p>
          <p>Only use curriculum or teaching content that you are happy to make public. Do not include pupil names, contact details, passwords or internal notes.</p>
        </section>

        

        <section id="troubleshooting" class="tt99-guide-section">
          <h2>Troubleshooting</h2>

          <h3>I pasted the code and the page shows &lt;iframe...&gt; as text</h3>
          <p>You have probably used an ordinary Text block. Remove that text and add an Embed, Custom HTML, HTML or Code block instead.</p>

          <h3>The website editor removes the iframe or says embeds are not allowed</h3>
          <p>Your website platform or school policy may block external embeds. Use the existing plain-link, PNG-card or website-card method instead. Use whichever route works best with your website.</p>

          <h3>The widget is too short and has a scrollbar</h3>
          <p>Some website editors overwrite iframe dimensions. If the editor exposes a height setting, increase it. If the editor strips all sizing controls, the PNG/card route may give a cleaner result.</p>

          <h3>The widget is extremely narrow</h3>
          <p>Check that the widget has been added to a normal full-width content area rather than a narrow sidebar or small column.</p>

          <h3>The logo looks wrong</h3>
          <p>Return to the Widget Builder, remove the logo and choose it again. Simple PNG, JPEG or WebP school marks work best. Then copy the updated embed and replace the old one on the school website.</p>

          <h3>I changed the Club rules but the website still uses the old rules</h3>
          <p>Published links are intentional snapshots. Reopen the widget from the current 99 Club setup, create the revised widget embed and replace the old embed on the school website.</p>

          <h3>I changed a puzzle pack but parents still get the old version</h3>
          <p>The existing shared pack keeps its old settings. Add the revised puzzle setup to the Maths Games Widget, remove the old pack if necessary, then publish the new widget embed.</p>

          <h3>I am taking over from another teacher and do not have their files</h3>
          <p>If the widget is still live, copy its URL/embed code from the school website editor and use <strong>Recreate existing widget</strong>. For deeper editing of Club or puzzle rules, restore the school's saved configuration files if available, or configure the source activities again in 99 Club Studio.</p>

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
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">
