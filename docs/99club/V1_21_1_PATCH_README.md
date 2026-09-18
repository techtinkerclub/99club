# 99 Club Studio — Custom Worksheets v1.21.1 hotfix

Date: 10 September 2026

Apply this patch **on top of v1.21**.

## Fixes

1. **Pie charts visible in preview and PDF**
   - `custom-graphs.js` is cache-busted to a new asset version so the polygon-capable visual canvas is definitely reloaded.
   - `custom-piecharts.js` now also has a line-outline fallback if an older visual canvas is ever mixed with the new pie module.

2. **Custom Worksheet layout**
   - Balanced is the default and matches the public 99 Club panel proportions.
   - A small sticky workspace switcher provides three explicit states: **Options**, **Balanced**, **Preview**.
   - The user's last choice is remembered locally.
   - On narrower screens the page returns to the existing single-column responsive layout.

3. **Public Help remains public-99-Club only**
   - Removes the Custom Worksheets tab/link, navigation entry and Custom section from `/tools/99-club/help/`.
   - Removes the Custom page's link to the public Help page while the Custom workspace remains private beta.
   - Inline `?` help inside Custom remains self-contained.

## Isolation / regression boundary

The new panel behaviour is in `assets/99club/custom-workspace.css`, loaded only by `/tools/99-club/custom/`.
The public 99 Club page, generator maths, QR implementation and standard PDF layout files are not modified.

## Files in this patch

Replace:
- `_pages/99-club-custom.md`
- `_pages/99-club-help.md`
- `assets/99club/custom-app.js`
- `assets/99club/custom-graphs.js`
- `assets/99club/custom-piecharts.js`
- `assets/99club/README.md`

Add:
- `assets/99club/custom-workspace.css`
- `assets/99club/RELEASE_NOTES_1.21.1.md`
- `docs/99club/V1_21_1_PATCH_README.md`
- `docs/99club/V1_21_1_QA.md`
- `docs/99club/V1_21_1_IMPLEMENTATION.json`

After deployment, hard-refresh `/tools/99-club/custom/` once.
