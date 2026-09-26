# Goodies interaction model

Status: working design contract for the hidden `/goodies/` lab.

The Goodies lab is moving from a collection of form-driven demos toward one coherent classroom-manipulative workspace. **Number Line is the primary internal interaction reference.** Mathigon Polypad is only an external source of useful interaction ideas, not a visual, behavioural or code template. Keep 99 Club Studio's own maths-specific automation, visual language and simpler primary-school workflow.

## Product rules

### 1. Objects first
Once a manipulative is on the board, teachers and pupils should work with the object directly.

Prefer:
- drag a marker, tile, counter, bar, point or hand;
- tap/click an object to select it;
- show relevant actions beside the board or selection;
- update dependent values immediately.

Avoid making a teacher return to a settings form for routine movement, deletion or editing.

### 2. Controls configure; the canvas teaches
The left controls may set up the mathematical environment (range, denominator family, available pieces, grid, challenge type, etc.).

The canvas should then support the normal live teaching actions without digging back through those controls.

### 3. One shared interaction language
Where an object supports an action, use the same behaviour and iconography across tools:
- select;
- drag/move;
- duplicate;
- colour;
- lock/unlock;
- delete;
- undo/redo;
- keyboard nudge where appropriate;
- optional snap/grid.

Tool-specific actions can be added contextually, but universal actions should not move around or change meaning.

### 4. Progressive disclosure
Keep the mathematical representation visually dominant.

Use:
- quiet semi-transparent icon rails;
- hover/focus labels on pointer devices;
- touch-sized targets on mobile;
- small contextual panels only when an action needs options.

Do not leave large permanent editing panels over the teaching surface.

### 5. Desktop/mobile parity
Use one state model and one feature set. Responsive layout may change, but mobile must not become a reduced implementation.

Pointer events are the primary direct-manipulation path so mouse, pen and touch share the same code. Keyboard shortcuts are enhancements, not requirements.

### 6. Safe direct manipulation
- Dragging an object updates all dependent mathematical values live.
- Lock prevents accidental movement/editing.
- Delete is immediately reachable after selection.
- Destructive board-wide actions should be deliberate.
- Undo/redo should cover meaningful canvas edits.
- Visual snapping and numerical snapping must agree.

### 7. Challenges are a shared overlay, not a separate tool
Every suitable Goodie should eventually expose the same **Standard / Custom** challenge language.

The teacher workflow should stay task-based rather than settings-based:
**Setup → Objects → Challenge → Export/Reuse**. Only the controls relevant to the current task should dominate the panel; avoid long stacks of open configuration sections.

The shared challenge shell owns:
- Standard / Custom switching;
- title and prompt presentation;
- the small rich-text editor;
- contextual Reveal answer;
- common challenge navigation/actions;
- share/export-safe challenge state;
- responsive/mobile presentation;
- a reusable challenge-card export pattern containing the title/question, mathematical visual and blank pupil response area.

Challenge exports should be directly usable in teacher-made resources. A pupil-facing export must not leak the revealed/correct answer just because the teacher has revealed it on screen. Prefer a clean PNG/SVG/print card that can be pasted into slides, worksheets or documents without rebuilding the question elsewhere.

The individual Goodie owns the mathematics:
- which standard challenge families make sense;
- what can be hidden or turned into an answer;
- how answers are calculated and validated;
- which live objects/values an answer can remain bound to.

For custom challenges, prefer **live answer sources** over making the teacher retype values the diagram already knows. The shared editor may present the common “Answer comes from” control, while each Goodie supplies meaningful sources such as a marker value, a difference/jump, an area/perimeter, a coordinate or an equivalent fraction. Selecting a live source should hide the corresponding pupil-facing value and keep Reveal/export answers synchronized when the mathematical object moves.

A challenge should reuse the current board state whenever possible rather than forcing the teacher to rebuild the representation. When a generated standard challenge configures a special board, the previous teaching setup must remain recoverable.

When a challenge is active:
- missing values have explicit answer spaces where the visual itself contains the blank;
- Reveal answer is contextual beside the challenge;
- a generated Standard challenge should offer a direct **Another like this** action so a teacher can run question → reveal → next question without reopening menus;
- moving relevant objects updates a bound answer automatically;
- a teacher may convert a generated Standard challenge into Custom and rewrite its title/instructions;
- typing a manual answer deliberately breaks the automatic answer binding;
- ending a custom challenge leaves the underlying maths setup intact;
- leaving a generated challenge restores the prior teaching setup where one exists.

