# 99 Club Studio v1.22.2 patch instructions

## Baseline

Apply this patch **directly over v1.21.3**.

Do **not** apply v1.22 or v1.22.1 first. Those were internal/withdrawn Angles QA builds and are superseded by this package.

## What this patch contains

- Angles & Turns Stage 1, visually reliability-reviewed: 104 active subtypes / 416 deterministic entries.
- Angles visual-polish pass: larger protected figures, clearer turn/label layouts, improved line/point/triangle spacing and rebuilt 1°/5°/10° dual-scale protractor.
- Pie Chart variety expansion: 37 subtypes × 16 deterministic variants = 592 pool entries, with structural/chart-layout variation and anti-repetition selection.
- Explicit estimation/measurement marking, working/explanation frames and teacher rubrics.
- Conventional vertical y-axis titles for bar/time/line graphs.

## Deployment

1. Apply the ZIP contents at repository root, preserving paths.
2. Deploy normally.
3. Hard-refresh `/tools/99-club/custom/` after deployment because Custom asset cache versions changed.
4. Check one question from each Angles family, a protractor question, several Pie Chart questions from the same family, and pupil/answer PDF export.

The public 99 Club page and public Help remain unchanged.
