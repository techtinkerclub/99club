# 99 Club Studio — v1.20 release notes

Date: 10 September 2026

## Custom Worksheet selection reset

Custom Worksheets is now a blank-canvas workflow. No curriculum topics are preselected and the former Year 1–6 / Core 4 quick-select row is removed. Teachers can:

- select freely across the complete curriculum catalogue;
- clear selected topics within one curriculum category;
- clear all topic selections in one action;
- keep an accordion category open while ticking/unticking topics;
- optionally choose a Year generation profile to adjust age-sensitive ranges without selecting content.

A completely empty selection is now a valid editing state. Generation/download actions remain disabled until at least one topic is selected. Existing saved setups can still be loaded.

## Coordinates visual stage 2

The visual coordinate families now include additional structures identified in the Corbettmaths, MathSphere and historical KS2 reference material. New normal-family subtypes include:

- labelled-point lookup;
- same-displacement endpoint reasoning;
- full reflected-coordinate sets about offset horizontal/vertical lines;
- four-quadrant plotting-error diagnostics;
- plot/join/name polygon construction;
- missing kite vertices;
- reflection sign-rule reasoning;
- completing a four-quadrant reflection pattern.

A separate **coordinate reasoning (extension)** family contains midpoint, rectangle-centre, equally-spaced-line and 90° rotation structures. These are deliberately not injected into normal Year 4–6 coordinate families.

## Graph integration fix retained

The v0.1.1 Custom-page MutationObserver hotfix remains incorporated. v1.20 removes the observer entirely; Custom Worksheet copy is now owned directly by `custom-app.js`, so the visual engine no longer mutates its host UI.

## Public 99 Club regression boundary

The public `/tools/99-club/` page and its 11–99/Bronze–Diamond maths generation paths are not changed by the visual modules. Custom visual scripts continue to load only on `/tools/99-club/custom/`.
