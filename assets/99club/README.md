# 99 Club Studio assets

This directory contains the active JavaScript, CSS, data, images and regression tests used by 99 Club Studio.

The current maintainer documentation has moved to `docs/99club/` so implementation notes do not become mixed with deployable assets.

Start here:

- [`../../docs/99club/README.md`](../../docs/99club/README.md) — current architecture and release discipline.
- [`../../docs/99club/GAMES.md`](../../docs/99club/GAMES.md) — Games & Puzzles engine inventory, known fixes and roadmap.
- [`../../docs/99club/CURRICULUM.md`](../../docs/99club/CURRICULUM.md) — curriculum-mapping principles.
- [`../../docs/99club/CURRICULUM_COVERAGE_DETAILED.md`](../../docs/99club/CURRICULUM_COVERAGE_DETAILED.md) — detailed Custom Worksheet coverage audit.
- [`../../docs/99club/CUSTOM_WORKSHEETS.md`](../../docs/99club/CUSTOM_WORKSHEETS.md) — Custom Worksheet maintenance guide.

## Tests

Current release-gating regression tests are directly under `assets/99club/tests/`. Superseded tests that encode historical version strings, cache numbers or retired layouts are kept in `assets/99club/tests/archive/` for traceability and should not be run as current release gates.

## Historical notes

Old release notes, QA reports, patch instructions and recovery files are preserved under `docs/archive/`.

Do not add new release notes or maintainer roadmaps to this asset directory. Update the canonical documents under `docs/99club/` instead.
