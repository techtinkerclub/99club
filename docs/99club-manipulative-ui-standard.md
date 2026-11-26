# Manipulatives UI standard

Applies to every current and future 99 Club Studio manipulative, both standalone and mixed whiteboard. Do not build separate permanent menus for new widgets. The mathematics is the primary content.

## Four control types

- **Primary mode**: what representation, device or mathematical method is on screen. Multi-mode tools declare their native teaching control in the shared mode contract in `assets/99club/goodies-app.js`. The board presents one compact dropdown next to the move handle, labelled with the current mode, using the actual widget options and handler. A single-purpose tool declares why it has no mode selector. Secondary parameters, display switches, object-level controls and challenge types are not primary modes.
- **Settings**: how the current mode works. Use the common floating settings panel, shared workflow, field, toggle and group styling. Do not duplicate the primary selector in the whiteboard settings panel or on the stage. Keep the original native teaching control available to the standalone view and bridge. Changes must use the existing state/handler.
- **Challenge**: one frame action opening the shared quick launcher (random across all eligible types, random in category, specific question). A separate full challenge settings panel provides generation settings and a back action. Keep challenge family selection distinct from teaching modes. Specific and random quick generation close the launcher. Active challenges must not be silently cancelled or modified by a mode switch; return to Explore first.
- **Publish**: existing frame export menu and automatic worksheet builder. Current illustration/challenge, batch and mixed-source generation, Copy/PNG/SVG/Print and teacher keys where applicable. Never leak answers in pupil exports.

## Classroom content

Use most of the available stage without clipping or excessive blank margins; SVG wrappers need explicit width and a content-aware viewBox. Scale labels, diagrams and touch targets for classroom readability. Avoid viewport-relative caps that shrink the mathematical content inside scaled iframes. Short contextual teaching hints may be shown beneath the content; keep existing dedicated help/instructions instead of duplicating them. Hints are optional through the frame menu and hidden during pupil challenges.

Mode changes use the widget's existing model. Preserve compatible content (for example the same chart data across representations); keep incompatible work separately where appropriate (for example timetable data). Mode changes that cannot preserve a model must be explicit and pedagogically sensible, not silently corrupt the lesson. Saved lessons and exports derive from the actual current model.

## Catalogue audit (27 tools)

| Tool | Primary mode or single-purpose decision |
|---|---|
| Number line | Single workspace; line alignment/zoom is a property of a selected line |
| Place value board | Counters, place-value frame, linked views |
| Abacus & historical calculators | Eight devices, grouped into abacuses and historical calculators |
| Fraction wall | Wall or strip workbench |
| Bar model | One modelling workspace; comparison is a challenge family |
| Hundred square | Pattern highlighting families |
| Multiplication grid | Single grid; size/highlights are settings |
| Array builder | Single array; dimensions/partitions are settings |
| Clock & time | Arabic or Roman clock face |
| UK money | Single workbench; denominations are objects |
| Coordinate grid | First quadrant or four quadrants |
| Ruler & measures | Metric or imperial scale (extend for Measurement Lab) |
| Data & graphs | Frequency, tally, pictogram, block, bar, line, pie, timetable |
| Dice, spinner & randomiser | Dice, spinner, random number, card |
| Equation balance | Single balance; number and question types are settings |
| Times-table visualiser | Linked representations shown together |
| Factors & multiples | Explore one number or compare two |
| Fraction–decimal–percentage | Linked representations shown together |
| Shape & geoboard | Single pin-grid workspace |
| Angles & geometry | Protractor, turns, lines, angle facts, polygons, construction |
| Function machines | One-stage or two-stage machine |
| Sequences & rules | Sequence rule families |
| Column addition | One written method |
| Column subtraction | One written method |
| Written multiplication | Short or long multiplication |
| Written division | Short or long division |
| Arithmetic Hub | Single arithmetic workspace; challenge families remain in Challenge |

## Release gate for new content

1. Declare the primary-mode contract or a single-purpose reason before adding the widget to the catalogue.
2. Test its native mode changes through the shared frame selector, including state preservation, save/restore, touchscreen use and no duplicate mode controls.
3. Test the shared quick launcher and full challenge settings, including specific question, random category and random all, with correct exit and reveal behavior.
4. Inspect teaching and challenge visuals on phone, desktop and classroom-sized frames; validate readable text, touch targets and absence of clipping.
5. Verify current and batch publication, mixed documents and separate teacher annexes with mathematical and visual regression tests.
6. Bump affected asset cache versions, run relevant CI and check the deployed build. Automated tests do not replace a real classroom visual review.

The composition QA checks that every catalogue item has a mode contract or a single-purpose decision. Add tests for new modes and update this audit when adding tools.

### One reveal action

Never display both a frame Reveal/Hide answer action and its native challenge button. The board delegates presentation to the frame while the selected object's proxy is available; keep the original native handler and intrinsic hidden/disabled state intact. Restore native presentation when the proxy is unavailable, the object is deselected, or the context menu hides the frame rail. Standalone tools retain their own control. Test Reveal/Hide round trips and context-menu fallback for every delegated widget.

### Compact challenge headers and geometric notation

Use the common compact challenge header and aligned response controls (40 CSS px border-box height for buttons and standard input fields). Remove inherited margins, keep controls centred in their row and allow wrapping on narrow screens. Keep mathematical content large rather than enlarging interface chrome. In adjacent angle sectors use distinct arc radii, conventional right-angle squares and restrained labels placed along their own angle bisector. Apply the same notation in teaching, challenges and exports.
