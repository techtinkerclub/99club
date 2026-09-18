# 99 Club Studio v1.31.5 — Number Path v2

## Why this patch exists
The original Number Path generator always started from the same row-by-row snake and only rotated, mirrored or reversed it. The puzzles were mathematically valid, but their structure had very little variety and could feel arbitrary rather than like a genuine path puzzle.

## Number Path v2
- Replaces the transformed-snake generator with seeded **winding Hamiltonian paths** that visit every square exactly once.
- Uses topology-preserving path mutations, then selects the stronger winding candidates rather than exposing a simple row snake.
- Removes clues progressively while checking that the finished puzzle still has **one solution**.
- Always keeps `1` and the final number visible.
- Easy keeps more helpful bend/anchor clues; Standard uses balanced anchors; Challenge relies on fewer, less conveniently placed anchors.
- Instructions now explicitly state that every number is used exactly once and that diagonal touching does not count.
- Keeps the existing preview/PDF data shape, so the established Number Path renderers continue to work without a separate visual fork.

## Grid sizes
- Easy Auto: **4 × 4** (`1–16`)
- Standard Auto: **5 × 5** (`1–25`)
- Challenge Auto: **7 × 7** (`1–49`)
- Manual choices: `4 × 4`, `5 × 5`, `6 × 6`, `7 × 7`

## QA
A dedicated regression test covers:
- path adjacency and complete 1…N coverage;
- one-solution validation;
- mandatory endpoint clues;
- structural diversity across multiple seeds;
- non-trivial path winding;
- automatic 4/5/7 sizing and manual 6/7 sizing;
- updated pupil instructions.

The new implementation is intentionally isolated in `games-number-path-v2.js` and loaded immediately after the existing numeric-logic engine, reducing regression risk to Kakuro, Futoshiki, Arithmetic Cages and Nonograms.