Rich text is intentionally restrained: bold, italic and a few text sizes are useful; fonts, decorative colours, tables and document-editor complexity are not.

Standard challenge libraries should be organised by mathematical task structure (for example Read & Scale, Position, Jumps & Intervals, Rounding, Reasoning), not by arbitrary difficulty labels or year-group guesses. Difficulty should come from the mathematical state: range, interval, sparse labels, crossing zero, fractions/decimals, reverse tasks and reasoning depth.

### 8. Reusable state
Where useful, a teacher should eventually be able to:
- share/reopen a prepared setup;
- export a clean illustration;
- print/save a clean worksheet view;
- start from a prepared challenge and continue manipulating it.

## Current reference implementations

### Number Line v6
The richest existing Goodie and the **primary behavioural reference** for:

Its extra lines have four distinct teaching purposes:
- **Aligned** — the same numeric scale, so equal values sit directly above one another.
- **Independent** — a separate min/max/tick scale using the full width with no implied numerical alignment.
- **Zoomed** — the main line highlights a bounded interval and the extra line expands that interval to the full working width; main-line markers are a useful fast default for the zoom bounds. When a teacher chooses marker-following, moving either of the first two main markers should update the zoom bounds immediately. Manual zoom bounds should detach that live dependency.
- **Double number line** — two proportional scales share horizontal positions while retaining their own numeric values. Keep correspondence guides restrained, and only display a multiplication factor when both scales have a meaningful zero origin. A teacher can add a **corresponding pair**: one marker on each line sharing the same proportional position. Dragging/editing either marker should move the pair together; paired labels/colours stay visually matched.

Do not blur these modes together. The visual relationship must explain why the extra line exists, and live dependencies should remove recalculation work rather than add configuration.

The Number Line reference covers:
- direct dragging;
- dependent-value updates;
- quiet side tool rail;
- direct delete;
- lock;
- undo/redo;
- challenge overlays;
- comparison lines;
- share/export state;
- mobile parity.
- the shared Standard / Custom challenge model.
- generated challenges that can become editable custom teaching prompts.

Do not rewrite it merely to use a new abstraction. Extract common behaviour only when that reduces duplication without regressing the working Number Line.

### Shared challenge framework
`goodies-challenge.js` is the reusable challenge/editor layer proven first by Number Line.

Do not fork its Standard / Custom tabs, title/prompt editor, reveal behaviour or rich-text toolbar inside individual tools. Extend the shared layer when a genuinely universal need appears; keep mathematical generators and answer bindings inside each Goodie.

### Maths Canvas pilot
The first tool using the shared `goodies-interaction.js` controller.

It validates:
- reusable object selection;
- pointer/touch drag;
- snap-aware movement;
- selected-object side actions;
- duplicate/colour/lock/delete;
- shared history;
- keyboard enhancements;
- responsive phone/desktop behaviour.

## Migration order

1. **Shared foundation + Maths Canvas**  
   Prove the interaction primitives and regression coverage.

2. **Place Value**  
   Replace the digit-display-only experience with manipulable place-value objects/counters. Moving an object between columns should change its place value and the represented total. Keep direct number entry as a quick setup method, not the main teaching interaction.

3. **Fractions**  
   Evolve Fraction Wall toward reusable fraction bars/pieces: select, duplicate, compare, align, split/partition where mathematically valid, and make equivalence visible through direct manipulation.

4. **Arrays / Geoboard / Coordinates / Measures**  
   Reuse the same object handling for counters, vertices, draggable points and measuring tools. Add tool-specific snapping and actions only where they support the maths.

5. **Mixed board composition**  
   Only after the individual manipulatives share stable primitives, consider allowing multiple compatible manipulative types on one board. Do not attempt this by copying every tool into one monolith.

## Regression rule

A migration must not remove existing mathematical capability merely to achieve interaction consistency.

For every migrated tool check:
- desktop;
- phone portrait;
- compact landscape where relevant;
- touch/pointer interaction;
- keyboard enhancement;
- undo/redo;
- lock/delete semantics;
- hidden/noindex status of the lab;
- existing public Studio pages remain unaffected.
