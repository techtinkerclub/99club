---
layout: default
title: "School Website Integration Help"
description: "Complete school website integration help for adding 99 Club Studio parent-practice links, cards, PNG images, website packs and widgets."
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
            <span class="tt99-eyebrow">99 Club Studio · School website integration help</span>
            <h1>Adding 99 Club Studio to your school website</h1>
            <p>A complete, platform-neutral guide for teachers, maths leads and school website editors. Start here whether you want one simple link, a picture/card, a complete website pack or an embedded widget.</p>
          </div>
          <a class="tt99-secondary tt99-guide-action" href="/">← Back to 99 Club Studio</a>
        </div>

        <div class="tt99-guide-note"><strong>You do not need to be a web developer.</strong> The safest approach is to use the simplest option your school website editor supports. Nothing in 99 Club Studio changes the school website automatically: an authorised member of staff must add or replace the link/card/widget in the school website editor and publish the page.</div>

        <nav class="tt99-guide-nav" aria-label="School website integration help topics">
          <a href="#choose">Choose a method</a>
          <a href="#before">Before you start</a>
          <a href="#plain-link">Plain link / school button</a>
          <a href="#html-card">Ready-made website card</a>
          <a href="#png-card">PNG card image</a>
          <a href="#website-pack">Website pack</a>
          <a href="#widgets">Widgets</a>
          <a href="#puzzle-practice">Puzzle sharing</a>
          <a href="#fresh">Fresh worksheets</a>
          <a href="#update">Update later</a>
          <a href="#backup">Save & hand over</a>
          <a href="#vocabulary">Vocabulary</a>
          <a href="#privacy">Privacy & public content</a>
          <a href="#troubleshooting">Troubleshooting</a>
          <a href="#checklist">Publish checklist</a>
        </nav>

        <section id="choose" class="tt99-guide-section tt99-guide-highlight">
          <h2>Choose the easiest method for your school</h2>
          <p>All of the options below lead to the same locked parent-practice system. The difference is only how the school presents the choices on its website.</p>

          <div class="tt99-guide-steps">
            <article>
              <b>1</b>
              <h3>Plain link or your website's own button/card</h3>
              <p><strong>Best starting point.</strong> Copy the locked parent-practice URL from Studio and attach it to a normal text link, button, image tile or card created inside the school website editor.</p>
            </article>
            <article>
              <b>2</b>
              <h3>Ready-made website card HTML</h3>
              <p>Useful when your website editor accepts Custom HTML/Code. Studio supplies a complete compact card with the badge, description and link.</p>
            </article>
            <article>
              <b>3</b>
              <h3>Downloadable PNG card image</h3>
              <p>Useful when your website editor is happier with normal images than HTML. Upload the PNG and attach the matching practice URL to it.</p>
            </article>
            <article>
              <b>4</b>
              <h3>Complete website pack</h3>
              <p>Useful when a maths lead wants to hand everything to another member of staff or a website administrator in one ZIP file.</p>
            </article>
            <article>
              <b>5</b>
              <h3>School website widget</h3>
              <p><strong>Best for several choices in one neat panel.</strong> A 99 Club Widget can show several Club levels; a Maths Games Widget can show printable puzzle packs and online games.</p>
            </article>
          </div>

          <div class="tt99-guide-note"><strong>If you are unsure, start with a plain link or PNG card.</strong> Widgets are useful but they are optional. If your school website does not allow iframe/embed code, use one of the other methods instead.</div>
        </section>

        <section id="before" class="tt99-guide-section">
          <h2>Before you start: what you need to know</h2>
          <p>Different school website systems use different words for the same things. You may see:</p>
          <ul>
            <li><strong>Website editor / CMS:</strong> the system you log into to edit the school website.</li>
            <li><strong>Page:</strong> the public webpage where parents will see the practice link/card/widget.</li>
            <li><strong>Block / content block:</strong> an item added to a page, such as Text, Image, Button, HTML, Code or Embed.</li>
            <li><strong>Link / URL:</strong> the web address a button or image opens when clicked.</li>
            <li><strong>Custom HTML / HTML / Code:</strong> a block that accepts website code rather than ordinary paragraph text.</li>
            <li><strong>Embed / iframe:</strong> a block that displays part of another website inside the school webpage. This is what the optional widget uses.</li>
            <li><strong>Preview:</strong> a way to check a page before publishing it.</li>
            <li><strong>Publish / Save / Update:</strong> the action that makes the change live for parents.</li>
          </ul>
          <p>99 Club Studio does not need access to the school website account. It only gives the teacher the public link/card/embed code to paste into the school's normal website editor. The plain-link/card routes use a normal HTTPS link; the widget route is an optional accountless widget embed.</p>
        </section>

        <section id="plain-link" class="tt99-guide-section">
          <h2>Option 1: use your website's own card or button</h2>
          <p>This is the simplest and most compatible route.</p>

          <h3>For a 99 Club level</h3>
          <ol>
            <li>Configure the 99 Club rules in the main <a href="/">99 Club Studio</a> page.</li>
            <li>Choose <strong>Create parent links</strong>.</li>
            <li>Find the required Club level.</li>
            <li>Choose <strong>Copy link</strong>.</li>
            <li>Open the school website editor.</li>
            <li>Add or edit a normal Button, Link, Card, Image Link or similar item.</li>
            <li>Paste the copied 99 Club practice URL as the destination.</li>
            <li>Use clear text such as <em>33 Club home practice</em> or <em>Bronze Challenge practice</em>.</li>
            <li>Preview, publish and test it.</li>
          </ol>

          <h3>For a printable puzzle pack</h3>
          <ol>
            <li>Configure the current pack in <a href="/games/">Maths Games &amp; Puzzles</a>.</li>
            <li>Open <strong>Create parent link</strong> / <strong>Share this puzzle setup</strong>.</li>
            <li>Choose <strong>Copy link</strong>.</li>
            <li>Add a normal link/button/card in the school website editor.</li>
            <li>Paste the copied practice URL as its destination.</li>
            <li>Preview, publish and test it.</li>
          </ol>

          <div class="tt99-guide-note"><strong>Why this method is so reliable:</strong> the school website only needs a normal HTTPS link. It does not need a plugin, script, account integration or iframe. The school controls the appearance; 99 Studio controls what happens after the parent clicks.</div>
        </section>

        <section id="html-card" class="tt99-guide-section">
          <h2>Option 2: use the ready-made website card HTML</h2>
          <p>Studio can copy a complete little website card containing the badge, title, short description and locked practice link.</p>
          <ol>
            <li>Configure the Club level or puzzle pack in Studio.</li>
            <li>Open the relevant parent-sharing panel.</li>
            <li>Choose <strong>Copy website card</strong>.</li>
            <li>In the school website editor, add a <strong>Custom HTML</strong>, <strong>HTML</strong>, <strong>Code</strong> or equivalent block.</li>
            <li>Paste the copied card code into that block.</li>
            <li>Preview the page before publishing.</li>
            <li>Check that the card image, title and description appear correctly and that clicking the card opens the expected parent-practice page.</li>
          </ol>
          <p>The card contains only a normal <code>&lt;a&gt;</code> hyperlink, image, text and styling. It does not contain a script or iframe.</p>
          <div class="tt99-guide-note"><strong>If the page displays the HTML itself as text</strong> — for example <code>&lt;a href=...</code> — it has been pasted into a normal Text block. Remove it and use a Custom HTML / HTML / Code block instead. If your school website removes the styling, use the PNG or plain-link method.</div>
        </section>

        <section id="png-card" class="tt99-guide-section">
          <h2>Option 3: use a downloadable PNG card image</h2>
          <p>This is usually the easiest visual method when the website editor supports images and links but blocks custom HTML.</p>
          <ol>
            <li>Configure the Club level or puzzle pack and open its parent-sharing panel.</li>
            <li>Choose <strong>Download card image</strong>. Studio creates a high-resolution PNG.</li>
            <li>Choose <strong>Copy link</strong> for the same Club/pack.</li>
            <li>Upload the PNG to the school website's normal image/media library.</li>
            <li>Add the image to the page.</li>
            <li>Use the website editor's option to make that image clickable.</li>
            <li>Paste the copied practice URL as the image destination.</li>
            <li>Add meaningful alternative text, for example <code>33 Club home practice – printable worksheet and answers</code>.</li>
            <li>Preview and publish the page.</li>
            <li>Click the image on the public page to verify that it opens the matching practice setup.</li>
          </ol>
          <div class="tt99-guide-note"><strong>The PNG itself does not contain the clickable link.</strong> The school website administrator must attach the matching practice URL to the uploaded image.</div>
        </section>

        <section id="website-pack" class="tt99-guide-section tt99-guide-highlight">
          <h2>Option 4: Download the complete website pack</h2>
          <p>The website pack is designed for handover. A maths lead can configure the practice in Studio, download one ZIP and give that ZIP to the person who manages the school website.</p>

          <h3>99 Club website pack</h3>
          <p><strong>Download website pack</strong> creates a ZIP containing:</p>
          <ul>
            <li>all 14 PNG card images, from 11 Club through Diamond;</li>
            <li><code>practice-links.csv</code>, matching every Club to its locked practice URL;</li>
            <li>a <code>README.html</code> with implementation instructions; and</li>
            <li><code>99-club-school-configuration.json</code>, so the Club rules can be restored later.</li>
          </ul>
          <p><strong>Copy all links</strong> provides the Club-to-URL mapping directly if a ZIP is unnecessary.</p>

          <h3>Puzzle website pack</h3>
          <p>The puzzle website pack contains the current pack's PNG card, the locked practice link, a short README and the restoreable puzzle configuration.</p>

          <div class="tt99-guide-note"><strong>Keep the configuration file as well as the images.</strong> The image/card is the public presentation. The JSON configuration is what helps another member of staff recreate and edit the source setup later.</div>
        </section>

        <section id="widgets" class="tt99-guide-section">
          <h2>Option 5: use School Website Widgets</h2>
          <p>Widgets are the compact multi-choice option. They are useful when the school wants several activities visible in one neat embedded panel instead of placing lots of separate buttons/cards on the webpage.</p>

          <h3>99 Club Widget</h3>
          <p>The 99 Club Widget can show any selection of 11–99 and Bronze, Silver, Gold, Platinum or Diamond. Each visible level keeps the school-selected maths rules.</p>
          <ol>
            <li>Configure the Club rules in the normal 99 Club Studio editor.</li>
            <li>Open <strong>Create parent links</strong>.</li>
            <li>Choose <strong>Open widget builder</strong> in the <strong>Alternative: 99 Club Widget</strong> section.</li>
            <li>Check the imported school name and logo.</li>
            <li>Tick only the Club levels you want parents to see.</li>
            <li>Check the live <strong>Parent preview</strong>.</li>
            <li>Choose <strong>Copy embed code</strong>.</li>
          </ol>

          <h3>Maths Games Widget</h3>
          <p>The Maths Games Widget can contain locked printable puzzle packs, selected online games, or both.</p>
          <ol>
            <li>Configure a printable puzzle pack in Maths Games &amp; Puzzles.</li>
            <li>Open its parent-sharing panel.</li>
            <li>Choose <strong>Open widget builder</strong>. The current locked pack is carried into the builder automatically.</li>
            <li>The Widget Builder opens with that locked pack included.</li>
            <li>To add a different printable pack, return to Maths Games &amp; Puzzles, configure another setup and add that pack as well.</li>
            <li>In the Widget Builder, tick any online games you want parents to see.</li>
            <li>If both Printable puzzles and Play online are present, choose which section opens first.</li>
            <li>Check the Parent preview and choose <strong>Copy embed code</strong>.</li>
          </ol>

          <h3>Put a widget on the school website</h3>
          <ol>
            <li>Copy the widget's complete embed code from 99 Club Studio.</li>
            <li>Open the school's normal website editor.</li>
            <li>Open the page where the widget should appear.</li>
            <li>Add an <strong>Embed</strong>, <strong>Custom HTML</strong>, <strong>HTML</strong>, <strong>Code</strong>, <strong>External content</strong> or equivalent block.</li>
            <li>Paste the complete code beginning with <code>&lt;iframe</code> and ending with <code>&lt;/iframe&gt;</code>.</li>
            <li>Save the block and preview the page.</li>
            <li>Check the school identity and the visible activities.</li>
            <li>Publish the page and test the public version.</li>
          </ol>

          <div class="tt99-guide-note"><strong>If the page literally shows <code>&lt;iframe ...&gt;</code> as text</strong>, the code has been pasted into an ordinary Text block. Remove it and use an Embed/HTML/Code block instead. If the school website blocks external embeds completely, use the plain-link, HTML-card or PNG methods above.</div>

          <h3>School name and logo</h3>
          <p>The widget can show the school's public name and logo so parents can recognise who selected the practice. The Widget Builder creates a small web copy of the logo so the embed remains practical. School name/logo in a widget are public presentation content.</p>

          <h3>Combined widget</h3>
          <p>A Combined widget is available under <strong>More options</strong>, but separate 99 Club and Maths Games widgets are normally easier for schools to place and manage.</p>
        </section>

        <section id="puzzle-practice" class="tt99-guide-section">
          <h2>Maths Games &amp; Puzzles: share a locked puzzle pack</h2>
          <p>The printable Maths Games &amp; Puzzles generator uses the same school-led idea as 99 Club. Configure the year range, topics, selected puzzle types, difficulty and specialist game options first, then use <strong>Create parent link</strong> / <strong>Share this puzzle setup</strong>.</p>
          <p>The parent receives one locked link for the <strong>whole current puzzle pack</strong>. They see a deliberately simple page and one download action. They do not see the puzzle editor and cannot change the school-selected settings.</p>
          <p>If the school wants several different choices — for example <em>Year 4 arithmetic puzzles</em>, <em>Upper KS2 number logic</em> and <em>Vocabulary Practice</em> — create each setup separately. They can be published as separate links/cards or collected into a Maths Games Widget.</p>

          <h3>Save puzzle setup</h3>
          <p><strong>Save puzzle setup</strong> downloads one JSON file containing the complete printable-puzzle configuration: year/topic choices, selected puzzle types, game settings, pack options, personalisation and saved vocabulary.</p>
          <p><strong>Restore puzzle setup</strong> recreates that configuration on another computer or after browser storage has been cleared. It restores the settings, not an old random puzzle seed, so a fresh pack is generated.</p>
        </section>

        <section id="fresh" class="tt99-guide-section tt99-guide-highlight">
          <h2>Does the same published link create fresh practice?</h2>
          <p><strong>Yes.</strong> The school-selected settings remain fixed, but the actual worksheet or puzzles are freshly generated when the parent presses the download button.</p>

          <h3>99 Club</h3>
          <p>A parent clicks a Club link/card/widget choice. The parent-practice page opens with the school's fixed maths rules. When the parent presses <strong>Download a new worksheet + answers</strong>, Studio generates fresh questions. Pressing the button again creates another fresh worksheet using the same rules.</p>

          <h3>Printable puzzle packs</h3>
          <p>A parent clicks the pack link/card/widget choice. The locked pack settings open. When they press <strong>Download a new puzzle pack + answers</strong>, Studio generates fresh puzzles using the same selected years, topics, game engines and difficulty settings. Pressing again creates another fresh pack.</p>

          <p>This means the school can publish one stable-looking practice choice without uploading new PDFs every week.</p>
        </section>

        <section id="update" class="tt99-guide-section">
          <h2>Important when the school changes the rules or practice setup</h2>
          <p>Published practice URLs are intentional snapshots. They do not silently change later if a teacher edits Studio or if Studio defaults are updated.</p>

          <h3>Updating a normal 99 Club link/card/PNG</h3>
          <ol>
            <li>Change the Club rules in Studio.</li>
            <li>Open <strong>Create parent links</strong> again.</li>
            <li>Copy the new parent-practice link.</li>
            <li>Replace the old URL on the school website.</li>
            <li>If the visible card description has also changed, copy/download a fresh website card or PNG.</li>
            <li>Publish and test.</li>
          </ol>

          <h3>Updating a puzzle link/card/PNG</h3>
          <ol>
            <li>Change the puzzle setup in Maths Games &amp; Puzzles.</li>
            <li>Create the new locked parent link.</li>
            <li>Replace the old website URL/card as appropriate.</li>
            <li>Publish and test.</li>
          </ol>

          <h3>Updating a widget</h3>
          <ol>
            <li>Copy the current widget URL or complete embed code from the school website editor.</li>
            <li>Open the <a href="/widget/builder/">Widget Builder</a>.</li>
            <li>Under <strong>Import / handover</strong>, paste the current widget URL/embed.</li>
            <li>Choose <strong>Recreate existing widget</strong>.</li>
            <li>Make the changes and check Parent preview.</li>
            <li>Choose <strong>Copy embed code</strong>.</li>
            <li>Replace the old embed in the school website editor with the new one.</li>
            <li>Preview, publish and test.</li>
          </ol>

          <div class="tt99-guide-note"><strong>Recreating or editing something in 99 Studio does not alter the school website.</strong> The public school page changes only after someone with authorised access deliberately replaces the link/card/embed and publishes the webpage.</div>
        </section>

        <section id="backup" class="tt99-guide-section">
          <h2>Save, restore and hand over the setup</h2>

          <h3>Save the school's club configuration</h3>
          <p>Studio remembers Club edits in the current browser, but browser storage is not a long-term backup. Open <strong>Create parent links</strong> and choose <strong>Save school configuration</strong>.</p>
          <p>The downloaded file contains the rules for all 14 parent-practice levels, print orientation and school setup needed to restore the configuration later.</p>

          <h3>Save the puzzle setup</h3>
          <p>Use <strong>Save puzzle setup</strong> for important printable-puzzle configurations. It preserves all game/pack settings and saved vocabulary.</p>

          <h3>Save the widget setup</h3>
          <p>In the Widget Builder choose <strong>Save widget setup</strong>. Another member of staff can use <strong>Restore widget setup</strong>. If the file is lost but the widget is still live, the public widget URL/embed can be pasted into <strong>Recreate existing widget</strong>.</p>

          <div class="tt99-guide-note"><strong>Keep backups somewhere independent of the browser.</strong> A shared school drive or another suitable staff-controlled location is much better than leaving the only copy in Downloads on one person's laptop.</div>
        </section>

        <section id="vocabulary" class="tt99-guide-section">
          <h2>Personal vocabulary</h2>
          <p>If a shared puzzle pack uses relevant entries from <strong>My vocabulary</strong>, the required terms and definitions are included in the locked parent-practice link so Word Search or Crossword can reproduce the intended activity.</p>
          <p>A Maths Games Widget keeps those locked pack links and marks when public vocabulary is present.</p>
          <ul>
            <li>Use mathematical terminology, curriculum vocabulary and teaching definitions.</li>
            <li>Do not use pupil names, email addresses, parent information, passwords, internal notes or other private information.</li>
            <li>If the vocabulary changes, create a new locked pack and update the published website link/card/widget.</li>
          </ul>
        </section>

        <section id="privacy" class="tt99-guide-section">
          <h2>Privacy, public content and who controls the website</h2>
          <p>Ordinary 99 Club parent-practice links deliberately exclude pupil names, parent details, teacher names, uploaded logos, worksheet dates, scores, progress history, teacher notes and generated question seeds.</p>
          <p>Puzzle parent links can include the relevant school-entered vocabulary required by a shared vocabulary activity.</p>
          <p><strong>School Website Widgets are public by design.</strong> The school name and compact logo are public presentation content inside the widget configuration. Selected Club levels, the maths-rule differences needed to reproduce them, selected online games and locked puzzle-pack links are also part of the public widget configuration.</p>
          <p>No pupil account, parent account, school login, class list, pupil score or pupil progress record is required for these publishing methods.</p>
          <p><strong>Website-source attribution:</strong> 99 Studio's generated HTML cards and widgets are designed to expose only the school website <em>origin</em> (for example <code>https://school.example</code>) when source attribution is available. The school page path, query string and fragment are not requested. Normal copied links/PNG buttons rely on the browser and school website's own referrer policy, so their source may sometimes be unavailable.</p>
          <p>The stripped parent-practice pages and public embedded widget do not load Google Analytics. A separate first-party school-usage system has been prepared for aggregate organisation/site reporting without parent or pupil profiles; <strong>that collector is currently disabled until its endpoint, retention and opt-out arrangements are finalised.</strong></p>
          <p>Anyone can copy a public widget/link and create their own copy. They cannot change what appears on the school's actual website without authorised access to the school's website editor.</p>
          <p>See <a href="/privacy/">Privacy &amp; analytics</a> for wider site information.</p>
        </section>

        <section id="troubleshooting" class="tt99-guide-section">
          <h2>Troubleshooting</h2>

          <h3>The page shows code such as &lt;iframe...&gt; or &lt;a href=...&gt; instead of a widget/card</h3>
          <p>The code was probably pasted into a normal Text block. Remove it and use an Embed, Custom HTML, HTML or Code block.</p>

          <h3>My school website does not allow iframe/embed code</h3>
          <p>Use a plain link/button, ready-made HTML card (if HTML is allowed) or PNG card. Widgets are optional; the other routes are fully supported.</p>

          <h3>The website editor removes the card styling</h3>
          <p>Use the PNG card or your website editor's own button/card component and attach the copied parent-practice URL.</p>

          <h3>The PNG looks fine but clicking it does nothing</h3>
          <p>The PNG itself is only an image. Edit that image on the school page and attach the matching copied practice URL as its link.</p>

          <h3>The wrong Club level or old rules open</h3>
          <p>The published URL is an old snapshot. Generate a new parent link from the current rules and replace the old URL on the school website.</p>

          <h3>The puzzle pack still uses the old setup</h3>
          <p>Generate a new locked parent link from the revised puzzle setup. Replace the old website link/card or update the Maths Games Widget.</p>

          <h3>The widget is too short and has a scrollbar</h3>
          <p>Some website editors override iframe dimensions. Increase the height if the editor provides a height setting. If it does not, a card/PNG layout may be cleaner.</p>

          <h3>The widget is very narrow</h3>
          <p>Move it into a normal full-width content area rather than a sidebar or narrow column.</p>

          <h3>The logo looks poor</h3>
          <p>Return to the Widget Builder, remove the logo and choose it again. Simple PNG, JPEG or WebP school marks work best. Then copy the updated embed and replace the old one on the school website.</p>

          <h3>I am taking over from another teacher</h3>
          <p>Use the saved school/puzzle/widget configuration files if available. If a widget is still live but the widget backup is missing, copy its URL/embed code from the school website editor and use <strong>Recreate existing widget</strong>.</p>

          <h3>It works in the website editor preview but not on the public site</h3>
          <p>First confirm that the page was actually published rather than left as a draft. Some platforms also apply stricter public-site security rules to embeds. If the iframe is blocked on the public site, switch to the plain-link or PNG method.</p>
        </section>

        <section id="checklist" class="tt99-guide-section tt99-guide-highlight">
          <h2>Before publishing: quick check</h2>
          <ul>
            <li>Correct school page?</li>
            <li>Correct Club level or puzzle setup?</li>
            <li>Correct school name/logo where used?</li>
            <li>If using vocabulary, checked that there is no pupil/private information?</li>
            <li>Plain links/buttons open the expected parent-practice page?</li>
            <li>HTML cards render as cards rather than code text?</li>
            <li>PNG card image has the matching URL attached?</li>
            <li>Widget shows only the intended Club levels/puzzle packs/games?</li>
            <li>Generated one test 99 Club worksheet + answers?</li>
            <li>Generated one test puzzle pack + answers?</li>
            <li>Confirmed a second download creates fresh questions/puzzles?</li>
            <li>Tested the school webpage on a phone?</li>
            <li>Tested it on a desktop/laptop?</li>
            <li>Page is published, not merely saved as a draft?</li>
            <li>Important school/puzzle/widget configuration files saved for handover?</li>
            <li>School's normal website, safeguarding and data-protection approval process followed?</li>
          </ul>
        </section>

        <section class="tt99-guide-section">
          <h2>Which option should I choose?</h2>
          <p>If you want the short answer:</p>
          <ol>
            <li><strong>Use a normal link/button</strong> for maximum compatibility.</li>
            <li><strong>Use a PNG card + link</strong> when you want something visual and easy to manage.</li>
            <li><strong>Use the ready-made website card HTML</strong> when the website accepts custom HTML.</li>
            <li><strong>Use the website pack</strong> when one member of staff is handing the job to another.</li>
            <li><strong>Use a widget</strong> when the website accepts iframe/embed code and you want several school-selected choices in one tidy panel.</li>
          </ol>
        </section>

        <div class="tt99-guide-note"><strong>Still worried you might break something?</strong> Experimenting in 99 Club Studio does not change the school website. Nothing becomes public until someone with authorised access deliberately adds or replaces the link/card/embed in the school website editor and publishes the page.</div>
      </div>
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/99club.css?v=20.2">
<link rel="stylesheet" href="/assets/99club/games-help-guides.css?v=1.1.1">
