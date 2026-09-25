# Goodies interaction model

Status: working design contract for the hidden `/goodies/` lab.

The Goodies lab is moving from a collection of form-driven demos toward one coherent classroom-manipulative workspace. Mathigon Polypad is an interaction benchmark, not a visual or code template: the aim is to reuse the useful interaction principles while keeping 99 Club Studio's own visual language and simpler primary-school scope.

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

### 7. Challenges are an overlay, not a separate tool
A challenge should reuse the current board state and temporarily hide/ask for information.

When a challenge is active:
- missing values have explicit answer spaces;
- Reveal answer is contextual beside the challenge;
- moving relevant objects updates the answer;
- leaving challenge mode restores the teaching representation cleanly.

### 8. Reusable state
Where useful, a teacher should eventually be able to:
- share/reopen a prepared setup;
- export a clean illustration;
- print/save a clean worksheet view;
- start from a prepared challenge and continue manipulating it.

## Current reference implementations

### Number Line v6
The richest existing Goodie and the behavioural reference for:
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

Do not rewrite it merely to use a new abstraction. Extract common behaviour only when that reduces duplication without regressing the working Number Line.

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
