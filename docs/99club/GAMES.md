# Maths Games & Puzzles — current engine inventory and roadmap

This file is the source of truth for the Games & Puzzles roadmap. Historical backlog/release documents are retained only for context.

## Current visible engine catalogue

### Vocabulary & language
- Maths Word Search
- Maths Crossword

### Number patterns & structures
- Number Pyramid
- Magic Square
- Arithmagons
- Magic Shapes
- Number Trail
- Number Connections (rule wheels, factor webs and sum/product diamonds)

### Arithmetic & calculation
- Correct-answer Maze
- Number Property Maze
- Crossnumber
- Number Search
- Arithmetic Equation Crossgrid
- Target Numbers
- Broken Calculator
- Operation Codebreaker
- Kakuro / Cross Sums
- Arithmetic Cages / Calcudoku-style cages
- Sumplete / Cross-Out Sums

### Algebra & relationships
- Symbol Equations (Online Play presents this as **Symbol Decoder**)
- Function Machines
- Equation Repair (engine id remains `balance`)
- Word Codes / Alphametics

### Number logic & grids
- Sudoku
- Futoshiki
- Nonogram / Number Picture
- Number Path
- Number Towers / Skyscrapers
- Binary Puzzle / Takuzu
- Killer Sudoku / Sum Sudoku
- Bridges / Hashi
- Maths Mines / Hidden Gems

`Arithmetic Domino Chain` remains hidden from the one-player library. It is a possible future cut-and-match classroom resource, not part of the current pupil puzzle catalogue.

## Recent refinement batches

### v1.37
- Fixed Challenge Operation Codebreaker multi-slot rendering.
- Improved Function Machines and Arithmagons.
- Added Kakuro 8×8.
- Added Number Towers / Skyscrapers with verified unique solutions.

### v1.38
- Refined Codebreaker layout.
- Rebuilt Function Machines as a clean process/flowchart diagram.
- Added inward-pointing Number Towers clue tabs and cleaned the grid edge rendering.

### v1.39
- Added **Binary Puzzle / Takuzu** as a deterministic unique-solution engine.
- Easy = 4×4, Standard = 6×6, Challenge = 8×8 by default.
- Every accepted Takuzu puzzle is both unique and completable by deterministic Takuzu deductions without guessing.
- Added a reviewed pupil-instruction layer and canonical wording document.

### v1.40
- Adds **Killer Sudoku / Sum Sudoku** with 4×4, 6×6 and optional 9×9 grids. Sudoku row/column/box rules and sum-cage constraints are validated together and every accepted puzzle has one solution.
- Adds **Bridges / Hashi** with 7-, 10- and 12-island solver-verified layouts. Rotations/reflections provide visual variation while a Hashi solver checks uniqueness.
- Adds **Maths Mines / Hidden Gems** with 5×5, 6×6 and 7×7 grids. Clues are removed only while uniqueness remains, then restored as needed until the built-in local-deduction solver can complete the puzzle without guessing.
- Adds **Word Codes / Alphametics** using a curated library of meaningful word equations rather than random letter strings. Current templates include `TWO + TWO = FOUR`, `BASE + BALL = GAMES`, `SEND + MORE = MONEY`, `CROSS + ROADS = DANGER` and `FORTY + TEN + TEN = SIXTY`.
- All four engines ship with pupil preview, answer preview, PDF rendering, settings, worked-example data and automated validation.

### v1.71 — Online Play existing-game wave
- Ports **Number Towers / Skyscrapers**, **Number Property Maze**, **Correct-Answer Maze** and **Maths Crossnumber** into Online Play without replacing their mature printable generators.
- Online generation calls the same deterministic engines and validates generated puzzles before accepting them.
- Interactive square grids use explicit equal row and column tracks so entered values cannot resize cells on mobile.
- Number Towers keeps inward-facing edge-clue directions and solver-verified uniqueness.
- Maze movement is orthogonal only; Number Property Maze preserves the generator's unique valid route and deliberate matching-number dead ends.
- Crossnumber uses one fixed square per digit and keeps blocked cells structurally separate from playable cells.
- `Check` marks only work the pupil has entered or selected. It never fills untouched solution cells.
- `Hint` highlights a useful clue, line or current position and explains a strategy without disclosing the next hidden value or route square.

