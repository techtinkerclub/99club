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
- `action`
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

### Printable puzzle sharing events on the main Studio page

The normal `/games/` page continues to use consent-controlled GA4 for generic product events. The school-sharing controls add two non-personal action events:

- `puzzle_parent_share_open`
  - `game_count`
  - `sheet_count`
- `puzzle_parent_share_action`
  - `action` (`copy_link`, `copy_card`, `open_parent_view`, `download_card`, `save_config`, `restore_config`, `download_website_pack`)
  - `game_count`

Do not add the school name, custom vocabulary, parent URL, puzzle seed or generated question content to these GA4 events.

## Data minimisation rule

Never add pupil names, school names, teacher names, uploaded logos, custom vocabulary, worksheet question text, answers, contact-form contents, generated seeds or recreation codes to analytics events.


## School-level parent-practice usage (currently disabled)

A separate first-party-style telemetry scaffold exists for school-issued parent-practice links. It is deliberately independent of Google Analytics and is configured in `assets/99club/school-usage-config.js`.

Current state:

- `enabled: false`
- no collection endpoint is configured
- no school-usage network requests are sent
- parent-practice pages still load no Google Analytics
- no pupil or parent identifier, score, worksheet seed, question text, answer, URL, referrer or persistent visitor ID is included

When a teacher has entered a school name, Studio derives a stable opaque school key and places only that key in newly created parent-practice links. The school name itself is not included in the parent URL. The dormant registration event can later associate that key with the public organisation name once the final analytics/privacy design is approved.

Prepared event schema (v1):

- `school_register`: `school_key`, `school_name`
- `practice_open`: `school_key`, `club_id`, `scheme_id`, `question_count`, `mode`, `orientation`
- `practice_download`: same aggregate practice fields as `practice_open`
- `puzzle_practice_open`: `school_key`, `game_ids`, `game_count`, `topic_ids`, `game_difficulties`, `min_year`, `max_year`, `sheet_count`, `activities_per_sheet`, `worked_examples`, `custom_vocabulary_count`
- `puzzle_practice_download`: same aggregate puzzle fields as `puzzle_practice_open`

Before enabling this telemetry:

1. decide and document the collection endpoint and retention period;
2. ensure the endpoint discards request-level IP/user-agent data from stored analytics wherever technically possible;
3. update `/privacy/`, `/schools/` and any analytics controls to describe the final behaviour accurately;
4. decide the simple school objection/opt-out mechanism;
5. set `enabled: true` and the HTTPS endpoint only after the above is complete;
6. keep the QA rules that prohibit pupil/parent identifiers and user-level tracking.

When parent-practice features change, review the v1 event schema at the same time so the aggregate data continues to answer “which schools are using which practice resources?” without drifting into individual-user tracking.
