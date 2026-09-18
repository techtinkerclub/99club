# 99 Club Studio v1.27.0 — Arithmetic Games expansion

Date: 11 September 2026

## Scope

v1.27.0 expands **Maths Games & Puzzles** from 5 engines to **18 engines**. The new work is deliberately limited to numerical, arithmetic and algebraic puzzle formats; broader logic-only families such as Futoshiki, Kakuro, nonograms and skyscrapers are not included in this release.

## New engines

### Number & arithmetic
- Arithmagons
- Magic Number Shapes (triangle / circle / star derivatives)
- Maths Crossnumber
- Number Trails & Snakes
- Arithmetic Domino Chain
- Missing Operations
- Number Wheels, Flowers & Diamonds

### Arithmetic reasoning
- Correct-Answer Maze
- Target Number Challenge
- Broken Calculator

### Algebra & relationships
- Symbol Equations
- Function Machines
- Balance the Equation

Existing Word Search, Number Pyramid, Maths Crossword, Magic Squares, and Sudoku / Latin Squares remain available.

## Generation and validation improvements

- Each new engine has its own settings schema and difficulty controls.
- Year/topic applicability prevents engines from silently falling back to unrelated maths.
- Correct-Answer Maze creates one orthogonally connected route from START through the correct answers to FINISH.
- Maths Crossnumber generates a connected criss-cross structure with agreeing digits at every crossing.
- Missing Operations is checked for a unique operator solution.
- Broken Calculator targets cannot simply be typed using the surviving digit keys.
- Arithmetic Domino Chain validates its continuous answer-to-question sequence.
- Function Machines validate forward and reverse relationships and avoid repeated adjacent stages.
- Magic Number Shapes validate a common line total across their generated structure.

## Print and worked examples

- All new engines support pupil, answer-key and combined PDFs through the existing Games PDF writer.
- Every new engine supplies a child-facing worked-example contract: Goal, Rules, Worked steps, Tip and Watch-out.
- Worked-example PDF typography was enlarged during final QA for better child readability.
- Correct-Answer Maze PDF density was tightened so 9-step Challenge mazes fit safely even when three activities share one A4 page.

## UI

- The game library is grouped into Vocabulary & language, Number & arithmetic, Arithmetic reasoning, Algebra & relationships, and Logic & patterns.
- Per-engine Configure / Done behaviour and selective whole-activity replacement are retained.

## Regression boundary

The public 99 Club progression engine, Custom Worksheet maths, coordinate, pie-chart and graphical-angle generators remain mathematically unchanged by this release.
