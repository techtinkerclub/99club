# 99 Club Studio — Custom Worksheets v1.20 patch

Date: 10 September 2026

## Apply this patch when

Use this patch on the current 99 Club Studio repository. It is deliberately consolidated: it contains the corrected Graphical Statistics files, Coordinate Geometry Stage 2, and the Custom Worksheet blank-canvas selection changes. It is safe to apply over the earlier Graphical Statistics / v0.1.1 hotfix build because the same files are replaced with their newer versions.

Do not re-apply the older graph or coordinate patches after v1.20.

## Custom Worksheet behaviour

- A **fresh Custom Worksheet** starts with zero curriculum topics selected.
- The former Year 1–6 / Core 4 quick-select buttons are removed.
- Teachers select any supported topics manually across the catalogue.
- `Clear selected in …` clears one curriculum category.
- `Clear all selections` clears the entire topic selection.
- Accordion categories stay open/closed only according to the teacher's explicit toggle.
- The optional **Generation profile** changes age-sensitive ranges only; it never selects content.
- An empty selection is a valid editing state, but generation/download actions stay disabled until at least one topic is selected.

### Existing browser state

v1.20 does **not** delete saved browser settings or reusable presets. Therefore a browser that already has an older Custom Worksheet state may reopen that saved selection after deployment. Use **Clear all selections** once, or **Start fresh**, to reach the new blank state. A new browser/fresh setup opens blank automatically.

## Visual content included

Graphical Statistics Stage 1 remains included:

- Year 3–4 bar charts
- Year 4 time graphs
- Year 5–6 line graphs

Coordinate Geometry Stage 2 includes 43 stable subtypes / 258 deterministic pool entries:

- Y4 coordinates: 12 subtypes / 72 entries
- Y5 transformations: 9 / 54
- Y6 coordinates: 18 / 108
- Coordinate reasoning (Extension): 4 / 24

The Extension family contains midpoint, rectangle-centre, equally-spaced-line and 90° rotation structures so they do not silently widen the normal Year 4–6 coordinate curriculum.

## `/custom/` loading fix

The earlier visual integration used a `MutationObserver` that could repeatedly rewrite its own host DOM and make `/tools/99-club/custom/` hang. v1.20 removes that observer entirely. Custom UI copy now belongs to `custom-app.js`.

## Regression boundary

The public `/tools/99-club/` page is not changed by this patch. `app.js`, the public page, `pdf-layout.js`, `simple-pdf.js` and `qr-lite.js` are unchanged. Automated fixed-seed comparison against the supplied stable baseline covered 150 Classic/alternative/post-99 cases with 0 differences.

## Recommended deployment check

After deploying, hard-refresh `/tools/99-club/custom/`, choose **Start fresh**, confirm no topics are selected, open Geometry, select a few items, close/reopen the category, try per-category and Clear-all controls, then generate a mixed text/chart/coordinate sheet in both worksheet and answer views.