### v1.73 — Online Play number-structures wave
- Ports **Number Pyramid**, **Magic Squares**, **Arithmagons** and **Magic Number Shapes** into Online Play while continuing to use their mature printable generators as the source of puzzle data and answers.
- Number Pyramid supports forward addition and inverse subtraction reasoning across 3–7 levels, with the existing uniquely-solvable clue masks retained.
- Magic Squares supports fill-missing, check-is-it-magic, repair-one-value and transform variants, including shifted/scaled number patterns and explicit decimal patterns.
- Arithmagons supports triangle through hexagon layouts, addition, multiplication, mixed-operation connections and the existing optional diagonal connections.
- Magic Number Shapes supports triangle, web, bow-tie and star layouts with fill-missing, check and repair variants.
- All four adapters use the shared Online Play shell for Relaxed/Challenge modes, Check, Hint, Undo, Redo, Reset, completion, personal bests and reproducible challenge links.
- Interactive grids and diagrams are responsive on narrow screens; Magic Squares use explicit equal zero-minimum row and column tracks to prevent content-driven mobile distortion.

### v1.84 — Online Play arithmetic/patterns wave
- Ports **Number Trail**, **Number Connections**, **Number Search** and **Arithmetic Equation Crossgrid** into Online Play while continuing to use their established printable generators and validators.
- Number Trail supports 12–25-cell snakes, constant and alternating rules, inverse reasoning and the existing clue-density settings.
- Number Connections supports rule wheels, factor-pair webs and sum/product diamonds, including challenge inverse reasoning.
- Number Search keeps the printable generator's unique answer placements and lets pupils calculate first, then drag across the matching digit sequence using the allowed directions.
- Arithmetic Equation Crossgrid preserves the generator's linked equation lattice and only hides values/operators when the existing sequential-resolvability check accepts the puzzle.
- All numeric-entry games use the shared non-native-focus interaction pattern: puzzle cells/buttons are the selection surface and the 4-column virtual keypad is used on touch/PWA, avoiding iOS input zoom.
- Square boards use explicit equal `minmax(0,1fr)` row and column tracks and `aspect-ratio:1` so mobile content cannot distort grid cells.
- `Check` evaluates only entered work; untouched blanks remain untouched. `Hint` highlights a productive next location or relationship and explains the strategy without filling the answer.
- All four support Relaxed/Challenge modes, Undo, Redo, Reset, completion, personal bests and compact reproducible challenge links.

### v1.86 — Online Play catalogue completion wave
- Ports **Symbol Equations**, **Function Machines**, **Equation Repair** and **Maths Crossword** into Online Play, completing Online Play coverage of every visible one-player printable game in the current catalogue.
- Symbol Equations reuses the existing two-/three-unknown generator, including coefficient variants, and asks pupils to solve the linked system rather than treating each equation separately.
- Function Machines supports one to three stages, forward and reverse rows, and explicitly teaches inverse-operation reasoning when the input is missing.
- Equation Repair uses the existing `balance` engine and presents the missing value as the pupil's editable repair while preserving the equality structure around it.
- Maths Crossword uses the same curated 591-entry UK-primary maths vocabulary source and the existing connected-crossword generator. It provides Across/Down clue selection, crossing-letter highlighting, optional word banks, physical-keyboard support and a touch-friendly on-screen letter keyboard.
- Numeric games continue to use the non-native-focus 4-column keypad pattern on touch devices. Crossword uses button-based cells rather than native text inputs, so iOS does not invoke input zoom or alter grid geometry.
- `Check` marks only pupil-entered work; `Hint` identifies a useful equation, row or clue and gives a strategy without inserting an answer or letter.
- All four support Relaxed/Challenge modes, Undo, Redo, Reset, completion, personal bests and compact reproducible challenge links.
- `Arithmetic Domino Chain` remains deliberately excluded from the one-player Online Play catalogue because its intended use is a printable/cut-and-match classroom activity.

