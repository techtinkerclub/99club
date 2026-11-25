---
layout: default
title: "Maths Whiteboard · 99 Club Studio"
permalink: /whiteboard/
sidebar: false
sitemap: false
search: false
robots: "noindex,nofollow,noarchive"
---

<div id="main" class="tt99-page-main" role="main">
  <article class="splash">
    <section class="page__content">
      <div id="tt99-goodies-root"><noscript>This maths whiteboard needs JavaScript enabled.</noscript></div>
      {% if site.github.build_revision %}
      <div class="gd-board-build-badge" title="Deployed Git revision {{ site.github.build_revision }} · built {{ site.time | date: "%Y-%m-%d %H:%M UTC" }}">Build {{ site.github.build_revision | slice: 0, 7 }} · {{ site.time | date: "%d %b %H:%M" }}</div>
      {% else %}
      <div class="gd-board-build-badge" title="Page built {{ site.time | date: "%Y-%m-%d %H:%M UTC" }}">Build {{ site.time | date: "%Y%m%d-%H%M" }}</div>
      {% endif %}
    </section>
  </article>
</div>

<link rel="stylesheet" href="/assets/99club/goodies.css?v=103">
<link rel="stylesheet" href="/assets/99club/goodies-abacus.css?v=22">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile.css?v=1">
<script>
window.TT99_GOODIES_FORCE_BOARD = true;
window.TT99_GOODIES_BOARD_EMBED_PATH = '/goodies/';
window.TT99_GOODIES_BOARD_HOME = '/goodies/';
</script>
<script>window.TT99_GOODIES_BUILD = {{ site.github.build_revision | default: site.time | jsonify }};</script>
<script src="/assets/99club/goodies-core.js?v=2" defer></script>
<script src="/assets/99club/goodies-interaction.js?v=4" defer></script>
<script src="/assets/99club/goodies-challenge.js?v=19" defer></script>
<script src="/assets/99club/goodies-export.js?v=10" defer></script>
<script src="/assets/99club/goodies-tools-a.js?v=65" defer></script>
<script src="/assets/99club/goodies-abacus.js?v=25" defer></script>
<script src="/assets/99club/goodies-number-line-v6.js?v=25" defer></script>
<script src="/assets/99club/goodies-tools-b.js?v=59" defer></script>
<script src="/assets/99club/goodies-number-mobile.js?v=1" defer></script>
<script src="/assets/99club/goodies-sequences.js?v=1" defer></script>
<script src="/assets/99club/goodies-app.js?v=13" defer></script>
<script src="/assets/99club/goodies-board.js?v=50" defer></script>