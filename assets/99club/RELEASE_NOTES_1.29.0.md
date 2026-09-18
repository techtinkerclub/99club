# 99 Club Studio v1.29.0 — Random Games & Puzzles packs

## Random compatible pack mode

Games & Puzzles can now build a pack from four simple teaching inputs:

- year range;
- one or more maths topics;
- difficulty: Easy / Standard / Challenge;
- total number of games / puzzles.

When **Random compatible games & puzzles** is selected, the generator chooses only engines that are genuinely compatible with the chosen years and topics. The choice is deterministic for a given pack seed, varied across the available compatible engines, and manual game selections are preserved so teachers can switch back to manual mode without losing them.

The selected random-pack difficulty is applied consistently to every generated engine and to the corresponding worked examples. Manual mode keeps each game's own individually configured difficulty and specialist settings.

## Simpler pack sizing

The former **Sheets** and **Activities / sheet** controls are hidden from the teacher workflow.

- Packs use **2 activities per pupil sheet**.
- The teacher chooses the exact total number of activities instead.
- The number of sheets is calculated automatically with `ceil(activityCount / 2)`.
- An odd activity count leaves one activity on the final sheet.

The same exact activity count applies in manual and random modes.

## Worked examples

When worked examples are enabled for a random pack, examples are produced for the game engines that actually occur in the generated pack rather than for unrelated compatible engines. Their difficulty follows the selected random-pack difficulty.

## Compatibility and rollback

The implementation is isolated in `games-pack-mode.js` and `games-random-ui.js`. Existing individual game engines and their settings are not rewritten. Removing those two scripts from the Games page restores the previous v1.28 pack workflow.