### v1.88 — Symbol Decoder gameplay
- Reworks the Online Play presentation of **Symbol Equations** into **Symbol Decoder**, while leaving the printable Symbol Equations engine unchanged.
- Each hidden symbol has a value from 1–26. Correct values use an A1Z26 mapping (`1=A`, `2=B`, …, `26=Z`) to reveal letters in a coded word.
- Repeated letters reuse the same symbol, so one successful deduction can reveal several positions in the final message at once.
- The clue set is generated as a solvable chain: the first clue exposes one symbol, then later clues use already-solvable symbols to unlock the next. Standard and Challenge can introduce coefficients while preserving a clear deduction path.
- The secret-word pool combines the existing 591-entry UK-primary maths vocabulary catalogue with a separate curated primary-science bank. Online settings allow Maths, Science or mixed STEM words.
- Easy uses shorter words with fewer distinct symbols; Standard increases the word length and symbol count; Challenge uses longer words, more distinct symbols and coefficient-based clues.
- Correct symbol values reveal immediately in the coded message. The finished puzzle reveals the full word plus its curriculum-friendly definition, giving the algebra a visible payoff rather than ending at the numeric values.
- The game keeps the shared non-native numeric keypad, Relaxed/Challenge modes, Check, Hint, Undo, Redo, Reset, completion, personal-best and reproducible challenge-link behaviour.

### v1.89 — Symbol Decoder shared paper/online design
- Symbol Decoder now uses one deterministic puzzle generator for Online Play, browser worksheet preview and PDF export.
- The printable Symbol Equations activity is replaced by the same decode-a-secret-word mechanic rather than remaining a separate worksheet-only variant.
- Decoded Online Play words are forced onto one responsive row; long words shrink their tiles instead of wrapping a final letter onto a second line.
- Once the word is decoded, its curriculum-friendly definition appears directly beneath the word.
- Printable pupil sheets show the coded word, linked clues, A1Z26 key and symbol-value working slots; answer sheets/PDFs reveal the word and definition.
- PDF symbols are drawn as vector shapes so output does not depend on Unicode glyph support in the built-in Helvetica font.

## Curriculum mapping principle

Puzzle engines are mapped conservatively. They are reasoning/fluency resources that exercise curriculum mathematics; they are not presented as replacements for teaching a statutory objective.

The present Games UI still uses broad topics plus a Year 1–6 range for compatibility. This is increasingly coarse compared with the detailed Custom Worksheet catalogue. A planned Games taxonomy refactor should move toward finer teacher-selected strands/subtopics, with year tags retained internally only where they genuinely control mathematical content or vocabulary.

The statutory curriculum itself is organised by both year and mathematical domain, but many puzzle mechanics cut across several years and are better chosen by the exact skill being practised than by a single year label.

## Pupil instruction standard

Reviewed instruction wording is maintained in `docs/99club/GAME_INSTRUCTIONS.md`.

The standard is:
- start with the pupil action;
- use short, familiar language;
- state every rule needed to begin fairly;
- move hints and strategies into worked examples;
- keep browser preview and PDF wording aligned.

## QA expectation for every game engine

Before an engine is called complete, check Easy/Standard/Challenge where applicable, manual variants, boundary compatibility, pupil preview, answer preview, generated PDF, instruction clarity, mathematical validity and any uniqueness requirement. Maximum grid sizes and dense/long-number cases must be included because they are where clipping and layout drift most often appear.

## Future candidates

After the existing printable catalogue is fully represented in Online Play, the next expansion should be chosen from distinct mechanics rather than adding near-duplicates. Candidates retained for later evaluation include region sums/number partition, domino placement, honeycomb/hex puzzles, equation loops, factor/prime chains, fraction-match grids and coordinate treasure puzzles.


### v1.92 — Balance Lab
Balance the Equation now uses operations on both sides. Each solved equation yields its common balanced value as a weight; all weights feed a final equal-partition challenge. Online accepts any valid equal split; printable answers show an example solution.
