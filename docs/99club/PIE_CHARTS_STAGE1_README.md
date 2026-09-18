# Pie Charts graphical module — Stage 1

Version: 0.1.1
Application release: 99 Club Studio v1.21
Date: 10 September 2026

## Curriculum boundary

Normal placement is Year 6 Statistics: interpret and construct pie charts and use them to solve problems. Fractions, percentages and angles are used where they are part of interpreting the pie chart. 11+/cross-topic structures are isolated in the Extension family rather than silently widening the Year 6 curriculum.

## Families

| Family | Purpose | Stable subtypes | Pool entries |
|---|---|---:|---:|
| `pie_charts_y6` | Interpretation and construction | 21 | 84 |
| `pie_charts_reasoning_y6` | Reasoning and problem solving | 11 | 44 |
| `pie_charts_extension` | 11+/cross-topic/cross-representation | 5 | 20 |
| **Total** | | **37** | **148** |

Each subtype has four deterministic pool variants.

## Architecture

The module is deliberately isolated in `assets/99club/custom-piecharts.js`. It registers three families with `TT99Generator`, then uses the visual-renderer registry supplied by `custom-graphs.js`.

The mathematical model is stored independently of drawing commands: each pie keeps its sector counts, total, fractions, percentages and angles. Preview and PDF therefore render the same question data, and pupil/answer views do not need separate independently-generated charts.

`custom-graphs.js` supplies the shared visual compositor, page packing and restrained palette. It gained a generic polygon primitive because pie sectors are rendered as filled polygons in both SVG preview and the minimal PDF writer.

## Colour policy

Use the shared restrained palette as a secondary cue. Do not encode the only meaning in colour. Pie charts always retain labels/legends; coordinate diagrams retain geometry/line distinctions; graphs retain axes, category labels and series labels.

## Research inputs

The taxonomy was synthesised from the project's Year 6 curriculum mapping plus the stored Corbettmaths, White Rose, Classroom Secrets, Twinkl, historical KS2 SATs, Andrew Jeffrey/KS2SATS and other supplied pie-chart packs. The 11+ Centre public Pie Charts archive was used only as an Extension/source-discovery catalogue.

See the Library files `Pie_Charts_Source_Review_2026-09-10_v0.3.md` and `Pie_Charts_Question_Type_Source_Matrix_v0.3.csv` for source-level classification.
