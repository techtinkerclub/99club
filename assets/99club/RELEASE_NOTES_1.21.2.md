# 99 Club Studio v1.21.2 — Custom workspace switcher hotfix

Date: 10 September 2026

## Fixes

- Repairs the **Options / Balanced / Preview** workspace control on Custom Worksheets.
- Removes the runtime dependency on the newly-added `custom-workspace.css` asset.
- Places the same scoped workspace styles into the already-established Custom-only `custom-graphs.css` and bumps that stylesheet to `?v=2`.
- Changes workspace-view buttons to persistent delegated click handling, so replacing the Custom page DOM during a re-render cannot lose their behaviour.
- **Balanced** remains the default and matches the public 99 Club panel proportions.

## Unchanged

- Pie-chart generation/rendering from v1.21.1.
- Coordinates and existing graph generators.
- Public 99 Club page, generator, PDF layout and QR path.
- Public Help remains free of Custom Worksheet links/content.
