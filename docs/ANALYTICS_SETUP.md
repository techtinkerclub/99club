# 99 Club Studio analytics setup

The site contains a privacy-first Google Analytics 4 integration plus Studio-specific product events.

## Activate GA4

1. Create a Google Analytics 4 property and Web data stream for `https://99studio.uk`.
2. Copy the Measurement ID in the form `G-XXXXXXXXXX`.
3. Put that value in `assets/99club/analytics-config.js` as `ga4MeasurementId`.
4. Deploy. The analytics choice UI appears only when a valid GA4 Measurement ID is configured.

The Google tag loads with Google Consent Mode. Analytics storage defaults to **denied** and is changed to **granted** only after the visitor chooses **Allow analytics**. Advertising-related consent/signals remain disabled.

## Automatically available GA4 information

Once activated, GA4 provides the normal website analytics layer, including page views, users/sessions, traffic acquisition/referrers, device/browser information and approximate geographic reporting.

## Studio product events

### Main 99 Club

- `challenge_selected`
  - `scheme_id`
  - `challenge_id`
- `worksheet_download`
  - `pdf_kind`
  - `scheme_id`
  - `challenge_id`
  - `variant_count`
  - `question_count`
  - `orientation`
  - `answer_qr`

### Printable Games & Puzzles

- `game_pack_selection`
  - `game_id`
  - `selection_action`
  - `selection_source`
  - `difficulty`
- `game_difficulty_selected`
  - `game_id`
  - `difficulty`
  - `context`
- `game_pack_download`
  - `pdf_kind`
  - `sheet_count`
  - `activity_count`
  - `game_count`
  - `worked_examples`
- `game_in_download`
  - `game_id`
  - `pdf_kind`
  - `activity_count`
  - `difficulty`

### Online Play

- `online_game_started`
  - `game_id`
  - `difficulty`
  - `play_mode`
- `online_hint_used`
  - `game_id`
  - `difficulty`
  - `play_mode`
  - `hint_number`
- `online_game_completed`
  - `game_id`
  - `difficulty`
  - `play_mode`
  - `hints_used`
  - `duration_seconds`
  - `personal_best`

### Navigation

- `navigation_click`
  - `target`
  - `source_area`

## GA4 custom definitions to register

For useful Explorations/reports, register these event-scoped custom dimensions:

- `game_id`
- `difficulty`
- `pdf_kind`
- `challenge_id`
- `scheme_id`
- `play_mode`
- `selection_action`
- `selection_source`
- `context`
- `target`
- `source_area`
- `orientation`

Useful custom metrics:

- `variant_count`
- `question_count`
- `sheet_count`
- `activity_count`
- `game_count`
- `hints_used`
- `hint_number`
- `duration_seconds`

## Data minimisation rule

Never add pupil names, school names, teacher names, uploaded logos, custom vocabulary, worksheet question text, answers, contact-form contents, generated seeds or recreation codes to analytics events.
