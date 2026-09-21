# Verbal Reasoning — experimental / hidden

Status: **parked and not exposed in the public 99 Club Studio UI**.

The Verbal Reasoning work is intentionally retained in the repository so it can be refined later without rebuilding the generator infrastructure. It is not currently loaded by the normal Games & Puzzles page, Custom Worksheet page, or parent puzzle-practice page.

## Retained implementation

- `assets/99club/verbal-reasoning-core-v208.js` — shared deterministic core for 21 question formats.
- `assets/99club/games-verbal-reasoning-v208.js` — Games bridge.
- `assets/99club/games-verbal-reasoning-v208.css` — Games setup/preview styling.
- `assets/99club/games-pdf-verbal-reasoning-v208.js` — printable PDF overlay.
- `assets/99club/custom-verbal-reasoning-v208.js` — Custom Worksheet bridge.
- `scripts/99club/verbal-reasoning-qa.js` — generator/regression QA.

The general Games engine retains the finite-content/no-repeat hooks needed by the experimental module, and the CI workflow continues to run the Verbal Reasoning regression suite.

## Public exposure

The public loaders and visible controls were deliberately restored to their pre-Verbal-Reasoning versions. Therefore:

- no Verbal Reasoning category is shown in Games & Puzzles;
- no Verbal Reasoning families are shown in Custom Worksheet;
- Random Pack does not show Verbal Reasoning scope choices;
- parent puzzle-practice does not advertise or load the module.

## Re-enabling later

Do not simply restore the old UI. First review the 21 formats for wording, UK conventions, ambiguity, semantic quality, difficulty calibration, printable layout and expected child working space.

When the content is ready, re-enable the module through a fresh feature branch by loading the retained core/bridges on the relevant pages, restoring the UI category/type picker, and running the full `99 Club QA` workflow plus a human sample review for every type and difficulty.

This file exists specifically so the experimental work is easy to find without making it part of the public product.
