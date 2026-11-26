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

<link rel="stylesheet" href="/assets/99club/goodies.css?v=118&amp;build={{ site.github.build_revision | default: site.time | url_encode }}">
<link rel="stylesheet" href="/assets/99club/goodies-abacus.css?v=23&amp;build={{ site.github.build_revision | default: site.time | url_encode }}">
<link rel="stylesheet" href="/assets/99club/goodies-number-mobile.css?v=2&amp;build={{ site.github.build_revision | default: site.time | url_encode }}">
<script>
window.TT99_GOODIES_FORCE_BOARD = true;
window.TT99_GOODIES_BOARD_EMBED_PATH = '/goodies/';
window.TT99_GOODIES_BOARD_HOME = '/goodies/';
</script>
<script>window.TT99_GOODIES_BUILD = {{ site.github.build_revision | default: site.time | jsonify }};</script>
<script src="/assets/99club/goodies-core.js?v=4&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-interaction.js?v=5&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-challenge.js?v=20&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-export.js?v=16&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-publishing.js?v=22&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-tools-a.js?v=75&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-abacus.js?v=28&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-number-line-v6.js?v=27&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-tools-b.js?v=68&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-number-mobile.js?v=2&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-sequences.js?v=5&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-written-methods.js?v=3&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-column-methods.js?v=3&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-statistics-model.js?v=2&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-statistics-table.js?v=3&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-function-machine.js?v=4&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-angles.js?v=21&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-app.js?v=18&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>
<script src="/assets/99club/goodies-board.js?v=64&amp;build={{ site.github.build_revision | default: site.time | url_encode }}" defer></script>