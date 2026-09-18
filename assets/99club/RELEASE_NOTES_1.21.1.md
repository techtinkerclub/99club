# 99 Club Studio v1.21.1 — Pie visibility and Custom workspace layout

Date: 10 September 2026

## Fixed

- Pie sectors can no longer disappear when a new Pie Charts module is combined with a stale pre-polygon visual canvas.
- Custom Worksheets no longer opens with the options panel dominating the desktop workspace.
- Public Help no longer exposes or documents the private Custom Worksheets beta.

## Added

- Three desktop workspace views for Custom Worksheets:
  - **Options** — wider configuration panel.
  - **Balanced** — default; same panel proportions as public 99 Club.
  - **Preview** — wider A4 preview area.
- The selected workspace view is remembered in Custom Worksheet browser settings/backups.
- Custom-only stylesheet `custom-workspace.css` isolates these layout changes from public 99 Club.

## Pie renderer hardening

The normal renderer still uses filled colour sectors through the polygon primitive. A new outline fallback draws a complete, readable pie using line primitives if polygon support is unexpectedly unavailable. Asset cache versions are also bumped so normal deployments receive the correct polygon-capable canvas.

## Unchanged

Classic/post-99 generation, public 99 Club UI, compact QR/recreation behaviour, base generator and standard PDF layout remain unchanged.
