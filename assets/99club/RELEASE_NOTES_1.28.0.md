# 99 Club Studio v1.28.0 - Numeric logic, scalable Games library and personalisation

Date: 11 September 2026

## Games library UI

The Games & Puzzles selector is reorganised into five accordion categories:

- Vocabulary & language
- Number patterns & structures
- Arithmetic & calculation
- Algebra & relationships
- Number logic & grids

Categories stay open while games are selected, show selected/compatible counts, highlight when they contain selections, and provide per-category **Select compatible** / **Clear** actions. A global **Clear all games** control and a compact **Selected games** tray make larger mixed packs manageable.

Each selected game keeps its own configuration and **Configure / Done** workflow. Collapsing a setup does not reset its settings.

## Pack personalisation

Games & Puzzles can now add optional pack identity without sending anything to a server:

- editable pack title;
- school name;
- optional class/year label;
- optional date (including a Use today convenience action);
- optional school logo (PNG/JPG/WebP input, converted/resized locally for the PDF writer).

These settings are stored locally in the browser and appear consistently on pupil, answer and combined PDFs.

## Five compact numeric-logic engines

### Kakuro / Cross Sums
Fill white cells with digits 1-9 so each across/down run reaches its clue total without repeated digits. Generated runs are validated. Where the sum clues alone do not force one solution, the primary-friendly derivative adds the minimum starter digits required by the configured clue level/uniqueness check.

### Futoshiki / Inequality Grid
Fill rows/columns with 1-N without repeats while obeying < and > relationships. Puzzles are solver-checked for one solution.

### Arithmetic Cages
A Calcudoku-style arithmetic grid: rows/columns use each number once and outlined cages must make their target using +, -, x or division according to year/difficulty settings. Puzzles are uniqueness checked.

### Nonogram / Number Picture
Use row/column run-length clues to shade a compact numerical picture. Generated clue sets are checked against the solution and for uniqueness.

### Number Path
Fill the missing sequence so consecutive values touch along an edge. Generated puzzles are checked for a unique path solution.

Each engine supports per-game difficulty/options, worked examples, selective activity replacement, pupil/answer rendering and deterministic regeneration.

## Domino chain decision

**Arithmetic Domino Chain is parked from the one-player Games library.** The underlying experimental engine is retained for possible future cut-and-match / classroom-card use, but it is no longer offered as a pencil puzzle because the answer relationships are too exposed in that format.

## Compatibility and regression boundary

Public 99 Club and Custom Worksheet generation remain separate. v1.28.0 retains the existing 105 base families, 258 coordinate entries / 43 subtypes, 592 pie-chart entries / 37 subtypes and 416 graphical-angle variants / 104 active subtypes.
